const { esClient } = require("../scripts/elasticsearch");
const { generateEmbedding } = require("../scripts/embeddingHelper");

const searchController = {
  /**
   * Search resources on Search Page
   * @param {*} req
   * @param {*} res
   */
  searchResources: async (req, res) => {
    const { q } = req.query;

    try {
      const queryEmbedding = await generateEmbedding(q);

      const results = await esClient.search({
        index: "resources",
        knn: {
          field: "embedding",
          query_vector: queryEmbedding,
          k: 10,
          num_candidates: 100,
        },
        query: {
          bool: {
            should: [{ match: { title: q } }, { match: { description: q } }],
          },
        },
      });

      const hits = results.hits.hits.map((hit) => ({
        id: hit._id,
        score: hit._score,
        ...hit._source,
      }));

      res.json(hits);
    } catch (error) {
      console.error("Semantic search for resources failed:", error);
      res.status(500).json({ error: "Semantic search for resources failed" });
    }
  },

  searchLearningContent: async (req, res) => {
    const { q } = req.query;

    try {
      const queryEmbedding = await generateEmbedding(q);

      const results = await esClient.search({
        index: "learning_content",
        knn: {
          field: "embedding",
          query_vector: queryEmbedding,
          k: 10,
          num_candidates: 100,
        },
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

      const hits = results.hits.hits.map((hit) => ({
        id: hit._id,
        score: hit._score,
        ...hit._source,
      }));

      res.json(hits);
    } catch (error) {
      console.error("Semantic search for learning content failed:", error);
      res
        .status(500)
        .json({ error: "Semantic search for learning content failed" });
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
