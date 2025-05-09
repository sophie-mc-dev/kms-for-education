import React, { useState, useEffect } from "react";
import { Card, CardBody, Typography, Progress, Chip } from "@material-tailwind/react";
import { ClockIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/context/UserContext";

export function LearningLPCard({ learningItem }) {
  const { userId, userRole } = useUser();
  const [learningPathStatus, setLearningPathStatus] = useState(null);

  const navigate = useNavigate();

  const handleLearningPathClick = async () => {
    try {
      await registerLearningPathView(userId, learningItem.id);
    } catch (error) {
      console.error("Error registering learning path view:", error);
    }
    navigate(`/dashboard/learning/learning-path/${learningItem.id}`);
  };

  const registerLearningPathView = async (userId, learningPathId) => {
    try {
      const response = await fetch(
        "http://localhost:8080/api/user-interactions/learning-path-view",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userId,
            learning_path_id: learningPathId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to register learning path view");
      }

      const data = await response.json();
    } catch (error) {
      console.error("Error registering learning path view:", error.message);
    }
  };

  useEffect(() => {
    if (userRole === "educator" || !learningItem.id || !userId) {
      return;
    }

    const getLearningPathStatus = async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/api/learning-paths/${learningItem.id}/status?user_id=${userId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch learning path status");
        }

        const data = await response.json();
        setLearningPathStatus(data.status);
      } catch (err) {
        console.error("Error fetching module status:", err);
      }
    };

    if (learningItem.id && userId) {
      getLearningPathStatus();
    }
  }, [learningItem.id, userId]);

  return (
    <Card
      className="border border-blue-gray-100 shadow-sm cursor-pointer hover:shadow-md transition h-full min-h-[250px] flex flex-col"
      onClick={handleLearningPathClick}
    >
      {/* Completed Badge */}
      {learningPathStatus === "completed" && (
        <div className="absolute top-2 right-2 flex items-center justify-center bg-green-500 text-white rounded-full p-2 shadow-md">
          <CheckCircleIcon className="h-5 w-5" />
        </div>
      )}
      <CardBody className="flex flex-col h-full">
        {/* Type Badge */}
        <div className="inline-flex items-center mb-3 px-2 py-1 rounded-md w-fit bg-blue-100">
          <Typography variant="small" className="text-blue-600 font-medium">
            Learning Path
          </Typography>
        </div>

        {/* Title & Summary */}
        <Typography
          variant="h6"
          color="blue-gray"
          className="mb-2 font-semibold"
        >
          {learningItem.title}
        </Typography>
        <Typography
          variant="paragraph"
          color="blue-gray"
          className="mb-3 leading-relaxed"
        >
          <span
            dangerouslySetInnerHTML={{
              __html:
                learningItem.summary.length > 70
                  ? learningItem.summary.substring(0, 70) + "..."
                  : learningItem.summary,
            }}
          ></span>
        </Typography>

        {/* Course Details */}
        <div className="flex items-center justify-between text-sm text-blue-gray-600 mb-2">
          <div className="flex items-center gap-2">
            <ClockIcon className="h-4 w-4 text-blue-gray-500" />
            <Typography variant="small" className="font-medium">
              {learningItem.estimated_duration} min
            </Typography>
          </div>
        </div>

        <div className="mt-auto">
          <div
            className="flex flex-wrap gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {learningItem.difficulty_level && (
              <div className="flex flex-wrap gap-2 text-sm mb-2">
                <Chip
                  value={learningItem.difficulty_level}
                  size="sm"
                  className="bg-blue-gray-100 text-blue-gray-700 font-medium"
                />
              </div>
            )}
          </div>
        </div>

        {/* Progress Section */}
        {learningItem.completion !== undefined && (
          <div className="mt-6">
            <Typography
              variant="small"
              className="mb-1 text-xs font-medium text-blue-gray-600"
            >
              {learningItem.completion}% Completed
            </Typography>
            <Progress
              value={learningItem.completion}
              variant="gradient"
              color={learningItem.completion === 100 ? "green" : "blue"}
              className="h-1"
            />
          </div>
        )}
      </CardBody>
    </Card>
  );
}
