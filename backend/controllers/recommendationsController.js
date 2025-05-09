const { pool } = require("../scripts/postgres");
const { driver } = require("../scripts/neo4j");

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
   * For the Module Recommendation sidebar at ResourceDetails Page.
   *
   * Recommends modules with similar resources or modules that include that resource.
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
        RETURN DISTINCT mod { .id, .title, .summary, .estimated_duration }
        LIMIT 5
      `;

      const result = await session.run(cypherQuery, { resource_id });

      if (!result.records.length) {
        res.status(200).json([]);
        return;
      }

      const recommendations = result.records.map((record) => {
        const rec = record.get("mod");
        return {
          id: rec.id,
          title: rec.title,
          summary: rec.summary,
          estimated_duration: rec.estimated_duration,
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
   * For the bottom card at ResourceDetails Page.
   *
   * Returns 12 recommendations that are the most fitting to the current resource.
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

      if (!result.records.length) {
        res.status(200).json([]);
        return;
      }

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
   * For the Recommended Learning Paths sidebar at ModuleDetails Page.
   *
   * Should recommend a list of learning paths that have that module together
   * with suggested learning paths based on the modules and its resources.
   *
   * @param {*} req
   * @param {*} res
   */
  getLearningPathRecommendationBasedOnModules: async (req, res) => {
    const module_id = req.params.module_id;
    const user_id = req.params.user_id;
    const session = driver.session();

    try {
      const cypherQuery = `
        WITH $module_id AS moduleId, $user_id AS userId 

        // Step 1: Get the input module and its resources
        MATCH (mod:Module {id: moduleId})-[:HAS_RESOURCE]->(res:Resource)
        WITH mod, COLLECT(res) AS modResources, userId

        // Step 2: Find learning paths that include this module directly
        OPTIONAL MATCH (lp:LearningPath)-[:HAS_MODULE]->(mod)
        WITH mod, modResources, COLLECT(DISTINCT lp) AS directLPs, userId

        // Step 3: Find other modules that share resources with the current one
        OPTIONAL MATCH (otherMod:Module)-[:HAS_RESOURCE]->(sharedRes:Resource)
        WHERE otherMod.id <> mod.id AND sharedRes IN modResources
        WITH mod, modResources, directLPs, COLLECT(DISTINCT otherMod) AS relatedModules, userId

        // Step 4: Find learning paths that include those related modules
        OPTIONAL MATCH (fallbackLP:LearningPath)-[:HAS_MODULE]->(relatedMod:Module)
        WHERE relatedMod IN relatedModules
        WITH modResources, directLPs, COLLECT(DISTINCT fallbackLP) AS fallbackLPs, userId

        // Step 5: Consider user interactions with resources
        OPTIONAL MATCH (user:User {id: userId})-[:PERFORMED]->(:Interaction {type: "VIEWED_RESOURCE"})-[:TARGET]->(viewedRes:Resource)
        WHERE viewedRes IN modResources
        WITH directLPs, fallbackLPs, COUNT(viewedRes) AS viewedCount

        // Step 6: Score direct and fallback learning paths separately inside a subquery
        CALL {
            WITH directLPs, viewedCount
            UNWIND directLPs AS directLP
            RETURN directLP AS learningPath, (10 + viewedCount * 3) AS score, 'direct' AS source
            UNION
            WITH fallbackLPs, viewedCount
            UNWIND fallbackLPs AS fallbackLP
            RETURN fallbackLP AS learningPath, (5 + viewedCount * 2) AS score, 'fallback' AS source
        }
        WITH DISTINCT learningPath, score, source  // Ensure unique learning paths in the final result
        RETURN learningPath { .id, .title, .summary, .estimated_duration } AS recommendedPath, score, source
        ORDER BY score DESC
        LIMIT 5

      `;

      const result = await session.run(cypherQuery, {
        user_id: user_id,
        module_id: module_id,
      });

      const recommendations = result.records.map((record) => {
        const rec = record.get("recommendedPath");
        return {
          id: rec.id,
          title: rec.title,
          summary: rec.summary,
          estimated_duration: rec.estimated_duration,
        };
      });

      res.json(recommendations);
    } catch (error) {
      console.error(
        "Error getting learning path recommendations based on module:",
        error
      );
      res.status(500).json({
        message: "Failed to get learning path recommendations based on module.",
      });
    } finally {
      await session.close();
    }
  },

  /**
   * For the LP Details Page
   *
   * Recommends other learning paths based on shared modules/resources
   * and previous user interactions
   *
   * @param {*} req
   * @param {*} res
   */
  getLPRecommendationBasedOnLearningPath: async (req, res) => {
    const user_id = req.params.user_id;
    const learning_path_id = req.params.learning_path_id;
    const session = driver.session();

    try {
      const cypherQuery = `
        WITH $learning_path_id AS currentLearningPathId, $user_id AS userId

        // Step 1: Get the current learning path and its modules
        MATCH (lp:LearningPath {id: currentLearningPathId})-[:HAS_MODULE]->(mod:Module)-[:HAS_RESOURCE]->(res:Resource)
        WITH currentLearningPathId, COLLECT(DISTINCT mod) AS currentModules, COLLECT(DISTINCT res) AS currentResources

        // Step 2: Find learning paths that share modules/resources
        MATCH (otherLp:LearningPath)-[:HAS_MODULE]->(sharedMod:Module)-[:HAS_RESOURCE]->(sharedRes:Resource)
        WHERE (sharedMod IN currentModules OR sharedRes IN currentResources) 
        AND otherLp.id <> currentLearningPathId  // Exclude the current learning path itself directly in this step

        // Step 3: Collect learning paths the user has completed
        OPTIONAL MATCH (user:User {id: $user_id})-[:PERFORMED]->(:Interaction {type: "COMPLETED_LEARNING_PATH"})-[:TARGET]->(completedLp:LearningPath)
        WITH currentLearningPathId, COLLECT(DISTINCT completedLp.id) AS completedLearningPaths, otherLp, sharedMod, sharedRes

        // Step 4: Filter out learning paths that the user has already completed
        WHERE NOT otherLp.id IN completedLearningPaths

        // Step 5: Count the number of "VIEWED_LEARNING_PATH" interactions for each learning path
        OPTIONAL MATCH (user:User {id: $user_id})-[:PERFORMED]->(:Interaction {type: "VIEWED_LEARNING_PATH"})-[:TARGET]->(viewedLp:LearningPath)
        WHERE viewedLp.id = otherLp.id
        WITH otherLp, COUNT(viewedLp) AS viewedCount, sharedMod, sharedRes, completedLearningPaths

        // Step 6: Rank the learning paths based on shared modules/resources and viewed interactions
        WITH otherLp, COUNT(DISTINCT sharedMod) AS sharedModulesCount, COUNT(DISTINCT sharedRes) AS sharedResourcesCount, viewedCount
        WITH otherLp, sharedModulesCount + sharedResourcesCount * 2 + viewedCount * 1 AS recommendationScore

        // Step 7: Return recommended learning paths sorted by the score
        RETURN otherLp { .id, .title, .summary, .estimated_duration } AS recommendedPath, recommendationScore
        ORDER BY recommendationScore DESC
        LIMIT 5
      `;

      const result = await session.run(cypherQuery, {
        user_id: user_id,
        learning_path_id: learning_path_id,
      });

      const recommendations = result.records.map((record) => {
        const rec = record.get("recommendedPath");
        return {
          id: rec.id,
          title: rec.title,
          summary: rec.summary,
          estimated_duration: rec.estimated_duration,
        };
      });

      res.status(200).json(recommendations);
    } catch (err) {
      console.error("Recommendation Error:", err);
      res.status(500).json({
        message:
          "Failed to get learning path recommendations based on learning path.",
      });
    } finally {
      await session.close();
    }
  },

  /**
   * For the LearningPath Details page sidebar
   *
   * It recommends resources from other modules that are not part of the current learning path.
   * If the user has previously viewed certain resources, those are prioritized in the recommendations.
   * Recommended resources are ranked based on how many times the user has viewed them.
   *
   * @param {*} req
   * @param {*} res
   */
  getResourceRecommendationBasedOnLearningPath: async (req, res) => {
    const user_id = req.params.user_id;
    const learning_path_id = req.params.learning_path_id;
    const session = driver.session();

    try {
      const cypherQuery = `
        WITH $learning_path_id AS currentLearningPathId, $user_id AS userId

        // Step 1: Get the current learning path and its modules/resources
        MATCH (lp:LearningPath {id: currentLearningPathId})-[:HAS_MODULE]->(mod:Module)-[:HAS_RESOURCE]->(res:Resource)
        WITH currentLearningPathId, COLLECT(DISTINCT mod) AS currentModules, COLLECT(DISTINCT res) AS currentResources

        // Step 2: Find other resources that share modules/resources (but not already in the current learning path)
        MATCH (otherMod:Module)-[:HAS_RESOURCE]->(otherRes:Resource)
        WHERE NOT otherRes IN currentResources // Exclude resources already part of the current learning path
        AND otherMod <> ALL(mod IN currentModules WHERE otherMod.id = mod.id) // Ensure it's from a different module
        WITH currentLearningPathId, COLLECT(DISTINCT otherRes) AS recommendedResources

        // Step 3: Consider resources based on the user's previous interactions (e.g., viewed or saved resources)
        OPTIONAL MATCH (user:User {id: $user_id})-[:PERFORMED]->(:Interaction {type: "VIEWED_RESOURCE"})-[:TARGET]->(viewedRes:Resource)
        WHERE viewedRes IN recommendedResources
        WITH recommendedResources, COUNT(viewedRes) AS viewCount

        // Step 4: Rank the recommended resources based on their similarity to current resources and view count
        WITH recommendedResources, viewCount
        ORDER BY viewCount DESC

        // Step 5: Unwind the resources and return the recommended resources with categories, tags, and score
        UNWIND recommendedResources AS recommendedRes
        MATCH (recommendedRes)-[:HAS_CATEGORY]->(cat:Category)
        MATCH (recommendedRes)-[:HAS_TAG]->(tag:Tag)
        WITH recommendedRes, COLLECT(DISTINCT cat) AS otherCategories, COLLECT(DISTINCT tag) AS otherTags, viewCount

        // Step 6: Calculate the total score (you can adjust how the score is calculated)
        WITH recommendedRes, otherCategories, otherTags, viewCount, (viewCount * 1) + 0 AS totalScore // Adjust scoring formula

        // Step 7: Return the recommended resources with all the required fields
        RETURN recommendedRes { 
            .id, 
            .title, 
            .description, 
            .type, 
            category: [cat IN otherCategories | cat.name], 
            tags: [tag IN otherTags | tag.name], 
            score: totalScore
        } AS recommendedResource
        LIMIT 6
      `;

      const result = await session.run(cypherQuery, {
        user_id: user_id,
        learning_path_id: learning_path_id,
      });

      const recommendations = result.records.map((record) => {
        const rec = record.get("recommendedResource");
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
        message:
          "Failed to get resource recommendations based on learning path.",
      });
    } finally {
      await session.close();
    }
  },

  /**
   * For the Recommended Modules bottom section at ModuleDetails Page.
   *
   * - Should recommend similar modules based on module metadata and its resources.
   * - Recommend modules that include the same resources.
   * - If standalone module is also in a learning path, recommends modules from that learning path as a way to continue the learning workflow.
   * - Excludes modules the user has already completed (interaction = completed_module)
   * - Calculate a score based on all this and recommend top results
   *
   * @param {*} req
   * @param {*} res
   */
  getModuleRecommendationBasedOnModule: async (req, res) => {
    const user_id = req.params.user_id;
    const module_id = req.params.module_id;
    const session = driver.session();

    try {
      const cypherQuery = `
        WITH $user_id AS userId, $module_id AS currentModuleId
  
        MATCH (current:Module {id: currentModuleId})-[:HAS_RESOURCE]->(res:Resource)
        WITH current, COLLECT(res) AS currentResources, userId, currentModuleId
  
        OPTIONAL MATCH (lp:LearningPath)-[:HAS_MODULE]->(current)
        WITH current, currentResources, COLLECT(lp) AS lps, userId, currentModuleId
  
        MATCH (user:User {id: userId})-[:PERFORMED]->(:Interaction {type: "COMPLETED_MODULE"})-[:TARGET]->(completed)
        WHERE completed:Module
        WITH current, currentResources, lps, COLLECT(completed.id) AS completedModuleIds, userId, currentModuleId
  
        MATCH (modRec:Module)
        WHERE modRec.id <> currentModuleId AND NOT modRec.id IN completedModuleIds
  
        OPTIONAL MATCH (lp:LearningPath)-[:HAS_MODULE]->(modRec)
        WHERE lp IN lps
  
        WITH current, modRec, completedModuleIds, 
            SIZE([r IN currentResources WHERE (modRec)-[:HAS_RESOURCE]->(r)]) AS sharedResourceCount,
            COUNT(lp) > 0 AS sameLearningPath
  
        WITH modRec,
            CASE WHEN sameLearningPath THEN 7 ELSE 0 END +
            (CASE WHEN abs(modRec.estimated_duration - current.estimated_duration) < 10 THEN 2 ELSE 0 END) +
            sharedResourceCount * 5 AS score
  
        RETURN modRec {
          .id,
          .title,
          .summary,
          .estimated_duration
        } AS modRec, score
        ORDER BY score DESC
        LIMIT 6
      `;

      const result = await session.run(cypherQuery, {
        user_id: user_id,
        module_id: module_id,
      });

      const recommendations = result.records.map((record) => {
        const rec = record.get("modRec");
        return {
          id: rec.id,
          title: rec.title,
          summary: rec.summary,
          estimated_duration: rec.estimated_duration,
        };
      });

      res.status(200).json(recommendations);
    } catch (err) {
      console.error("Recommendation Error:", err);
      res.status(500).json({
        message: "Failed to get module recommendations.",
      });
    } finally {
      await session.close();
    }
  },

  /**
   * User inputs categories
   *
   *
   * @param {*} req
   * @param {*} res
   */
  getModuleRecommendationForLPathCreation: async (req, res) => {
    const selectedCategories = req.body.categories;

    try {
      const cypherQuery = `
        WITH $categories AS categories

        // Step 1: Match resources that belong to any of the selected categories
        MATCH (r:Resource)-[:HAS_CATEGORY]->(cat:Category)
        WHERE cat.name IN categories

        // Step 2: Find modules that include those resources
        MATCH (m:Module)-[:HAS_RESOURCE]->(r)

        // Step 3: Count how many matching resources each module has
        WITH m, COUNT(DISTINCT r) AS matchingResourceCount

        // Step 4: Return module data with a relevance score
        RETURN m {
          .id,
          .title,
          .summary,
          .estimated_duration,
        } AS modRec, matchingResourceCount
        ORDER BY matchingResourceCount DESC
        LIMIT 10
      `;

      const result = await session.run(cypherQuery, {
        selectedCategories: selectedCategories,
      });

      const recommendations = result.records.map((record) => {
        const rec = record.get("modRec");
        return {
          id: rec.id,
          title: rec.title,
          summary: rec.summary,
          estimated_duration: rec.estimated_duration,
        };
      });

      res.status(200).json(recommendations);
    } catch (err) {
      console.error("Recommendation Error:", err);
      res.status(500).json({
        message:
          "Failed to get module recommendations for learning path creation.",
      });
    } finally {
      await session.close();
    }
  },
};

module.exports = recommendationsController;
