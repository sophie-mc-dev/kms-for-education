import React, { useState, useEffect } from "react";
import { Card, CardBody, Typography, Progress } from "@material-tailwind/react";
import { ClockIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/context/UserContext";

export function LearningMDCard({ moduleItem }) {
  const { userId, userRole } = useUser();
  const navigate = useNavigate();
  const [moduleStatus, setModuleStatus] = useState(null);

  const handleModuleClick = async () => {
    try {
      await registerModuleView(userId, moduleItem.id);
    } catch (error) {
      console.error("Error registering module view:", error);
    }

    navigate(`/dashboard/learning/module/${moduleItem.id}`);
  };

  const registerModuleView = async (userId, moduleId) => {
    try {
      const response = await fetch(
        "http://localhost:8080/api/user-interactions/module-view",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userId,
            module_id: moduleId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to register module view");
      }

      const data = await response.json();
    } catch (error) {
      console.error("Error registering module view:", error.message);
    }
  };

  useEffect(() => {
    if (userRole === "educator" || !moduleItem.id || !userId) {
      return;
    }

    const getModuleStatus = async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/api/modules/${moduleItem.id}/standalone-status?user_id=${userId}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch module status");
        }

        const data = await response.json();
        setModuleStatus(data.status);
      } catch (err) {
        console.error("Error fetching module status:", err);
        setModuleStatus("error");
      }
    };

    if (moduleItem.id && userId) {
      getModuleStatus();
    }
  }, [moduleItem.id, userId]);

  return (
    <Card
      className="border border-blue-gray-100 shadow-sm cursor-pointer hover:shadow-md transition h-full min-h-[250px] flex flex-col"
      onClick={handleModuleClick}
    >
      {/* Completed Badge */}
      {moduleStatus === "completed" && (
        <div
          className="absolute top-2 right-2 flex items-center justify-center bg-green-600 text-white rounded-full p-1.5 shadow-md"
          title="Completed"
        >
          <CheckCircleIcon className="h-5 w-5" />
        </div>
      )}

      <CardBody className="flex flex-col h-full">
        {/* Type Badge */}
        <div className="inline-flex items-center mb-3 px-2 py-1 rounded-md w-fit bg-orange-100">
          <Typography variant="small" className="text-orange-600 font-medium">
            Module
          </Typography>
        </div>

        {/* Title & Summary */}
        <Typography
          variant="h6"
          color="blue-gray"
          className="mb-2 font-semibold"
        >
          {moduleItem.title}
        </Typography>
        <Typography
          variant="paragraph"
          color="blue-gray"
          className="mb-3 leading-relaxed"
        >
          <span
            dangerouslySetInnerHTML={{
              __html:
                moduleItem.summary.length > 70
                  ? moduleItem.summary.substring(0, 70) + "..."
                  : moduleItem.summary,
            }}
          ></span>
        </Typography>

        {/* Course Details */}
        <div className="flex items-center justify-between text-sm text-blue-gray-600 mb-2">
          <div className="flex items-center gap-2">
            <ClockIcon className="h-4 w-4 text-blue-gray-500" />
            <Typography variant="small" className="font-medium">
              {(() => {
                const totalMinutes = moduleItem.estimated_duration;
                const hours = Math.floor(totalMinutes / 60);
                const minutes = totalMinutes % 60;

                if (hours && minutes) return `${hours} hr ${minutes} min`;
                if (hours) return `${hours} hr`;
                return `${minutes} min`;
              })()}
            </Typography>
          </div>
        </div>

        {/* Progress Section */}
        {moduleItem.completion !== undefined && (
          <div className="mt-6">
            <Typography
              variant="small"
              className="mb-1 text-xs font-medium text-blue-gray-600"
            >
              {moduleItem.completion}% Completed
            </Typography>
            <Progress
              value={moduleItem.completion}
              variant="gradient"
              color={moduleItem.completion === 100 ? "green" : "blue"}
              className="h-1"
            />
          </div>
        )}
      </CardBody>
    </Card>
  );
}
