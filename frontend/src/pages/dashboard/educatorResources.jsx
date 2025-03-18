import React, { useState, useEffect } from "react";
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
  const [resources, setResources] = useState([]);

  const collections = ["Published"];

  // TODO: get resources published by the educator (add method on backend)
  const getAllResources = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/resources");
      if (!response.ok) throw new Error("Failed to fetch resources");

      return await response.json();
    } catch (error) {
      console.error("Error fetching resources:", error);
      return [];
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const allResources = await getAllResources();

      setResources(allResources);
    };

    fetchData();
  }, []);

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
        <Link to="upload-resource">
          <Button
            variant="filled"
            size="sm"
            className="flex items-center gap-2"
          >
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
          className="col-span-4 mb-6 rounded-lg border border-blue-gray-100 shadow-sm"
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
