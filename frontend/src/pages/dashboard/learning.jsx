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
  IconButton,
} from "@material-tailwind/react";
import { LearningLPCard } from "@/widgets/cards/";
import { LearningMDCard } from "@/widgets/cards/";
import { PlusIcon } from "@heroicons/react/24/solid";
import { useUser } from "@/context/UserContext";
import { Link } from "react-router-dom";

export function LearningPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [learningPaths, setLearningPaths] = useState([]);
  const [modules, setModules] = useState([]);
  const [filterLP, setFilterLP] = useState(true);
  const [filterMD, setFilterMD] = useState(true);
  const { userRole } = useUser();

  useEffect(() => {
    const fetchLearningPathsAndModules = async () => {
      try {
        const response = await fetch(
          "http://localhost:8080/api/learning-paths"
        );
        const data = await response.json();
        setLearningPaths(data);

        const modulesResponse = await fetch(
          "http://localhost:8080/api/modules"
        );
        const modulesData = await modulesResponse.json();
        setModules(modulesData);
      } catch (error) {
        console.error("Error fetching learning paths or modules:", error);
      }
    };
    fetchLearningPathsAndModules();
  }, []);

  const filteredLearningPaths = learningPaths.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredModules = modules.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  let combinedItems = [];
  if (filterLP) {
    combinedItems = [
      ...combinedItems,
      ...filteredLearningPaths.map((item) => ({
        ...item,
        type: "learningPath",
        id: `lp_${item.id}`,
      })),
    ];
  }
  if (filterMD) {
    combinedItems = [
      ...combinedItems,
      ...filteredModules.map((item) => ({
        ...item,
        type: "module",
        id: `md_${item.id}`,
      })),
    ];
  }

  const sortedItems = combinedItems.sort((a, b) =>
    a.title.localeCompare(b.title)
  );

  return (
    <div className="mt-12 flex flex-col gap-6">
      {/* Educator Action Button */}
      {userRole === "educator" && (
        <div className="flex items-center justify-end py-0 px-1">
          <Popover placement="bottom-end">
            <PopoverHandler>
              <Button
                variant="filled"
                size="sm"
                className="flex items-center gap-2"
              >
                <PlusIcon className="w-4 h-4" />
                Create
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

      {/* Search Section */}

      <Input
        label="Search Resources"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="mb-4"
      />

      {/* Results Section */}
      <Card className="border border-gray-300 shadow-md flex flex-col min-h-screen">
        <CardBody>
          <Typography variant="h6" color="blue-gray" className="mb-2">
            Results
          </Typography>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {sortedItems.map((item) =>
              item.type === "learningPath" ? (
                <LearningLPCard key={item.id} learningItem={item} />
              ) : (
                <LearningMDCard key={item.id} moduleItem={item} />
              )
            )}
          </div>
        </CardBody>
      </Card>

      {/* Filters Sidebar */}
      <Card className="border border-gray-300 shadow-md flex flex-col min-h-screen">
        <CardBody>
          <Typography variant="h6" color="blue-gray" className="mb-2">
            Filters
          </Typography>
          <div className="mb-4">
            <Typography
              variant="small"
              color="blue-gray"
              className="text-xs font-semibold uppercase text-blue-gray-500"
            >
              Type:
            </Typography>
            <div className="flex flex-col gap-2">
              <div className="flex items-center">
                <Checkbox
                  checked={filterLP}
                  onChange={() => setFilterLP(!filterLP)}
                />
                <Typography variant="small" className="leading-none">
                  Learning Paths
                </Typography>
              </div>
              <div className="flex items-center">
                <Checkbox
                  checked={filterMD}
                  onChange={() => setFilterMD(!filterMD)}
                />
                <Typography variant="small" className="leading-none">
                  Modules
                </Typography>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default LearningPage;
