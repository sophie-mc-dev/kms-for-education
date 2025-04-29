// backend/services/elasticsearchService.js
const { esClient } = require('../scripts/elasticsearch');
const { generateEmbedding } = require('../scripts/generateResourceEmbeddings');

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

module.exports = { indexResource };
