const { esClient } = require("./elasticsearch");

async function createLearningPathIndex() {
  const indexExists = await esClient.indices.exists({ index: "learning_paths" });

  if (!indexExists.body) {
    await esClient.indices.create({
      index: "learning_paths",
      body: {
        mappings: {
          properties: {
            title: { type: "text" },
            summary: { type: "text" },
            user_id: { type: "integer" },
            visibility: { type: "keyword" },
            created_at: { type: "date" },
            updated_at: { type: "date" },
            estimated_duration: { type: "integer" },  
            ects: { type: "integer" },
            difficulty_level: { type: "keyword" },
            objectives: { type: "text" },
            creator_type: { type: "keyword" },
            first_name: { type: "text" },
            last_name: { type: "text" },
            embedding: { type: "dense_vector", dims: 768 }
          },
        },
      },
    });
    console.log("Learning Path index created");
  } else {
    console.log("Learning Path index already exists");
  }
}

createLearningPathIndex().catch(console.error);
