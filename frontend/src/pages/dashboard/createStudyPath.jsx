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
} from "@material-tailwind/react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { LearningMDCard } from "@/widgets/cards";
import { DragDropContext, Draggable } from "react-beautiful-dnd";
import { StrictModeDroppable as Droppable } from "@/helpers/StrictModeDroppable";
import { useUser } from "@/context/UserContext";

export function CreateStudyPath() {
  const { userId } = useUser();
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [objectives, setObjectives] = useState("");
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
      modules: modulesWithOrder,
      user_id: userId,
      objectives: objectives,
    };

    console.log("Submitting Learning Path Data:", learningPathData);

    try {
      const response = await fetch("http://localhost:8080/api/learning-paths/study-path", {
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
          ? prevSelected.filter((mod) => mod.id !== module.id) 
          : [...prevSelected, module] 
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
                value={summary}
                onChange={setSummary}
                placeholder="Overview of the learning paths"
              />
              <ReactQuill
                value={objectives}
                onChange={setObjectives}
                placeholder="Describe the learning path objectives"
              />
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

              {/* Display Selected Modules */}
              {selectedModules.length > 0 && (
                <div className="mt-6">
                  <Typography variant="h6" color="blue-gray">
                    Selected Modules:
                  </Typography>

                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable
                      droppableId="modules-list"
                      direction="horizontal"
                    >
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          // grid aspect is here:
                          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2"
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
                                  className="relative bg-white p-2"
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

export default CreateStudyPath;
