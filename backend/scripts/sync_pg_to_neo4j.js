// run script command: node sync_pg_to_neo4j.js

require("dotenv").config();

const { pool } = require("./postgres");
const { driver } = require("./neo4j");

const syncData = async () => {
  const pgClient = await pool.connect();
  const neoSession = driver.session();

  try {
    console.log("🔄 Starting data synchronization...");
    await neoSession.run(`MATCH (n) DETACH DELETE n`);
    console.log("🔥 Cleared existing Neo4j data.");

    // Sync Users
    const users = await pgClient.query(
      "SELECT user_id, first_name, last_name, user_role, education_level, field_of_study, topic_interests, preferred_content_types, language_preference FROM users"
    );
    for (let user of users.rows) {
      await neoSession.run(
        `MERGE (u:User {id: $id}) 
        SET u.first_name = $first_name, u.last_name = $last_name, 
        u.user_role = $user_role, 
        u.education_level = $education_level,
        u.field_of_study = $field_of_study,
        u.topic_interests = $topic_interests,
        u.preferred_content_types = $preferred_content_types,
        u.language_preference = $language_preference
        `,
        {
          id: user.user_id.toString(),
          first_name: user.first_name,
          last_name: user.last_name,
          user_role: user.user_role,
          education_level: user.education_level,
          field_of_study: user.field_of_study,
          topic_interests: user.topic_interests,
          preferred_content_types: user.preferred_content_types,
          language_preference: user.language_preference,
        }
      );
    }

    // **Sync Resources**
    const resources = await pgClient.query(
      "SELECT id, title, description, category, tags, type FROM resources"
    );

    for (let resource of resources.rows) {
      // **Check if category is an array** (PostgreSQL should return it as an array)
      const category = Array.isArray(resource.category)
        ? resource.category
        : [];
      const tags = Array.isArray(resource.tags) ? resource.tags : [];

      // Merge Resource node
      await neoSession.run(
        `MERGE (r:Resource {id: $id})
         SET r.title = $title, r.description = $description, r.type = $type, r.category = $category, r.tags = $tags`,
        {
          id: resource.id.toString(),
          title: resource.title,
          description: resource.description,
          type: resource.type,
          category: resource.category,
          tags: resource.tags,
        }
      );

      // **Sync Categories**: Create relationships between Resource and Categories
      for (let cat of category) {
        cat = cat.trim();
        if (cat) {
          await neoSession.run(
            `
            MATCH (r:Resource {id: $id})
            MERGE (c:Category {name: $cat})
            MERGE (r)-[:HAS_CATEGORY]->(c)
            `,
            { id: resource.id.toString(), cat }
          );
        }
      }
      for (let tag of tags) {
        tag = tag.trim();
        if (tag) {
          await neoSession.run(
            `
            MATCH (r:Resource {id: $id})
            MERGE (t:Tag {name: $tag})
            MERGE (r)-[:HAS_TAG]->(t)
            `,
            { id: resource.id.toString(), tag }
          );
        }
      }

      // **Sync Resource Type**: Ensure types are also properly connected
      if (resource.type) {
        await neoSession.run(
          `
          MATCH (r:Resource {id: $id})
          MERGE (rt:ResourceType {name: $type})
          MERGE (r)-[:OF_TYPE]->(rt)
           `,
          { id: resource.id.toString(), type: resource.type }
        );
      }
    }

    // Sync Modules
    const modules = await pgClient.query(
      "SELECT id, title, summary, objectives, estimated_duration FROM modules"
    );
    for (let module of modules.rows) {
      await neoSession.run(
        "MERGE (m:Module {id: $id}) SET m.title = $title, m.summary = $summary, m.objectives = $objectives, m.estimated_duration = $estimated_duration",
        {
          id: module.id.toString(),
          title: module.title,
          summary: module.summary,
          objectives: module.objectives,
          estimated_duration: module.estimated_duration,
        }
      );
    }

    // Sync Learning Paths
    const learningPaths = await pgClient.query(
      "SELECT id, title, summary, objectives, difficulty_level, estimated_duration FROM learning_paths"
    );
    for (let lp of learningPaths.rows) {
      await neoSession.run(
        "MERGE (lp:LearningPath {id: $id}) SET lp.title = $title, lp.summary = $summary, lp.objectives = $objectives, lp.difficulty_level = $difficulty_level, lp.estimated_duration = $estimated_duration",
        {
          id: lp.id.toString(),
          title: lp.title,
          summary: lp.summary,
          objectives: lp.objectives,
          difficulty_level: lp.difficulty_level,
          estimated_duration: lp.estimated_duration,
        }
      );
    }

    // Sync Relationships: Modules contain Resources
    const moduleResources = await pgClient.query(
      "SELECT module_id, resource_id FROM module_resources"
    );
    for (let mr of moduleResources.rows) {
      await neoSession.run(
        "MATCH (m:Module {id: $module_id}), (r:Resource {id: $resource_id}) MERGE (m)-[:HAS_RESOURCE]->(r)",
        {
          module_id: mr.module_id.toString(),
          resource_id: mr.resource_id.toString(),
        }
      );
    }

    // Sync Relationships: Learning Paths include Modules
    const learningPathModules = await pgClient.query(
      "SELECT learning_path_id, module_id FROM learning_path_modules"
    );
    for (let lpm of learningPathModules.rows) {
      await neoSession.run(
        "MATCH (lp:LearningPath {id: $learning_path_id}), (m:Module {id: $module_id}) MERGE (lp)-[:HAS_MODULE]->(m)",
        {
          learning_path_id: lpm.learning_path_id.toString(),
          module_id: lpm.module_id.toString(),
        }
      );
    }

    // Sync Bookmarks
    const bookmarks = await pgClient.query(
      "SELECT user_id, resource_id FROM bookmarks"
    );
    for (let bookmark of bookmarks.rows) {
      await neoSession.run(
        "MATCH (u:User {id: $user_id}), (r:Resource {id: $resource_id}) MERGE (u)-[:BOOKMARKED]->(r)",
        {
          user_id: bookmark.user_id.toString(),
          resource_id: bookmark.resource_id.toString(),
        }
      );
    }

    // Sync User Interactions using Interaction nodes
    const userInteractions = await pgClient.query(
      "SELECT user_id, resource_id, module_id, learning_path_id, interaction_type, timestamp FROM user_interactions"
    );

    for (let interaction of userInteractions.rows) {
      if (interaction.user_id && interaction.interaction_type) {
        const timestamp = interaction.timestamp
          ? interaction.timestamp.toISOString()
          : new Date().toISOString();

        const weight = calculateInteractionWeight(
          interaction.interaction_type,
          interaction.timestamp
        );

        const interactionId = `${interaction.user_id}_${interaction.interaction_type}_${timestamp}`;

        // Create Interaction node
        await neoSession.run(
          `
      MERGE (i:Interaction {id: $interactionId})
      SET i.type = $type, i.timestamp = datetime($timestamp), i.weight = $weight
      `,
          {
            interactionId,
            type: interaction.interaction_type.toUpperCase(),
            timestamp,
            weight,
          }
        );

        // Create PERFORMED relationship
        await neoSession.run(
          `
      MATCH (u:User {id: $userId}), (i:Interaction {id: $interactionId})
      MERGE (u)-[:PERFORMED]->(i)
      `,
          {
            userId: interaction.user_id.toString(),
            interactionId,
          }
        );

        // Create TARGET relationship to Resource / Module / LearningPath
        if (interaction.resource_id) {
          await neoSession.run(
            `
        MATCH (i:Interaction {id: $interactionId}), (r:Resource {id: $targetId})
        MERGE (i)-[:TARGET]->(r)
        `,
            {
              interactionId,
              targetId: interaction.resource_id.toString(),
            }
          );
        } else if (interaction.module_id) {
          await neoSession.run(
            `
        MATCH (i:Interaction {id: $interactionId}), (m:Module {id: $targetId})
        MERGE (i)-[:TARGET]->(m)
        `,
            {
              interactionId,
              targetId: interaction.module_id.toString(),
            }
          );
        } else if (interaction.learning_path_id) {
          await neoSession.run(
            `
        MATCH (i:Interaction {id: $interactionId}), (lp:LearningPath {id: $targetId})
        MERGE (i)-[:TARGET]->(lp)
        `,
            {
              interactionId,
              targetId: interaction.learning_path_id.toString(),
            }
          );
        } else {
          console.log(
            `Skipping TARGET relationship due to missing target: ${JSON.stringify(
              interaction
            )}`
          );
        }
      } else {
        console.log(
          `Skipping interaction due to missing user_id or interaction_type: ${JSON.stringify(
            interaction
          )}`
        );
      }
    }

    console.log("✅ Data synchronization completed successfully!");
  } catch (error) {
    console.error("Error syncing data:", error);
  } finally {
    pgClient.release();
    await neoSession.close();
  }
};

function calculateInteractionWeight(interactionType, timestamp) {
  let baseWeight = 0;

  switch (interactionType) {
    case "viewed_resource":
    case "viewed_module":
    case "viewed_learning_path":
      baseWeight = 2;
      break;
    case "started_module":
    case "started_learning_path":
      baseWeight = 3;
      break;
    case "bookmarked":
      baseWeight = 4;
      break;
    case "completed_module":
      baseWeight = 5;
      break;
    case "completed_learning_path":
      baseWeight = 6;
      break;
    default:
      baseWeight = 1;
  }

  const now = new Date();
  const interactionDate = new Date(timestamp);
  const timeDiff = now - interactionDate;
  const daysDiff = timeDiff / (1000 * 3600 * 24);

  const recencyFactor = Math.max(1, 10 - daysDiff); // More recent = higher

  return baseWeight * recencyFactor;
}
// syncData();
module.exports = { syncData };
