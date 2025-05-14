// backend/services/elasticsearchService.js
const { esClient } = require("../scripts/elasticsearch");
const { generateEmbedding } = require("../scripts/embeddingHelper");

const stripHTML = (text) => text?.replace(/<[^>]*>?/gm, "") || "";

// Helper to generate embedding
async function tryGenerateEmbedding(text, id, typeLabel) {
  try {
    const embedding = await generateEmbedding(text);
    console.log(`Generated ${typeLabel} Embedding:`, embedding);
    return embedding;
  } catch (err) {
    console.error(`❌ Failed to generate embedding for ${typeLabel} ID ${id}:`, err.message);
    return null;
  }
}

// Helper to index document
async function tryIndexDocument(index, id, document, typeLabel) {
  try {
    await esClient.index({ index, id, document });
    console.log(`✅ Indexed ${typeLabel} ID ${id}`);
  } catch (err) {
    console.error(`❌ Failed to index ${typeLabel} ID ${id}:`, err.message);
  }
}

// Index a resource
async function indexResource(resource) {
  const combinedText = [
    resource.title,
    stripHTML(resource.description),
    ...(resource.tags || []),
    ...(resource.category || []),
  ].join(" ");

  const embedding = await tryGenerateEmbedding(combinedText, resource.id, "resource");
  if (!embedding) return;

  const document = {
    title: resource.title,
    description: stripHTML(resource.description),
    type: resource.type,
    tags: resource.tags,
    category: resource.category,
    format: resource.format,
    embedding,
  };

  await tryIndexDocument("resources", resource.id, document, "resource");
}

// Index a module
async function indexModule(module) {
  const combinedText = [
    module.title,
    stripHTML(module.summary),
    stripHTML(module.objectives),
  ].join(" ");

  const embedding = await tryGenerateEmbedding(combinedText, module.id, "module");
  if (!embedding) return;

  const document = {
    item_id: module.id,
    type: "module",
    title: module.title,
    summary: stripHTML(module.summary),
    created_at: module.created_at,
    updated_at: module.updated_at,
    estimated_duration: module.estimated_duration,
    objectives: module.objectives,
    embedding,
  };

  await tryIndexDocument("learning_content", `module-${module.id}`, document, "module");
}

// Index a learning path
async function indexLearningPath(learningPath) {
  const combinedText = [
    learningPath.title,
    stripHTML(learningPath.summary),
    stripHTML(learningPath.objectives),
  ].join(" ");

  const embedding = await tryGenerateEmbedding(combinedText, learningPath.id, "learningPath");
  if (!embedding) return;

  const document = {
    type: "learning_path",
    title: learningPath.title,
    summary: stripHTML(learningPath.summary),
    created_at: learningPath.created_at,
    updated_at: learningPath.updated_at,
    estimated_duration: learningPath.estimated_duration,
    difficulty_level: learningPath.difficulty_level,
    objectives: learningPath.objectives,
    creator_type: learningPath.creator_type,
    first_name: learningPath.first_name,
    last_name: learningPath.last_name,
    embedding,
  };

  await tryIndexDocument("learning_content", `learning_path-${learningPath.id}`, document, "learningPath");
}

module.exports = { indexResource, indexModule, indexLearningPath };
