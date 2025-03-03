import React from "react";
import { Card, CardBody, Typography, Chip } from "@material-tailwind/react";
import { Bars3Icon } from "@heroicons/react/24/solid";

export function LearningPathDetails() {
  // Sample Learning Path Data
  const learningPath = {
    title: "Machine Learning for Engineers",
    description:
      "An in-depth learning path covering fundamentals to advanced concepts of machine learning, including hands-on projects.",
    estimated_duration: "12 weeks",
    ects: 6,
  };

  // Sample Modules Data
  const modules = [
    {
      id: 1,
      title: "Introduction to Machine Learning",
      description: "Overview of ML concepts, history, and applications.",
      has_assessment: true,
    },
    {
      id: 2,
      title: "Supervised Learning",
      description:
        "Understanding regression, classification, and evaluation metrics.",
      has_assessment: true,
    },
    {
      id: 3,
      title: "Unsupervised Learning",
      description:
        "Exploring clustering and dimensionality reduction techniques.",
      has_assessment: false,
    },
  ];

  return (
    <div className="mt-12 flex gap-4 h-full">
      <Card className="w-screen h-screen border border-blue-gray-100 shadow-sm p-6 flex flex-col">
        <CardBody className="flex-1 overflow-auto">
          {/* Learning Path Title & Details */}
          <Typography variant="h4" color="blue-gray" className="font-semibold">
            {learningPath.title}
          </Typography>

          <div className="mt-4 flex items-center gap-x-6">
            <div className="flex items-center gap-x-2">
              <Typography className="text-xs font-semibold uppercase text-blue-gray-500">
                Estimated Duration:
              </Typography>
              <Typography variant="small" className="text-blue-gray-600">
                {learningPath.estimated_duration}
              </Typography>
            </div>

            <div className="flex items-center gap-x-2">
              <Typography className="text-xs font-semibold uppercase text-blue-gray-500">
                ECTS:
              </Typography>
              <Typography variant="small" className="text-blue-gray-600">
                {learningPath.ects}
              </Typography>
            </div>
          </div>

          <Typography className="mt-2 text-blue-gray-700">
            {learningPath.description}
          </Typography>

          {/* Divider */}
          <div className="border-t my-4"></div>

          {/* Modules List */}
          <Typography
            variant="h5"
            color="blue-gray"
            className="font-semibold mb-2"
          >
            Modules
          </Typography>

          <div className="flex flex-col gap-2">
            {modules.map((module, index) => (
              <div
                key={module.id}
                className="flex items-center justify-between p-3 border border-blue-gray-100 rounded-lg bg-blue-gray-50"
              >
                <div className="flex items-start gap-4">
                  {/* Drag Handle */}
                  <Bars3Icon className="h-6 w-6 text-blue-gray-500 cursor-grab" />

                  {/* Module Details */}
                  <div>
                    <Typography
                      variant="h6"
                      color="blue-gray"
                      className="font-semibold"
                    >
                      {`${index + 1}. ${module.title}`}
                    </Typography>
                    <Typography
                      variant="small"
                      className="text-blue-gray-600 mt-1"
                    >
                      {module.description}
                    </Typography>

                    {/* Estimated Time & Resources */}
                    <div className="flex gap-4 mt-2 text-sm text-blue-gray-500">
                      <div className="flex items-center gap-1">
                        ⏳{" "}
                        <span>{module.estimated_time || "Unknown"} hours</span>
                      </div>
                      <div className="flex items-center gap-1">
                        📚 <span>{module.resource_count || "0"} materials</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Assessment Badge */}
                {module.has_assessment && (
                  <Chip size="sm" color="green" value="Assessment Available" />
                )}
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default LearningPathDetails;
