const { pool } = require("../db/postgres");

const modulesController = {
  createModule: async (req, res) => {
    const {
      title,
      summary,
      estimated_duration,
      assessment,
      resources,
      objectives,
      ects,
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Insert module
      const moduleResult = await client.query(
        `INSERT INTO modules (title, summary, estimated_duration, objectives, ects) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
        [title, summary, estimated_duration, objectives, ects]
      );

      const module = moduleResult.rows[0];

      // Insert selected resources into module_resources table
      const values = resources.map((_, i) => `($1, $${i + 2})`).join(", ");
      const query = `INSERT INTO module_resources (module_id, resource_id) VALUES ${values}`;
      await client.query(query, [module.id, ...resources]);

      // If an assessment is included, check if one exists for this module
      if (
        assessment &&
        assessment.questions &&
        assessment.answers &&
        assessment.solution &&
        assessment.passing_percentage
      ) {
        const existingAssessmentResult = await client.query(
          `SELECT id FROM assessments WHERE module_id = $1`,
          [module.id]
        );

        if (existingAssessmentResult.rows.length > 0) {
          // Update existing assessment if it exists
          const existingAssessmentId = existingAssessmentResult.rows[0].id;
          await client.query(
            `UPDATE assessments 
            SET questions = $1, answers = $2, solution = $3 
            WHERE id = $4`,
            [
              JSON.stringify(assessment.questions),
              JSON.stringify(assessment.answers),
              JSON.stringify(assessment.solution),
              existingAssessmentId,
            ]
          );
          module.assessment = { id: existingAssessmentId, ...assessment };
        } else {
          // Insert new assessment if no existing assessment
          const assessmentResult = await client.query(
            `INSERT INTO assessments (questions, answers, solution, module_id, passing_percentage) 
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING *`,
            [
              JSON.stringify(assessment.questions),
              JSON.stringify(assessment.answers),
              JSON.stringify(assessment.solution),
              module.id,
              assessment.passing_percentage || 70,
            ]
          );
          module.assessment = assessmentResult.rows[0];
        }
      }

      await client.query("COMMIT");
      res.status(201).json(module);
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error creating module:", error);
      res.status(500).json({ error: error.message });
    } finally {
      client.release();
    }
  },

  // Get all modules
  getAllModules: async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM modules ORDER BY id ASC");
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching modules:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // Get a single module by ID
  getModuleById: async (req, res) => {
    const { id } = req.params;
    try {
      const result = await pool.query("SELECT * FROM modules WHERE id = $1", [
        id,
      ]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Module not found" });
      }
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error fetching module:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // Update a module
  updateModule: async (req, res) => {
    const { id } = req.params;
    const { title, summary, estimated_duration, assessment, objectives, ects } =
      req.body;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Update module details
      const moduleResult = await client.query(
        `UPDATE modules 
         SET title = $1, summary = $2,  estimated_duration = $3, objectives = $4, ects = $5, updated_at = NOW()
         WHERE id = $7 
         RETURNING *`,
        [title, summary, estimated_duration, objectives, ects, id]
      );

      if (moduleResult.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(404).json({ error: "Module not found" });
      }

      const module = moduleResult.rows[0];

      // Check if an assessment exists for this module
      const existingAssessment = await client.query(
        `SELECT * FROM assessments WHERE module_id = $1`,
        [id]
      );

      if (
        assessment &&
        assessment.questions &&
        assessment.answers &&
        assessment.solution &&
        assessment.passing_percentage
      ) {
        if (existingAssessment.rows.length > 0) {
          // Update existing assessment
          await client.query(
            `UPDATE assessments 
             SET questions = $1, answers = $2, solution = $3, passing_percentage = $4, updated_at = NOW()
             WHERE module_id = $5
             RETURNING *`,
            [
              JSON.stringify(assessment.questions),
              JSON.stringify(assessment.answers),
              JSON.stringify(assessment.solution),
              id,
              assessment.passing_percentage,
            ]
          );
        } else {
          // Create new assessment and link to module
          await client.query(
            `INSERT INTO assessments (questions, answers, solution, module_id, passing_percentage) 
             VALUES ($1, $2, $3, $4, $5)`,
            [
              JSON.stringify(assessment.questions),
              JSON.stringify(assessment.answers),
              JSON.stringify(assessment.solution),
              id,
              assessment.passing_percentage,
            ]
          );
        }
      }

      await client.query("COMMIT");
      res.json({ message: "Module updated successfully", module });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error updating module:", error);
      res.status(500).json({ error: "Internal Server Error" });
    } finally {
      client.release();
    }
  },

  // Delete a module
  deleteModule: async (req, res) => {
    const { id } = req.params;
    try {
      await pool.query("DELETE FROM module_resources WHERE module_id = $1", [
        id,
      ]);
      const result = await pool.query(
        "DELETE FROM modules WHERE id = $1 RETURNING *",
        [id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Module not found" });
      }
      res.json({ message: "Module deleted successfully" });
    } catch (error) {
      console.error("Error deleting module:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // Get resources by module ID
  getResourcesByModuleId: async (req, res) => {
    const { module_id } = req.params;
    try {
      const result = await pool.query(
        `SELECT r.* FROM resources r
          INNER JOIN module_resources mr ON r.id = mr.resource_id
          WHERE mr.module_id = $1 ORDER BY mr.resource_order ASC`,
        [module_id]
      );
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching resources for module:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  getModuleResourceCount: async (req, res) => {
    const { module_id } = req.params;
    try {
      const result = await pool.query(
        `SELECT COUNT(*) AS resource_count FROM module_resources WHERE module_id = $1`,
        [module_id]
      );

      res.json({
        module_id,
        resource_count: parseInt(result.rows[0].resource_count),
      });
    } catch (error) {
      console.error("Error fetching resource count for module:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  getModulesByResourceId: async (req, res) => {
    const { resource_id } = req.params;

    try {
      const result = await pool.query(
        `SELECT m.* 
         FROM modules m
         INNER JOIN module_resources mr ON m.id = mr.module_id
         WHERE mr.resource_id = $1
         ORDER BY m.id ASC`,
        [resource_id]
      );

      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching modules for resource:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  getAssessmentByModuleId: async (req, res) => {
    const { module_id } = req.params;

    try {
      const result = await pool.query(
        `SELECT * FROM assessments WHERE module_id = $1`,
        [module_id]
      );

      if (result.rows.length === 0) {
        return res
          .status(404)
          .json({ error: "Assessment not found for this module" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error fetching assessment:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // Create new assessment results
  createAssessmentResults: async (req, res) => {
    const { user_id, assessment_id, module_id, score, passed, answers } =
      req.body;

    try {
      // Get the current number of attempts for this assessment
      const previousAttempts = await pool.query(
        `SELECT COUNT(*) AS attempt_count FROM public.assessment_results 
         WHERE user_id = $1 AND assessment_id = $2 AND module_id = $3`,
        [user_id, assessment_id, module_id]
      );

      // Calculate new attempt number (previous attempts + 1)
      const newAttemptNumber =
        parseInt(previousAttempts.rows[0].attempt_count) + 1;

      // Insert a new record with incremented attempt number
      const result = await pool.query(
        `INSERT INTO public.assessment_results (user_id, assessment_id, module_id, score, passed, answers, num_attempts)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          user_id,
          assessment_id,
          module_id,
          score,
          passed,
          JSON.stringify(answers),
          newAttemptNumber,
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error("Error saving assessment results:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // Get assessment results by user_id, assessment_id, and module_id
  getAssessmentResults: async (req, res) => {
    const { user_id, assessment_id, module_id } = req.params;

    try {
      const result = await pool.query(
        `SELECT id, user_id, assessment_id, module_id, score, passed, submission_time, answers, num_attempts
      FROM public.assessment_results
      WHERE user_id = $1 AND assessment_id = $2 AND module_id = $3`,
        [user_id, assessment_id, module_id]
      );

      if (result.rows.length === 0) {
        // return res.status(404).json({ error: "Assessment results not found" });
        return res.json({ num_attempts: 0 });
      }

      // Return the assessment result in the response
      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error fetching assessment results:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // Get all assessment results (for admin use)
  getAllAssessmentResults: async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT * FROM public.assessment_results"
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "No assessment results found" });
      }

      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching all assessment results:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // Update the number of attempts for a specific user and assessment
  updateAssessmentAttempts: async (req, res) => {
    const { user_id, assessment_id, module_id } = req.params;
    const { num_attempts } = req.body;

    try {
      const result = await pool.query(
        `UPDATE public.assessment_results
      SET num_attempts = $1
      WHERE user_id = $2 AND assessment_id = $3 AND module_id = $4
      RETURNING *`,
        [num_attempts, user_id, assessment_id, module_id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Assessment result not found" });
      }

      res.json(result.rows[0]); // Return the updated result
    } catch (error) {
      console.error("Error updating assessment attempts:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  updateAssessmentStatus: async (req, res) => {
    const { assessment_status, learning_path_id } = req.body; // Get learning_path_id from the body
    const { user_id, module_id } = req.params;

    if (!user_id || !module_id) {
      return res
        .status(400)
        .json({ error: "Missing required parameters (user_id, module_id)" });
    }

    const validStatuses = ["not_started", "in_progress", "passed", "failed"];
    if (!assessment_status || !validStatuses.includes(assessment_status)) {
      return res
        .status(400)
        .json({ error: "Invalid or missing assessment status" });
    }

    try {
      // Construct query and params based on learning_path_id
      let query, queryParams;

      if (learning_path_id) {
        // Check if user progress exists for a specific learning path
        query = `
          SELECT * FROM user_module_progress 
          WHERE user_id = $1 AND module_id = $2 AND learning_path_id = $3
        `;
        queryParams = [user_id, module_id, learning_path_id];
      } else {
        // Check if user progress exists for standalone module
        query = `
          SELECT * FROM user_module_progress 
          WHERE user_id = $1 AND module_id = $2 AND learning_path_id IS NULL
        `;
        queryParams = [user_id, module_id];
      }

      const result = await pool.query(query, queryParams);

      if (result.rows.length === 0) {
        // If no entry exists, insert a new progress entry
        query = `
          INSERT INTO user_module_progress (user_id, module_id, learning_path_id, status, assessment_status)
          VALUES ($1, $2, $3, 'in_progress', $4)
        `;
        queryParams = [
          user_id,
          module_id,
          learning_path_id || null,
          assessment_status,
        ];
        await pool.query(query, queryParams);
      } else {
        // Otherwise, update the existing progress entry's assessment_status
        query = `
          UPDATE user_module_progress 
          SET assessment_status = $1 
          WHERE user_id = $2 AND module_id = $3 AND learning_path_id ${
            learning_path_id ? "= $4" : "IS NULL"
          }
        `;
        queryParams = learning_path_id
          ? [assessment_status, user_id, module_id, learning_path_id]
          : [assessment_status, user_id, module_id];

        await pool.query(query, queryParams);
      }

      res.json({ message: "Assessment status updated successfully" });
    } catch (error) {
      console.error("Error updating assessment status:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  getAssessmentStatus: async (req, res) => {
    const { user_id, module_id } = req.params;
    const { learning_path_id } = req.query;

    // Validate input parameters
    if (!user_id || !module_id) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    try {
      let query;
      let queryParams = [user_id, module_id];

      // Check if learning_path_id is provided and not null
      if (learning_path_id && learning_path_id !== "null") {
        query = `
          SELECT assessment_status
            FROM user_module_progress
           WHERE user_id = $1
             AND module_id = $2
             AND learning_path_id = $3
        `;
        queryParams.push(learning_path_id);
      } else {
        // If learning_path_id is null or not provided, look for the standalone module
        query = `
          SELECT assessment_status
            FROM user_module_progress
           WHERE user_id = $1
             AND module_id = $2
             AND learning_path_id IS NULL
        `;
      }

      const result = await pool.query(query, queryParams);

      if (result.rows.length === 0) {
        return res.json({ assessmentStatus: "not_started" });
      }

      // Return the assessment status
      const assessmentStatus = result.rows[0].assessment_status;
      res.json({ assessmentStatus });
    } catch (error) {
      console.error("Error fetching assessment status:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // Delete assessment results for a user, assessment, and module
  deleteAssessmentResults: async (req, res) => {
    const { user_id, assessment_id, module_id } = req.params;

    try {
      const result = await pool.query(
        `DELETE FROM public.assessment_results
      WHERE user_id = $1 AND assessment_id = $2 AND module_id = $3
      RETURNING *`,
        [user_id, assessment_id, module_id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Assessment results not found" });
      }

      res.json({ message: "Assessment results deleted successfully" });
    } catch (error) {
      console.error("Error deleting assessment results:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // Start a Module for a User
  startModule: async (req, res) => {
    const { module_id, user_id, learning_path_id } = req.body;

    try {
      // Check if Learning Path exists
      const lpCheck = await pool.query(
        "SELECT * FROM learning_paths WHERE id = $1",
        [learning_path_id]
      );
      if (lpCheck.rows.length === 0) {
        return res.status(404).json({ error: "Learning Path not found" });
      }

      // Check if Module exists
      const moduleCheck = await pool.query(
        "SELECT * FROM modules WHERE id = $1",
        [module_id]
      );
      if (moduleCheck.rows.length === 0) {
        return res.status(404).json({ error: "Module not found" });
      }

      // Check if user has already started the module
      const userModuleCheck = await pool.query(
        `SELECT * FROM user_module_progress 
       WHERE user_id = $1 AND module_id = $2 AND learning_path_id = $3`,
        [user_id, module_id, learning_path_id]
      );
      if (userModuleCheck.rows.length > 0) {
        return res.status(400).json({ error: "Module already started" });
      }

      // Get the current progress of the user in the learning path
      const userProgressQuery = await pool.query(
        `SELECT * FROM learning_path_progress 
       WHERE user_id = $1 AND learning_path_id = $2`,
        [user_id, learning_path_id]
      );
      if (userProgressQuery.rows.length === 0) {
        return res
          .status(400)
          .json({ error: "User has not started this learning path" });
      }

      const userProgress = userProgressQuery.rows[0];
      const lockedModules = userProgress.locked_module_ids || [];

      // If the current module is null, set it to the first locked module
      if (!userProgress.current_module_id && lockedModules.length > 0) {
        const firstLockedModule = lockedModules[0];
        await pool.query(
          `UPDATE learning_path_progress 
         SET current_module_id = $1, status = 'in_progress', last_accessed = NOW() 
         WHERE user_id = $2 AND learning_path_id = $3`,
          [firstLockedModule, user_id, learning_path_id]
        );
      }

      // Insert new progress entry for the module
      await pool.query(
        `INSERT INTO user_module_progress 
        (user_id, module_id, learning_path_id, status, assessment_status, started_at) 
        VALUES ($1, $2, $3, 'in_progress', 'not_started', NOW())`,
        [user_id, module_id, learning_path_id]
      );

      // Log the interaction in the user_interactions table
      await pool.query(
        `INSERT INTO user_interactions (user_id, module_id, learning_path_id, interaction_type)
       VALUES ($1, $2, $3, 'started_module')`,
        [user_id, module_id, learning_path_id]
      );

      res.status(201).json({
        message: "Module started successfully",
        current_module_id: module_id,
      });
    } catch (err) {
      console.error("Error starting module:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // Get the status of a module for a user
  getModuleStatus: async (req, res) => {
    const { module_id } = req.params;
    const { user_id, learning_path_id } = req.query;

    if (!user_id || !learning_path_id) {
      return res
        .status(400)
        .json({ error: "Missing user_id or learning_path_id" });
    }

    try {
      // Check if Learning Path exists
      const lpCheck = await pool.query(
        "SELECT id FROM learning_paths WHERE id = $1",
        [learning_path_id]
      );
      if (lpCheck.rows.length === 0) {
        return res.status(404).json({ error: "Learning Path not found" });
      }

      // Check if Module exists
      const moduleCheck = await pool.query(
        "SELECT id FROM modules WHERE id = $1",
        [module_id]
      );
      if (moduleCheck.rows.length === 0) {
        return res.status(404).json({ error: "Module not found" });
      }

      // Get the module progress for the user
      const userModuleProgressQuery = await pool.query(
        `SELECT * FROM user_module_progress 
         WHERE user_id = $1 AND module_id = $2 AND learning_path_id = $3`,
        [user_id, module_id, learning_path_id]
      );

      if (userModuleProgressQuery.rows.length === 0) {
        // Instead of 404, return a default response
        return res.status(200).json({
          status: "not_started",
          message: "No progress found for this module",
        });
      }

      const userModuleProgress = userModuleProgressQuery.rows[0];
      const status = userModuleProgress.status;

      res.status(200).json({
        status,
        message: "Module status fetched successfully",
      });
    } catch (err) {
      console.error("Error getting module status:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  getStandaloneModuleStatus: async (req, res) => {
    const { module_id } = req.params;
    const { user_id } = req.query;

    if (!user_id) {
      return res.status(400).json({ error: "Missing user_id" });
    }

    try {
      // Check if Module exists
      const moduleCheck = await pool.query(
        "SELECT id FROM modules WHERE id = $1",
        [module_id]
      );
      if (moduleCheck.rows.length === 0) {
        return res.status(404).json({ error: "Module not found" });
      }

      // Check user progress WITHOUT learning_path_id
      const userModuleProgressQuery = await pool.query(
        `SELECT * FROM user_module_progress 
         WHERE user_id = $1 AND module_id = $2 AND learning_path_id IS NULL`,
        [user_id, module_id]
      );

      if (userModuleProgressQuery.rows.length === 0) {
        return res.status(200).json({
          status: "not_started",
          message: "No progress found for this standalone module",
        });
      }

      const userModuleProgress = userModuleProgressQuery.rows[0];
      const status = userModuleProgress.status;

      res.status(200).json({
        status,
        message: "Standalone module status fetched successfully",
      });
    } catch (err) {
      console.error("Error getting standalone module status:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  getCompletedStandaloneModules: async (req, res) => {
    const { user_id } = req.params;

    if (!user_id) {
      return res
        .status(400)
        .json({ error: "Missing required parameter: user_id" });
    }

    try {
      const result = await pool.query(
        `SELECT m.*
         FROM user_module_progress ump
         JOIN modules m ON m.id = ump.module_id
         WHERE ump.user_id = $1 
           AND ump.status = 'completed'
           AND ump.learning_path_id IS NULL`,
        [user_id]
      );

      if (result.rows.length === 0) {
        return res
          .status(404)
          .json({ error: "No modules found for this user" });
      }

      res.status(200).json(result.rows);
    } catch (err) {
      console.error("Error fetching completed standalone modules:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  getInProgressStandaloneModules: async (req, res) => {
    const { user_id } = req.params;

    if (!user_id) {
      return res.status(400).json({ error: "Missing user_id" });
    }

    try {
      const result = await pool.query(
        `SELECT m.*
         FROM user_module_progress ump
         JOIN modules m ON m.id = ump.module_id
         WHERE ump.user_id = $1 
           AND ump.status = 'in_progress'
           AND ump.learning_path_id IS NULL
          ORDER BY ump.started_at DESC`,
        [user_id]
      );

      res.status(200).json(result.rows);
    } catch (err) {
      console.error("Error fetching in-progress standalone modules:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // Complete
  updateStandaloneModuleCompletion: async (req, res) => {
    const { user_id, module_id } = req.params;
    const { assessment_id, score, passed, answers, num_attempts } = req.body;

    try {
      // Step 1: Store the assessment results
      const result = await pool.query(
        `INSERT INTO assessment_results (user_id, assessment_id, module_id, score, passed, submission_time, answers, num_attempts) 
             VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7) 
             RETURNING *`,
        [
          user_id,
          assessment_id,
          module_id,
          score,
          passed,
          JSON.stringify(answers),
          num_attempts + 1,
        ]
      );

      // Step 2: Define the status based on the assessment result
      const assessmentStatus = passed ? "passed" : "failed";
      const moduleStatus = passed ? "completed" : "in_progress";

      // Step 3: Calculate the time spent
      const timeSpentQuery = `
        SELECT started_at
        FROM user_module_progress
        WHERE user_id = $1 AND module_id = $2 AND learning_path_id IS NULL
      `;
      const timeSpentResult = await pool.query(timeSpentQuery, [
        user_id,
        module_id,
      ]);

      if (timeSpentResult.rows.length > 0) {
        const startedAt = timeSpentResult.rows[0].started_at;
        const completedAt = new Date(); 
        const timeSpent = completedAt - startedAt; 

        // Convert milliseconds to seconds (or minutes, as needed)
        const timeSpentInMinutes = Math.floor(timeSpent / 1000 / 60);

        // Step 4: Update the user progress with status, completed_at, and time_spent
        const updateQuery = `
          UPDATE user_module_progress 
          SET assessment_status = $1, 
              status = $2, 
              completed_at = NOW(),
              time_spent = $3
          WHERE user_id = $4 AND module_id = $5 AND learning_path_id IS NULL
        `;
        const updateValues = [
          assessmentStatus,
          moduleStatus,
          timeSpentInMinutes,
          user_id,
          module_id,
        ];

        // Execute the update query
        await pool.query(updateQuery, updateValues);
      }

      // Step 5: Log the interaction in the user_interactions table
      await pool.query(
        `INSERT INTO user_interactions (user_id, module_id, interaction_type)
       VALUES ($1, $2, 'completed_module')`,
        [user_id, module_id]
      );

      // Step 6: Send back the response with updated attempt count
      res.json({
        message: "Assessment submitted successfully",
        score,
        passed,
        num_attempts: num_attempts + 1,
      });
    } catch (err) {
      console.error("Error submitting assessment:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
};

module.exports = modulesController;
