const { Pinecone } = require('@pinecone-database/pinecone');
const { GoogleGenerativeAIEmbeddings } = require('@langchain/google-genai');
const { PineconeStore } = require('@langchain/pinecone');
const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const { PromptTemplate } = require('@langchain/core/prompts');
const { StringOutputParser } = require('@langchain/core/output_parsers');
const { RunnableSequence } = require('@langchain/core/runnables');
const ActivityLog = require('../models/ActivityLog');
const Document = require('../models/Document');
const SearchHistory = require('../models/SearchHistory');

const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
 model: "gemini-embedding-001",
});

const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
// PINECONE_INDEX_NAME should be just the index name (e.g. "contextos"), not a URL
const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);

const model = new ChatGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
  model: 'gemini-2.5-flash',
  temperature: 0,
});

const searchTemplate = `You are ContextOS, an AI workspace assistant. Answer the user's question using ONLY the provided company text chunks below. If the answer cannot be found in the context, politely state that the information is missing.

Formatting rules:
- Write in short, clear paragraphs (2-4 sentences each). Add a blank line between paragraphs.
- If the answer has multiple distinct points (e.g. skills, experience, contact details), use a line-separated list with a dash at the start of each line instead of one long paragraph.
- Do NOT cram citations mid-sentence. Instead, end each paragraph or bullet with a single citation in parentheses naming the source document, like this: (Source: Adityaresume3.docx)
- Do not use markdown symbols like **, ##, or backticks. Plain text only, using line breaks and dashes for structure.

Context chunks:
{context}

Question: {question}
Answer:`;

const searchPrompt = PromptTemplate.fromTemplate(searchTemplate);

const searchChain = RunnableSequence.from([
  {
    context: (input) => input.context,
    question: (input) => input.question,
  },
  searchPrompt,
  model,
  new StringOutputParser(),
]);

async function searchWorkspace(query, workspaceId, userId) {
  const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex,
    namespace: workspaceId,
  });
  const results = await vectorStore.similaritySearch(query, 3);

  const context = results.map(r => `[Source: ${r.metadata.source}]: ${r.pageContent}`).join('\n\n');
  const answer = await searchChain.invoke({ context, question: query });

  // Log activity
  ActivityLog.create({
    workspace: workspaceId,
    user: userId,
    action: 'search',
    resource: 'search',
    metadata: { query },
  }).catch(err => console.error('Activity log failed:', err));

  // Look up each source document's actual fileName so the frontend can
  // build a working link to open the original file (served via /uploads).
  const documentIds = [...new Set(results.map(r => r.metadata.documentId))];
  const docs = await Document.find({ _id: { $in: documentIds } }).select('fileName').lean();
  const fileNameById = {};
  docs.forEach(d => { fileNameById[d._id.toString()] = d.fileName; });

  // Save to search history (separate from ActivityLog, which only logs
  // the query — this stores the full answer + sources so it can be
  // revisited later from the Search page).
  SearchHistory.create({
    workspace: workspaceId,
    user: userId,
    query,
    answer,
    sources: results.map(r => ({
      documentId: r.metadata.documentId,
      source: r.metadata.source,
      excerpt: r.pageContent.substring(0, 200),
    })),
  }).catch(err => console.error('Search history save failed:', err));

  return {
    answer,
    sources: results.map(r => ({
      documentId: r.metadata.documentId,
      source: r.metadata.source,
      excerpt: r.pageContent.substring(0, 200),
      fileName: fileNameById[r.metadata.documentId] || null,
    })),
  };
}

async function* chatStream(query, workspaceId, userId) {
  console.log('[chatStream] started, query:', query, 'workspace:', workspaceId);

  const vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex,
    namespace: workspaceId,
  });
  console.log('[chatStream] got vector store, running similarity search...');

  const results = await vectorStore.similaritySearch(query, 3);
  console.log('[chatStream] similarity search done, results:', results.length);

  const context = results.map(r => `[Source: ${r.metadata.source}]: ${r.pageContent}`).join('\n\n');

  const prompt = await searchPrompt.format({ context, question: query });
  console.log('[chatStream] prompt built, calling Gemini...');

  // Stream from Gemini
  const streamingModel = new ChatGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
    model: 'gemini-2.5-flash',
    temperature: 0,
    streaming: true,
    maxRetries: 0, // fail fast on quota errors instead of retrying for 20+ seconds
  });

  const stream = await streamingModel.stream(prompt).catch(err => {
    if (err.status === 429 || err.message?.includes('429')) {
      throw new Error('Gemini API daily quota reached. Please wait for the quota to reset or try again later.');
    }
    throw err;
  });
  console.log('[chatStream] Gemini stream started, reading tokens...');

  // Manually drive the async iterator instead of `for await` so a parse
  // error mid-stream rejects a promise we're directly awaiting (and can
  // catch), rather than surfacing as an unhandled rejection that crashes
  // the whole Node process.
  const iterator = stream[Symbol.asyncIterator]();
  while (true) {
    let result;
    try {
      result = await iterator.next();
    } catch (err) {
      console.error('[chatStream] stream parse error:', err);
      yield { error: 'The AI response was interrupted mid-stream. Please try sending your message again.' };
      return;
    }
    if (result.done) break;
    const token = result.value.content;
    if (token) {
      yield { token };
    }
  }
  console.log('[chatStream] stream complete');

  // Log activity
  ActivityLog.create({
    workspace: workspaceId,
    user: userId,
    action: 'chat',
    resource: 'chat',
    metadata: { query },
  }).catch(err => console.error('Activity log failed:', err));
}

async function deleteDocumentVectors(documentId, workspaceId) {
  // Pinecone's deleteMany with a metadata filter removes every chunk
  // belonging to this document without needing to know the exact vector IDs.
  await pineconeIndex.namespace(workspaceId).deleteMany({
    documentId: { $eq: documentId },
  });
}

module.exports = { searchWorkspace, chatStream, deleteDocumentVectors };