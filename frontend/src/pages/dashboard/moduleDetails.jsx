import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardBody,
  Typography,
  Button,
  Spinner,
} from "@material-tailwind/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import { ResourceCard } from "@/widgets/cards/";

export function ModuleDetails() {
  const { moduleId } = useParams();
  const [module, setModule] = useState(null);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const cleanedModuleId = moduleId.replace("md_", "");

  // Fetch module data
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

  // Fetch modules data
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
  }, []); // Fetch resources when the component mounts

  // Handle loading and error states
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
      {/* Left Section: Module Content */}
      <Card className="border border-blue-gray-100 shadow-sm p-4 flex-1 min-h-full flex flex-col">
        <CardBody className="flex-grow">
          <Typography variant="h4" color="blue-gray" className="font-semibold">
            {module.title}
          </Typography>

          <div className="mt-4 flex items-center gap-x-6">
            <div className="flex items-center gap-x-2">
              <Typography className="text-xs font-semibold uppercase text-blue-gray-500">
                Estimated Duration:
              </Typography>
              <Typography variant="small" className="text-blue-gray-600">
                {module.estimated_duration} min
              </Typography>
            </div>
          </div>

          <Typography className="mt-2 text-blue-gray-700">
            {module.description}
          </Typography>

          {/* Divider */}
          <div className="border-t my-4"></div>

          {/* Resources Section */}
          <div className="mt-6">
            <Typography variant="h6" color="blue-gray" className="mb-3">
              Resources
            </Typography>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {resources && resources.length > 0 ? (
                resources.map((resource) => (
                  <ResourceCard key={resource.id} resource={resource} />
                ))
              ) : (
                <Typography className="text-blue-gray-600">
                  No resources available for this module.
                </Typography>
              )}
            </div>
          </div>
        </CardBody>

        {/* Navigation Buttons at the bottom */}
        <div className="flex justify-center gap-4 mt-auto mb-6">
          <Button
            variant="outlined"
            color="blue"
            onClick={() =>
              navigate(`/modules/md_${parseInt(cleanedModuleId) - 1}`)
            }
            disabled={parseInt(cleanedModuleId) <= 1}
            className="flex items-center px-6 py-3 text-sm font-medium border-2 border-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-colors duration-300 disabled:opacity-50"
          >
            <ChevronLeftIcon className="h-5 w-5 mr-2" />
            Previous
          </Button>
          <Button
            variant="outlined"
            color="blue"
            onClick={() =>
              navigate(`/modules/md_${parseInt(cleanedModuleId) + 1}`)
            }
            disabled={parseInt(cleanedModuleId) >= module.totalModules}
            className="flex items-center px-6 py-3 text-sm font-medium border-2 border-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-colors duration-300 disabled:opacity-50"
          >
            Next
            <ChevronRightIcon className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </Card>

      {/* Right Sidebar: Learning Path Progress */}
      <Card className="w-80 border border-blue-gray-100 shadow-sm">
        <CardBody>
          hey
        </CardBody>
      </Card>
    </div>
  );
}

export default ModuleDetails;
