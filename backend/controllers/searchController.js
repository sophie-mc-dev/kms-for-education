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

  searchModules: async (req, res) => {
    const { q } = req.query;

    try {
      const results = await esClient.search({
        index: "modules",
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
        ...hit._source,
      }));

      res.json(hits);
    } catch (error) {
      console.error("Search for modules failed:", error);
      res.status(500).json({ error: "Search for modules failed" });
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
  searchLearningPaths: async (req, res) => {
    const { q } = req.query;

    try {
      const results = await esClient.search({
        index: "learningPaths",
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
        ...hit._source,
      }));

      res.json(hits);
    } catch (error) {
      console.error("Search for modules failed:", error);
      res.status(500).json({ error: "Search for modules failed" });
    }
  },
};

module.exports = searchController;
