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
      console.error("Search failed:", error);
      res.status(500).json({ error: "Search failed" });
    }
  },

  /**
   * Search MD/LP on Learning Page
   *
   * Search modules and learning paths at once or
   * separately and then join (?).
   * @param {*} req
   * @param {*} res
   */
  searchModulesAndLearningPaths: async (req, res) => {
    // Implement logic for searching modules and learning paths
  },
};

module.exports = searchController;
