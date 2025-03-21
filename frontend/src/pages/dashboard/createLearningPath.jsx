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
  Radio,
} from "@material-tailwind/react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { LearningMDCard } from "@/widgets/cards";

export function CreateLearningPath() {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [ects, setEcts] = useState("");
  const [modules, setModules] = useState([]);
  const [selectedModules, setSelectedModules] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchModules = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/modules");
        const data = await response.json();
        setModules(data);
      } catch (error) {
        console.error("Error fetching modules:", error);
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
      modules: selectedModules,
    };

    fetch("/api/learning-paths", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(learningPathData),
    })
      .then((response) => response.json())
      .then(() => {
        setIsSubmitting(false);
        navigate("/learning-paths");
      })
      .catch(() => setIsSubmitting(false));
  };

  const handleModuleToggle = (module) => {
    setSelectedModules(
      (prevSelected) =>
        prevSelected.some((mod) => mod.id === module.id)
          ? prevSelected.filter((mod) => mod.id !== module.id) // Remove if exists
          : [...prevSelected, module] // Add if not selected
    );
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
            {step === 1 ? "Learning Path Details" : "Add Modules"}
          </Typography>
        </CardHeader>

        <CardBody className="p-6">
          {step === 1 && (
            <div className="space-y-6">
              <Input
                label="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <ReactQuill
                value={description}
                onChange={setDescription}
                placeholder="Describe the learning path"
              />
              <div className="flex gap-4">
                <Input
                  label="Estimated Duration (min)"
                  type="number"
                  value={estimatedDuration}
                  onChange={(e) => setEstimatedDuration(e.target.value)}
                  required
                />
                <Input
                  label="ECTS"
                  type="number"
                  value={ects}
                  onChange={(e) => setEcts(e.target.value)}
                  required
                />
              </div>
              <div>
                <Typography className="text-xs font-semibold uppercase text-blue-gray-500">
                  Visibility:
                </Typography>
                <div className="flex gap-4">
                  <Radio
                    name="visibility"
                    value="public"
                    checked={visibility === "public"}
                    onChange={() => setVisibility("public")}
                    label="Public"
                  />
                  <Radio
                    name="visibility"
                    value="private"
                    checked={visibility === "private"}
                    onChange={() => setVisibility("private")}
                    label="Private"
                  />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {/* Searchable Input */}
              <Input
                label="Search Modules"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              {/* Filtered Modules in Grid Layout */}
              <div className="grid grid-cols-4 gap-4">
                {modules
                  .filter((mod) =>
                    mod.title.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((module) => {
                    const isSelected = selectedModules.some(
                      (mod) => mod.id === module.id
                    );

                    return (
                      <div
                        key={module.id}
                        className=" p-2 bg-white grid items-center"
                      >
                        <LearningMDCard moduleItem={module} />

                        {/* Add / Remove Button */}
                        {isSelected ? (
                          <Button
                            color="red"
                            size="sm"
                            className="mt-2"
                            onClick={() => handleModuleToggle(module)}
                          >
                            Remove
                          </Button>
                        ) : (
                          <Button
                            color="blue"
                            size="sm"
                            className="mt-2"
                            onClick={() => handleModuleToggle(module)}
                          >
                            Add
                          </Button>
                        )}
                      </div>
                    );
                  })}
              </div>

              {/* Display Selected Modules */}
              {selectedModules.length > 0 && (
                <div className="mt-6">
                  <Typography variant="h6" color="blue-gray">
                    Selected Modules:
                  </Typography>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
                    {selectedModules.map((module) => (
                      <div key={module.id} className="relative">
                        <LearningMDCard moduleItem={module} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardBody>

        <CardFooter className="flex justify-center p-6">
          {step > 1 && (
            <Button variant="text" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
          {step < 2 ? (
            <Button variant="filled" onClick={() => setStep(step + 1)}>
              Next
            </Button>
          ) : (
            <Button
              variant="filled"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

export default CreateLearningPath;
