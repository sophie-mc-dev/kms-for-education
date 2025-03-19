const { pool } = require("../db/postgres");

const assessmentsController = {
  addAssessment: async (req, res) => {
    const {
      title,
      description,
      assessment_type,
      questions,
      solution,
      pass_percentage,
      module_id,
    } = req.body;

    if (
      !title ||
      !assessment_type ||
      !questions ||
      !solution ||
      !pass_percentage ||
      !module_id
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    try {
      const result = await pool.query(
        `INSERT INTO assessments (title, description, assessment_type, questions, solution, pass_percentage, module_id)
                VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [
          title,
          description,
          assessment_type,
          questions,
          solution,
          pass_percentage,
          module_id,
        ]
      );

      res
        .status(201)
        .json({ message: "Assessment created", assessment: result.rows[0] });
    } catch (err) {
      console.error("Error creating assessment:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  getAssessments: async (req, res) => {
    try {
      const result = await pool.query(
        "SELECT * FROM assessments ORDER BY created_at DESC"
      );
      res.json(result.rows);
    } catch (err) {
      console.error("Error fetching assessments:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  getAssessmentById: async (req, res) => {
    const { id } = req.params;

    try {
      const result = await pool.query(
        "SELECT * FROM assessments WHERE id = $1",
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Assessment not found" });
      }

      res.json(result.rows[0]);
    } catch (err) {
      console.error("Error fetching assessment:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  updateAssessment: async (req, res) => {
    const { id } = req.params;
    const {
      title,
      description,
      assessment_type,
      questions,
      solution,
      pass_percentage,
    } = req.body;

    try {
      const result = await pool.query(
        `UPDATE assessments 
                SET title = $1, description = $2, assessment_type = $3, questions = $4, solution = $5, pass_percentage = $6, updated_at = now()
                WHERE id = $7 RETURNING *`,
        [
          title,
          description,
          assessment_type,
          questions,
          solution,
          pass_percentage,
          id,
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Assessment not found" });
      }

      res.json({ message: "Assessment updated", assessment: result.rows[0] });
    } catch (err) {
      console.error("Error updating assessment:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  removeAssessment: async (req, res) => {
    const { id } = req.params;

    try {
      const result = await pool.query(
        "DELETE FROM assessments WHERE id = $1 RETURNING *",
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Assessment not found" });
      }

      res.json({ message: "Assessment deleted" });
    } catch (err) {
      console.error("Error deleting assessment:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
};

module.exports = assessmentsController;
