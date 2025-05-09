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
      // Step 1: Generate embedding from user query
      const queryEmbedding = await generateEmbedding(q);

      // Step 2: Perform semantic search using script_score
      const results = await esClient.search({
        index: "resources",
        size: 10,
        query: {
          script_score: {
            query: { 
              match_all: {}
            },
            script: {
              source:
                "cosineSimilarity(params.query_vector, 'embedding') + 1.0",
              params: { query_vector: queryEmbedding },
            },
          },
        },
      });

      // Step 3: Return results
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
      const results = await esClient.search({
        index: "learning_content",
        query: {
          multi_match: {
            query: q,
            fields: ["title^3", "summary", "objectives"],
            fuzziness: "AUTO",
          },
        },
      });

      const hits = results.hits.hits.map((hit) => ({
        id: hit._id,
        type: hit._source.type,
        ...hit._source,
      }));

      res.json(hits);
    } catch (error) {
      console.error("Search for learning content failed:", error);
      res.status(500).json({ error: "Search for learning content failed" });
    }
  },
};

module.exports = searchController;
