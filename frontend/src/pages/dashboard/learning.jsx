import React, { useState } from "react";
import { Input, Card, CardBody, Typography } from "@material-tailwind/react";
import { LearningCard } from "@/widgets/cards/";

export function LearningPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const learningPaths = [
    {
      id: 1,
      type: "learning-path",
      title: "Machine Learning Basics",
      description: "Learn fundamental ML concepts and applications...",
      created_by: "Dr. Smith",
      visibility: "public",
      ects: 5,
      estimated_duration: 20,
      completion: 40,
    },
    {
      id: 2,
      type: "learning-path",
      title: "Software Engineering Principles",
      description: "A structured approach to software development...",
      created_by: "Prof. Jane Doe",
      visibility: "private",
      ects: 6,
      estimated_duration: 25,
      completion: 0,
    },
    {
      id: 3,
      type: "module",
      title: "Introduction to Neural Networks",
      description:
        "A deep dive into the basics of neural networks and their applications...",
      created_by: "Dr. John Doe",
      visibility: "public",
      ects: 3,
      estimated_duration: 15,
      completion: 20,
    },
  ];

  return (
    <div className="mt-12 grid grid-cols-4 gap-4">
      <Card className="col-span-4 border border-gray-300 shadow-md rounded-lg">
        <CardBody className="space-y-6 p-6">
          <Input
            label="Search Resources"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-4"
          />
        </CardBody>
      </Card>

      {/* Learning Paths Grid */}
      <Card className="col-span-3 border border-gray-300 shadow-md flex flex-col min-h-screen">
        <CardBody>
          <Typography variant="h6" color="blue-gray" className="mb-2">
            Results
          </Typography>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {learningPaths.map((item) => (
              <LearningCard key={item.id} learningItem={item} />
            ))}
          </div>
        </CardBody>
      </Card>

      <Card className="col-span-1 border border-gray-300 shadow-md flex flex-col min-h-screen">
        <CardBody>
          <Typography variant="h6" color="blue-gray" className="mb-2">
            Filters
          </Typography>
          {/* status, learning path or module, ects, duration */}
        </CardBody>
      </Card>
    </div>
  );
}

export default LearningPage;
