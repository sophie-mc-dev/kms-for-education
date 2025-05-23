import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  CardBody,
  Typography,
  Button,
  Progress,
} from "@material-tailwind/react";
import { ModuleCard } from "@/widgets/cards";
import { useUser } from "@/context/UserContext";
import { ResourceCard } from "@/widgets/cards";

export function LearningPathDetails() {
  const { userId } = useUser();
  const { userRole } = useUser();
  const { learningPathId } = useParams();
  const [learningPath, setLearningPath] = useState(null);
  const [modules, setModules] = useState([]);
  const [userProgress, setUserProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recommendedResources, setRecommendedResources] = useState([]);

  const completion = Number(userProgress?.progress_percentage) || 0;

  // Fetch learning path data
  useEffect(() => {
    const fetchLearningPath = async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/api/learning-paths/${learningPathId}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch learning path");
        }
        const data = await response.json();
        setLearningPath(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLearningPath();
  }, []);

  // Fetch modules data
  useEffect(() => {
    const fetchModules = async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/api/learning-paths/${learningPathId}/modules`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch modules");
        }
        const data = await response.json();
        setModules(data);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchModules();
  }, []);

  // Fetch user progress (only for students)
  useEffect(() => {
    const fetchUserProgress = async () => {
      if (!learningPathId || !userId || userRole === "educator") {
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:8080/api/learning-paths/${learningPathId}/progress/${userId}`
        );

        if (response.status === 404) {
          setUserProgress({ status: "not_started", completed_modules: [] });
          return;
        }

        const data = await response.json();
        setUserProgress(data);
      } catch (err) {
        console.error("Error fetching progress:", err.message);
      }
    };

    fetchUserProgress();
  }, [learningPathId, userId, userRole]);

  const refreshUserProgress = async () => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/learning-paths/${learningPathId}/progress/${userId}`
      );
      if (!response.ok) throw new Error("Failed to fetch user progress");
      const data = await response.json();
      setUserProgress(data);
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle the Start Learning Path button click
  const handleStartLearningPath = async () => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/learning-paths/${learningPathId}/start`,
        {
          method: "POST",
          body: JSON.stringify({
            user_id: userId,
            learning_path_id: learningPathId,
          }),
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );
      if (!response.ok) throw new Error("Failed to start learning path");

      // const data = await response.json();
      // setUserProgress(data);

      await refreshUserProgress();
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    const fetchRecommendedLearningPaths = async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/api/recommendations/${userId}/learning-paths/${learningPathId}/resources`
        );
        const data = await response.json();
        setRecommendedResources(data);
      } catch (error) {
        console.error("Error fetching recommended resources:", error);
      }
    };
    fetchRecommendedLearningPaths();
  }, []);

  const isLearningPathStarted =
    userProgress && userProgress.status === "in_progress";

  const isLearningPathCompleted =
    userProgress && userProgress.status === "completed";

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!learningPath) return <div>No Learning Path Data</div>;

  return (
    <div className="mt-12 flex gap-4 min-h-screen">
      {/* Left Main Column */}
      <div className="w-3/4 flex flex-col gap-4">
        <Card className="border border-blue-100 shadow-blue-100 shadow-sm p-4 flex-1 h-full">
          {" "}
          <CardBody className="flex-1 overflow-auto">
            <div className="flex items-center justify-between">
              <Typography
                variant="h4"
                color="blue-gray"
                className="font-semibold"
              >
                {learningPath.title}
              </Typography>
              <Button
                onClick={handleStartLearningPath}
                disabled={isLearningPathStarted || isLearningPathCompleted}
                className={`${
                  isLearningPathCompleted ? "bg-green-500" : "bg-blue-500"
                }`}
              >
                {isLearningPathCompleted
                  ? "Learning Path Completed"
                  : isLearningPathStarted
                  ? "Learning Path Started"
                  : "Start Learning Path"}
              </Button>
            </div>

            <div className="mt-4 flex items-center gap-x-6">
              {learningPath.estimated_duration && (
                <div className="flex items-center gap-x-2">
                  <Typography className="text-xs font-semibold uppercase text-blue-gray-500">
                    Estimated Duration:
                  </Typography>
                  <Typography variant="small" className="text-blue-gray-600">
                    {learningPath.estimated_duration} minutes
                  </Typography>
                </div>
              )}
            </div>

            <div className="mb-6 font-normal text-blue-gray-500 text-sm">
              <Typography variant="h6" color="blue-gray">
                Summary
              </Typography>
              <div
                className="
                  [&_ol]:list-decimal [&_ul]:list-disc 
                  [&_li]:ml-4
                  [&_ol_ol]:list-decimal [&_ul_ul]:list-disc 
                  [&_ol_ol]:ml-2 [&_ul_ul]:ml-4 
                  mt-2 text-blue-gray-500 text-sm
                "
                dangerouslySetInnerHTML={{ __html: learningPath.objectives }}
              ></div>
            </div>
            <div className="mb-6 font-normal text-blue-gray-500 text-sm">
              <Typography variant="h6" color="blue-gray">
                Objectives
              </Typography>
              <div
                className="
                  [&_ol]:list-decimal [&_ul]:list-disc 
                  [&_li]:ml-4
                  [&_ol_ol]:list-decimal [&_ul_ul]:list-disc 
                  [&_ol_ol]:ml-2 [&_ul_ul]:ml-4 
                  mt-2 text-blue-gray-500 text-sm
                "
                dangerouslySetInnerHTML={{ __html: learningPath.objectives }}
              ></div>
            </div>

            {/* Progress Bar Section */}
            {userProgress && (
              <div className="mt-4">
                <Typography className="text-xs font-semibold uppercase text-blue-gray-500">
                  Progress: {completion}%
                </Typography>
                <Progress
                  value={completion}
                  variant="gradient"
                  color={completion === 100 ? "green" : "blue"}
                  className="h-1"
                />
              </div>
            )}

            <div className="border-t my-4"></div>

            <Typography
              variant="h5"
              color="blue-gray"
              className="font-semibold mb-2"
            >
              Modules
            </Typography>

            <div className="flex flex-col gap-2">
              {modules.map((module, index) => (
                <ModuleCard
                  key={module.id}
                  userId={userId}
                  module={module}
                  learningPathId={learningPathId}
                  isUnlocked={
                    (isLearningPathStarted || isLearningPathCompleted) &&
                    (index === 0 ||
                      userProgress?.completed_module_ids?.includes(
                        modules[index - 1]?.id
                      ))
                  }
                  isPassed={userProgress?.completed_module_ids?.includes(
                    module.id
                  )}
                  index={index}
                  refreshUserProgress={refreshUserProgress}
                />
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Right Sidebar */}
      <div className="w-1/4">
        <Card className="border border-blue-gray-100 p-4 h-full shadow-md rounded-lg">
          <CardBody className="space-y-4">
            <Typography variant="h6" className="font-semibold text-gray-800">
              Expand Your Knowledge
            </Typography>
            <div className="flex flex-col gap-3">
              {recommendedResources.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  {loading
                    ? "Loading recommended learning paths..."
                    : "Couldn't recommend learning paths."}
                </p>
              ) : (
                recommendedResources.map((item) => (
                  <ResourceCard
                    key={item.id}
                    resource={item}
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

export default LearningPathDetails;
