const { pool } = require("../db/db");

const learningPathsController = {
  addLearningPath: async (req, res) => {
    const { title, description, visibility, estimated_duration, ects } = req.body;
    const created_by = req.user.id; 

    if (!title || !description || !visibility || !estimated_duration || ects === undefined) {
      return res.status(400).json({ error: "All fields are required" });
    }
    
    try {
      const result = await pool.query(
        `INSERT INTO learning_paths (title, description, created_by, visibility, estimated_duration, ects, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING *`,
        [title, description, created_by, visibility, estimated_duration, ects]
      );

      res.status(201).json({ message: "Learning Path created", learningPath: result.rows[0] });
    } catch (err) {
      console.error("Error creating learning path:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  removeLearningPath: async (req, res) => {
    const { id } = req.params;

    try {
      const result = await pool.query("DELETE FROM learning_paths WHERE id = $1 RETURNING *", [id]);

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
      const result = await pool.query("SELECT * FROM learning_paths ORDER BY created_at DESC");
      res.json(result.rows);
    } catch (err) {
      console.error("Error fetching learning paths:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  getLearningPaths: async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT lp.*, u.first_name, u.last_name 
             FROM learning_paths lp
             JOIN users u ON lp.created_by = u.user_id
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
             JOIN users u ON lp.created_by = u.user_id
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
    const { title, description, visibility, estimated_duration, ects } = req.body;

    if (!title || !description || !visibility || !estimated_duration || ects === undefined) {
      return res.status(400).json({ error: "All fields are required" });
    }

    try {
      const result = await pool.query(
        `UPDATE learning_paths 
         SET title = $1, description = $2, visibility = $3, estimated_duration = $4, ects = $5, updated_at = NOW()
         WHERE id = $6 RETURNING *`,
        [title, description, visibility, estimated_duration, ects, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Learning Path not found" });
      }

      res.json({ message: "Learning Path updated", learningPath: result.rows[0] });
    } catch (err) {
      console.error("Error updating learning path:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  addModuleToLearningPath: async (req, res) => {
    const { learning_path_id, title, description } = req.body;

    if (!learning_path_id || !title) {
      return res.status(400).json({ error: "Learning path ID and title are required" });
    }

    try {
      // Ensure the learning path exists
      const learningPathCheck = await pool.query(
        "SELECT * FROM learning_paths WHERE id = $1",
        [learning_path_id]
      );

      if (learningPathCheck.rows.length === 0) {
        return res.status(404).json({ error: "Learning path not found" });
      }

      // Insert the new module under the specified learning path
      const result = await pool.query(
        `INSERT INTO modules (learning_path_id, title, description) 
         VALUES ($1, $2, $3) RETURNING *`,
        [learning_path_id, title, description]
      );

      res.status(201).json({ message: "Module created", module: result.rows[0] });
    } catch (err) {
      console.error("Error creating module:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  getModulesByLearningPath: async (req, res) => {
    const { id } = req.params; 

    try {
      const result = await pool.query(
        `SELECT * FROM modules WHERE learning_path_id = $1`,
        [id]
      );

      res.status(200).json({ modules: result.rows });
    } catch (err) {
      console.error("Error fetching modules:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  updateModule: async (req, res) => {
    const { id } = req.params;
    const { title, description } = req.body;

    try {
      const result = await pool.query(
        `UPDATE modules SET title = $1, description = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
        [title, description, id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Module not found" });
      }

      res.json({ message: "Module updated successfully", module: result.rows[0] });
    } catch (err) {
      console.error("Error updating module:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  removeModuleFromLearningPath: async (req, res) => {
    const { id } = req.params;

    try {
      const result = await pool.query("DELETE FROM modules WHERE id = $1 RETURNING *", [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Module not found" });
      }

      res.json({ message: "Module deleted successfully" });
    } catch (err) {
      console.error("Error deleting module:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  addModuleResources: async (req, res) => {
    const { id } = req.params; 
    const { resource_id } = req.body;

    if (!resource_id) {
      return res.status(400).json({ error: "Resource ID is required" });
    }

    try {
      const result = await pool.query(
        `INSERT INTO module_resources (module_id, resource_id) VALUES ($1, $2) RETURNING *`,
        [id, resource_id]
      );

      res.status(201).json({ message: "Resource added to module", moduleResource: result.rows[0] });
    } catch (err) {
      console.error("Error adding resource to module:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  getModuleResources: async (req, res) => {
    const { id } = req.params;

    try {
      const result = await pool.query(
        `SELECT r.* FROM resources r
         JOIN module_resources mr ON r.id = mr.resource_id
         WHERE mr.module_id = $1`,
        [id]
      );

      res.json(result.rows);
    } catch (err) {
      console.error("Error fetching module resources:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  deleteModuleResources: async (req, res) => {
    const { id, resource_id } = req.params;

    try {
      const result = await pool.query(
        "DELETE FROM module_resources WHERE module_id = $1 AND resource_id = $2 RETURNING *",
        [id, resource_id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Resource not found in module" });
      }

      res.json({ message: "Resource removed from module" });
    } catch (err) {
      console.error("Error removing resource from module:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  checkModuleProgression: async (req, res) => {
    const { user_id, module_id } = req.params;
  
    try {
      // Get module's assessment details
      const module = await pool.query(
        `SELECT assessment_id FROM modules WHERE id = $1`,
        [module_id]
      );
  
      if (module.rows.length === 0) {
        return res.status(404).json({ error: "Module not found" });
      }
  
      const assessmentId = module.rows[0].assessment_id;
      if (!assessmentId) {
        return res.json({ canProceed: true }); // No assessment, allow access
      }
  
      // Get assessment passing percentage
      const assessmentInfo = await pool.query(
        `SELECT pass_percentage FROM assessments WHERE id = $1`,
        [assessmentId]
      );
  
      if (assessmentInfo.rows.length === 0) {
        return res.status(500).json({ error: "Assessment data not found" });
      }
  
      const passPercentage = assessmentInfo.rows[0].pass_percentage;
  
      // Get user's latest assessment score
      const assessmentResult = await pool.query(
        `SELECT score, total_score FROM assessment_results 
         WHERE user_id = $1 AND assessment_id = $2 
         ORDER BY created_at DESC LIMIT 1`,
        [user_id, assessmentId]
      );
  
      if (assessmentResult.rows.length === 0) {
        return res.json({ canProceed: false, message: "You need to complete the assessment first" });
      }
  
      const { score, total_score } = assessmentResult.rows[0];
      const requiredScore = (passPercentage / 100) * total_score; // Calculate the required score
  
      if (score >= requiredScore) {
        return res.json({ canProceed: true });
      } else {
        return res.json({ canProceed: false, message: "You need to pass the assessment to proceed" });
      }
    } catch (err) {
      console.error("Error checking module progression:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
  

  updateModuleProgression: async (req, res) => {
    const { id } = req.params; 
    const { user_id, score } = req.body;

    if (!user_id || score === undefined) {
      return res.status(400).json({ error: "User ID and score are required" });
    }

    try {
      // Get module details
      const moduleResult = await pool.query(
        "SELECT * FROM modules WHERE id = $1",
        [id]
      );

      if (moduleResult.rows.length === 0) {
        return res.status(404).json({ error: "Module not found" });
      }

      const module = moduleResult.rows[0];

      if (!module.has_assessment) {
        return res.json({ message: "Module has no assessment, no progress update needed." });
      }

      // Store assessment result
      await pool.query(
        `INSERT INTO assessment_results (user_id, assessment_id, score, created_at)
         VALUES ($1, $2, $3, NOW())`,
        [user_id, module.assessment_id, score]
      );

      if (score >= 5) {
        return res.json({ message: "User passed the module assessment and can proceed." });
      } else {
        return res.json({ message: "User failed the assessment. They must retry." });
      }
    } catch (err) {
      console.error("Error updating module progress:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  // Ao recuperar informações sobre um learning path, inclua os dados de duração estimada, ECTS e tempos sugeridos.
};

module.exports = learningPathsController;
