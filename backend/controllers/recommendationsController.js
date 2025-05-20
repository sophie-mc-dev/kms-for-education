const { pool } = require("../scripts/postgres");
const { driver } = require("../scripts/neo4j");
const { getUserProfile } = require("../utils/getUserById");

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

    const userProfile = await getUserProfile(user_id);
    if (!userProfile) {
      return res.status(404).json({ message: "User not found" });
    }

    const {
      education_level,
      field_of_study,
      topic_interests,
      preferred_content_types,
      language_preference,
    } = userProfile;

    try {
      // Interaction-Based Recommendations
      const interactionQuery = `
      MATCH (u:User {id: $user_id})
      OPTIONAL MATCH (u)-[:PERFORMED]->(:Interaction)-[:TARGET]->(iRes:Resource)
      WITH u, COLLECT(DISTINCT iRes.id) AS interactedIds

      MATCH (rec:Resource)
      WHERE NOT rec.id IN interactedIds

      OPTIONAL MATCH (rec)-[:HAS_CATEGORY]->(cat:Category)
      OPTIONAL MATCH (rec)-[:HAS_TAG]->(tag:Tag)
      WITH rec, COLLECT(DISTINCT cat.name) AS recCategories,
           COLLECT(DISTINCT tag.name) AS recTags

      OPTIONAL MATCH (:Interaction)-[:TARGET]->(rec)
      WITH rec, recCategories, recTags,
           COUNT(*) AS popularity

      RETURN rec {
        .id,
        .title,
        .description,
        .type,
        category: recCategories,
        tags: recTags,
        score: popularity
      }
      ORDER BY popularity DESC
      LIMIT 6
    `;

      let result = await session.run(interactionQuery, { user_id });

      let recommendations = result.records.map((record) => {
        const rec = record.get("rec");
        return {
          id: rec.id,
          title: rec.title,
          description: rec.description,
          type: rec.type,
          category: rec.category,
          tags: rec.tags,
          score: rec.score,
        };
      });

      // Fallback: Profile-Based if no interaction-based recommendations
      if (recommendations.length === 0) {
        const profileQuery = `
        MATCH (rec:Resource)
        OPTIONAL MATCH (rec)-[:HAS_CATEGORY]->(cat:Category)
        OPTIONAL MATCH (rec)-[:HAS_TAG]->(tag:Tag)
        WITH rec,
             COLLECT(DISTINCT cat.name) AS recCategories,
             COLLECT(DISTINCT tag.name) AS recTags

        WITH rec, recCategories, recTags,
             (
               (CASE WHEN $education_level IN recCategories THEN 1 ELSE 0 END) +
               (CASE WHEN $topic_interests IN recCategories THEN 1 ELSE 0 END) +
               (CASE WHEN rec.type IN $preferred_content_types THEN 1 ELSE 0 END)
             ) AS profileScore

        RETURN rec {
          .id,
          .title,
          .description,
          .type,
          category: recCategories,
          tags: recTags,
          score: profileScore
        }
        ORDER BY profileScore DESC
        LIMIT 6
      `;

        result = await session.run(profileQuery, {
          education_level,
          field_of_study,
          topic_interests,
          preferred_content_types,
          language_preference,
        });

        recommendations = result.records.map((record) => {
          const rec = record.get("rec");
          return {
            id: rec.id,
            title: rec.title,
            description: rec.description,
            type: rec.type,
            category: rec.category,
            tags: rec.tags,
            score: rec.score,
          };
        });
      }

      // Fallback: Popular Resources if profile-based also returns nothing
      if (recommendations.length === 0) {
        const popularQuery = `
        MATCH (r:Resource)
        OPTIONAL MATCH (:Interaction)-[:TARGET]->(r)
        WITH r, COUNT(*) AS popularity
        RETURN r {
          .id,
          .title,
          .description,
          .type
        } AS resource
        ORDER BY popularity DESC
        LIMIT 6
      `;

        const fallbackResult = await session.run(popularQuery);
        recommendations = fallbackResult.records.map((record) =>
          record.get("resource")
        );
      }

      res.json(recommendations);
    } catch (error) {
      console.error("Error getting recommendations:", error);
      res.status(500).json({
        message: "Failed to get resource recommendations.",
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
      let recommendations = [];

      // Step 1: Modules directly linked to the resource
      const directQuery = `
      MATCH (m:Module)-[:HAS_RESOURCE]->(r:Resource {id: $resource_id})
      RETURN DISTINCT m { .id, .title, .summary, .estimated_duration }
      LIMIT 5
    `;
      const directResult = await session.run(directQuery, { resource_id });
      recommendations = directResult.records.map((r) => r.get("m"));

      if (recommendations.length === 0) {
        // Step 2: Modules linked to similar category resources
        const categoryQuery = `
        MATCH (r1:Resource {id: $resource_id})-[:HAS_CATEGORY]->(c:Category)
        MATCH (r2:Resource)-[:HAS_CATEGORY]->(c)
        WHERE r2.id <> r1.id
        MATCH (m:Module)-[:HAS_RESOURCE]->(r2)
        RETURN DISTINCT m { .id, .title, .summary, .estimated_duration }
        LIMIT 5
      `;
        const categoryResult = await session.run(categoryQuery, {
          resource_id,
        });
        recommendations = categoryResult.records.map((r) => r.get("m"));
      }

      if (recommendations.length === 0) {
        // Step 3: Random fallback
        const fallbackQuery = `
        MATCH (m:Module)<-[:TARGET]-(i:Interaction)
        WITH m, SUM(
          CASE i.type
            WHEN 'viewed_module' THEN 2
            WHEN 'started_module' THEN 3
            WHEN 'bookmarked' THEN 4
            WHEN 'completed_module' THEN 5
            ELSE 1
          END
        ) AS score
        RETURN m { .id, .title, .summary, .estimated_duration } 
        ORDER BY score DESC
        LIMIT 5
      `;
        const fallbackResult = await session.run(fallbackQuery);
        recommendations = fallbackResult.records.map((r) => r.get("m"));
      }

      res.status(200).json(recommendations);
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
    const user_id = req.query.user_id;
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

        // interaction boost: separate match to count interactions
        OPTIONAL MATCH (u:User {id: $user_id})-[:PERFORMED]->(:Interaction)-[:TARGET]->(other)
        WITH r, resourceCategories, resourceTags, rTitle, rDesc,
            other, COLLECT(DISTINCT cat2) AS otherCategories,
            COLLECT(DISTINCT tag2) AS otherTags,
            toLower(other.title) AS oTitle, toLower(other.description) AS oDesc,
            COUNT(DISTINCT u) AS interactionBoost

        WITH other, otherCategories, otherTags,
            SIZE([c IN otherCategories WHERE c IN resourceCategories]) AS categoryScore,
            SIZE([t IN otherTags WHERE t IN resourceTags]) AS tagScore,
            apoc.text.sorensenDiceSimilarity(oTitle, rTitle) AS titleScore,
            apoc.text.sorensenDiceSimilarity(oDesc, rDesc) AS descScore,
            interactionBoost

        WITH other, otherCategories, otherTags,
            (categoryScore * 2 + tagScore * 2 + titleScore + descScore + interactionBoost * 3) AS totalScore

        ORDER BY totalScore DESC
        RETURN other {
          .id, .title, .description, .type,
          category: [cat IN otherCategories | cat.name],
          tags: [tag IN otherTags | tag.name],
          score: totalScore
        }
        LIMIT 12
      `;

      const result = await session.run(cypherQuery, {
        resource_id,
        user_id,
      });

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
        MATCH (mod:Module {id: moduleId})-[:HAS_RESOURCE]->(res:Resource)
        WITH mod, COLLECT(res) AS modResources, userId

        OPTIONAL MATCH (lp:LearningPath)-[:HAS_MODULE]->(mod)
        WITH mod, modResources, COLLECT(DISTINCT lp) AS directLPs, userId

        OPTIONAL MATCH (otherMod:Module)-[:HAS_RESOURCE]->(sharedRes:Resource)
        WHERE otherMod.id <> mod.id AND sharedRes IN modResources
        WITH modResources, directLPs, COLLECT(DISTINCT otherMod) AS relatedModules, userId

        OPTIONAL MATCH (fallbackLP:LearningPath)-[:HAS_MODULE]->(relatedMod:Module)
        WHERE relatedMod IN relatedModules
        WITH modResources, directLPs, COLLECT(DISTINCT fallbackLP) AS fallbackLPs, userId

        OPTIONAL MATCH (user:User {id: userId})-[:PERFORMED]->(interaction:Interaction {type: "VIEWED_RESOURCE"})-[:TARGET]->(viewedRes:Resource)
        WHERE viewedRes IN modResources
        WITH directLPs, fallbackLPs, COUNT(DISTINCT interaction) AS viewedCount

        CALL {
          WITH directLPs, viewedCount
          UNWIND directLPs AS directLP
          RETURN directLP AS learningPath, (10 + viewedCount * 3) AS score, 'direct' AS source
          UNION
          WITH fallbackLPs, viewedCount
          UNWIND fallbackLPs AS fallbackLP
          RETURN fallbackLP AS learningPath, (5 + viewedCount * 2) AS score, 'fallback' AS source
        }

        WITH DISTINCT learningPath, score, source
        RETURN learningPath { .id, .title, .summary, .estimated_duration } AS recommendedPath, score, source
        ORDER BY score DESC
        LIMIT 5
      `;

      const result = await session.run(cypherQuery, {
        user_id: user_id,
        module_id: module_id,
      });

      if (result.records.length === 0) {
        // Fallback query if no results from main query
        const fallbackQuery = `
        MATCH (lp:LearningPath)
        RETURN lp { .id, .title, .summary, .estimated_duration } AS recommendedPath, 1 AS score, 'popular' AS source
        ORDER BY lp.popularity DESC  
        LIMIT 5
      `;

        result = await session.run(fallbackQuery);
      }

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

        // Step 1: Get current learning path title, objectives, modules, and their resources
        MATCH (lp:LearningPath {id: currentLearningPathId})
        WITH lp.title AS lpTitle, lp.objectives AS lpObjectives

        MATCH (lp)-[:HAS_MODULE]->(mod:Module)-[:HAS_RESOURCE]->(res:Resource)
        WITH lpTitle, lpObjectives, COLLECT(DISTINCT mod) AS currentModules, COLLECT(DISTINCT res) AS currentResources

        // Step 2: Find resources NOT in current learning path modules/resources
        MATCH (otherMod:Module)-[:HAS_RESOURCE]->(recommendedRes:Resource)
        WHERE NOT recommendedRes IN currentResources
        AND ALL(m IN currentModules WHERE m.id <> otherMod.id)
        WITH DISTINCT recommendedRes, lpTitle, lpObjectives

        // Step 3: Get categories, tags, and count user views on each recommended resource
        OPTIONAL MATCH (recommendedRes)-[:HAS_CATEGORY]->(cat:Category)
        OPTIONAL MATCH (recommendedRes)-[:HAS_TAG]->(tag:Tag)
        OPTIONAL MATCH (user:User {id: userId})-[:PERFORMED]->(interaction:Interaction {type: "VIEWED_RESOURCE"})-[:TARGET]->(recommendedRes)
        WITH recommendedRes, 
            COLLECT(DISTINCT cat.name) AS categories,
            COLLECT(DISTINCT tag.name) AS tags,
            COUNT(DISTINCT interaction) AS viewCount,
            lpTitle,
            lpObjectives

        // Step 4: Calculate similarity scores with learning path title and objectives
        WITH recommendedRes, categories, tags, viewCount,
            apoc.text.sorensenDiceSimilarity(toLower(recommendedRes.title), toLower(lpTitle)) AS titleSim,
            apoc.text.sorensenDiceSimilarity(toLower(recommendedRes.description), toLower(lpObjectives)) AS descSim

        // Step 5: Combine scores - weight can be adjusted
        WITH recommendedRes, categories, tags, viewCount,
            (viewCount * 1.0) + (titleSim * 2.0) + (descSim * 1.5) AS totalScore

        ORDER BY totalScore DESC

        // Step 6: Return final recommendations
        RETURN recommendedRes {
            .id,
            .title,
            .description,
            .type,
            category: categories,
            tags: tags,
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

      // Get current module and its resources/categories
      MATCH (current:Module {id: currentModuleId})-[:HAS_RESOURCE]->(res:Resource)
      OPTIONAL MATCH (res)-[:HAS_CATEGORY]->(cat:Category)
      WITH current, COLLECT(DISTINCT res) AS currentResources, COLLECT(DISTINCT cat.name) AS currentCategories, userId

      // Get learning paths containing current module
      OPTIONAL MATCH (lp:LearningPath)-[:HAS_MODULE]->(current)
      WITH current, currentResources, currentCategories, COLLECT(lp) AS lps, userId

      // Get modules user has completed
      MATCH (user:User {id: userId})-[:PERFORMED]->(:Interaction {type: "COMPLETED_MODULE"})-[:TARGET]->(completed)
      WHERE completed:Module
      WITH current, currentResources, currentCategories, lps, COLLECT(completed.id) AS completedModuleIds

      // Find other modules not completed or current
      MATCH (modRec:Module)
      WHERE modRec.id <> current.id AND NOT modRec.id IN completedModuleIds

      // Get candidate module's resources and categories
      OPTIONAL MATCH (modRec)-[:HAS_RESOURCE]->(res2:Resource)
      OPTIONAL MATCH (res2)-[:HAS_CATEGORY]->(cat2:Category)
      WITH current, currentResources, currentCategories, modRec, lps,
          COLLECT(DISTINCT res2) AS recResources,
          COLLECT(DISTINCT cat2.name) AS recCategories

      // Check if modRec is in any of the same learning paths
      OPTIONAL MATCH (lp:LearningPath)-[:HAS_MODULE]->(modRec)
      WHERE lp IN lps
      WITH current, currentResources, currentCategories, modRec,
          SIZE([r IN currentResources WHERE r IN recResources]) AS sharedResourceCount,
          SIZE(apoc.coll.intersection(currentCategories, recCategories)) AS sharedCategoryCount,
          COUNT(lp) > 0 AS sameLearningPath

      // Score modules
      WITH modRec,
          CASE WHEN sameLearningPath THEN 2 ELSE 0 END +
          (CASE WHEN abs(modRec.estimated_duration - current.estimated_duration) < current.estimated_duration * 0.2 THEN 2 ELSE 0 END) +
          sharedResourceCount * 5 +
          sharedCategoryCount * 3 AS score

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

      let recommendations = result.records.map((record) => {
        const rec = record.get("modRec");
        return {
          id: rec.id,
          title: rec.title,
          summary: rec.summary,
          estimated_duration: rec.estimated_duration,
        };
      });

      // Fallback: most popular modules overall
      if (recommendations.length === 0) {
        const fallbackQuery = `
        MATCH (m:Module)<-[:TARGET]-(i:Interaction)
        WITH m, SUM(
          CASE i.type
            WHEN 'viewed_module' THEN 2
            WHEN 'started_module' THEN 3
            WHEN 'bookmarked' THEN 4
            WHEN 'completed_module' THEN 5
            ELSE 1
          END
        ) AS score
        RETURN m { .id, .title, .summary, .estimated_duration }
        ORDER BY score DESC
        LIMIT 6
      `;

        const fallbackResult = await session.run(fallbackQuery);
        recommendations = fallbackResult.records.map((record) => {
          const rec = record.get("m");
          return {
            id: rec.id,
            title: rec.title,
            summary: rec.summary,
            estimated_duration: rec.estimated_duration,
          };
        });
      }

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
    const categories = req.body.categories;
    const session = driver.session();

    try {
      const cypherQuery = `
        WITH $categories AS categories

        MATCH (r:Resource)-[:HAS_CATEGORY]->(cat:Category)
        WHERE cat.name IN categories

        MATCH (m:Module)-[:HAS_RESOURCE]->(r)

        WITH m, COUNT(DISTINCT r) AS matchingResourceCount

        RETURN m {
          .id,
          .title,
          .summary,
          .estimated_duration
        } AS modRec, matchingResourceCount
        ORDER BY matchingResourceCount DESC
        LIMIT 10
      `;

      const result = await session.run(cypherQuery, {
        categories: categories,
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

  getModuleRecommendationForStudyPathCreation: async (req, res) => {
    const { categories, user_id } = req.body;
    const session = driver.session();

    try {
      const cypherQuery = `
        WITH $categories AS categories, $user_id AS userId

        // Find all modules completed by the user
        MATCH (u:User {id: userId})-[:PERFORMED]->(interaction:Interaction)-[:TARGET]->(completedModule:Module)
        WHERE interaction.type = "COMPLETED_MODULE"
        WITH categories, collect(completedModule.id) AS completedIds

        // Match modules related to the selected categories
        MATCH (r:Resource)-[:HAS_CATEGORY]->(cat:Category)
        WHERE cat.name IN categories

        MATCH (m:Module)-[:HAS_RESOURCE]->(r)

        // Exclude completed modules
        WHERE NOT m.id IN completedIds

        WITH m, COUNT(DISTINCT r) AS matchingResourceCount

        RETURN m {
          .id,
          .title,
          .summary,
          .estimated_duration
        } AS modRec, matchingResourceCount
        ORDER BY matchingResourceCount DESC
        LIMIT 10
      `;

      const result = await session.run(cypherQuery, {
        categories: categories,
        user_id: user_id,
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

  getResourceRecommendationForModuleCreation: async (req, res) => {
    const categories = req.body.categories;
    const session = driver.session();

    try {
      const cypherQuery = `
        WITH $categories AS categories

        MATCH (r:Resource)-[:HAS_CATEGORY]->(cat:Category)
        WHERE cat.name IN categories

        RETURN r {
          .id,
          .title,
          .description,
          .type,
          .category,
          .tags
        } AS recRes
        ORDER BY r.title
        LIMIT 10
      `;

      const result = await session.run(cypherQuery, {
        categories: categories,
      });

      const recommendations = result.records.map((record) => {
        const rec = record.get("recRes");
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
        message: "Failed to get resource recommendations for module creation.",
      });
    } finally {
      await session.close();
    }
  },
};

module.exports = recommendationsController;
