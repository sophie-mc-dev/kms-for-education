const { esClient } = require("../scripts/elasticsearch");
const { generateEmbedding } = require("../scripts/embeddingHelper");
const { pool } = require("../scripts/postgres");

const searchController = {
  /**
   * Search resources on Search Page
   * @param {*} req
   * @param {*} res
   */
  searchResources: async (req, res) => {
    const { q } = req.query;
    const userId = req.user?.id || null;

    const startTime = Date.now();
    let client;

    try {
      client = await pool.connect();
      const queryEmbedding = await generateEmbedding(q);

      const results = await esClient.search({
        index: "resources",
        knn: {
          field: "embedding",
          query_vector: queryEmbedding,
          k: 10,
          num_candidates: 100,
        },
        size: 10,
        query: {
          bool: {
            should: [{ match: { title: q } }, { match: { description: q } }],
          },
        },
      });

      // Filter based on vector similarity threshold
      const hits = results.hits.hits.map((hit, i) => ({
        id: hit._id,
        score: hit._score,
        rank: i + 1,
        ...hit._source,
      }));
      console.log("HITS: ", hits);

      // Compute stats
      const topScore = hits[0]?.score || 0;
      const avgScore =
        hits.reduce((acc, h) => acc + h.score, 0) / hits.length || 0;
      const duration = Date.now() - startTime;

      // Save to DB
      const searchInsertQuery = `
      INSERT INTO user_searches (
        user_id, query_text, created_at, query_embedding,
        result_count, top_score, average_score, search_duration_ms
      ) VALUES ($1, $2, now(), $3, $4, $5, $6, $7)
      RETURNING id
    `;

      const { rows } = await client.query(searchInsertQuery, [
        userId,
        q,
        JSON.stringify(queryEmbedding),
        hits.length,
        topScore,
        avgScore,
        duration,
      ]);

      const searchId = rows[0].id;
      console.log("SearchID: ", searchId);

      // Insert each result
      const resultInserts = hits.map((hit) => ({
        text: `INSERT INTO user_search_results (search_id, resource_id, rank, score) VALUES ($1, $2, $3, $4)`,
        values: [searchId, hit.id, hit.rank, hit.score],
      }));

      // Run inserts in parallel
      await Promise.all(
        resultInserts.map((q) => client.query(q.text, q.values))
      );

      res.json(hits);
    } catch (error) {
      console.error("Semantic search for resources failed:", error);
      res.status(500).json({ error: "Semantic search for resources failed" });
    }
  },

  searchLearningContent: async (req, res) => {
    const { q } = req.query;
    const userId = req.user?.id || null;
    const startTime = Date.now();
    let client;

    try {
      client = await pool.connect();
      const queryEmbedding = await generateEmbedding(q);

      const results = await esClient.search({
        index: "learning_content",
        knn: {
          field: "embedding",
          query_vector: queryEmbedding,
          k: 10,
          num_candidates: 100,
        },
        size: 10,
        query: {
          bool: {
            should: [
              { match: { title: q } },
              { match: { summary: q } },
              { match: { objectives: q } },
            ],
          },
        },
      });

      const hits = results.hits.hits.map((hit, i) => ({
        id: hit._id,
        score: hit._score,
        rank: i + 1,
        ...hit._source,
      }));

      // Compute stats
      const topScore = hits[0]?.score || 0;
      const avgScore =
        hits.length > 0
          ? hits.reduce((sum, h) => sum + h.score, 0) / hits.length
          : 0;
      const duration = Date.now() - startTime;

      // Insert into user_searches
      const searchInsertQuery = `
      INSERT INTO user_searches (
        user_id, query_text, created_at, query_embedding,
        result_count, top_score, average_score, search_duration_ms
      ) VALUES ($1, $2, now(), $3, $4, $5, $6, $7)
      RETURNING id
    `;
      const { rows } = await client.query(searchInsertQuery, [
        userId,
        q,
        JSON.stringify(queryEmbedding),
        hits.length,
        topScore,
        avgScore,
        duration,
      ]);
      const searchId = rows[0].id;

      // Insert results
      const resultInserts = hits.map((hit) => ({
        text: `INSERT INTO user_learning_content_search_results (search_id, learning_content_id, rank, score) VALUES ($1, $2, $3, $4)`,
        values: [searchId, hit.id, hit.rank, hit.score],
      }));

      await Promise.all(
        resultInserts.map((q) => client.query(q.text, q.values))
      );

      res.json(hits);
    } catch (error) {
      console.error("Semantic search for learning content failed:", error);
      res
        .status(500)
        .json({ error: "Semantic search for learning content failed" });
    } finally {
      if (client) client.release();
    }
  },

  searchLearningContent2: async (req, res) => {
    const { q } = req.query;

    try {
      // Step 1: Get the embedding for the input query
      const queryEmbedding = await generateEmbedding(q);

      // Step 2: Perform a semantic search using KNN
      const results = await esClient.search({
        index: "learning_content",
        knn: {
          field: "embedding",
          query_vector: queryEmbedding,
          k: 10,
          num_candidates: 100,
        },
      });

      const hits = results.hits.hits.map((hit) => ({
        id: hit._id,
        type: hit._source.type,
        ...hit._source,
      }));

      res.json(hits);
    } catch (error) {
      console.error("Semantic search failed:", error);
      res.status(500).json({ error: "Semantic search failed" });
    }
  },
};

module.exports = searchController;
