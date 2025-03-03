import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card,
  CardBody,
  Typography,
  Button,
} from "@material-tailwind/react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import { ResourceCard } from "@/widgets/cards/";

export function ModuleDetails() {
  const { moduleId } = useParams();
  const navigate = useNavigate();

  // Sample Data (Mock Data)
  const sampleModule = {
    id: "1",
    title: "Introduction to AI",
    estimated_duration: "2 weeks",
    ects: 5,
    has_assessment: true,
    assessment_id: "101",
  };

  const sampleResources = [
    { id: "r1", title: "AI Basics", type: "Video", link: "#" },
    { id: "r2", title: "Machine Learning Overview", type: "Article", link: "#" },
  ];

  const sampleLearningPath = [
    { id: "1", title: "Introduction to AI" },
    { id: "2", title: "Machine Learning Fundamentals" },
    { id: "3", title: "Deep Learning" },
  ];

  const sampleUserProgress = {
    passed_modules_ids: ["1"], // Modules the user has completed
  };

  // Set module, resources, learning path, and user progress from sample data
  const module = sampleModule;
  const resources = sampleResources;
  const learningPath = sampleLearningPath;
  const userProgress = sampleUserProgress;

  // Determine previous and next modules
  const currentIndex = learningPath.findIndex(m => m.id === module.id);
  const previousModule = learningPath[currentIndex - 1];
  const nextModule = learningPath[currentIndex + 1];

  const canProceed = userProgress.passed_modules_ids.includes(module.id);

  return (
    <div className="flex gap-4 h-full mt-12">
      {/* Left Section: Module Content */}
      <Card className="border border-blue-gray-100 shadow-sm p-4 flex-1">
        <CardBody>
          <Typography variant="h4" color="blue-gray" className="font-semibold mb-2">
            {module.title}
          </Typography>
          <Typography variant="small" className="text-blue-gray-500">
            Estimated Duration: {module.estimated_duration} | ECTS: {module.ects}
          </Typography>

          {/* Resources */}
          <div className="mt-6">
            <Typography variant="h6" color="blue-gray" className="mb-3">Resources</Typography>
            <div className="grid grid-cols-2 gap-4">
              
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            {previousModule ? (
              <Button color="blue-gray" onClick={() => navigate(`/modules/${previousModule.id}`)}>
                <ChevronLeftIcon className="h-5 w-5 inline-block mr-2" /> Previous
              </Button>
            ) : <div />}

            {nextModule && (
              <Button
                color="blue-gray"
                disabled={!canProceed}
                onClick={() => navigate(`/modules/${nextModule.id}`)}
              >
                Next <ChevronRightIcon className="h-5 w-5 inline-block ml-2" />
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Right Sidebar: Learning Path Progress */}
      <Card className="w-80 border border-blue-gray-100 shadow-sm">
        <CardBody>
          <Typography variant="h6" color="blue-gray" className="mb-4">
            Learning Path
          </Typography>
          <div className="space-y-2">
            {learningPath.map(m => (
              <Button
                key={m.id}
                fullWidth
                variant={m.id === module.id ? "filled" : "outlined"}
                color={userProgress.passed_modules_ids.includes(m.id) ? "green" : "blue-gray"}
                onClick={() => navigate(`/modules/${m.id}`)}
              >
                {m.title}
              </Button>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default ModuleDetails;
