const { esClient } = require("./elasticsearch");

async function createModuleIndex() {
  const indexExists = await esClient.indices.exists({ index: "modules" });

  if (!indexExists.body) {
    await esClient.indices.create({
      index: "modules",
      body: {
        mappings: {
          properties: {
            title: { type: "text" },
            summary: { type: "text" },
            created_at: { type: "date" },
            updated_at: { type: "date" },
            estimated_duration: { type: "integer" }, 
            is_standalone: { type: "boolean" },
            objectives: { type: "text" },
            embedding: { type: "dense_vector", dims: 768 }
          },
        },
      },
    });
    console.log("Module index created");
  } else {
    console.log("Module index already exists");
  }
}

createModuleIndex().catch(console.error);
