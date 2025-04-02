import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  CardBody,
  Typography,
  Button,
  Spinner,
} from "@material-tailwind/react";
import { ResourceCard } from "@/widgets/cards/";
import { useUser } from "@/context/userContext";
import { Assessment } from "@/widgets/cards/";

export function ModuleDetails() {
  const { userId } = useUser();
  const { moduleId } = useParams();
  const [module, setModule] = useState(null);
  const [resources, setResources] = useState([]);
  const [assessment, setAssessment] = useState(null);
  const [assessmentStatus, setAssessmentStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
        setError(err.message);
      }
    };
    fetchAssessment();
  }, []);

  useEffect(() => {
    const fetchAssessmentStatus = async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/api/modules/${cleanedModuleId}/assessment/status/${userId}`
        );
        if (!response.ok) {
          setAssessmentStatus("not_started"); 
        } else {
          const data = await response.json();
          setAssessmentStatus(data.assessmentStatus || "not_started");
        }
      } catch (err) {
        setError(err.message);
      }
    };
    fetchAssessmentStatus();
  }, [userId, cleanedModuleId]);

  const handleStartAssessment = async () => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/modules/${cleanedModuleId}/assessment/status/${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            assessment_status: "in_progress",
          }),
        }
      );

      if (!response.ok) throw new Error("Failed to update assessment status");
      setAssessmentStatus("in_progress");
    } catch (err) {
      setError(err.message);
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
              dangerouslySetInnerHTML={{ __html: module.summary }}
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
          {assessmentStatus === "not_started" ? (
            <Button
              onClick={handleStartAssessment}
              color="blue"
              className="mb-4"
            >
              Start Assessment 
            </Button>
          ) : (
            <Assessment
              userId={userId}
              moduleId={cleanedModuleId}
              assessment={assessment}
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}

export default ModuleDetails;
