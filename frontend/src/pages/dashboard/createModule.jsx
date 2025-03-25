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
} from "@material-tailwind/react";

import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { useUser } from "@/context/userContext";
import { useNavigate } from "react-router-dom";

export function CreateModule() {
  const [step, setStep] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedResources, setSelectedResources] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const { userId } = useUser();
  const [questions, setQuestions] = useState(
    Array.from({ length: 5 }, () => ({
      question_text: "",
      options: ["", "", "", ""],
      correct_answer: null,
    }))
  );
  const navigate = useNavigate();

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const response = await fetch("http://localhost:8080/api/resources");
        const data = await response.json();
        setResources(data);
      } catch (error) {
        console.error("Error fetching resources:", error);
      }
    };
    fetchResources();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("http://localhost:8080/api/modules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          estimated_duration: Number(estimatedDuration),
          assessment: {
            questions: questions.map((q) => q.question_text),
            answers: questions.map((q) => q.options),
            solution: questions.map((q) => q.correct_answer),
          },
          resources: selectedResources.map((res) => res.id),
        }),
      });
      if (response.ok) navigate("/learning");
      else alert("Error creating module");
    } catch (error) {
      console.error(error);
      alert("Error creating module");
    } finally {
      setLoading(false);
    }
  };

  const handleResourceToggle = (resource) => {
    setSelectedResources(
      (prevSelected) =>
        prevSelected.some((res) => res.id === resource.id)
          ? prevSelected.filter((res) => res.id !== resource.id) // Remove if exists
          : [...prevSelected, resource] // Add if not selected
    );
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
                placeholder="Describe the module"
                required
              />
              <Input
                label="Estimated Duration (minutes)"
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(e.target.value)}
                type="number"
                required
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <Input
                label="Search Resources"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />

              <div className="grid grid-cols-4 gap-4">
                {resources
                  .filter((res) =>
                    res.title.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map((resource) => {
                    const isSelected = selectedResources.some(
                      (res) => res.id === resource.id
                    );

                    return (
                      <div
                        key={resource.id}
                        className="p-2 bg-white grid items-center"
                      >
                        <ResourceCard resource={resource} userId={userId} />

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
                            onClick={() => handleResourceToggle(resource)}
                          >
                            Add
                          </Button>
                        )}
                      </div>
                    );
                  })}
              </div>

              {selectedResources.length > 0 && (
                <div className="mt-6">
                  <Typography variant="h6" color="blue-gray">
                    Selected Resources:
                  </Typography>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
                    {selectedResources.map((resource) => (
                      <div key={resource.id} className="relative">
                        <ResourceCard resource={resource} userId={userId} />
                        <Button
                          color="red"
                          size="sm"
                          className="mt-2 w-full"
                          onClick={() => handleResourceToggle(resource)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              {questions.map((q, index) => (
                <div key={index} className="space-y-2 border p-4 rounded-md">
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

        <div className="p-6 flex justify-center">
          <Button
            variant="text"
            onClick={() =>
              step === 1 ? navigate("/modules") : setStep(step - 1)
            }
          >
            {step === 1 ? "Cancel" : "Back"}
          </Button>
          {step < 3 ? (
            <Button variant="filled" onClick={() => setStep(step + 1)}>
              Next
            </Button>
          ) : (
            <Button variant="filled" onClick={handleSubmit} disabled={loading}>
              {loading ? "Submitting..." : "Submit"}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

export default CreateModule;
