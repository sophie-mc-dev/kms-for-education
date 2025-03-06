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

export function CreateModule() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [learningPath, setLearningPath] = useState("");
  const [orderIndex, setOrderIndex] = useState("");
  const [assessment, setAssessment] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // TODO: ADD RESOURCES OPTION

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/modules", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          estimated_duration: estimatedDuration,
        }),
      });

      if (response.ok) {
        navigate("/learning"); 
      } else {
        alert("Error creating module");
      }
    } catch (error) {
      console.error(error);
      alert("Error creating module");
    } finally {
      setLoading(false);
    }
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
            New Module
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
                placeholder="Describe the module content here"
                required
              />
            </div>

            {/* Estimated Duration */}
            <div className="mb-4">
              <Input
                label="Estimated Duration (in minutes)"
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(e.target.value)}
                type="number"
                required
              />
            </div>

            <div className="flex gap-4">
              <Button
                variant="text"
                onClick={() => navigate("/modules")}
              >
                Cancel
              </Button>
              <Button
                variant="filled"
                type="submit"
                className="flex items-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    Submit
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

export default CreateModule;
