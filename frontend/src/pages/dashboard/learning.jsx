import React, { useState, useEffect } from "react";
import {
  Input,
  Card,
  CardBody,
  Typography,
  Checkbox,
  Button,
  Popover,
  PopoverHandler,
  PopoverContent,
  Spinner,
} from "@material-tailwind/react";
import { LearningLPCard } from "@/widgets/cards";
import { LearningMDCard } from "@/widgets/cards";
import { PlusIcon } from "@heroicons/react/24/solid";
import { useUser } from "@/context/UserContext";
import { Link } from "react-router-dom";

export function LearningPage() {
  const [learningPaths, setLearningPaths] = useState([]);
  const [modules, setModules] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterLP, setFilterLP] = useState(true);
  const [filterMD, setFilterMD] = useState(true);
  const { userRole } = useUser();

  useEffect(() => {
    const fetchLearningPathsAndModules = async () => {
      try {
        const learningPathResponse = await fetch(
          "http://localhost:8080/api/learning-paths"
        );
        const learningPathData = await learningPathResponse.json();
        setLearningPaths(learningPathData);

        const modulesResponse = await fetch(
          "http://localhost:8080/api/modules"
        );
        const modulesData = await modulesResponse.json();
        setModules(modulesData);

        // Combine data for initial display (if no search is performed)
        const combined = [
          ...learningPathData.map((item) => ({
            ...item,
            type: "learning_path",
            item_id: item.id,
          })),
          ...modulesData.map((item) => ({
            ...item,
            type: "module",
            item_id: item.id,
          })),
        ].sort((a, b) => a.title.localeCompare(b.title));

        setResults(combined);
      } catch (error) {
        console.error("Error fetching learning paths or modules:", error);
      }
    };

    fetchLearningPathsAndModules();
  }, []);

  const handleSearch = async () => {
    setLoading(true);
    try {
      if (!searchQuery.trim()) {
        // Show all content if the search query is empty
        const combined = [
          ...learningPaths.map((item) => ({
            ...item,
            type: "learning_path",
            item_id: item.id,
          })),
          ...modules.map((item) => ({
            ...item,
            type: "module",
            item_id: item.id,
          })),
        ].sort((a, b) => a.title.localeCompare(b.title));

        setResults(combined);
      } else {
        // Fetch results from the search API
        const response = await fetch(
          `http://localhost:8080/api/search/learning-content?q=${encodeURIComponent(
            searchQuery
          )}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch search results");
        }

        const data = await response.json();
        if (data.length === 0) {
          setResults([]);
        } else {
          setResults(data);
        }
      }
    } catch (error) {
      console.error("Error searching for learning content:", error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = results.filter((item) => {
    if (filterLP && item.type === "learning_path") return true;
    if (filterMD && item.type === "module") return true;
    return false;
  });

  return (
    <div className="mt-12 grid grid-cols-4 gap-4">
      {/* Educator Action Button */}
      {userRole === "educator" && (
        <div className="col-span-4 flex justify-end py-2 px-4">
          <Popover placement="bottom-end">
            <PopoverHandler>
              <Button
                variant="filled"
                size="sm"
                className="flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                Add
              </Button>
            </PopoverHandler>
            <PopoverContent className="p-2 border rounded-lg shadow-lg bg-white w-48">
              <Link to="upload-learning-path">
                <Button variant="text" fullWidth className="text-left">
                  Learning Path
                </Button>
              </Link>
              <Link to="upload-module">
                <Button variant="text" fullWidth className="text-left mt-1">
                  Module
                </Button>
              </Link>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Student Action Button */}
      {userRole === "student" && (
        <div className="col-span-4 flex justify-end py-2 px-4">
          <Link to="create-learning-path">
            <Button
              variant="filled"
              size="sm"
              className="flex items-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              Create Study Path
            </Button>
          </Link>
        </div>
      )}

      {/* Search Section */}
      <Card className="col-span-4 border border-gray-300 rounded-lg">
        <CardBody className="p-6">
          <form
            className="flex items-center space-x-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
          >
            <Input
              label="Search Learning Content"
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

      {/* Results Section */}
      <Card className="col-span-3 border border-gray-300 shadow-md">
        <CardBody>
          <Typography variant="h6" color="blue-gray" className="mb-4">
            Results
          </Typography>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-full flex justify-center items-center">
                <Spinner />
              </div>
            ) : filteredResults.length > 0 ? (
              filteredResults.map((item) =>
                item.type === "learning_path" ? (
                  <LearningLPCard
                    key={`lp-${item.id}`}
                    learningItem={{ ...item, id: item.item_id }}
                  />
                ) : (
                  <LearningMDCard
                    key={`md-${item.item_id}`}
                    moduleItem={{ ...item, id: item.item_id }}
                  />
                )
              )
            ) : (
              <Typography
                variant="small"
                color="gray"
                className="col-span-full text-center"
              >
                No matching resources found.
              </Typography>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Filters Sidebar */}
      <Card className="col-span-1 border border-gray-300 shadow-md">
        <CardBody>
          <Typography variant="h6" color="blue-gray" className="mb-4">
            Filters
          </Typography>
          <div className="mb-4">
            <Typography
              variant="small"
              className="text-xs font-semibold uppercase text-blue-gray-500"
            >
              Type:
            </Typography>
            <div className="flex flex-col gap-2">
              <Checkbox
                checked={filterLP}
                onChange={() => setFilterLP(!filterLP)}
                label="Learning Paths"
              />
              <Checkbox
                checked={filterMD}
                onChange={() => setFilterMD(!filterMD)}
                label="Modules"
              />
            </div>
          </div>
          <div>
            TODO: add progress filters, difficulty level, ects, duration
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default LearningPage;
