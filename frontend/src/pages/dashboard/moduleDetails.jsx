import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  CardBody,
  Typography,
  Button,
  Spinner,
} from "@material-tailwind/react";
import { ResourceCard, LearningMDCard, LearningLPCard } from "@/widgets/cards/";
import { useUser } from "@/context/userContext";
import { Assessment } from "@/widgets/cards/";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

export function ModuleDetails() {
  const { userId } = useUser();
  const { moduleId } = useParams();
  const [module, setModule] = useState(null);
  const [resources, setResources] = useState([]);
  const [assessment, setAssessment] = useState(null);
  const [assessmentStatus, setAssessmentStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [recommendedLearningPaths, setRecommendedLearningPaths] = useState([]);
  const [recommendedModules, setRecommendedModules] = useState([]);

  const containerRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [cardsPerRow, setCardsPerRow] = useState(1);

  const handleRefresh = () => {
    const totalPages = Math.ceil(recommendedModules.length / cardsPerRow);
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  const visibleModules = recommendedModules.slice(
    currentPage * cardsPerRow,
    currentPage * cardsPerRow + cardsPerRow
  );

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
          `http://localhost:8080/api/modules/${moduleId}`
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
          `http://localhost:8080/api/modules/${moduleId}/resources`
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
          `http://localhost:8080/api/modules/${moduleId}/assessment`
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
          `http://localhost:8080/api/modules/${moduleId}/assessment/status/${userId}`
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
  }, [userId, moduleId]);

  useEffect(() => {
    const fetchRecommendedLearningPaths = async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/api/recommendations/${userId}/learning-paths/${moduleId}`
        );
        const data = await response.json();
        setRecommendedLearningPaths(data);
      } catch (error) {
        console.error("Error fetching recommended modules:", error);
      }
    };
    fetchRecommendedLearningPaths();
  }, []);

  useEffect(() => {
    const fetchRecommendedModules = async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/api/recommendations/${userId}/modules/${moduleId}`
        );
        const data = await response.json();
        setRecommendedModules(data);
      } catch (error) {
        console.error("Error fetching recommended modules:", error);
      }
    };
    fetchRecommendedModules();
  }, []);

  useEffect(() => {
    const calculateCardsPerRow = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const maxCards = Math.floor(containerWidth / 250);
        setCardsPerRow(maxCards || 1);
      }
    };

    calculateCardsPerRow();
    window.addEventListener("resize", calculateCardsPerRow);
    return () => window.removeEventListener("resize", calculateCardsPerRow);
  }, []);

  const handleStartAssessment = async () => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/modules/${moduleId}/assessment/status/${userId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            assessment_status: "in_progress",
            assessment_id: assessment.id
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
    <div className="mt-12 flex gap-4 h-full">
      {/* Left Main Column */}
      <div className="w-3/4 flex flex-col gap-4">
        <Card className="border border-orange-100 shadow-orange-100 shadow-sm p-4 flex-1">
          <CardBody className="flex-grow">
            <Typography
              variant="h4"
              color="blue-gray"
              className="font-semibold"
            >
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
              <Typography variant="h6" color="blue-gray" className="mb-3">
                Summary
              </Typography>
              <div
                className="[&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal"
                dangerouslySetInnerHTML={{ __html: module.summary }}
              ></div>
            </div>
            <div className="mb-6 font-normal text-blue-gray-900">
              <Typography variant="h6" color="blue-gray" className="mb-3">
                Objectives
              </Typography>
              <div
                className="[&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal"
                dangerouslySetInnerHTML={{ __html: module.objectives }}
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
            {assessmentStatus === "not_started" ||
            assessmentStatus === "passed" ||
            assessmentStatus === "failed" ? (
              <Button
                onClick={handleStartAssessment}
                color="orange"
                className="mb-4"
              >
                Start Assessment
              </Button>
            ) : (
              <Assessment
                userId={userId}
                moduleId={moduleId}
                assessment={assessment}
              />
            )}
          </CardBody>
        </Card>

        <Card className="border border-blue-gray-100 shadow-sm p-4 flex-1">
          <CardBody>
            <div className="flex mb-2 justify-between items-center">
              <Typography
                variant="h6"
                className="font-semibold text-gray-800 mb-3"
              >
                Recommended Modules
              </Typography>
              <button
                className="mb-4 transition-transform duration-300 hover:rotate-90"
                onClick={handleRefresh}
              >
                <ArrowPathIcon className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <div
              ref={containerRef}
              className="flex gap-4 transition-all duration-300 overflow-hidden"
            >
              {loading ? (
                <p className="text-gray-500 text-sm">
                  Loading recommended modules...
                </p>
              ) : visibleModules.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  Couldn't recommend modules.
                </p>
              ) : (
                visibleModules.map((module) => (
                  <div key={module.id} className="flex-shrink-0 w-[350px]">
                    <LearningMDCard moduleItem={module} />
                  </div>
                ))
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Right Sidebar */}
      <div className="w-1/4">
        <Card className="border border-blue-gray-100 p-4 h-full shadow-md rounded-lg">
          <CardBody className="space-y-4">
            <Typography variant="h6" className="font-semibold text-gray-800">
              Recommended Learning Paths
            </Typography>
            <div className="flex flex-col gap-3">
              {recommendedLearningPaths.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  {loading
                    ? "Loading recommended learning paths..."
                    : "Couldn't recommend learning paths."}
                </p>
              ) : (
                recommendedLearningPaths.map((item) => (
                  <LearningLPCard
                    key={item.id}
                    learningItem={item}
                    className="p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                  />
                ))
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default ModuleDetails;
