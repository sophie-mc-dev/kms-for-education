/*
Create an endpoint to handle student submissions.
Validate student answers against the stored solution.
Calculate the score and determine if the student passed.
Store the result in the assessment_results table.
Update learning_paths_progress if the assessment is required for module progression.
*/

const { pool } = require("../db/db");

const assessmentResultsController = {
    submitAssessment: async (req, res) => {
        const { user_id, assessment_id, module_id, answers } = req.body;

        if (!user_id || !assessment_id || !module_id || !answers) {
            return res.status(400).json({ error: "All fields are required" });
        }

        try {
            // Fetch assessment solution
            const assessmentQuery = await pool.query("SELECT solution, pass_percentage FROM assessments WHERE id = $1", [assessment_id]);

            if (assessmentQuery.rows.length === 0) {
                return res.status(404).json({ error: "Assessment not found" });
            }

            const { solution, pass_percentage } = assessmentQuery.rows[0];

            // Calculate score
            let score = 0;
            const totalQuestions = Object.keys(solution).length;
            
            Object.keys(solution).forEach(questionId => {
                if (solution[questionId] === answers[questionId]) {
                    score += 1;
                }
            });

            const percentageScore = (score / totalQuestions) * 100;
            const passed = percentageScore >= pass_percentage;

            // Insert result into assessment_results table
            const result = await pool.query(
                `INSERT INTO assessment_results (user_id, assessment_id, module_id, score, passed, answers) 
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                [user_id, assessment_id, module_id, score, passed, answers]
            );

            res.status(201).json({ message: "Assessment submitted", result: result.rows[0] });
        } catch (err) {
            console.error("Error submitting assessment:", err);
            res.status(500).json({ error: "Internal Server Error" });
        }
    },

    getUserResultsByModule: async (req, res) => {
        const { user_id, module_id } = req.params;

        try {
            const result = await pool.query(
                `SELECT ar.*, a.title as assessment_title
                 FROM assessment_results ar
                 JOIN assessments a ON ar.assessment_id = a.id
                 WHERE ar.user_id = $1 AND ar.module_id = $2
                 ORDER BY ar.submission_time DESC`,
                [user_id, module_id]
            );

            res.json(result.rows);
        } catch (err) {
            console.error("Error fetching assessment results:", err);
            res.status(500).json({ error: "Internal Server Error" });
        }
    }
};

module.exports = assessmentResultsController;
