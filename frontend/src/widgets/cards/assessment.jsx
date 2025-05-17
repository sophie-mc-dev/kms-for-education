import { Typography, Button, Radio } from "@material-tailwind/react";
import React, { useEffect, useState } from "react";

export function Assessment({
  userId,
  moduleId,
  assessment = { questions: [] },
  learningPathId = null,
  onModuleCompleted = () => {},
}) {
  const [userAnswers, setUserAnswers] = useState({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [isAnswerChanged, setIsAnswerChanged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchAttempts = async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/api/modules/${moduleId}/assessment/results/${userId}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch attempt count");
        }
        const data = await response.json();
        setAttempts(data.num_attempts || 0);
      } catch (err) {
        console.error("Error fetching attempt count:", err.message);
        setAttempts(0);
      }
    };

    if (assessment) {
      fetchAttempts();
    }
  }, [assessment, moduleId, userId]);

  const handleAnswerSelect = (questionIndex, answerIndex) => {
    setUserAnswers((prev) => ({
      ...prev,
      [questionIndex]: answerIndex,
    }));
    setIsAnswerChanged(true);
  };

  const checkAnswers = async () => {
    if (isSubmitting) return;

    if (!assessment || !assessment.questions || !assessment.solution) {
      console.error("Invalid assessment data.");
      return;
    }

    let correctCount = 0;
    const answers = [];

    // Evaluate the answers
    assessment.questions.forEach((_, qIndex) => {
      const correctAnswerIndex = assessment.solution[qIndex];
      const userSelectedIndex = userAnswers[qIndex];

      answers.push({
        questionIndex: qIndex,
        selectedAnswerIndex: userSelectedIndex,
        correctAnswerIndex: correctAnswerIndex,
      });

      // Increment the correct count if the user's answer matches the correct one
      if (
        userSelectedIndex !== undefined &&
        userSelectedIndex === correctAnswerIndex
      ) {
        correctCount++;
      }
    });

    const totalQuestions = assessment.questions.length;
    const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
    setScore(scorePercentage);
    setShowFeedback(true);
    setIsAnswerChanged(false);

    const passed = scorePercentage >= assessment.passing_percentage;

    const assessmentResults = {
      user_id: userId,
      assessment_id: assessment.id,
      module_id: parseInt(moduleId, 10),
      score: scorePercentage,
      passed: passed,
      num_attempts: attempts + 1,
      answers: JSON.stringify(answers),
      learning_path_id: parseInt(learningPathId, 10),
    };

    // Change the API endpoint dynamically (for standalone modules or modules in a LP)
    const endpoint = learningPathId
      ? `http://localhost:8080/api/learning-paths/${learningPathId}/modules/${moduleId}/complete/${userId}`
      : `http://localhost:8080/api/modules/${moduleId}/complete/${userId}?learning_path_id=${learningPathId}`;

    setIsSubmitting(true);

    try {
      const submitResponse = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(assessmentResults),
      });

      console.log(assessmentResults);

      if (!submitResponse.ok) {
        throw new Error("Failed to save assessment results");
      }

      onModuleCompleted({
        moduleId,
        score: scorePercentage,
        passed,
      });

      console.log("Assessment results saved successfully.");

      // Fetch the updated number of attempts
      const updatedAttemptsResponse = await fetch(
        `http://localhost:8080/api/modules/${moduleId}/assessment/results/${userId}`
      );

      if (updatedAttemptsResponse.ok) {
        const updatedData = await updatedAttemptsResponse.json();
        setAttempts(updatedData.num_attempts || 0);
      } else {
        console.error("Failed to fetch updated attempts.");
      }
    } catch (err) {
      console.error("Error saving results:", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg">
      {!assessment ? (
        <Typography className="text-blue-gray-500">
          No assessment available for this module.
        </Typography>
      ) : (
        <div key={assessment?.id} className="mb-6">
          {assessment?.questions?.length > 0 ? (
            assessment.questions.map((questionObj, qIndex) => {
              const correctIndex = assessment?.solution?.[qIndex];
              const userSelectedIndex = userAnswers[qIndex];

              return (
                <div key={qIndex} className="mb-4 p-4 rounded-md">
                  <Typography className="mb-2 font-medium">
                  {`Question ${qIndex + 1}: ${questionObj}`}
                  </Typography>

                  {assessment?.answers?.[qIndex]?.length > 0 ? (
                    assessment.answers[qIndex].map((answer, aIndex) => {
                      const isCorrect = aIndex === correctIndex;
                      const isSelected = aIndex === userSelectedIndex;

                      return (
                        <label key={`${assessment?.id}-${qIndex}-${aIndex}`} className="block">
                          <div
                            className={`p-2 rounded-md cursor-pointer flex items-center gap-2 border 
                              ${isSelected ? "border-2" : "border"}
                              ${
                                showFeedback && isSelected && !isAnswerChanged
                                  ? isCorrect
                                    ? "border-green-500 bg-green-100"
                                    : "border-red-500 bg-red-100"
                                  : ""
                              }
                            `}
                          >
                            <Radio
                              name={`question-${assessment?.id}-${qIndex}`}
                              value={aIndex}
                              checked={isSelected}
                              onChange={() =>
                                handleAnswerSelect(qIndex, aIndex)
                              }
                            />
                            {answer}
                          </div>
                        </label>
                      );
                    })
                  ) : (
                    <Typography className="text-red-500">
                      No answers available
                    </Typography>
                  )}
                </div>
              );
            })
          ) : (
            <Typography className="text-blue-gray-500">
              No questions available
            </Typography>
          )}
        </div>
      )}

      {/* Check Answers Button */}
      {assessment && (
        <Button onClick={checkAnswers} className="mt-4" disabled={isSubmitting}>
          {isSubmitting ? "Checking..." : "Check Answers"}
        </Button>
      )}

      {/* Score Display */}
      {score !== null && (
        <Typography className="mt-2 text-blue-gray-700">
          Score: {score} / 100
        </Typography>
      )}
    </div>
  );
}
