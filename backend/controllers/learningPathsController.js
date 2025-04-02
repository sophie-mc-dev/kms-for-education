const { pool } = require("../db/postgres");

const learningPathsController = {
  addLearningPath: async (req, res) => {
    const {
      title,
      summary,
      visibility,
      estimatedDuration,
      ects,
      modules,
      objectives,
      user_id,
    } = req.body;

    // Validate required fields
    if (
      !title ||
      !summary ||
      !visibility ||
      !estimatedDuration ||
      ects === undefined ||
      !objectives ||
      !user_id
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Insert Learning Path
      const learningPathResult = await client.query(
        `INSERT INTO learning_paths (title, summary, user_id, visibility, estimated_duration, ects, objectives, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING id`,
        [
          title,
          summary,
          user_id,
          visibility,
          estimatedDuration,
          ects,
          objectives,
        ]
      );

      const learningPathId = learningPathResult.rows[0].id;

      // Insert modules into the learning_path_modules table
      const insertModuleQuery = `
    INSERT INTO public.learning_path_modules (learning_path_id, module_id, module_order)
    VALUES ($1, $2, $3);
  `;
      for (const { module_id, module_order } of modules) {
        await client.query(insertModuleQuery, [
          learningPathId,
          module_id,
          module_order,
        ]);
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
    const { title, summary, visibility, estimated_duration, ects, modules } =
      req.body;

    if (
      !title ||
      !summary ||
      !visibility ||
      !estimated_duration ||
      ects === undefined
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      // Update Learning Path details
      const result = await client.query(
        `UPDATE learning_paths 
         SET title = $1, summary = $2, visibility = $3, estimated_duration = $4, ects = $5, updated_at = NOW()
         WHERE id = $6 RETURNING *`,
        [title, summary, visibility, estimated_duration, ects, id]
      );

      if (result.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Learning Path not found" });
      }

      // If modules are provided, update their order
      if (modules && modules.length > 0) {
        // Delete existing module entries for the learning path
        await client.query(
          `DELETE FROM learning_path_modules WHERE learning_path_id = $1`,
          [id]
        );

        // Insert new module order
        const values = modules
          .map(
            (_, index) => `($1, $${index + 2}, $${index + 2 + modules.length})`
          )
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

      res.json(result.rows);
    } catch (err) {
      console.error("Error fetching modules for learning path:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // Start Learning Path for a User
  startLearningPath: async (req, res) => {
    const { learning_path_id, user_id } = req.body;

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

      // Get all modules ordered by module_order
      const modulesQuery = await pool.query(
        `SELECT module_id FROM learning_path_modules 
        WHERE learning_path_id = $1 
        ORDER BY module_order ASC`,
        [learning_path_id]
      );

      if (modulesQuery.rows.length === 0) {
        return res
          .status(400)
          .json({ error: "No modules found in this learning path" });
      }

      const allModules = modulesQuery.rows.map((row) => row.module_id);
      const firstModuleId = allModules[0];

      // Lock all modules except the first one
      const lockedModules = allModules.slice(1);

      // Insert new progress entry
      await pool.query(
        `INSERT INTO learning_path_progress 
          (user_id, learning_path_id, current_module_id, completed_module_ids, locked_module_ids, progress_percentage, status, started_at) 
          VALUES ($1, $2, $3, '{}', $4, 0.00, 'in_progress', NOW())`,
        [user_id, learning_path_id, firstModuleId, lockedModules]
      );

      // Log the interaction in the user_interactions table
      await pool.query(
        `INSERT INTO user_interactions (user_id, learning_path_id, interaction_type)
        VALUES ($1, $2, 'started_learning_path')`,
        [user_id, learning_path_id]
      );

      res.status(201).json({
        message: "Learning path started successfully",
        current_module_id: firstModuleId,
        locked_modules: lockedModules,
      });
    } catch (err) {
      console.error("Error starting learning path:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  getStartedLearningPaths: async (req, res) => {
    const { user_id } = req.params;

    if (!user_id) {
      return res
        .status(400)
        .json({ error: "Missing required parameter: user_id" });
    }

    try {
      // Fetch learning paths that the user has started
      const result = await pool.query(
        `SELECT lp.id AS learning_path_id, lp.title, lp.summary, lp.estimated_duration, lp.created_at, lp.updated_at,
                lpp.current_module_id, lpp.progress_percentage, lpp.status, lpp.started_at
         FROM learning_paths lp
         JOIN learning_path_progress lpp ON lp.id = lpp.learning_path_id
         WHERE lpp.user_id = $1 AND lpp.status = 'in_progress' 
         ORDER BY lpp.started_at DESC`,
        [user_id]
      );

      if (result.rows.length === 0) {
        return res
          .status(404)
          .json({ error: "No learning paths found for this user" });
      }

      res.json(result.rows);
    } catch (err) {
      console.error("Error fetching started learning paths:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // Get User's Learning Path Progress
  getLearningPathProgress: async (req, res) => {
    const { learning_path_id, user_id } = req.params;

    if (!learning_path_id || !user_id) {
      return res.status(400).json({
        error: "Missing required parameters: learning_path_id or user_id",
      });
    }

    try {
      const result = await pool.query(
        `SELECT user_id, learning_path_id, current_module_id, completed_module_ids,
                progress_percentage, last_accessed, time_spent, status, locked_module_ids
         FROM learning_path_progress 
         WHERE user_id = $1 AND learning_path_id = $2`,
        [user_id, learning_path_id]
      );

      if (result.rows.length === 0) {
        // Return default progress instead of 404
        return res.status(200).json({
          user_id,
          learning_path_id,
          current_module_id: null,
          completed_module_ids: [],
          progress_percentage: 0,
          last_accessed: null,
          time_spent: 0,
          status: "not_started",
          locked_module_ids: [],
          message: "No progress found for this learning path",
        });
      }

      // Ensure locked_module_ids is always an array
      const progress = result.rows[0];
      progress.locked_module_ids = progress.locked_module_ids || [];

      res.json(progress);
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

  // Mark Module as Complete
  updateLearningPathModuleCompletion: async (req, res) => {
    const { learning_path_id, module_id, user_id } = req.params;

    try {
      // Step 1: Update user module progress (mark module as completed)
      const updateUserModuleProgressQuery = `
        UPDATE public.user_module_progress
        SET status = 'completed',
            completed_at = NOW()
        WHERE user_id = $1 AND module_id = $2 AND learning_path_id = $3
        RETURNING *;
      `;

      const userModuleProgressResult = await pool.query(
        updateUserModuleProgressQuery,
        [user_id, module_id, learning_path_id]
      );

      if (userModuleProgressResult.rows.length === 0) {
        return res
          .status(404)
          .json({ message: "User module progress not found." });
      }

      // Step 2: Update learning path progress (move to next module, update progress)
      const currentLearningPathProgressQuery = `
        SELECT * FROM public.learning_path_progress
        WHERE user_id = $1 AND learning_path_id = $2;
      `;

      const learningPathProgressResult = await pool.query(
        currentLearningPathProgressQuery,
        [user_id, learning_path_id]
      );

      if (learningPathProgressResult.rows.length === 0) {
        return res
          .status(404)
          .json({ message: "Learning path progress not found." });
      }

      const learningPathProgress = learningPathProgressResult.rows[0];

      // Add current module to completed modules
      const completedModuleIds = [
        ...learningPathProgress.completed_module_ids,
        module_id,
      ];

      // Move to next module
      const nextModuleQuery = `
        SELECT id FROM public.modules
        WHERE learning_path_id = $1 AND id > $2
        ORDER BY id ASC LIMIT 1;
      `;

      const nextModuleResult = await pool.query(nextModuleQuery, [
        learning_path_id,
        module_id,
      ]);
      const nextModuleId =
        nextModuleResult.rows.length > 0 ? nextModuleResult.rows[0].id : null;

      // Update learning path progress
      const updateLearningPathProgressQuery = `
        UPDATE public.learning_path_progress
        SET current_module_id = $1,
            completed_module_ids = $2,
            progress_percentage = (array_length($2, 1) * 100) / (SELECT COUNT(*) FROM public.modules WHERE learning_path_id = $3),
            last_accessed = NOW()
        WHERE user_id = $4 AND learning_path_id = $5
        RETURNING *;
      `;

      const updatedLearningPathProgress = await pool.query(
        updateLearningPathProgressQuery,
        [
          nextModuleId,
          completedModuleIds,
          learning_path_id,
          user_id,
          learning_path_id,
        ]
      );

      return res.status(200).json({
        message:
          "Module marked as completed and learning path progress updated.",
        data: updatedLearningPathProgress.rows[0],
      });
    } catch (err) {
      console.error("Error updating module completion:", err);
      return res
        .status(500)
        .json({
          message: "An error occurred while updating module completion.",
        });
    }
  },
};

module.exports = learningPathsController;
