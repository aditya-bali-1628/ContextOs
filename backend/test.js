require('dotenv').config();

const { GoogleGenerativeAIEmbeddings } = require('@langchain/google-genai');

const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY,
});

async function run() {
  const vector = await embeddings.embedQuery("hello world");

  console.log("VECTOR LENGTH:", vector.length);
  console.log(vector.slice(0, 5));
}

run().catch(console.error);