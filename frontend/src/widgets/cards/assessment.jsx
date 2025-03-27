import { Typography, Button, Radio } from "@material-tailwind/react";
import React, { useEffect, useState } from "react";

export function Assessment({ userId, moduleId, assessment }) {
  const [userAnswers, setUserAnswers] = useState({});
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    // Fetch the number of attempts for the user and assessment
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
  };

  const checkAnswers = async () => {
    if (!assessment) return;

    let correctCount = 0;
    const answers = [];

    assessment.questions.forEach((_, qIndex) => {
      const correctAnswerIndex = assessment.solution[qIndex];
      const userSelectedIndex = userAnswers[qIndex];
      answers.push({
        questionIndex: qIndex,
        selectedAnswerIndex: userSelectedIndex,
        correctAnswerIndex: correctAnswerIndex,
      });

      if (
        userSelectedIndex !== undefined &&
        userSelectedIndex === correctAnswerIndex
      ) {
        correctCount++;
      }
    });

    setScore(correctCount);
    setShowFeedback(true);

    const passed = correctCount === 5;

    // Prepare the data to save to the database
    const assessmentResults = {
      user_id: userId,
      assessment_id: assessment.id,
      module_id: moduleId,
      score: correctCount,
      passed: passed,
      num_attempts: attempts + 1, // Incrementing attempt count
      answers: JSON.stringify(answers),
    };

    try {
      const response = await fetch(
        `http://localhost:8080/api/modules/${moduleId}/assessment/results/${userId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(assessmentResults),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to save assessment results");
      }

      const savedResult = await response.json();
      console.log("Assessment results saved:", savedResult);

      // Fetch updated attempts count after saving
      const updatedAttemptsResponse = await fetch(
        `http://localhost:8080/api/modules/${moduleId}/assessment/results/${userId}`
      );

      if (updatedAttemptsResponse.ok) {
        const updatedData = await updatedAttemptsResponse.json();
        setAttempts(updatedData.num_attempts || 0);
      }
    } catch (err) {
      console.error("Error saving results:", err.message);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg">
      {!assessment ? (
        <Typography className="text-blue-gray-500">
          No assessment available for this module.
        </Typography>
      ) : (
        <div key={assessment.id} className="mb-6">
          {assessment.questions.map((questionObj, qIndex) => {
            const correctIndex = assessment.solution[qIndex];
            const userSelectedIndex = userAnswers[qIndex];

            return (
              <div key={qIndex} className="mb-4 p-4 rounded-md">
                <Typography className="mb-2 font-medium">
                  Question {qIndex + 1}: {questionObj.question_text}
                </Typography>

                {assessment.answers[qIndex]?.map((answer, aIndex) => {
                  const isCorrect = aIndex === correctIndex;
                  const isSelected = aIndex === userSelectedIndex;

                  return (
                    <label key={aIndex} className="block">
                      <div
                        className={`p-2 rounded-md cursor-pointer flex items-center gap-2 border 
                          ${isSelected ? "border-2" : "border"}
                          ${
                            showFeedback && isSelected
                              ? isCorrect
                                ? "border-green-500 bg-green-100"
                                : "border-red-500 bg-red-100"
                              : ""
                          }
                        `}
                      >
                        <Radio
                          name={`question-${assessment.id}-${qIndex}`}
                          value={aIndex}
                          checked={isSelected}
                          onChange={() => handleAnswerSelect(qIndex, aIndex)}
                        />
                        {answer}
                      </div>
                    </label>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}

      {/* Check Answers Button */}
      {assessment && (
        <Button onClick={checkAnswers} className="mt-4">
          Check Answers
        </Button>
      )}

      {/* Score Display */}
      {score !== null && (
        <Typography className="mt-2 text-blue-gray-700">
          Score: {score} / {assessment?.questions.length}
        </Typography>
      )}
    </div>
  );
}
