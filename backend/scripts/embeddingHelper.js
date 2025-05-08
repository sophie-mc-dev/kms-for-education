const { pipeline } = require('@huggingface/transformers');
const { esClient } = require("./elasticsearch");


const generateEmbedding = async (text) => {
  try {
    const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    const output = await extractor(text);

    let embedding = output[0];  
    let flattenedEmbedding = Array.from(embedding.ort_tensor.cpuData);

    if (flattenedEmbedding.length > 385) {
      flattenedEmbedding = flattenedEmbedding.slice(0, 385);
    } else if (flattenedEmbedding.length < 385) {
      while (flattenedEmbedding.length < 385) {
        flattenedEmbedding.push(0);
      }
    }

    return flattenedEmbedding;
  } catch (error) {
    console.error("Error generating embedding:", error.message);
    throw error;
  }
};


module.exports = { generateEmbedding };
