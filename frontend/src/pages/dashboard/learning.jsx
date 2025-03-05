import React, { useState, useEffect } from "react";
import { Input, Card, CardBody, Typography, Checkbox, Button } from "@material-tailwind/react";
import { LearningLPCard } from "@/widgets/cards/";  // For learning paths
import { LearningMDCard } from "@/widgets/cards/";  // For modules

export function LearningPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [learningPaths, setLearningPaths] = useState([]);
  const [modules, setModules] = useState([]);
  const [filterLP, setFilterLP] = useState(true);
  const [filterMD, setFilterMD] = useState(true);

  // Fetch learning paths and modules when the component is mounted
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

  // Filter based on search query
  const filteredLearningPaths = learningPaths.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredModules = modules.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Combine and filter by category selection
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

  // Sort alphabetically
  const sortedItems = combinedItems.sort((a, b) =>
    a.title.localeCompare(b.title)
  );

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

      {/* Combined Learning Paths and Modules Section */}
      <Card className="col-span-3 border border-gray-300 shadow-md flex flex-col min-h-screen">
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
      <Card className="col-span-1 border border-gray-300 shadow-md flex flex-col min-h-screen">
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
