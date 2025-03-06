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

import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useUser } from "@/context/userContext";

export function CreateLearningPath() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [ects, setEcts] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [modules, setModules] = useState([]); 
  const [selectedModules, setSelectedModules] = useState([]); 

  const navigate = useNavigate();

  // TODO: ADD MODULES OPTION

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

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const learningPathData = {
      title,
      description,
      visibility,
      estimatedDuration,
      ects,
      content,
      modules: selectedModules, 
    };

    fetch("/api/learning-paths", {
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
            New Learning Path
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
                value={content}
                onChange={setContent}
                placeholder="Describe the learning path content here"
              />
            </div>

            {/* Visibility */}
            <div className="mb-4">
              <Select
                label="Visibility"
                value={visibility}
                onChange={(e) => setVisibility(e)}
                required
              >
                <Option value="public">Public</Option>
                <Option value="private">Private</Option>
              </Select>
            </div>

            {/* Estimated Duration */}
            <div className="flex gap-4">
              <div className="mb-4 flex-1">
                <Input
                  label="Estimated Duration (in minutes)"
                  value={estimatedDuration}
                  onChange={(e) => setEstimatedDuration(e.target.value)}
                  type="number"
                  required
                />
              </div>

              {/* ECTS */}
              <div className="mb-4 flex-1">
                <Input
                  label="ECTS"
                  value={ects}
                  onChange={(e) => setEcts(e.target.value)}
                  type="number"
                  required
                />
              </div>
            </div>

            {/* Modules (Multi-Select) */}
            <div className="mb-4">
              <Select
                label="Select Modules"
                multiple
                value={selectedModules}
                onChange={(e) => setSelectedModules(e)}
                required
              >
                {modules.map((module) => (
                  <Option key={module.id} value={module.id}>
                    {module.title}
                  </Option>
                ))}
              </Select>
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

export default CreateLearningPath;
