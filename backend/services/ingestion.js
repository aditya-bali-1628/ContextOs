const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const { RecursiveCharacterTextSplitter } = require('@langchain/textsplitters');
const { GoogleGenerativeAIEmbeddings } = require('@langchain/google-genai');
const { PineconeStore } = require('@langchain/pinecone');
const { Pinecone } = require('@pinecone-database/pinecone');

const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
   model: "gemini-embedding-001",
});

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const pineconeIndex = pinecone.Index(
  process.env.PINECONE_INDEX_NAME
  
);

async function extractText(filePath, fileType) {
  const buffer = fs.readFileSync(filePath);

  if (fileType.includes('pdf')) {
    const data = await pdfParse(buffer);
    return data.text || '';
  }

  if (
    fileType.includes('docx') ||
    fileType.includes('wordprocessingml')
  ) {
    const { value } = await mammoth.extractRawText({ buffer });
    return value || '';
  }

  if (fileType.includes('text')) {
    return buffer.toString('utf-8');
  }

  throw new Error('Unsupported file type');
}
async function processDocument(doc) {
  try {
    console.log('\n===== DOCUMENT PROCESSING STARTED =====');

    const rawText = await extractText(
      doc.filePath,
      doc.fileType
    );

    console.log('Text Length:', rawText.length);

    if (!rawText.trim()) {
      throw new Error('No text extracted from document');
    }

    doc.extractedText = rawText;
    await doc.save();

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const chunks = await splitter.createDocuments(
      [rawText],
      [{
        source: doc.originalName,
        documentId: doc._id.toString(),
        workspaceId: doc.workspace.toString(),
      }]
    );

    console.log('Chunks created:', chunks.length);

    if (!chunks.length) {
      throw new Error('No chunks generated');
    }

    // TEST SINGLE EMBEDDING
    const testVector = await embeddings.embedQuery(
      'hello world'
    );

    console.log('====================');
    console.log('TEST VECTOR');
    console.log('Length:', testVector?.length);
    console.log(
      'First 5:',
      testVector?.slice(0, 5)
    );
    console.log('====================');

    // TEST DOCUMENT EMBEDDINGS
    const vectors = await embeddings.embedDocuments(
      chunks.map(c => c.pageContent)
    );

    console.log('====================');
    console.log('DOCUMENT VECTORS');
    console.log('Count:', vectors.length);
    console.log(
      'Dimension:',
      vectors[0]?.length
    );
    console.log(
      'First 5:',
      vectors[0]?.slice(0, 5)
    );
    console.log('====================');

    if (
      !vectors.length ||
      !vectors[0] ||
      vectors[0].length === 0
    ) {
      throw new Error(
        'Gemini returned empty embeddings'
      );
    }

    await PineconeStore.fromDocuments(
      chunks,
      embeddings,
      {
        pineconeIndex,
        namespace: doc.workspace.toString(),
      }
    );

    console.log(
      `Processed ${doc.originalName}`
    );

    async function testEmbedding() {
      const vector = await embeddings.embedQuery(
        'hello world'
      );

      console.log('TEST VECTOR LENGTH:', vector.length);
      console.log('FIRST 5 VALUES:', vector.slice(0, 5));
    }

    testEmbedding().catch(console.error);

  } catch (error) {
    console.error(
      'DOCUMENT PROCESSING ERROR:',
      error
    );
  }
}

module.exports = { processDocument };