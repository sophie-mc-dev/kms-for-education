import { ResourceCard } from "@/widgets/cards";
import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Typography,
  Radio,
  Popover,
  PopoverHandler,
  PopoverContent,
  CardFooter,
} from "@material-tailwind/react";
import { DragDropContext, Draggable } from "react-beautiful-dnd";
import { StrictModeDroppable as Droppable } from "@/helpers/StrictModeDroppable";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useUser } from "@/context/userContext";
import { useNavigate } from "react-router-dom";
import { resourceCategories } from "@/data/resource-categories";
import Select from "react-select";

export function CreateModule() {
  const { userId } = useUser();

  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [objectives, setObjectives] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [resources, setResources] = useState([]);
  const [selectedResources, setSelectedResources] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [recommendedResources, setRecommendedResources] = useState([]);
  const [activeTab, setActiveTab] = useState("recommended");
  const resourcesToShow =
    activeTab === "recommended" ? recommendedResources : resources;

  const [searchTerm, setSearchTerm] = useState("");
  const [questions, setQuestions] = useState(
    Array.from({ length: 3 }, () => ({
      question_text: "",
      options: ["", "", "", ""],
      correct_answer: null,
    }))
  );
  const [passingPercentage, setPassingPercentage] = useState(70);
  const [questionCount, setQuestionCount] = useState(3);
  const navigate = useNavigate();

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/resources");
      const data = await response.json();
      setResources(data);
    } catch (error) {
      console.error("Error fetching resources:", error);
    }
  };

  const fetchRecommendedResources = async () => {
    try {
      const response = await fetch(
        "http://localhost:8080/api/recommendations/resources",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            categories: selectedCategories.map((cat) => cat.label),
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const cleaned = data.map((res) => ({
          ...res,
          id: parseInt(res.id, 10),
        }));
        setRecommendedResources(cleaned);
        setStep(2);
      } else {
        console.error(
          "Error fetching recommended resources:",
          await response.text()
        );
      }
    } catch (error) {
      console.error("Error fetching recommended resources:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const resourcesWithOrder = selectedResources.map((resource, index) => ({
      resource_id: resource.id,
      resource_order: index,
    }));

    const moduleData = {
      title,
      summary,
      objectives,
      assessment: {
        passing_percentage: passingPercentage,
        questions: questions.map((q) => q.question_text),
        answers: questions.map((q) => q.options),
        solution: questions.map((q) => q.correct_answer),
      },
      resources: resourcesWithOrder,
    };

    try {
      const response = await fetch("http://localhost:8080/api/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(moduleData),
      });

      if (response.ok) navigate("/learning");
      else alert("Error creating module");
    } catch (error) {
      console.error(error);
      alert("Error creating module");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResourceToggle = (resource) => {
    setSelectedResources((prevSelected) =>
      prevSelected.some((res) => res.id === resource.id)
        ? prevSelected.filter((res) => res.id !== resource.id)
        : [...prevSelected, resource]
    );
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const updatedResources = Array.from(selectedResources);
    const [movedItem] = updatedResources.splice(result.source.index, 1);
    updatedResources.splice(result.destination.index, 0, movedItem);

    setSelectedResources(updatedResources);
  };

  const handleQuestionCountChange = (event) => {
    const count = parseInt(event.target.value);
    if (count <= 20 && count >= 1) {
      setQuestionCount(count);
      setQuestions((prevQuestions) => {
        const newQuestions = [...prevQuestions];

        if (count > newQuestions.length) {
          const additional = Array.from(
            { length: count - newQuestions.length },
            () => ({
              question_text: "",
              options: ["", "", "", ""],
              correct_answer: null,
            })
          );
          return [...newQuestions, ...additional];
        } else {
          return newQuestions.slice(0, count);
        }
      });
    }
  };

  const handleExportQuestions = (type) => {
    if (type === "xml") {
      // Convert questions to XML format
      const xmlData = `
      <quiz>
        ${questions
          .map((q) => {
            // Ensure correct_answer is treated as an array
            const correctAnswer = Array.isArray(q.correct_answer)
              ? q.correct_answer
              : [q.correct_answer];

            return `
          <question>
            <question_text>${q.question_text}</question_text>
            <answers>
              ${q.options
                .map(
                  (opt, index) => `<answer index="${index + 1}">${opt}</answer>`
                )
                .join("")}
            </answers>
            <solution>${correctAnswer.join(",")}</solution>
          </question>`;
          })
          .join("")}
      </quiz>
      `;
      const blob = new Blob([xmlData], { type: "application/xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "quiz.xml";
      a.click();
      URL.revokeObjectURL(url);
    } else if (type === "json") {
      const jsonData = JSON.stringify(questions, null, 2);
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "quiz.json";
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const handleImportQuestions = (event, type) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();

      reader.onload = (e) => {
        if (
          type === "xml" &&
          (file.type === "application/xml" || file.type === "text/xml")
        ) {
          const xmlData = e.target.result;

          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(xmlData, "text/xml");

          const questionsXml = xmlDoc.getElementsByTagName("question");

          const newQuestions = Array.from(questionsXml).map((question) => {
            const question_text =
              question.getElementsByTagName("question_text")[0]?.textContent;
            const options = Array.from(
              question.getElementsByTagName("answer")
            ).map((opt) => opt.textContent);
            const correct_answer = parseInt(
              question.getElementsByTagName("solution")[0]?.textContent
            );

            return {
              question_text,
              options,
              correct_answer,
            };
          });

          setQuestions(newQuestions);
        } else if (type === "json" && file.type === "application/json") {
          const jsonData = JSON.parse(e.target.result);
          setQuestions(jsonData);
        }
      };

      reader.readAsText(file);
    }
  };

  const canGoToNextStep = () => {
    if (step === 1) {
      return (
        title.trim() !== "" && summary.trim() !== "" && objectives.trim() !== ""
      );
    }
    if (step === 2) {
      return selectedResources.length > 0;
    }
    if (step === 3) {
      return questions.every(
        (q) =>
          q.question_text.trim() !== "" &&
          q.options.every((opt) => opt.trim() !== "") &&
          q.correct_answer !== null
      );
    }
    return true;
  };

  return (
    <div className="mt-12 flex justify-center h-screen">
      <Card className="w-full h-full border border-gray-300 shadow-md rounded-lg flex flex-col">
        <CardHeader
          floated={false}
          shadow={false}
          color="transparent"
          className="m-0 flex items-center justify-between p-6"
        >
          <Typography variant="h6" color="blue-gray">
            {step === 1 && "Add Module Details"}
            {step === 2 && "Add Resources"}
            {step === 3 && "Add Assessment"}
          </Typography>
        </CardHeader>

        <CardBody className="p-6 flex-1 overflow-auto">
          {/* Step 1: Add Module Details */}
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
                placeholder="Overview of the module"
                required
              />
              <ReactQuill
                value={objectives}
                onChange={setObjectives}
                placeholder="Describe the objectives of the module"
                required
              />
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
            </div>
          )}

          {/* Step 2: Add Resources */}
          {step === 2 && (
            <div className="space-y-6">
              {/* Searchable Input */}
              <Input
                label="Search Resources"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              {/* Side-by-side layout: Resources (left) + Selected Resources (right) */}

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
                      Recommended Resources
                    </button>
                    <button
                      onClick={() => setActiveTab("all")}
                      className={`pb-2 text-sm font-medium border-b-2 ${
                        activeTab === "all"
                          ? "border-blue-600 text-blue-600"
                          : "border-transparent text-gray-500"
                      }`}
                    >
                      All Resources
                    </button>
                  </div>

                  {/* Resources Grid */}
                  <div className="mt-4 w-full">
                    {resourcesToShow.filter((res) =>
                      res.title.toLowerCase().includes(searchTerm.toLowerCase())
                    ).length === 0 ? (
                      <Typography
                        variant="paragraph"
                        color="gray"
                        className="text-gray-500"
                      >
                        {activeTab === "recommended"
                          ? "No recommended resources available."
                          : "No resources match your search."}
                      </Typography>
                    ) : (
                      <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
                        {resourcesToShow
                          .filter((res) =>
                            res.title
                              .toLowerCase()
                              .includes(searchTerm.toLowerCase())
                          )
                          .map((resource) => {
                            const isSelected = selectedResources.some(
                              (res) => res.id === resource.id
                            );

                            return (
                              <div
                                key={resource.id}
                                className="p-2 bg-white rounded grid items-center"
                              >
                                <ResourceCard
                                  resource={resource}
                                  userId={userId}
                                />{" "}
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
                                    onClick={() =>
                                      handleResourceToggle(resource)
                                    }
                                  >
                                    Add
                                  </Button>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Resources Section */}
                <div className="w-[320px] min-w-[320px]">
                  <div className="border-b border-gray-200 mb-4">
                    <Typography
                      variant="h6"
                      color="gray"
                      className="pb-2 text-gray-500 text-sm font-medium"
                    >
                      Selected Resources
                    </Typography>
                  </div>

                  <div
                    className={
                      selectedResources.length === 0 ? "opacity-50" : ""
                    }
                  >
                    <DragDropContext onDragEnd={handleDragEnd}>
                      <Droppable
                        droppableId="resources-list"
                        direction="vertical"
                      >
                        {(provided) => (
                          <div
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                            className="space-y-4"
                          >
                            {selectedResources.map((resource, index) => (
                              <Draggable
                                key={resource.id}
                                draggableId={String(resource.id)}
                                index={index}
                              >
                                {(provided) => (
                                  <div
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    ref={provided.innerRef}
                                    className="bg-white p-2 rounded"
                                  >
                                    <ResourceCard
                                      resource={resource}
                                      userId={userId}
                                    />
                                    <Button
                                      color="red"
                                      size="sm"
                                      className="mt-2 w-full"
                                      onClick={() =>
                                        handleResourceToggle(resource)
                                      }
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

          {/* Step 3: Add Assessment */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Add Import/Export buttons for Quiz */}
              <div className="col-span-4 flex justify-end py-2 px-4 gap-4">
                {/* Import Popover */}
                <Popover placement="bottom-end">
                  <PopoverHandler>
                    <Button
                      variant="filled"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      Import
                    </Button>
                  </PopoverHandler>
                  <PopoverContent className="p-2 border rounded-lg shadow-lg bg-white w-48">
                    <Button
                      variant="text"
                      fullWidth
                      className="text-left"
                      onClick={() =>
                        document.getElementById("importXml").click()
                      }
                    >
                      Import XML
                    </Button>
                    <Button
                      variant="text"
                      fullWidth
                      className="text-left mt-1"
                      onClick={() =>
                        document.getElementById("importJson").click()
                      }
                    >
                      Import JSON
                    </Button>

                    {/* Hidden file inputs for importing XML and JSON */}
                    <input
                      type="file"
                      accept=".xml"
                      onChange={(e) => handleImportQuestions(e, "xml")}
                      style={{ display: "none" }}
                      id="importXml"
                    />
                    <input
                      type="file"
                      accept=".json"
                      onChange={(e) => handleImportQuestions(e, "json")}
                      style={{ display: "none" }}
                      id="importJson"
                    />
                  </PopoverContent>
                </Popover>

                {/* Export Popover */}
                <Popover placement="bottom-end">
                  <PopoverHandler>
                    <Button
                      variant="filled"
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      Export
                    </Button>
                  </PopoverHandler>
                  <PopoverContent className="p-2 border rounded-lg shadow-lg bg-white w-48">
                    <Button
                      variant="text"
                      fullWidth
                      className="text-left"
                      onClick={() => handleExportQuestions("xml")}
                    >
                      Export XML
                    </Button>
                    <Button
                      variant="text"
                      fullWidth
                      className="text-left mt-1"
                      onClick={() => handleExportQuestions("json")}
                    >
                      Export JSON
                    </Button>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-center gap-4">
                <Input
                  label="Passing Percentage"
                  type="number"
                  value={passingPercentage}
                  onChange={(e) => setPassingPercentage(e.target.value)}
                  min="60"
                  max="100"
                  required
                />
                <Input
                  label="Number of Questions"
                  type="number"
                  value={questionCount}
                  onChange={handleQuestionCountChange}
                  min="3"
                  max="20"
                  required
                />
              </div>

              {questions.map((q, index) => (
                <div key={index} className="space-y-2 p-4 rounded-md">
                  <Input
                    label={`Question ${index + 1}`}
                    value={q.question_text}
                    onChange={(e) => {
                      const newQuestions = [...questions];
                      newQuestions[index].question_text = e.target.value;
                      setQuestions(newQuestions);
                    }}
                    required
                  />
                  {[0, 1, 2, 3].map((optIndex) => (
                    <div key={optIndex} className="flex items-center space-x-2">
                      <Radio
                        name={`correct-answer-${index}`}
                        checked={q.correct_answer === optIndex}
                        onChange={() => {
                          const newQuestions = [...questions];
                          newQuestions[index].correct_answer = optIndex;
                          setQuestions(newQuestions);
                        }}
                      />
                      <Input
                        label={`Option ${optIndex + 1}`}
                        value={q.options[optIndex]}
                        onChange={(e) => {
                          const newQuestions = [...questions];
                          newQuestions[index].options[optIndex] =
                            e.target.value;
                          setQuestions(newQuestions);
                        }}
                        required
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </CardBody>

        <CardFooter className="p-6 flex justify-center">
          <Button
            variant="text"
            onClick={() =>
              step === 1 ? navigate("/dashboard/learning") : setStep(step - 1)
            }
          >
            {step === 1 ? "Cancel" : "Back"}
          </Button>
          {step < 3 ? (
            <Button
              variant="filled"
              onClick={async () => {
                if (!canGoToNextStep()) {
                  if (step === 1) {
                    await fetchRecommendedResources();
                  }
                  setStep(step + 1);
                } else {
                  alert("Please fill in all required fields");
                }
              }}
            >
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

export default CreateModule;
