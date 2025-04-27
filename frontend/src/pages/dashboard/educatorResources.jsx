import React, { useState, useEffect } from "react";
import {
  Input,
  Card,
  CardBody,
  Typography,
  CardHeader,
} from "@material-tailwind/react";
import { useUser } from "@/context/userContext";

export function EducatorResources() {
  const [searchQuery, setSearchQuery] = useState("");
  const [resources, setResources] = useState([]);
  const { user } = useUser();
  
  const collections = ["My Resources", "Public Resources", "Private Resources", "My Modules", "My Learning Paths"];

  // Fetch resources created by the logged-in user
  const getAllResources = async () => {
    try {
      const createdBy = `${user.first_name} ${user.last_name}`;
      
      const response = await fetch("http://localhost:8080/api/resources/bycreator");
      if (!response.ok) {
        throw new Error("Failed to fetch resources");
      }
      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching resources:", error);
      return [];
    }
  };

  useEffect(() => {
    const fetchResources = async () => {
      const data = await getAllResources();
      setResources(data);
    };
    fetchResources();
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
