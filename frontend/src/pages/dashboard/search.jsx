import React, { useState, useEffect } from "react";
import {
  Input,
  Card,
  CardBody,
  Typography,
  Checkbox,
  Chip,
  Button,
  Spinner,
  CardFooter,
} from "@material-tailwind/react";
import { CloudArrowUpIcon } from "@heroicons/react/24/solid";
import { resourceTypes } from "@/data/resource-types.jsx";
import { resourceCategories } from "@/data/resource-categories";
import { ResourceCard } from "@/widgets/cards/";
import { useUser } from "@/context/UserContext";
import { Link } from "react-router-dom";

export function Search() {
  const { userId, userRole } = useUser();
  const [resources, setResources] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const [categoryFilter, setCategoryFilter] = useState([]);
  const [typeFilter, setTypeFilter] = useState([]);
  const [tagFilter, setTagFilter] = useState([]);

  const [expandedTypes, setExpandedTypes] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState(false);
  const [expandedTags, setExpandedTags] = useState(false);
  const visibleLimit = 5;
  const visibleTagLimit = 15;

  useEffect(() => {
    const fetchResources = async () => {
      setLoading(true);
      const data = await getAllResources();
      setResources(data);
      setResults(data);
      setLoading(false);
    };
    fetchResources();
  }, []);

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

  const handleSearch = async () => {
    if (!searchQuery) {
      setResults(resources);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:8080/api/search/resources?q=${searchQuery}`
      );
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Error fetching search results:", error);
    }
    setLoading(false);
  };

  // This function filters resources based on search query and active filters
  const filteredResults = results.filter((resource) => {
    const typeMatch =
      typeFilter.length > 0 ? typeFilter.includes(resource.type) : true;

    const categoryMatch =
      categoryFilter.length > 0
        ? resource.category?.some((cat) => categoryFilter.includes(cat)) ??
          false
        : true;

    const tagMatch =
      tagFilter.length > 0
        ? resource.tags?.some((tag) => tagFilter.includes(tag)) ?? false
        : true;

    return categoryMatch && tagMatch && typeMatch;
  });

  // Order resource results alphabetically by default except when a search is made
  const isSearch = searchQuery.trim().length > 0;
  const displayedResults = isSearch
    ? filteredResults // keep relevance order
    : [...filteredResults].sort((a, b) =>
        a.title.toLowerCase().localeCompare(b.title.toLowerCase())
      );

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
      {/* Educator Action Button */}
      {userRole === "educator" && (
        <CardFooter className="col-span-4 flex justify-end py-2 px-4">
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
      )}

      <Card className="col-span-4 border border-gray-300 rounded-lg">
        <CardBody className="space-y-6 p-6">
          <form
            className="flex items-center space-x-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
          >
            <Input
              label="Search Resources"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-4 flex-grow"
            />
            <Button type="submit" disabled={loading}>
              {loading ? <Spinner className="w-4 h-4" /> : "Search"}
            </Button>
          </form>
        </CardBody>
      </Card>

      <Card className="col-span-3 border border-blue-gray-100 flex flex-col min-h-screen">
        <CardBody>
          <Typography variant="h6" color="blue-gray" className="mb-2">
            Results
          </Typography>

          {loading ? (
            <div className="w-full flex justify-center items-center py-8">
              <Spinner className="w-6 h-6" />
            </div>
          ) : displayedResults.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {displayedResults.map((resource) => (
                <ResourceCard
                  key={resource.id}
                  resource={resource}
                  userId={userId}
                />
              ))}
            </div>
          ) : (
            <Typography variant="small" color="gray">
              No matching resources found.
            </Typography>
          )}
        </CardBody>
      </Card>

      <Card className="col-span-1 border border-gray-300 flex flex-col min-h-screen">
        <CardBody>
          <Typography variant="h6" color="blue-gray" className="mb-2">
            Filters
          </Typography>

          {/* RESOURCE TYPES */}
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
                .filter((type) => type.label)
                .sort((a, b) => (a.value ?? "").localeCompare(b.value ?? ""))
                .slice(0, expandedTypes ? resourceTypes.length : visibleLimit)
                .map((type) => (
                  <div key={type.value} className="flex items-center">
                    <Checkbox
                      checked={typeFilter.includes(type.label)}
                      onChange={() => toggleType(type.label)}
                    />
                    <Typography variant="small" className="leading-none">
                      {type.label}
                    </Typography>
                  </div>
                ))}

              {resourceTypes.length > visibleLimit && (
                <Button
                  variant="text"
                  size="sm"
                  className="font-normal underline text-blue-gray-500"
                  onClick={() => setExpandedTypes(!expandedTypes)}
                >
                  {expandedTypes ? "Show Less" : "Show More"}
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
                .filter((category) => category.label)
                .sort((a, b) => (a.value ?? "").localeCompare(b.value ?? ""))
                .slice(
                  0,
                  expandedCategories ? resourceCategories.length : visibleLimit
                )
                .map((category) => (
                  <div key={category.value} className="flex items-center">
                    <Checkbox
                      checked={categoryFilter.includes(category.label)}
                      onChange={() => toggleCategory(category.label)}
                    />
                    <Typography variant="small" className="leading-none">
                      {category.label}
                    </Typography>
                  </div>
                ))}

              {resourceCategories.length > visibleLimit && (
                <Button
                  variant="text"
                  size="sm"
                  className="font-normal underline text-blue-gray-500"
                  onClick={() => setExpandedCategories(!expandedCategories)}
                >
                  {expandedCategories ? "Show Less" : "Show More"}
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
              )
                .slice(0, expandedTags ? undefined : visibleTagLimit)
                .map((tag) => (
                  <Chip
                    key={tag}
                    value={tag}
                    color={tagFilter.includes(tag) ? "green" : "blue-gray"}
                    className="cursor-pointer font-medium"
                    onClick={() => handleTagClick(tag)}
                  />
                ))}
            </div>
            {Array.from(new Set(resources.flatMap((resource) => resource.tags)))
              .length > visibleTagLimit && (
              <Chip
                key="toggle-tags"
                value={expandedTags ? "−" : "+"}
                color="green"
                className="cursor-pointer font-medium px-2 py-0 text-lg w-6 h-6 flex items-center mt-2 justify-center rounded-full"
                onClick={() => setExpandedTags(!expandedTags)}
              />
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default Search;
