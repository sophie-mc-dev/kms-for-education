const { generateEmbedding } = require('../scripts/generateResourceEmbeddings');

const testText = "This is a test sentence to generate embeddings for.";

generateEmbedding(testText)
  .then((embedding) => {
    console.log("Generated embedding:", embedding);
  })
  .catch((err) => {
    console.error("Error generating embedding:", err);
  });
