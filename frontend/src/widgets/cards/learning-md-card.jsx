import React from "react";
import { Card, CardBody, Typography, Progress } from "@material-tailwind/react";
import { ClockIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/context/UserContext";

export function LearningMDCard({ moduleItem }) {
  const { userId } = useUser();
  const navigate = useNavigate();

  const handleModuleClick = async () => {
    let cleanedModuleId;

    if (typeof moduleItem.id === "string") {
      cleanedModuleId = parseInt(moduleItem.id.replace("md_", ""), 10);
    } else {
      cleanedModuleId = parseInt(moduleItem.id, 10);
    }

    try {
      await registerModuleView(userId, cleanedModuleId);
    } catch (error) {
      console.error("Error registering module view:", error);
    }

    navigate(`/dashboard/learning/module/${cleanedModuleId}`);
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

  return (
    <Card
      className="border border-blue-gray-100 shadow-sm cursor-pointer hover:shadow-md transition h-full min-h-[250px] flex flex-col"
      onClick={handleModuleClick}
    >
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
              {moduleItem.estimated_duration} min | {moduleItem.ects} ECTS
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
