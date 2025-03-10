import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardBody, Typography } from "@material-tailwind/react";
import { ModuleCard } from "@/widgets/cards";

export function LearningPathDetails() {
  const { learningPathId } = useParams();
  const [learningPath, setLearningPath] = useState(null);
  const [modules, setModules] = useState([]);
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
// Fetch modules data after updating the order
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
      console.log(data)
      setModules(data);  // Update state with newly ordered modules

      // After fetching, update the module order index in the backend
      await updateModuleOrderIndex(cleanedLearningPathId);
      setModules(data);
      console.log(data)
    } catch (err) {
      setError(err.message);
    }
  };

  fetchModules();
}, []); // Ensure this is called only once

  // Function to update the module order index in the backend
  const updateModuleOrderIndex = async (learningPathId) => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/learning-paths/${learningPathId}/modules/order`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log("success"); // Success message
      } else {
        const errorData = await response.json();
        console.error("error"); // Error message
      }
    } catch (error) {
      console.error("Error updating module order:", error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  if (!learningPath) return <div>No Learning Path Data</div>;

  return (
    <div className="mt-12 flex gap-4 h-full">
      <Card className="w-screen h-screen border border-blue-gray-100 shadow-sm p-6 flex flex-col">
        <CardBody className="flex-1 overflow-auto">
          {/* Learning Path Title & Details */}
          <Typography variant="h4" color="blue-gray" className="font-semibold">
            {learningPath.title}
          </Typography>

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
            {learningPath.description}
          </Typography>

          {/* Divider */}
          <div className="border-t my-4"></div>

          {/* Modules List */}
          <Typography
            variant="h5"
            color="blue-gray"
            className="font-semibold mb-2"
          >
            Modules
          </Typography>

          <div className="flex flex-col gap-2">
            {modules.map((module, index) => (
              <ModuleCard key={module.id} module={module} index={index} />
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default LearningPathDetails;
