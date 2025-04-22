// run script command: node sync_pg_to_neo4j.js

require("dotenv").config();

const { pool } = require("./postgres");
const { driver } = require("./neo4j");

const syncData = async () => {
  const pgClient = await pool.connect();
  const neoSession = driver.session();

  try {
    console.log("Starting data synchronization...");

    // Sync Users
    const users = await pgClient.query(
      "SELECT user_id, first_name, last_name, user_role FROM users"
    );
    for (let user of users.rows) {
      await neoSession.run(
        "MERGE (u:User {id: $id}) SET u.first_name = $first_name, u.last_name = $last_name, u.user_role = $user_role",
        {
          id: user.user_id.toString(),
          first_name: user.first_name,
          last_name: user.last_name,
          user_role: user.user_role,
        }
      );
    }

    // **Sync Resources**
    const resources = await pgClient.query(
      "SELECT id, title, description, category, type FROM resources"
    );

    for (let resource of resources.rows) {
      // **Check if category is an array** (PostgreSQL should return it as an array)
      const category = Array.isArray(resource.category)
        ? resource.category
        : [];

      // Merge Resource node
      await neoSession.run(
        `MERGE (r:Resource {id: $id})
         SET r.title = $title, r.description = $description, r.type = $type, r.category = $category`,
        {
          id: resource.id.toString(),
          title: resource.title,
          description: resource.description,
          type: resource.type,
          category: resource.category,
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
      "SELECT id, title, summary, objectives, estimated_duration, ects FROM modules"
    );
    for (let module of modules.rows) {
      await neoSession.run(
        "MERGE (m:Module {id: $id}) SET m.title = $title, m.summary = $summary, m.objectives = $objectives, m.estimated_duration = $estimated_duration, m.ects = $ects",
        {
          id: module.id.toString(),
          title: module.title,
          summary: module.summary,
          objectives: module.objectives,
          estimated_duration: module.estimated_duration,
          ects: module.ects,
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

    // Sync User Interactions with weights
    const userInteractions = await pgClient.query(
      "SELECT user_id, resource_id, module_id, learning_path_id, interaction_type, timestamp FROM user_interactions"
    );

    for (let interaction of userInteractions.rows) {
      // Ensure that user_id and interaction_type are not null/undefined
      if (interaction.user_id && interaction.interaction_type) {
        let query = "MATCH (u:User {id: $user_id})";
        let params = { user_id: interaction.user_id.toString() };
        params.timestamp = interaction.timestamp
          ? interaction.timestamp.toISOString()
          : null;

        // Calculate the interaction weight
        let weight = calculateInteractionWeight(
          interaction.interaction_type,
          interaction.timestamp
        );

        // Only add resource_id match if resource_id is not null
        if (interaction.resource_id) {
          query += ", (r:Resource {id: $resource_id})";
          params.resource_id = interaction.resource_id.toString();
        }

        // Only add module_id match if module_id is not null
        if (interaction.module_id) {
          query += ", (m:Module {id: $module_id})";
          params.module_id = interaction.module_id.toString();
        }

        // Only add learning_path_id match if learning_path_id is not null
        if (interaction.learning_path_id) {
          query += ", (lp:LearningPath {id: $learning_path_id})";
          params.learning_path_id = interaction.learning_path_id.toString();
        }

        // Ensure we have an interaction with either resource, module, or learning path
        if (
          interaction.resource_id ||
          interaction.module_id ||
          interaction.learning_path_id
        ) {
          query += ` CREATE (u)-[:${interaction.interaction_type.toUpperCase()} {timestamp: datetime($timestamp), weight: $weight}]->`;

          // Add the appropriate node relationship based on the available ids
          if (interaction.resource_id) {
            query += "(r)";
          } else if (interaction.module_id) {
            query += "(m)";
          } else if (interaction.learning_path_id) {
            query += "(lp)";
          }

          // Run the final query with all parameters
          await neoSession.run(query, {
            ...params,
            interaction_type: interaction.interaction_type,
            weight: weight,
          });
        } else {
          console.log(
            `Skipping interaction due to missing resource, module, or learning path: ${JSON.stringify(
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

    console.log("Data synchronization completed successfully!");
  } catch (error) {
    console.error("Error syncing data:", error);
  } finally {
    pgClient.release();
    await neoSession.close();
  }
};

function calculateInteractionWeight(interactionType, timestamp) {
  // Set a base weight depending on interaction type
  let baseWeight = 0;
  
  switch (interactionType) {
    case 'viewed_resource':
      baseWeight = 1;  // Viewing a resource has a lower weight
      break;
    case 'bookmarked':
      baseWeight = 2;  // Bookmarking a resource might indicate higher interest
      break;
    case 'completed_module':
      baseWeight = 5;  // Completing a module or resource is a strong indicator of engagement
      break;
    default:
      baseWeight = 1;
      break;
  }

  // Factor in recency: recent interactions get higher weights
  const now = new Date();
  const interactionDate = new Date(timestamp);
  const timeDiff = now - interactionDate; // time difference in milliseconds
  const daysDiff = timeDiff / (1000 * 3600 * 24); // Convert to days
  
  // A simple weight decay model: recency increases weight
  const recencyFactor = Math.max(1, 10 - daysDiff);  // Max decay weight factor is 10 (recent interactions)

  return baseWeight * recencyFactor; // Weight adjusted by recency
}


// syncData();
module.exports = { syncData };
