const { pool } = require('./postgres'); // your DB connection
const { indexResource } = require('../services/elasticSearchService');
const { generateEmbedding } = require('../scripts/generateResourceEmbeddings');

(async () => {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT * FROM resources');

    console.log(`Found ${result.rows.length} resources. Indexing...`);

    for (const resource of result.rows) {
      try {
        // Index the resource along with the embedding
        await indexResource(resource);
        console.log(`✅ Indexed resource ${resource.id}`);
      } catch (err) {
        console.error(`❌ Failed to index resource ${resource.id}:`, err.message);
      }
    }

    console.log('🎉 Done indexing all resources!');
  } catch (err) {
    console.error('Error indexing existing resources:', err.message);
  } finally {
    client.release();
    process.exit();
  }
})();