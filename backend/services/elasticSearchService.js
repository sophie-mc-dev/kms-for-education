// backend/services/elasticsearchService.js
const { esClient } = require('../scripts/elasticsearch');

async function indexResource(resource) {
  await esClient.index({
    index: 'resources',
    id: resource.id,
    document: {
      title: resource.title,
      description: resource.description.replace(/<[^>]*>?/gm, ''),
      type: resource.type,
      tags: resource.tags,
      category: resource.category,
      format: resource.format
    }
  });
}

module.exports = { indexResource };
