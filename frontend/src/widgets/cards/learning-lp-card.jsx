import React from "react";
import { Card, CardBody, Typography, Progress } from "@material-tailwind/react";
import { ClockIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";

export function LearningLPCard({ learningItem }) {
  const navigate = useNavigate();

  return (
    <Card
      className="border border-blue-gray-100 shadow-sm cursor-pointer hover:shadow-md transition h-full min-h-[250px] flex flex-col"
      onClick={() => navigate(`learning-path/${learningItem.id}`)} // Navigate to the specific learning path
    >
      <CardBody className="flex flex-col h-full">
        {/* Type Badge */}
        <div className="inline-flex items-center mb-3 px-2 py-1 rounded-md w-fit bg-blue-100">
          <Typography variant="small" className="text-blue-600 font-medium">
            Learning Path
          </Typography>
        </div>

        {/* Title & Description */}
        <Typography variant="h6" color="blue-gray" className="mb-2 font-semibold">
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
                learningItem.description.length > 70
                  ? learningItem.description.substring(0, 70) + "..."
                  : learningItem.description,
            }}
          ></span>
        </Typography>

        {/* Course Details */}
        <div className="flex items-center justify-between text-sm text-blue-gray-600 mb-2">
          <div className="flex items-center gap-2">
            <ClockIcon className="h-4 w-4 text-blue-gray-500" />
            <Typography variant="small" className="font-medium">
              {learningItem.estimated_duration} min | {learningItem.ects} ECTS
            </Typography>
          </div>
        </div>

        {/* Progress Section */}
        {learningItem.completion !== undefined && (
          <div className="mt-6">
            <Typography variant="small" className="mb-1 text-xs font-medium text-blue-gray-600">
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
