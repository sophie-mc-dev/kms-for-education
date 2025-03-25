import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  CardBody,
  Typography,
  Button,
  Spinner,
  Radio,
} from "@material-tailwind/react";
import { ResourceCard } from "@/widgets/cards/";
import { useUser } from "@/context/userContext";

export function ModuleDetails() {
  const { userId } = useUser();
  const { moduleId } = useParams();
  const [module, setModule] = useState(null);
  const [resources, setResources] = useState([]);
  const [assessment, setAssessment] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assessmentError, setAssessmentError] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const cleanedModuleId = moduleId.replace("md_", "");

  const formattedDate = module?.created_at
    ? new Date(module.created_at).toLocaleString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "UTC",
      })
    : "N/A";

  useEffect(() => {
    const fetchModule = async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/api/modules/${cleanedModuleId}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch module");
        }
        const data = await response.json();
        setModule(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchModule();
  }, []);

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/api/modules/${cleanedModuleId}/resources`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch resources");
        }
        const data = await response.json();
        setResources(data);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchResources();
  }, []);

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/api/modules/${cleanedModuleId}/assessment`
        );
        if (!response.ok) throw new Error("Failed to fetch assessment");
        const data = await response.json();
        setAssessment(data);
      } catch (err) {
        setAssessmentError(err.message);
      }
    };
    fetchAssessment();
  }, []);

  useEffect(() => {
    // Fetch the number of attempts for the user and assessment
    const fetchAttempts = async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/api/modules/${cleanedModuleId}/assessment/results/${userId}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch attempt count");
        }
        const data = await response.json();
        console.log(data);
        // Check if data contains num_attempts, if not, set it to 0
        setAttempts(data.num_attempts || 0);
      } catch (err) {
        console.error("Error fetching attempt count:", err.message);
        // Set attempts to 0 if there's an error
        setAttempts(0);
      }
    };

    if (assessment) {
      fetchAttempts();
    }
  }, [assessment, cleanedModuleId, userId]);

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
      module_id: cleanedModuleId,
      score: correctCount,
      passed: passed,
      num_attempts: attempts + 1, // Incrementing attempt count
      answers: JSON.stringify(answers),
    };

    try {
      const response = await fetch(
        `http://localhost:8080/api/modules/${cleanedModuleId}/assessment/results/${userId}`,
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
        `http://localhost:8080/api/modules/${cleanedModuleId}/assessment/results/${userId}`
      );

      if (updatedAttemptsResponse.ok) {
        const updatedData = await updatedAttemptsResponse.json();
        setAttempts(updatedData.num_attempts || 0); 
      }
    } catch (err) {
      console.error("Error saving results:", err.message);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center mt-12">
        <Spinner />
      </div>
    );

  if (error)
    return <div className="mt-12 text-center text-red-500">Error: {error}</div>;

  if (!module)
    return <div className="mt-12 text-center">No Module Data Available</div>;

  return (
    <div className="flex gap-4 mt-12 min-h-screen flex-col lg:flex-row">
      <Card className="border border-blue-gray-100 shadow-sm p-4 flex-1 min-h-full flex flex-col">
        <CardBody className="flex-grow">
          <Typography variant="h4" color="blue-gray" className="font-semibold">
            {module.title}
          </Typography>

          <div className="mb-6 flex items-center gap-x-4">
            {/* Left Section: Date and Author */}
            <div className="flex items-center gap-x-1">
              <Typography className="block text-xs font-semibold uppercase text-blue-gray-500">
                Published On:
              </Typography>
              <Typography
                variant="small"
                className="font-normal text-blue-gray-500"
              >
                {formattedDate}
              </Typography>
            </div>
          </div>

          <div className="mb-6 font-normal text-blue-gray-900">
            <div
              className="[&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal"
              dangerouslySetInnerHTML={{ __html: module.description }}
            ></div>
          </div>

          <div className="border-t my-4"></div>

          <Typography variant="h6" color="blue-gray" className="mb-3">
            Resources
          </Typography>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {resources.length > 0 ? (
              resources.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))
            ) : (
              <Typography className="text-blue-gray-600">
                No resources available for this module.
              </Typography>
            )}
          </div>
          <div className="border-t my-4"></div>

          <Typography variant="h6" color="blue-gray" className="mb-3">
            Test Your Knowledge
          </Typography>

          {assessmentError ? (
            <Typography className="text-red-500">
              Error loading assessment: {assessmentError}
            </Typography>
          ) : assessment ? (
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
                            className={`p-2 rounded-md cursor-pointer flex items-center gap-2
                    ${isSelected ? "border-2" : "border"}
                    ${
                      showFeedback && isSelected && isCorrect
                        ? "border-green-500 bg-green-100"
                        : ""
                    }
                    ${
                      showFeedback && isSelected && !isCorrect
                        ? "border-red-500 bg-red-100"
                        : ""
                    }
                  `}
                          >
                            <Radio
                              name={`question-${assessment.id}-${qIndex}`}
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
                    })}
                  </div>
                );
              })}
            </div>
          ) : (
            <Typography>No assessment available.</Typography>
          )}

          <Button onClick={checkAnswers} className="mt-4">
            Check Answers
          </Button>

          {score !== null && (
            <Typography className="mt-2 text-blue-gray-700">
              Score: {score} / {assessment?.questions.length}
            </Typography>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

export default ModuleDetails;
