import React, { useState, useEffect } from "react";
import {
  Input,
  Card,
  CardBody,
  Typography,
  Checkbox,
  Chip,
  Button,
} from "@material-tailwind/react";
import { resourceTypes } from "@/data/resource-types.jsx";
import { resourceCategories } from "@/data/resource-categories";
import { ResourceCard } from "@/widgets/cards/";
import { useUser } from "@/context/UserContext";

export function Search() {
  const { userId } = useUser();
  const [resources, setResources] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [categoryFilter, setCategoryFilter] = useState([]);
  const [typeFilter, setTypeFilter] = useState([]);
  const [tagFilter, setTagFilter] = useState([]);

  const [expanded, setExpanded] = useState(false);
  const visibleLimit = 5;

  const getAllResources = async () => {
    try {
      const response = await fetch("http://localhost:8080/api/resources");
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

  const filteredResources = resources.filter((resource) => {
    const searchMatch =
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase());

    const typeMatch =
      typeFilter.length > 0 ? typeFilter.includes(resource.type) : true;

    const categoryMatch =
      categoryFilter.length > 0
        ? categoryFilter.includes(resource.category)
        : true;

    const tagMatch =
      tagFilter.length > 0
        ? resource.tags?.some((tag) => tagFilter.includes(tag)) || false
        : true;

    return searchMatch && categoryMatch && tagMatch && typeMatch;
  });

  // Toggle category selection
  const toggleCategory = (category) => {
    setCategoryFilter((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  // Toggle type selection
  const toggleType = (type) => {
    setTypeFilter((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleTagClick = (tag) => {
    setTagFilter((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="mt-12 grid grid-cols-4 gap-4">
      <Card className="col-span-4 border border-gray-300 rounded-lg">
        <CardBody className="space-y-6 p-6">
          <Input
            label="Search Resources"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-4"
          />
        </CardBody>
      </Card>

      <Card className="col-span-3 border border-blue-gray-100 flex flex-col min-h-screen">
        <CardBody>
          <Typography variant="h6" color="blue-gray" className="mb-2">
            Results
          </Typography>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredResources.length > 0 ? (
              filteredResources.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  userId={userId}
                />
              ))
            ) : (
              <Typography variant="small" color="gray">
                No resources found.
              </Typography>
            )}
          </div>
        </CardBody>
      </Card>

      <Card className="col-span-1 border border-gray-300 flex flex-col min-h-screen">
        <CardBody>
          <Typography variant="h6" color="blue-gray" className="mb-2">
            Filters
          </Typography>

          {/* TYPES */}
          <div className="mb-4">
            <Typography
              variant="small"
              color="blue-gray"
              className="text-xs font-semibold uppercase text-blue-gray-500"
            >
              Resource Types:
            </Typography>
            <div>
              {[...resourceTypes]
                .sort((a, b) => a.name.localeCompare(b.name))
                .slice(0, expanded ? resourceTypes.length : visibleLimit)
                .map((type) => (
                  <div key={type.id} className="flex items-center">
                    <Checkbox
                      checked={typeFilter.includes(type.name)}
                      onChange={() => toggleType(type.name)}
                    />
                    <Typography variant="small" className="leading-none">
                      {type.name}
                    </Typography>
                  </div>
                ))}

              {resourceTypes.length > visibleLimit && (
                <Button
                  variant="text"
                  size="sm"
                  className="font-normal underline text-blue-gray-500"
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? "Show Less" : "Show More"}
                </Button>
              )}
            </div>
          </div>

          {/* CATEGORIES */}
          <div className="mb-4">
            <Typography
              variant="small"
              color="blue-gray"
              className="text-xs font-semibold uppercase text-blue-gray-500"
            >
              Categories:
            </Typography>
            <div>
              {[...resourceCategories]
                .sort((a, b) => a.name.localeCompare(b.name))
                .slice(0, expanded ? resourceCategories.length : visibleLimit)
                .map((category) => (
                  <div key={category.id} className="flex items-center">
                    <Checkbox
                      checked={categoryFilter.includes(category.name)}
                      onChange={() => toggleCategory(category.name)}
                    />
                    <Typography variant="small" className="leading-none">
                      {category.name}
                    </Typography>
                  </div>
                ))}

              {resourceCategories.length > visibleLimit && (
                <Button
                  variant="text"
                  size="sm"
                  className="font-normal underline text-blue-gray-500"
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? "Show Less" : "Show More"}
                </Button>
              )}
            </div>
          </div>

          {/* TAGS */}
          <div>
            <Typography
              variant="small"
              color="blue-gray"
              className="mb-2 text-xs font-semibold uppercase text-blue-gray-500"
            >
              Tags:
            </Typography>
            <div className="flex flex-wrap gap-2">
              {Array.from(
                new Set(resources.flatMap((resource) => resource.tags))
              ).map((tag) => (
                <Chip
                  key={tag}
                  value={tag}
                  color={tagFilter.includes(tag) ? "green" : "blue-gray"}
                  className="cursor-pointer font-medium"
                  onClick={() => handleTagClick(tag)}
                />
              ))}
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default Search;
