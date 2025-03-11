import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Button,
  Input,
  Select,
  Typography,
  Option,
} from "@material-tailwind/react";

import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { ModuleCard } from "@/widgets/cards";

import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

export function CreateStudentLearningPath() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [errors, setErrors] = useState({});

  const [searchQuery, setSearchQuery] = useState("");
  const [modules, setModules] = useState([]);
  const [selectedModules, setSelectedModules] = useState([]);
  const [searchOpen, setSearchOpen] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/modules");
        const data = await response.json();
        setModules(data);
      } catch (error) {
        console.error("Error fetching modules:", error);
        setErrorMessage("Error fetching modules");
      }
    };
    fetchModules();
  }, []);

  // Filtered modules based on search query
  const filteredModules = modules.filter((module) =>
    module.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Add module to selected list
  const addModule = (module) => {
    if (!selectedModules.some((m) => m.id === module.id)) {
      setSelectedModules([...selectedModules, module]);
    }
  };

  // Remove module from selected list
  const removeModule = (id) => {
    setSelectedModules(selectedModules.filter((module) => module.id !== id));
  };

  const moveModule = (fromIndex, toIndex) => {
    const updatedModules = [...selectedModules];
    const [movedModule] = updatedModules.splice(fromIndex, 1);
    updatedModules.splice(toIndex, 0, movedModule);
    setSelectedModules(updatedModules);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const learningPathData = {
      title,
      description,
      modules: selectedModules,
    };

    fetch("http://localhost:8080/api/learning-paths", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(learningPathData),
    })
      .then((response) => response.json())
      .then((data) => {
        setIsSubmitting(false);
        setSuccessMessage("Learning path created successfully");
        navigate("/learning-paths");
      })
      .catch((error) => {
        setIsSubmitting(false);
        setErrorMessage("Error creating learning path");
      });
  };

  return (
    <div className="mt-12 flex justify-center">
      <Card className="w-full h-full border border-gray-300 shadow-md rounded-lg">
        <CardHeader
          floated={false}
          shadow={false}
          color="transparent"
          className="m-0 flex items-center justify-between p-6"
        >
          <Typography variant="h6" color="blue-gray">
            Create Learning Path
          </Typography>
        </CardHeader>

        <CardBody className="p-6">
          <form onSubmit={handleSubmit}>
            {/* Title */}
            <div className="mb-4">
              <Input
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            {/* Description */}
            <div className="mb-4">
              <ReactQuill
                value={description}
                onChange={setDescription}
                placeholder="Describe the learning path content here"
              />
            </div>

            {/* Search Modules Input */}
            <div className="mb-4 relative">
              <Input
                label="Search Modules"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchOpen(true)}
                onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
              />
              {searchOpen && (
                <div className="absolute z-10 mt-2 w-full bg-white border rounded-lg shadow-lg p-4 max-h-60 overflow-auto">
                  {filteredModules.length > 0 ? (
                    filteredModules.map((module) => (
                      <div key={module.id} className="mb-2">
                        <ModuleCard
                          module={module}
                          addModule={addModule}
                          isSelected={selectedModules.some((m) => m.id === module.id)}
                        />
                      </div>
                    ))
                  ) : (
                    <Typography className="text-gray-500">No modules found.</Typography>
                  )}
                </div>
              )}
            </div>

            {/* Selected Modules */}
            <div className="mb-4">
              <Typography className="text-xs font-semibold uppercase text-blue-gray-500">
                Selected Modules
              </Typography>
              {selectedModules.length === 0 ? (
                <Typography className="text-gray-500">No modules selected.</Typography>
              ) : (
                <div className="grid gap-4">
                  {selectedModules.map((module) => (
                    <ModuleCard
                      key={module.id}
                      module={module}
                      removeModule={() => removeModule(module.id)}
                      isSelected={true}
                    />
                  ))}
                </div>
              )}
            </div>
          </form>
        </CardBody>

        <CardFooter className="flex flex-col items-center gap-4 p-6">
          <div className="flex gap-4">
            <Button
              variant="text"
              onClick={() => navigate("/dashboard/learning")}
            >
              Cancel
            </Button>
            <Button
              variant="filled"
              onClick={handleSubmit}
              className="flex items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                "Submit"
              )}
            </Button>
          </div>

          {successMessage && (
            <div className="text-green-600 text-center">{successMessage}</div>
          )}
          {errorMessage && (
            <div className="text-red-600 text-center">{errorMessage}</div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

export default CreateStudentLearningPath;
