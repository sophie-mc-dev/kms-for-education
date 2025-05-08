const { esClient } = require("../scripts/elasticsearch");

const searchController = {
  /**
   * Search resources on Search Page
   * @param {*} req
   * @param {*} res
   */
  searchResources: async (req, res) => {
    const { q } = req.query;

    try {
      const results = await esClient.search({
        index: "resources",
        query: {
          multi_match: {
            query: q,
            fields: ["title^3", "description", "tags", "category"],
            fuzziness: "AUTO",
          },
        },
      });

      const hits = results.hits.hits.map((hit) => ({
        id: hit._id,
        ...hit._source,
      }));

      res.json(hits);
    } catch (error) {
      console.error("Search for resources failed:", error);
      res.status(500).json({ error: "Search for resources failed" });
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
