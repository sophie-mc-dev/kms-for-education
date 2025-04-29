// backend/services/elasticsearchService.js
const { esClient } = require('../scripts/elasticsearch');
const { generateEmbedding } = require('../scripts/generateResourceEmbeddings');

// Index a resource
async function indexResource(resource) {
  const embedding = await generateEmbedding(resource.description);
  console.log(embedding);  // Check that this is an array of numbers (e.g., [0.1, 0.2, ...])

  await esClient.index({
    index: 'resources',
    id: resource.id,
    document: {
      title: resource.title,
      description: resource.description.replace(/<[^>]*>?/gm, ''),
      type: resource.type,
      tags: resource.tags,
      category: resource.category,
      format: resource.format,
      embedding: embedding
    }
  });
}

// Index a module
async function indexModule(module) {
  const embedding = await generateEmbedding(module.summary);
  console.log(embedding); 

  await esClient.index({
    index: 'modules',
    id: module.id,
    document: {
      title: module.title,
      summary: module.summary.replace(/<[^>]*>?/gm, ''), 
      created_at: module.created_at,
      updated_at: module.updated_at,
      estimated_duration: module.estimated_duration,
      is_standalone: module.is_standalone,
      objectives: module.objectives,
      ects: module.ects,
      embedding: embedding
    }
  });
}

// Index a learning path
async function indexLearningPath(learningPath) {
  const embedding = await generateEmbedding(learningPath.summary);
  console.log(embedding); 

  await esClient.index({
    index: 'learning_paths',
    id: learningPath.id,
    document: {
      title: learningPath.title,
      summary: learningPath.summary.replace(/<[^>]*>?/gm, ''), 
      created_at: learningPath.created_at,
      updated_at: learningPath.updated_at,
      estimated_duration: learningPath.estimated_duration,
      ects: learningPath.ects,
      difficulty_level: learningPath.difficulty_level,
      objectives: learningPath.objectives,
      creator_type: learningPath.creator_type,
      first_name: learningPath.first_name,
      last_name: learningPath.last_name,
      embedding: embedding
    }
  });
}

module.exports = { indexResource, indexModule, indexLearningPath };
