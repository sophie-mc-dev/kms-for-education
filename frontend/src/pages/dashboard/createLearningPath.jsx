import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Button,
  Input,
  Typography,
  Radio,
} from "@material-tailwind/react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { LearningMDCard } from "@/widgets/cards";
import { DragDropContext, Draggable } from "react-beautiful-dnd";
import { StrictModeDroppable as Droppable } from "@/helpers/StrictModeDroppable";
import { useUser } from "@/context/UserContext";
import Select from "react-select";
import { resourceCategories } from "@/data/resource-categories";

export function CreateLearningPath() {
  const { userId } = useUser();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [objectives, setObjectives] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState("");
  const [modules, setModules] = useState([]);
  const [selectedModules, setSelectedModules] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [recommendedModules, setRecommendedModules] = useState([]);
  const [activeTab, setActiveTab] = useState("recommended");
  const modulesToShow = activeTab === "recommended" ? [] : modules;

  const navigate = useNavigate();

  const difficultyLevels = [
    { value: "Beginner", label: "Beginner" },
    { value: "Intermediate", label: "Intermediate" },
    { value: "Advanced", label: "Advanced" },
  ];

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const modulesWithOrder = selectedModules.map((module, index) => ({
      module_id: module.id,
      module_order: index,
    }));

    const learningPathData = {
      title,
      summary,
      visibility,
      estimatedDuration: parseInt(estimatedDuration, 10),
      modules: modulesWithOrder,
      user_id: userId,
      objectives: objectives,
      difficulty_level: difficultyLevel,
    };

    console.log("Submitting Learning Path Data:", learningPathData);

    try {
      const response = await fetch("http://localhost:8080/api/learning-paths", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(learningPathData),
      });

      if (response.ok) {
        navigate("/learning-paths");
      } else {
        console.error("Error saving learning path:", await response.text());
      }
    } catch (error) {
      console.error("Failed to save:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModuleToggle = (module) => {
    setSelectedModules(
      (prevSelected) =>
        prevSelected.some((mod) => mod.id === module.id)
          ? prevSelected.filter((mod) => mod.id !== module.id) // Remove if exists
          : [...prevSelected, module] // Add if not selected
    );
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    console.log(
      "Dragging from:",
      result.source.index,
      "to:",
      result.destination.index
    );

    const updatedModules = Array.from(selectedModules);
    const [movedItem] = updatedModules.splice(result.source.index, 1);
    updatedModules.splice(result.destination.index, 0, movedItem);

    // Save new order in state
    setSelectedModules(updatedModules);

    console.log(
      "Updated order:",
      updatedModules.map((mod, index) => ({ id: mod.id, order: index }))
    );
  };

  const handleNextStep = async () => {
    if (step === 1) {
      try {
        const response = await fetch(
          "http://localhost:8080/api/recommendations/modules",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(learningPathData),
          }
        );

        if (response.ok) {
          console.log("Learning path data saved successfully");
          setStep(step + 1);
        } else {
          console.error("Error saving learning path:", await response.text());
        }
      } catch (error) {
        console.error("Failed to save:", error);
      }
    } else {
      setStep(step + 1);
    }
  };

  return (
    <div className="mt-12 flex justify-center">
      <Card className="w-full h-full border border-gray-300 rounded-lg">
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
                value={summary}
                onChange={setSummary}
                placeholder="Overview of the learning paths"
              />
              <ReactQuill
                value={objectives}
                onChange={setObjectives}
                placeholder="Describe the learning path objectives"
              />
              <div className="flex gap-4">
                <Input
                  label="Estimated Duration (min)"
                  type="number"
                  value={estimatedDuration}
                  onChange={(e) => setEstimatedDuration(e.target.value)}
                  required
                />
              </div>

              <div className="flex-1">
                <Typography className="text-xs font-semibold uppercase text-blue-gray-500">
                  Difficulty Level:
                </Typography>
                <Select
                  name="difficulty"
                  value={difficultyLevels.find(
                    (d) => d.value === difficultyLevel
                  )}
                  onChange={(selectedOption) =>
                    setDifficultyLevel(selectedOption.value)
                  }
                  options={difficultyLevels}
                  placeholder="Select difficulty level"
                  className="basic-single-select"
                  classNamePrefix="select"
                />
              </div>

              <div className="flex-1">
                <Typography className="text-xs font-semibold uppercase text-blue-gray-500">
                  Categories:
                </Typography>
                <Select
                  name="categories"
                  value={selectedCategories}
                  onChange={(selected) => setSelectedCategories(selected)}
                  options={resourceCategories}
                  isMulti
                  className="basic-multi-select"
                  classNamePrefix="select"
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

              {/* Side-by-side layout: Modules (left) + Selected Modules (right) */}
              <div className="flex gap-6">
                <div className="flex-1">
                  {/* TABS */}
                  <div className="flex gap-4 border-b border-gray-200">
                    <button
                      onClick={() => setActiveTab("recommended")}
                      className={`pb-2 text-sm font-medium border-b-2  ${
                        activeTab === "recommended"
                          ? "border-blue-600 text-blue-600"
                          : "border-transparent text-gray-500 "
                      }`}
                    >
                      Recommended Modules
                    </button>
                    <button
                      onClick={() => setActiveTab("all")}
                      className={`pb-2 text-sm font-medium border-b-2 ${
                        activeTab === "all"
                          ? "border-blue-600 text-blue-600"
                          : "border-transparent text-gray-500"
                      }`}
                    >
                      All Modules
                    </button>
                  </div>

                  {/* Filtered Modules Grid */}
                  <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4 mt-4 w-full">
                    {modulesToShow
                      .filter((mod) =>
                        mod.title
                          .toLowerCase()
                          .includes(searchTerm.toLowerCase())
                      )
                      .map((module) => {
                        const isSelected = selectedModules.some(
                          (mod) => mod.id === module.id
                        );

                        return (
                          <div
                            key={module.id}
                            className="p-2 bg-white rounded grid items-center"
                          >
                            <LearningMDCard moduleItem={module} />

                            {isSelected ? (
                              <Button
                                color="gray"
                                size="sm"
                                className="mt-2"
                                disabled
                              >
                                Added
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
                </div>

                {/* Selected Modules Section (visible even if no modules are selected) */}
                <div className="w-[320px] min-w-[320px]">
                  <div className="border-b border-gray-200 mb-4">
                    <Typography
                      variant="h6"
                      color="gray"
                      className="pb-2 text-gray-500 text-sm font-medium"
                    >
                      Selected Modules
                    </Typography>
                  </div>

                  {/* Display even if no modules are selected */}
                  <div
                    className={selectedModules.length === 0 ? "opacity-50" : ""}
                  >
                    <DragDropContext onDragEnd={handleDragEnd}>
                      <Droppable
                        droppableId="modules-list"
                        direction="vertical"
                      >
                        {(provided) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="space-y-4"
                          >
                            {selectedModules.map((module, index) => (
                              <Draggable
                                key={module.id}
                                draggableId={String(module.id)}
                                index={index}
                              >
                                {(provided) => (
                                  <div
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    ref={provided.innerRef}
                                    className="bg-white p-2 rounded"
                                  >
                                    <LearningMDCard moduleItem={module} />
                                    <Button
                                      color="red"
                                      size="sm"
                                      className="mt-2 w-full"
                                      onClick={() => handleModuleToggle(module)}
                                    >
                                      Remove
                                    </Button>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </div>
                </div>
              </div>
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
