const { esClient } = require("./elasticsearch");

async function createIndex() {
  const indexExists = await esClient.indices.exists({ index: "resources" });

  if (!indexExists.body) {
    await esClient.indices.create({
      index: "resources",
      body: {
        mappings: {
          properties: {
            title: { type: "text" },
            description: { type: "text" },
            type: { type: "keyword" },
            tags: { type: "keyword" },
            category: { type: "keyword" },
            format: { type: "keyword" },
            embedding: {
              type: "dense_vector",
              dims: 384,
              index: true,
              similarity: "cosine",
            },
          },
        },
      },
    });
    console.log("Index created");
  } else {
    console.log("Index already exists");
  }
}

createIndex().catch(console.error);
