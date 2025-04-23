const { pool } = require("../db/postgres");
const { driver } = require("../db/neo4j");

const recommendationsController = {
  /**
   * Recommendation query that returns resources to a user based on
   * their interactions, categories, and tags of the resources they have engaged with
   * Also based on resource popularity.
   *
   * The final recommendation score is a combination of:
   * - User Affinity Score: Based on how much the user interacted with similar categories/tags.
   * - Popularity Score: Based on how popular the resource is with other users.
   *
   * @param {*} req
   * @param {*} res
   */
  getResourceRecommendations: async (req, res) => {
    const user_id = req.params.user_id;
    const session = driver.session();

    try {
      const cypherQuery = `
        MATCH (u:User {id: $user_id})-[:PERFORMED]->(i:Interaction)-[:TARGET]->(r:Resource)
        WITH u, r, i.weight AS weight
        OPTIONAL MATCH (r)-[:HAS_CATEGORY]->(cat:Category)
        OPTIONAL MATCH (r)-[:HAS_TAG]->(tag:Tag)
        WITH u, COLLECT(DISTINCT cat) AS categories, COLLECT(DISTINCT tag) AS tags, SUM(weight) AS userAffinityScore

        MATCH (rec:Resource)
        OPTIONAL MATCH (rec)-[:HAS_CATEGORY]->(cat2:Category)
        OPTIONAL MATCH (rec)-[:HAS_TAG]->(tag2:Tag)
        WHERE cat2 IN categories OR tag2 IN tags
        AND NOT EXISTS {
          MATCH (u)-[:PERFORMED]->(:Interaction)-[:TARGET]->(rec)
        }
        OPTIONAL MATCH (otherInt:Interaction)-[:TARGET]->(rec)
        WITH rec, COLLECT(DISTINCT cat2.name) AS categoryNames, COLLECT(DISTINCT tag2.name) AS tagNames,
            SUM(otherInt.weight) AS popularityScore, userAffinityScore
        WITH rec, categoryNames, tagNames,
            (popularityScore * 0.2 + userAffinityScore * 0.8) AS hybridScore
        RETURN rec {
            .id, .title, .description, .type, 
            category: categoryNames,
            tags: tagNames,
            score: hybridScore
        }
        ORDER BY hybridScore DESC
        LIMIT 10
      `;

      const result = await session.run(cypherQuery, { user_id });

      const recommendations = result.records.map((record) => {
        const rec = record.get("rec");

        return {
          id: rec.id,
          title: rec.title,
          description: rec.description,
          type: rec.type,
          category: rec.category,
          tags: rec.tags,
        };
      });

      res.json(recommendations);
    } catch (error) {
      console.error("Error getting recommendations:", error);
      res.status(500).json({
        message:
          "Failed to get resource recommendations based on user interactions.",
      });
    } finally {
      await session.close();
    }
  },

  /**
   *
   * @param {*} req
   * @param {*} res
   */
  getModulesRecommendationBasedOnResource: async (req, res) => {
    const resource_id = req.params.resource_id;
    const session = driver.session();

    try {
      const cypherQuery = `
        MATCH (r:Resource {id: $resource_id})
        OPTIONAL MATCH (r)-[:HAS_CATEGORY]->(cat:Category)
        WITH r, COLLECT(cat) AS resourceCategories

        // Step 1: collect direct modules
        CALL {
          WITH r
          MATCH (m:Module)-[:HAS_RESOURCE]->(r)
          RETURN COLLECT(DISTINCT m) AS directModules
        }

        // Step 2: collect fallback modules
        CALL {
          WITH r, resourceCategories
          MATCH (other:Resource)-[:HAS_CATEGORY]->(cat)
          WHERE other.id <> r.id AND cat IN resourceCategories
          MATCH (mod:Module)-[:HAS_RESOURCE]->(other)
          RETURN COLLECT(DISTINCT mod) AS fallbackModules
        }

        // Combine the two sets
        WITH directModules, fallbackModules,
            CASE WHEN SIZE(directModules) > 0 THEN directModules ELSE fallbackModules END AS finalModules
        UNWIND finalModules AS mod
        RETURN DISTINCT mod { .id, .title, .summary, .estimated_duration, .ects }
        LIMIT 5
      `;

      const result = await session.run(cypherQuery, { resource_id });

      const recommendations = result.records.map((record) => {
        const rec = record.get("mod");
        return {
          id: rec.id,
          title: rec.title,
          summary: rec.summary,
          estimated_duration: rec.estimated_duration,
          ects: rec.ects,
        };
      });

      res.json(recommendations);
    } catch (error) {
      console.error(
        "Error getting module recommendations based on resource:",
        error
      );
      res.status(500).json({
        message: "Failed to get module recommendations based on resource.",
      });
    } finally {
      await session.close();
    }
  },

  /**
   *
   * @param {*} req
   * @param {*} res
   */
  getRecommendationBasedOnResource: async (req, res) => {
    const resource_id = req.params.resource_id;
    const session = driver.session();

    try {
      const cypherQuery = `
        MATCH (r:Resource {id: $resource_id})
        OPTIONAL MATCH (r)-[:HAS_CATEGORY]->(cat:Category)
        OPTIONAL MATCH (r)-[:HAS_TAG]->(tag:Tag)
        WITH r, COLLECT(DISTINCT cat) AS resourceCategories, COLLECT(DISTINCT tag) AS resourceTags,
            toLower(r.title) AS rTitle, toLower(r.description) AS rDesc

        MATCH (other:Resource)
        WHERE other.id <> r.id
        OPTIONAL MATCH (other)-[:HAS_CATEGORY]->(cat2:Category)
        OPTIONAL MATCH (other)-[:HAS_TAG]->(tag2:Tag)
        WITH r, resourceCategories, resourceTags, rTitle, rDesc, other,
            COLLECT(DISTINCT cat2) AS otherCategories, COLLECT(DISTINCT tag2) AS otherTags,
            toLower(other.title) AS oTitle, toLower(other.description) AS oDesc

        WITH other, otherCategories, otherTags, 
            SIZE([c IN otherCategories WHERE c IN resourceCategories]) AS categoryScore,
            SIZE([t IN otherTags WHERE t IN resourceTags]) AS tagScore,
            apoc.text.sorensenDiceSimilarity(oTitle, rTitle) AS titleScore,
            apoc.text.sorensenDiceSimilarity(oDesc, rDesc) AS descScore

        WITH other, otherCategories, otherTags, (categoryScore * 2 + tagScore * 2 + titleScore + descScore) AS totalScore
        ORDER BY totalScore DESC
        RETURN other {
          .id, .title, .description, .type,
          category: [cat IN otherCategories | cat.name],
          tags: [tag IN otherTags | tag.name],
          score: totalScore
        }
        LIMIT 12
    `;

      const result = await session.run(cypherQuery, { resource_id });

      const recommendations = result.records.map((record) => {
        const rec = record.get("other");

        return {
          id: rec.id,
          title: rec.title,
          description: rec.description,
          type: rec.type,
          category: rec.category,
          tags: rec.tags,
        };
      });
      res.status(200).json(recommendations);
    } catch (err) {
      console.error("Recommendation Error:", err);
      res.status(500).json({
        message: "Failed to get resource recommendations based on resource.",
      });
    }
  },

  /**
   *
   * @param {*} req
   * @param {*} res
   */
  getLearningPathRecommendationBasedOnModules: async (req, res) => {},

  /**
   *
   * @param {*} req
   * @param {*} res
   */
  getRecommendationBasedOnLearningPath: async (req, res) => {},

  /**
   *
   * @param {*} req
   * @param {*} res
   */
  getRecommendationBasedOnModule: async (req, res) => {},
};

// For Standalone Modules, Get Similar Modules (for example if module is also in a LP, recommend modules of that LP)
// Get Collaborative Recommendations for User
// Get Recommended Resources Based on Interaction History
module.exports = recommendationsController;
