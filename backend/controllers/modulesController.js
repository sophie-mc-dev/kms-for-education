const { pool } = require("../db/postgres");

const modulesController = {
  createModule: async (req, res) => {
    const { title, description, estimated_duration, assessment, resources } =
      req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Insert module
      const moduleResult = await client.query(
        `INSERT INTO modules (title, description, estimated_duration) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
        [title, description, estimated_duration]
      );

      const module = moduleResult.rows[0];

      // Insert selected resources into module_resources table
      const values = resources.map((_, i) => `($1, $${i + 2})`).join(", ");
      const query = `INSERT INTO module_resources (module_id, resource_id) VALUES ${values}`;
      await client.query(query, [module.id, ...resources]);

      // If an assessment is included, insert it
      if (
        assessment &&
        assessment.questions &&
        assessment.answers &&
        assessment.solution
      ) {
        const assessmentResult = await client.query(
          `INSERT INTO assessments (questions, answers, solution, module_id) 
         VALUES ($1, $2, $3, $4) 
         RETURNING *`,
          [
            JSON.stringify(assessment.questions),
            JSON.stringify(assessment.answers),
            JSON.stringify(assessment.solution),
            module.id,
          ]
        );
        module.assessment = assessmentResult.rows[0];
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
    const { title, description, order_index, estimated_duration, assessment } =
      req.body;

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      // Update module details
      const moduleResult = await client.query(
        `UPDATE modules 
         SET title = $1, description = $2, order_index = $3, estimated_duration = $4, updated_at = NOW()
         WHERE id = $5 
         RETURNING *`,
        [title, description, order_index, estimated_duration, id]
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
        assessment.title &&
        assessment.questions &&
        assessment.solution
      ) {
        if (existingAssessment.rows.length > 0) {
          // Update existing assessment
          await client.query(
            `UPDATE assessments 
             SET title = $1, description = $2, questions = $3, solution = $4, updated_at = NOW()
             WHERE module_id = $5
             RETURNING *`,
            [
              assessment.title,
              assessment.description || null,
              JSON.stringify(assessment.questions),
              JSON.stringify(assessment.solution),
              id,
            ]
          );
        } else {
          // Create new assessment and link to module
          await client.query(
            `INSERT INTO assessments (title, description, questions, solution, module_id) 
             VALUES ($1, $2, $3, $4, $5)`,
            [
              assessment.title,
              assessment.description || null,
              JSON.stringify(assessment.questions),
              JSON.stringify(assessment.solution),
              id,
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
    const {
      user_id,
      assessment_id,
      module_id,
      score,
      passed,
      answers,
    } = req.body;
  
    try {
      // Get the current number of attempts for this assessment
      const previousAttempts = await pool.query(
        `SELECT COUNT(*) AS attempt_count FROM public.assessment_results 
         WHERE user_id = $1 AND assessment_id = $2 AND module_id = $3`,
        [user_id, assessment_id, module_id]
      );
  
      // Calculate new attempt number (previous attempts + 1)
      const newAttemptNumber = parseInt(previousAttempts.rows[0].attempt_count) + 1;
  
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

  // Mark Module as Complete
  completeModule: async (req, res) => {
    const { module_id } = req.params;
    const user_id = req.user.user_id;

    try {
      // Check if the module has an associated assessment
      const moduleResult = await pool.query(
        `SELECT assessment_id FROM modules WHERE id = $1`,
        [module_id]
      );

      if (moduleResult.rows.length === 0) {
        return res.status(404).json({ error: "Module not found" });
      }

      const { assessment_id } = moduleResult.rows[0];

      // If the module has an assessment, check if the user has passed it
      if (assessment_id) {
        const assessmentResult = await pool.query(
          `SELECT passed FROM assessment_results 
           WHERE user_id = $1 AND assessment_id = $2 
           ORDER BY submission_time DESC 
           LIMIT 1`,
          [user_id, assessment_id]
        );

        if (
          assessmentResult.rows.length === 0 ||
          !assessmentResult.rows[0].passed
        ) {
          return res.status(400).json({
            error: "User must pass the assessment before completing the module",
          });
        }
      }

      // Insert into user_module_progress
      await pool.query(
        `INSERT INTO user_module_progress (user_id, module_id, completed_at) 
        VALUES ($1, $2, NOW()) 
        ON CONFLICT (user_id, module_id) DO NOTHING`,
        [user_id, module_id]
      );

      // Log the interaction in the user_interactions table
      await pool.query(
        `INSERT INTO user_interactions (user_id, module_id, interaction_type)
               VALUES ($1, $2, 'completed_module')`,
        [user_id, module_id]
      );

      res.json({ message: "Module marked as completed" });
    } catch (err) {
      console.error("Error marking module complete:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  submitAssessment: async (req, res) => {
    const { assessment_id } = req.params;
    const user_id = req.user.user_id;
    const { answers } = req.body; // User-submitted answers in JSON format

    try {
      // Fetch correct answers from the database
      const assessment = await pool.query(
        `SELECT solution FROM assessments WHERE id = $1`,
        [assessment_id]
      );

      if (assessment.rows.length === 0) {
        return res.status(404).json({ error: "Assessment not found" });
      }

      const correctAnswers = assessment.rows[0].solution; // JSON of correct answers

      // Evaluate score
      let score = 0;
      let totalQuestions = Object.keys(correctAnswers).length;

      for (let questionId in correctAnswers) {
        if (correctAnswers[questionId] === answers[questionId]) {
          score++;
        }
      }

      let percentage = (score / totalQuestions) * 100;
      let passed = percentage >= 70; // Example: Passing threshold = 70%

      // Insert into assessment_results
      await pool.query(
        `INSERT INTO assessment_results (user_id, assessment_id, module_id, score, passed, submission_time, answers) 
        VALUES ($1, $2, (SELECT module_id FROM assessments WHERE id = $2), $3, $4, NOW(), $5) 
        RETURNING *`,
        [user_id, assessment_id, score, passed, answers]
      );

      res.json({ message: "Assessment submitted successfully", score, passed });
    } catch (err) {
      console.error("Error submitting assessment:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // Lock/unlock modules based on assessment results
  unlockModule: async (req, res) => {
    const { module_id } = req.params;
    const user_id = req.user.user_id;

    try {
      // Check if the module has an associated assessment
      const assessmentCheck = await pool.query(
        `SELECT assessment_id FROM modules WHERE id = $1`,
        [module_id]
      );

      if (
        assessmentCheck.rows.length === 0 ||
        !assessmentCheck.rows[0].assessment_id
      ) {
        return res
          .status(400)
          .json({ error: "Module has no assessment requirement" });
      }

      const assessment_id = assessmentCheck.rows[0].assessment_id;

      // Check if the user has passed the assessment
      const assessmentResult = await pool.query(
        `SELECT * FROM assessment_results 
       WHERE user_id = $1 AND assessment_id = $2 AND passed = true`,
        [user_id, assessment_id]
      );

      if (assessmentResult.rows.length === 0) {
        return res
          .status(403)
          .json({ error: "Assessment not passed. Module remains locked." });
      }

      res.json({ message: "Module unlocked!" });
    } catch (err) {
      console.error("Error unlocking module:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
};

module.exports = modulesController;
