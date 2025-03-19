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
    const users = await pgClient.query("SELECT user_id, first_name, last_name, user_role FROM users");
    for (let user of users.rows) {
      await neoSession.run(
        "MERGE (u:User {id: $id}) SET u.first_name = $first_name, u.last_name = $last_name, u.user_role = $user_role",
        { id: user.user_id.toString(), first_name: user.first_name, last_name: user.last_name, user_role: user.user_role }
      );
    }

    // Sync Resources
    // const resources = await pgClient.query("SELECT id, title, description, category, type FROM resources");
    // for (let resource of resources.rows) {
    //   await neoSession.run(
    //     "MERGE (r:Resource {id: $id}) SET r.title = $title, r.description = $description, r.category = $category, r.type = $type",
    //     { id: resource.id.toString(), title: resource.title, description: resource.description, category: resource.category, type: resource.type }
    //   );
    // }

    // **Sync Resources**
    const resources = await pgClient.query("SELECT id, title, description, category, type, tags FROM resources");

    for (let resource of resources.rows) {
      console.log(`Syncing resource: ${resource.id} - ${resource.title}`);

      // **Check if tags is an array** (PostgreSQL should return it as an array)
      const tags = Array.isArray(resource.tags) ? resource.tags : [];

      // Merge Resource node
      await neoSession.run(
        `MERGE (r:Resource {id: $id})
         SET r.title = $title, r.description = $description, r.category = $category, r.type = $type`,
        {
          id: resource.id.toString(),
          title: resource.title,
          description: resource.description,
          category: resource.category,
          type: resource.type
        }
      );

      // **Sync Tags**: Create relationships between Resource and Tags
      for (let tag of tags) {
        tag = tag.trim();
        if (tag) {
          await neoSession.run(
            `MERGE (t:Tag {name: $tag})
             MERGE (r:Resource {id: $id})
             MERGE (r)-[:HAS_TAG]->(t)`,
            { id: resource.id.toString(), tag }
          );
        }
      }

      // **Sync Resource Type**: Ensure types are also properly connected
      if (resource.type) {
        await neoSession.run(
          `MERGE (rt:ResourceType {name: $type})
           MERGE (r:Resource {id: $id})
           MERGE (r)-[:OF_TYPE]->(rt)`,
          { id: resource.id.toString(), type: resource.type }
        );
      }
    }

    // Sync Modules
    const modules = await pgClient.query("SELECT id, title, description, estimated_duration FROM modules");
    for (let module of modules.rows) {
      await neoSession.run(
        "MERGE (m:Module {id: $id}) SET m.title = $title, m.description = $description, m.estimated_duration = $estimated_duration",
        { id: module.id.toString(), title: module.title, description: module.description, estimated_duration: module.estimated_duration }
      );
    }

    // Sync Learning Paths
    const learningPaths = await pgClient.query("SELECT id, title, description, difficulty_level FROM learning_paths");
    for (let lp of learningPaths.rows) {
      await neoSession.run(
        "MERGE (lp:LearningPath {id: $id}) SET lp.title = $title, lp.description = $description, lp.difficulty_level = $difficulty_level",
        { id: lp.id.toString(), title: lp.title, description: lp.description, difficulty_level: lp.difficulty_level }
      );
    }

    // Sync Relationships: Modules contain Resources
    const moduleResources = await pgClient.query("SELECT module_id, resource_id FROM module_resources");
    for (let mr of moduleResources.rows) {
      await neoSession.run(
        "MATCH (m:Module {id: $module_id}), (r:Resource {id: $resource_id}) MERGE (m)-[:CONTAINS]->(r)",
        { module_id: mr.module_id.toString(), resource_id: mr.resource_id.toString() }
      );
    }

    // Sync Relationships: Learning Paths include Modules
    const learningPathModules = await pgClient.query("SELECT learning_path_id, module_id FROM learning_path_modules");
    for (let lpm of learningPathModules.rows) {
      await neoSession.run(
        "MATCH (lp:LearningPath {id: $learning_path_id}), (m:Module {id: $module_id}) MERGE (lp)-[:INCLUDES]->(m)",
        { learning_path_id: lpm.learning_path_id.toString(), module_id: lpm.module_id.toString() }
      );
    }

    // Sync Bookmarks
    const bookmarks = await pgClient.query("SELECT user_id, resource_id FROM bookmarks");
    for (let bookmark of bookmarks.rows) {
      await neoSession.run(
        "MATCH (u:User {id: $user_id}), (r:Resource {id: $resource_id}) MERGE (u)-[:BOOKMARKED]->(r)",
        { user_id: bookmark.user_id.toString(), resource_id: bookmark.resource_id.toString() }
      );
    }

    // Sync User Interactions
    const userInteractions = await pgClient.query("SELECT user_id, resource_id, interaction_type FROM user_interactions");
    for (let interaction of userInteractions.rows) {
      await neoSession.run(
        "MATCH (u:User {id: $user_id}), (r:Resource {id: $resource_id}) MERGE (u)-[:INTERACTED_WITH {type: $interaction_type}]->(r)",
        { user_id: interaction.user_id.toString(), resource_id: interaction.resource_id.toString(), interaction_type: interaction.interaction_type }
      );
    }

    console.log("Data synchronization completed successfully!");
  } catch (error) {
    console.error("Error syncing data:", error);
  } finally {
    pgClient.release();
    await neoSession.close();
  }
};

// syncData();
module.exports = { syncData };