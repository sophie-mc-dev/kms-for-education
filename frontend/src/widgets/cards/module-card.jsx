import React, { useEffect, useState } from "react";
import { Card, CardBody, Typography, Button } from "@material-tailwind/react";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { ResourceCard } from "@/widgets/cards/";
import { Assessment } from "@/widgets/cards/";

export function ModuleCard({
  module,
  learningPathId,
  userId,
  isUnlocked,
  isPassed,
  index,
  refreshUserProgress,
}) {
  const [resources, setResources] = useState([]);
  const [assessment, setAssessment] = useState(null);
  const [assessmentStatus, setAssessmentStatus] = useState(null);
  const [resourceCount, setResourceCount] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [moduleStatus, setModuleStatus] = useState("");

  useEffect(() => {
    if (isPassed) {
      setIsOpen(true);
    }
  }, [isPassed]);

  useEffect(() => {
    const fetchModuleStatus = async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/api/modules/${module.id}/status?user_id=${userId}&learning_path_id=${learningPathId}`
        );

        if (response.status === 404) {
          setModuleStatus("not_started");
          return;
        }

        if (!response.ok) {
          throw new Error("Failed to fetch module status");
        }

        const data = await response.json();
        setModuleStatus(data.status);
        if (data.status === "in_progress") {
          setIsOpen(true);
        }
      } catch (err) {
        console.error("Error fetching module status:", err);
      }
    };

    if (module.id && userId && learningPathId) {
      fetchModuleStatus();
    }
  }, [module.id, userId, learningPathId, refreshUserProgress]);

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

  useEffect(() => {
    const fetchAssessmentStatus = async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/api/modules/${module.id}/assessment/status/${userId}?learning_path_id=${learningPathId}`
        );
        if (!response.ok) {
          setAssessmentStatus("not_started");
        } else {
          const data = await response.json();
          setAssessmentStatus(data.assessmentStatus || "not_started");
        }
      } catch (err) {
        console.error("Error fetching assessment status:", err);
        setAssessmentStatus("not_started");
      }
    };

    if (module.id && userId && learningPathId) {
      fetchAssessmentStatus();
    }
  }, [userId, module.id, learningPathId]);

  const handleStartAssessment = async () => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/modules/${module.id}/assessment/status/${userId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            assessment_status: "in_progress",
            assessment_id: assessment.id,
            learning_path_id: learningPathId,
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to update assessment status");
      setAssessmentStatus("in_progress");
    } catch (err) {
      console.error("Error starting module:", err);
    }
  };

  const handleModuleStart = async () => {
    if (
      isUnlocked &&
      moduleStatus !== "completed" &&
      moduleStatus !== "in_progress"
    ) {
      setModuleStatus("in_progress");
      setIsOpen(true);
      try {
        const response = await fetch(
          `http://localhost:8080/api/modules/${module.id}/start`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              user_id: userId,
              module_id: module.id,
              learning_path_id: learningPathId,
            }),
          }
        );
        if (!response.ok) {
          throw new Error("Failed to start module");
        }
        console.log("Module started successfully");

        refreshUserProgress();
      } catch (err) {
        console.error("Error starting module:", err);
      }
    }
  };

  return (
    <Card className="border rounded-md mt-2 cursor-pointer transition">
      <CardBody className="w-full">
        <div className="flex flex-col w-full gap-2">
          <div className="flex items-start justify-between gap-4">
            <div
              onClick={() => {
                if (
                  isUnlocked &&
                  (moduleStatus === "in_progress" ||
                    moduleStatus === "completed")
                ) {
                  setIsOpen(!isOpen);
                }
              }}
              className={`${
                !isUnlocked ? "cursor-not-allowed opacity-50" : "cursor-pointer"
              }`}
            >
              {isOpen ? (
                <ChevronDownIcon className="w-5 h-5 text-blue-gray-500" />
              ) : (
                <ChevronRightIcon className="w-5 h-5 text-blue-gray-500" />
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Typography variant="h6" className="text-blue-gray-700">
                {`Module ${index + 1}: ${module.title}`}
              </Typography>

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

            <div className="ml-auto">
              <Button
                size="sm"
                disabled={
                  !isUnlocked ||
                  moduleStatus === "in_progress" ||
                  moduleStatus === "completed"
                }
                onClick={handleModuleStart}
                className={`text-white transition ${
                  !isUnlocked
                    ? "bg-gray-300 cursor-not-allowed"
                    : moduleStatus === "in_progress"
                    ? "bg-blue-500 cursor-not-allowed"
                    : moduleStatus === "completed"
                    ? "bg-green-500 cursor-not-allowed"
                    : "bg-blue-500 hover:bg-blue-600"
                }`}
              >
                {!isUnlocked
                  ? "Start Module"
                  : moduleStatus === "in_progress"
                  ? "In Progress"
                  : moduleStatus === "completed"
                  ? "Completed"
                  : "Start Module"}
              </Button>
            </div>
          </div>

          {isOpen && (
            <div className="mt-4 p-4 rounded-lg w-full">
              <div
                className="
                  [&_ol]:list-decimal [&_ul]:list-disc 
                  [&_li]:ml-4
                  [&_ol_ol]:list-decimal [&_ul_ul]:list-disc 
                  [&_ol_ol]:ml-2 [&_ul_ul]:ml-4 
                  mt-2 text-blue-gray-500
                  text-sm
                "
                dangerouslySetInnerHTML={{ __html: module.summary }}
              ></div>

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

              <div className="mt-10">
                <Typography variant="h6" className="mb-3">
                  Test Your Knowledge
                </Typography>
                {assessmentStatus === "not_started" ||
                assessmentStatus === "passed" ||
                assessmentStatus === "failed" ? (
                  <Button
                    onClick={handleStartAssessment}
                    color="blue"
                    className="mb-4"
                  >
                    Start Assessment
                  </Button>
                ) : (
                  <Assessment
                    assessment={assessment}
                    moduleId={module.id}
                    learningPathId={learningPathId}
                    userId={userId}
                    onModuleCompleted={refreshUserProgress}
                  />
                )}
              </div>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
}
