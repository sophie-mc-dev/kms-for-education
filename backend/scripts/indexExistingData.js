const { pool } = require('./postgres'); // your DB connection
const { indexModule } = require('../services/elasticSearchService');
const { indexLearningPath } = require('../services/elasticSearchService');
const { generateEmbedding } = require('./generateResourceEmbeddings');

(async () => {
  const client = await pool.connect();
  try {
    // Indexing Resources
    const resourceResult = await client.query('SELECT * FROM resources');
    console.log(`Found ${resourceResult.rows.length} resources. Indexing...`);
    for (const resource of resourceResult.rows) {
      try {
        const embedding = await generateEmbedding(resource.description);
        await indexResource(resource, embedding);  
        console.log(`✅ Indexed resource ${resource.id}`);
      } catch (err) {
        console.error(`❌ Failed to index resource ${resource.id}:`, err.message);
      }
    }

    // Indexing Modules
    const moduleResult = await client.query('SELECT * FROM modules');
    console.log(`Found ${moduleResult.rows.length} modules. Indexing...`);
    for (const module of moduleResult.rows) {
      try {
        const embedding = await generateEmbedding(module.summary);
        await indexModule(module, embedding);  
        console.log(`✅ Indexed module ${module.id}`);
      } catch (err) {
        console.error(`❌ Failed to index module ${module.id}:`, err.message);
      }
    }

    // Indexing Learning Paths
    const learningPathResult = await client.query('SELECT * FROM learning_paths');
    console.log(`Found ${learningPathResult.rows.length} learning paths. Indexing...`);
    for (const learningPath of learningPathResult.rows) {
      try {
        const embedding = await generateEmbedding(learningPath.summary);
        await indexLearningPath(learningPath, embedding); 
        console.log(`✅ Indexed learning path ${learningPath.id}`);
      } catch (err) {
        console.error(`❌ Failed to index learning path ${learningPath.id}:`, err.message);
      }
    }

    console.log('🎉 Done indexing all resources, modules, and learning paths!');
  } catch (err) {
    console.error('Error indexing existing data:', err.message);
  } finally {
    client.release();
    process.exit();
  }
})();
