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
        size: 10,
        query: {
          bool: {
            should: [
              {
                script_score: {
                  query: { match_all: {} },
                  script: {
                    source: `cosineSimilarity(params.query_vector, 'embedding')`,
                    params: { query_vector: queryEmbedding },
                  },
                },
              },
              {
                multi_match: {
                  query: q,
                  fields: ["title^5", "description^4", "category^2", "tags^3"],
                  fuzziness: "AUTO",
                  boost: 2.0,
                },
              },
            ],
            minimum_should_match: 1,
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
        query: {
          bool: {
            should: [
              {
                script_score: {
                  query: { match_all: {} },
                  script: {
                    source: `cosineSimilarity(params.query_vector, 'embedding')`,
                    params: { query_vector: queryEmbedding },
                  },
                },
              },
              {
                multi_match: {
                  query: q,
                  fields: ["title^3", "summary^2", "objectives"],
                  fuzziness: "AUTO",
                },
              },
            ],
            minimum_should_match: 1,
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
};

module.exports = searchController;
