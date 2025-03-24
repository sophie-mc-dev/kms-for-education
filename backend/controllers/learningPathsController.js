const { pool } = require("../db/postgres");

const learningPathsController = {
  addLearningPath: async (req, res) => {
    const {
      title,
      description,
      visibility,
      estimated_duration,
      ects,
      modules, 
    } = req.body;
    const user_id = req.user.user_id;

    if (
      !title ||
      !description ||
      !visibility ||
      !estimated_duration ||
      ects === undefined
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Insert Learning Path
      const learningPathResult = await client.query(
        `INSERT INTO learning_paths (title, description, user_id, visibility, estimated_duration, ects, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING id`,
        [title, description, user_id, visibility, estimated_duration, ects]
      );

      const learningPathId = learningPathResult.rows[0].id;

      // Insert modules with correct order
      if (modules && modules.length > 0) {
        const values = modules
          .map((_, index) => `($1, $${index + 2}, $${index + 2 + modules.length})`)
          .join(", ");

        const queryParams = [learningPathId, ...modules, ...modules.map((_, i) => i)];

        await client.query(
          `INSERT INTO learning_path_modules (learning_path_id, module_id, module_order) VALUES ${values}`,
          queryParams
        );
      }

      await client.query("COMMIT");

      res.status(201).json({
        message: "Learning Path created successfully",
        learningPathId,
      });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Error creating learning path:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } finally {
      client.release();
    }
  },

  removeLearningPath: async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query(
        "DELETE FROM learning_paths WHERE id = $1 RETURNING *",
        [id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Learning Path not found" });
      }
      res.json({ message: "Learning Path deleted successfully" });
    } catch (err) {
      console.error("Error deleting learning path:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  getLearningPaths: async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT lp.*, u.first_name, u.last_name 
         FROM learning_paths lp
         JOIN users u ON lp.user_id = u.user_id
         ORDER BY lp.created_at DESC`
      );
      res.json(result.rows);
    } catch (err) {
      console.error("Error fetching learning paths:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  getLearningPathById: async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query(
        `SELECT lp.*, u.first_name, u.last_name 
         FROM learning_paths lp
         JOIN users u ON lp.user_id = u.user_id
         WHERE lp.id = $1`,
        [id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Learning Path not found" });
      }
      res.json(result.rows[0]);
    } catch (err) {
      console.error("Error fetching learning path:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  updateLearningPath: async (req, res) => {
    const { id } = req.params;
    const { title, description, visibility, estimated_duration, ects, modules } = req.body;

    if (!title || !description || !visibility || !estimated_duration || ects === undefined) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Update Learning Path details
      const result = await client.query(
        `UPDATE learning_paths 
         SET title = $1, description = $2, visibility = $3, estimated_duration = $4, ects = $5, updated_at = NOW()
         WHERE id = $6 RETURNING *`,
        [title, description, visibility, estimated_duration, ects, id]
      );

      if (result.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Learning Path not found" });
      }

      // If modules are provided, update their order
      if (modules && modules.length > 0) {
        // Delete existing module entries for the learning path
        await client.query(`DELETE FROM learning_path_modules WHERE learning_path_id = $1`, [id]);

        // Insert new module order
        const values = modules
          .map((_, index) => `($1, $${index + 2}, $${index + 2 + modules.length})`)
          .join(", ");

        const queryParams = [id, ...modules, ...modules.map((_, i) => i)];

        await client.query(
          `INSERT INTO learning_path_modules (learning_path_id, module_id, module_order) VALUES ${values}`,
          queryParams
        );
      }

      await client.query("COMMIT");

      res.json({
        message: "Learning Path updated",
        learningPath: result.rows[0],
      });
    } catch (err) {
      await client.query("ROLLBACK");
      console.error("Error updating learning path:", err);
      res.status(500).json({ error: "Internal Server Error" });
    } finally {
      client.release();
    }
  },

  getModulesByLearningPath: async (req, res) => {
    const { learning_path_id } = req.params;

    try {
      // Query to fetch all modules for the specified learning path
      const result = await pool.query(
        `SELECT m.*
         FROM modules m
         JOIN learning_path_modules lpm ON m.id = lpm.module_id
         WHERE lpm.learning_path_id = $1`,
        [learning_path_id]
      );

      if (result.rows.length === 0) {
        return res
          .status(404)
          .json({ error: "No modules found for this learning path" });
      }

      // Adding order_index dynamically based on the order of modules fetched
      const modulesWithOrderIndex = result.rows.map((module, index) => {
        module.order_index = index + 1; // Start the order index from 1
        return module;
      });

      res.status(200).json(modulesWithOrderIndex);
    } catch (err) {
      console.error("Error fetching modules for learning path:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // Start Learning Path for a User
  startLearningPath: async (req, res) => {
    const { learning_path_id } = req.params;
    const user_id = req.user.user_id;

    try {
      // Check if Learning Path exists
      const lpCheck = await pool.query(
        "SELECT * FROM learning_paths WHERE id = $1",
        [learning_path_id]
      );
      if (lpCheck.rows.length === 0) {
        return res.status(404).json({ error: "Learning Path not found" });
      }

      // Check if user has already started
      const userLPCheck = await pool.query(
        "SELECT * FROM learning_path_progress WHERE user_id = $1 AND learning_path_id = $2",
        [user_id, learning_path_id]
      );
      if (userLPCheck.rows.length > 0) {
        return res.status(400).json({ error: "Learning path already started" });
      }

      // Insert progress entry
      await pool.query(
        `INSERT INTO learning_path_progress (user_id, learning_path_id, progress_percentage, started_at, status) 
         VALUES ($1, $2, 0, NOW(), 'in_progress')
         ON CONFLICT (user_id, learning_path_id) DO UPDATE SET started_at = NOW(), status = 'in_progress'`,
        [user_id, learning_path_id]
      );

      res.status(201).json({ message: "Learning Path started successfully" });
    } catch (err) {
      console.error("Error starting learning path:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // Get User's Learning Path Progress
  getLearningPathProgress: async (req, res) => {
    const { learning_path_id } = req.params;
    const user_id = req.user.user_id;

    try {
      const result = await pool.query(
        `SELECT * FROM learning_path_progress 
         WHERE user_id = $1 AND learning_path_id = $2`,
        [user_id, learning_path_id]
      );
      if (result.rows.length === 0) {
        return res
          .status(404)
          .json({ error: "Progress not found for this learning path" });
      }
      res.json(result.rows[0]);
    } catch (err) {
      console.error("Error fetching learning path progress:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // Update Learning Path Progress
  updateLearningPathProgress: async (req, res) => {
    const { learning_path_id } = req.params;
    const { module_id, progress_percentage, status } = req.body;
    const user_id = req.user.user_id;

    if (!user_id || !learning_path_id || !module_id || !status) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (progress_percentage < 0 || progress_percentage > 100) {
      return res.status(400).json({ error: "Invalid progress percentage" });
    }

    try {
      const result = await pool.query(
        `UPDATE learning_path_progress 
         SET progress_percentage = $1, status = $2, updated_at = NOW()
         WHERE user_id = $3 AND learning_path_id = $4 AND module_id = $5
         RETURNING *`,
        [progress_percentage, status, user_id, learning_path_id, module_id]
      );

      if (result.rows.length === 0) {
        return res
          .status(404)
          .json({ error: "Learning path not found or not started" });
      }

      res.json({
        message: "Progress updated successfully",
        progress: result.rows[0],
      });
    } catch (err) {
      console.error("Error updating learning path progress:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
};

module.exports = learningPathsController;
