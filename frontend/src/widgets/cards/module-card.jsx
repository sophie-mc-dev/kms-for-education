import React, { useEffect, useState } from "react";
import { Card, CardBody, Typography, Button } from "@material-tailwind/react";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { ResourceCard } from "@/widgets/cards/";
import { Assessment } from "@/widgets/cards/";

export function ModuleCard({
  userId,
  module,
  isUnlocked,
  isPassed,
  isCurrent,
  index,
}) {
  const [resources, setResources] = useState([]);
  const [assessment, setAssessment] = useState([]);
  const [resourceCount, setResourceCount] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isPassed) {
      setIsOpen(false);
    }
  }, [isPassed]);

  const handleModuleStart = () => {
    if (isUnlocked && !isPassed) {
      setIsOpen(true);
    }
  };

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/api/modules/${module.id}/resources`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch resources");
        }
        const data = await response.json();
        setResources(data);
      } catch (err) {
        console.error("Error fetching resources:", err);
      }
    };
    fetchResources();
  }, []);

  useEffect(() => {
    const fetchResourceCount = async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/api/modules/${module.id}/resource_count`
        );
        if (response.ok) {
          const data = await response.json();
          setResourceCount(data.resource_count);
        } else {
          console.error("Failed to fetch resource count");
        }
      } catch (err) {
        console.error("Error fetching resource count:", err);
      }
    };

    fetchResourceCount();
  }, [module.id]);

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/api/modules/${module.id}/assessment`
        );
        if (!response.ok) throw new Error("Failed to fetch assessment");
        const data = await response.json();
        setAssessment(data);
      } catch (err) {
        console.error("Error fetching assessment:", err);
      }
    };
    fetchAssessment();
  }, []);

  return (
    <Card className="border border-blue-gray-200 rounded-lg mt-2 cursor-pointer transition">
      <CardBody className="w-full">
        <div className="flex flex-col w-full gap-2">
          {/* Wrapper for Chevron, Title, Resource Count, Estimated Time */}
          <div className="flex items-start justify-between gap-4">
            {/* Chevron Icons */}
            <div
              onClick={() => {
                if (isUnlocked && (module.status === "in_progress" || module.status === "completed")) {
                  setIsOpen(!isOpen);
                }
              }}
              className={`${!isUnlocked ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
            >
              {isOpen ? (
                <ChevronDownIcon className="w-5 h-5 text-blue-gray-500" />
              ) : (
                <ChevronRightIcon className="w-5 h-5 text-blue-gray-500" />
              )}
            </div>

            {/* Module Title, Resource Count, and Estimated Time */}
            <div className="flex flex-col gap-2">
              {/* Module Title */}
              <Typography variant="h6" className="text-blue-gray-700">
                {`Module ${index + 1}: ${module.title}`}
              </Typography>

              {/* Resource Count and Estimated Time */}
              <div className="flex gap-4">
                <div className="flex flex-col items-start pr-4 border-r border-blue-gray-300">
                  <Typography variant="small" className="text-blue-gray-500">
                    {resourceCount} resources
                  </Typography>
                </div>

                <div className="flex flex-col items-start">
                  <Typography variant="small" className="text-blue-gray-500">
                    {module.estimated_duration} min
                  </Typography>
                </div>
              </div>
            </div>

            {/* Start Button */}
            <div className="ml-auto">
              <Button
                size="sm"
                disabled={
                  !isUnlocked ||
                  module.status === "in_progress" ||
                  module.status === "completed"
                }
                onClick={handleModuleStart}
                className={`text-white transition ${
                  !isUnlocked
                    ? "bg-gray-300 cursor-not-allowed"
                    : module.status === "in_progress"
                    ? "bg-blue-500 cursor-not-allowed"
                    : module.status === "completed"
                    ? "bg-green-500 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600"
                }`}
              >
                {!isUnlocked
                  ? "Start Module"
                  : module.status === "in_progress"
                  ? "In Progress"
                  : module.status === "completed"
                  ? "Completed"
                  : "Start Module"}
              </Button>
            </div>
          </div>

          {/* Expanded View */}
          {isOpen && (
            <div className="mt-4 p-4 rounded-lg w-full">
              <Typography className="text-blue-gray-700">
                {module.description}
              </Typography>

              {/* Resources */}
              <Typography variant="h6" className="mt-4">
                Resources
              </Typography>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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

              {/* Assessment */}
              <div className="mt-10">
                <Typography variant="h6">Test Your Knowledge</Typography>
                <Typography variant="small">
                  You must score 5/5 correct answers on this quiz to unlock the
                  next module.
                </Typography>
                <Assessment
                  userId={userId}
                  moduleId={module.id}
                  assessment={assessment}
                />
              </div>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
