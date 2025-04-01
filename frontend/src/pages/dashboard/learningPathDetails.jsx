import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardBody, Typography, Button } from "@material-tailwind/react";
import { ModuleCard } from "@/widgets/cards";
import { useUser } from "@/context/UserContext";

export function LearningPathDetails() {
  const { userId } = useUser();
  const { userRole } = useUser();
  const { learningPathId } = useParams();
  const [learningPath, setLearningPath] = useState(null);
  const [modules, setModules] = useState([]);
  const [userProgress, setUserProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cleanedLearningPathId = learningPathId.replace("lp_", "");

  // Fetch learning path data
  useEffect(() => {
    const fetchLearningPath = async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/api/learning-paths/${cleanedLearningPathId}`
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
          `http://localhost:8080/api/learning-paths/${cleanedLearningPathId}/modules`
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
      console.log("Learning Path ID:", cleanedLearningPathId);
      console.log("User ID:", userId);

      if (!cleanedLearningPathId || !userId || userRole === "educator") {
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:8080/api/learning-paths/${cleanedLearningPathId}/progress/${userId}`
        );
        if (!response.ok) throw new Error("Failed to fetch user progress");
        const data = await response.json();
        console.log("Fetched data:", data);
        setUserProgress(data);
      } catch (err) {
        console.error("Error fetching progress:", err.message);
      }
    };

    fetchUserProgress();
  }, [cleanedLearningPathId, userId, userRole]);

  const refreshUserProgress = async () => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/learning-paths/${cleanedLearningPathId}/progress/${userId}`
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
        `http://localhost:8080/api/learning-paths/${cleanedLearningPathId}/start`,
        {
          method: "POST",
          body: JSON.stringify({
            user_id: userId,
            learning_path_id: cleanedLearningPathId,
          }),
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      );
      if (!response.ok) throw new Error("Failed to start learning path");

      const data = await response.json();
      setUserProgress(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const isLearningPathStarted =
    userProgress && userProgress.status === "in_progress";

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!learningPath) return <div>No Learning Path Data</div>;

  return (
    <div className="mt-12 flex gap-4 h-full">
      <Card className="w-screen h-screen border border-blue-gray-100 shadow-sm p-6 flex flex-col relative">
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
              disabled={isLearningPathStarted}
            >
              {isLearningPathStarted
                ? "Learning Path Started"
                : "Start Learning Path"}
            </Button>
          </div>

          <div className="mt-4 flex items-center gap-x-6">
            <div className="flex items-center gap-x-2">
              <Typography className="text-xs font-semibold uppercase text-blue-gray-500">
                Estimated Duration:
              </Typography>
              <Typography variant="small" className="text-blue-gray-600">
                {learningPath.estimated_duration} minutes
              </Typography>
            </div>
            <div className="flex items-center gap-x-2">
              <Typography className="text-xs font-semibold uppercase text-blue-gray-500">
                ECTS:
              </Typography>
              <Typography variant="small" className="text-blue-gray-600">
                {learningPath.ects}
              </Typography>
            </div>
          </div>

          <Typography className="mt-2 text-blue-gray-700">
            {learningPath.summary}
          </Typography>

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
                learningPathId={learningPathId}
                module={module}
                isUnlocked={
                  isLearningPathStarted &&
                  (index === 0 ||
                    userProgress?.completed_modules?.includes(
                      modules[index - 1]?.id
                    ))
                }
                isPassed={userProgress?.completed_modules?.includes(module.id)}
                isCurrent={userProgress?.current_module === module.id}
                index={index}
              />
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default LearningPathDetails;
