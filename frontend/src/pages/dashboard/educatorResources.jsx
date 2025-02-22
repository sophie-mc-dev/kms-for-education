import React, { useState } from "react";
import {
  Input,
  Card,
  CardBody,
  Typography,
  CardHeader,
  Button,
  CardFooter,
} from "@material-tailwind/react";
import { CloudArrowUpIcon } from "@heroicons/react/24/solid";

import { Link } from "react-router-dom";

export function EducatorResources() {
  const [searchQuery, setSearchQuery] = useState("");

  const collections = ["Recently Added", "Published", "Private"];

  // Sample resources data
  const resources = [
    { id: 1, title: "AI in Education", category: "Recently Added" },
    { id: 2, title: "Semantic Web Basics", category: "Published" },
    { id: 3, title: "Knowledge Management Systems", category: "Private" },
    {
      id: 4,
      title: "Machine Learning for Students",
      category: "Recently Added",
    },
    { id: 5, title: "Collaborative Learning Tools", category: "Published" },
  ];

  // Filter function
  const filteredResources = (category) =>
    resources.filter(
      (resource) =>
        resource.category === category &&
        resource.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="mt-12 flex flex-col gap-6">
      <CardFooter className="flex items-center justify-end py-0 px-1">
        <Link to="upload">
          <Button variant="filled" size="sm" className="flex items-center gap-2">
            <CloudArrowUpIcon className="w-4 h-4" />
            Upload Resource
          </Button>
        </Link>
      </CardFooter>

      {/* Search Bar */}
      <Input
        label="Search Resources"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="mb-4"
      />

      {/* Collections Cards */}
      {collections.map((category) => (
        <Card
          key={category}
          className="col-span-4 mb-6 border border-gray-300 shadow-md rounded-lg"
        >
          <CardHeader
            floated={false}
            shadow={false}
            color="transparent"
            className="m-0 flex items-center justify-between p-6"
          >
            <Typography variant="h6" color="blue-gray">
              {category}
            </Typography>
          </CardHeader>
          <CardBody>
            {filteredResources(category).length > 0 ? (
              filteredResources(category).map((resource) => (
                <Typography key={resource.id} className="mb-2">
                  {resource.title}
                </Typography>
              ))
            ) : (
              <Typography color="gray">No matching resources found.</Typography>
            )}
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

export default EducatorResources;
