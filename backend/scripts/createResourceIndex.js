const { esClient } = require("./elasticsearch");

async function createIndex() {
  const exists = await esClient.indices.exists({ index: "resources" });

  if (!exists) {
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
