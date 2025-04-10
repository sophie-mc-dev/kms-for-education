import React, { useState, useEffect, useRef } from "react";
import { Input, Card, CardBody, Typography } from "@material-tailwind/react";
import { useUser } from "@/context/UserContext";
import { ResourceCard } from "@/widgets/cards/";
import { LearningLPCard } from "@/widgets/cards/";
import { LearningMDCard } from "@/widgets/cards/";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

export function StudentResources() {
  const { userId } = useUser();
  const [resources, setResources] = useState([]);
  const [bookmarkedResources, setBookmarkedResources] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [studyPaths, setStudyPaths] = useState([]);
  const [learningPathsInProgress, setLearningPathsInProgress] = useState([]);
  const [learningPathsCompleted, setLearningPathsCompleted] = useState([]);
  const [modulesInProgress, setModulesInProgress] = useState([]);
  const [modulesCompleted, setModulesCompleted] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const collections = [
    "Recently Viewed",
    "My Study Paths",
    "In Progress",
    "Completed",
    "Bookmarked",
    "Recommended",
  ];

  // Fetch all resources from the API
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

  const getStudyPaths = async () => {
    if (!userId) return [];

    try {
      const response = await fetch(
        `http://localhost:8080/api/learning-paths/student/${userId}`
      );
      if (!response.ok) throw new Error("Failed to fetch study paths");

      return await response.json();
    } catch (error) {
      console.error("Error fetching study paths:", error);
      return [];
    }
  };

  // Fetch bookmarked resources for the user
  const getBookmarkedResources = async () => {
    if (!userId) return [];
    try {
      const response = await fetch(
        ` http://localhost:8080/api/bookmarks/${userId}`
      );
      if (!response.ok) throw new Error("Failed to fetch bookmarks");

      return await response.json();
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
      return [];
    }
  };

  // Fetch learning paths in progress for the user
  const getLearningPathsInProgress = async () => {
    if (!userId) return [];
    try {
      const response = await fetch(
        ` http://localhost:8080/api/learning-paths/in-progress/${userId}`
      );
      if (!response.ok) throw new Error("Failed to fetch learning paths");

      return await response.json();
    } catch (error) {
      console.error("Error fetching learning paths:", error);
      return [];
    }
  };

  const getCompletedLearningPaths = async () => {
    if (!userId) return [];
    try {
      const response = await fetch(
        `http://localhost:8080/api/learning-paths/completed/${userId}`
      );
      if (!response.ok) throw new Error("Failed to fetch learning paths");

      return await response.json();
    } catch (error) {
      console.error("Error fetching learning paths:", error);
      return [];
    }
  };

  const getCompletedModules = async () => {
    if (!userId) return [];
    try {
      const response = await fetch(
        `http://localhost:8080/api/modules/completed/${userId}`
      );
      if (!response.ok) throw new Error("Failed to fetch completed modules");

      return await response.json();
    } catch (error) {
      console.error("Error fetching completed modules:", error);
      return [];
    }
  };

  const getInProgressModules = async () => {
    if (!userId) return [];
    try {
      const response = await fetch(
        `http://localhost:8080/api/modules/in-progress/${userId}`
      );
      if (!response.ok) throw new Error("Failed to fetch completed modules");

      return await response.json();
    } catch (error) {
      console.error("Error fetching completed modules:", error);
      return [];
    }
  };

  // Load recently viewed resources from localStorage
  const getRecentlyViewedResources = () => {
    return JSON.parse(localStorage.getItem("recentlyViewed")) || [];
  };

  // Fetch all resources, bookmarks, learning paths, etc.
  const fetchData = async () => {
    const allResources = await getAllResources();
    const bookmarks = await getBookmarkedResources();
    const lpInProgress = await getLearningPathsInProgress();
    const lpCompleted = await getCompletedLearningPaths();
    const mdInProgress = await getInProgressModules();
    const mdCompleted = await getCompletedModules();
    const stdPaths = await getStudyPaths();
    const recentlyViewedData = getRecentlyViewedResources();

    const recentResources = recentlyViewedData
      .map((recent) => allResources.find((res) => res.id === recent.id))
      .filter(Boolean);

    setResources(allResources);
    setBookmarkedResources(
      allResources.filter((res) => bookmarks.some((b) => b.id === res.id))
    );
    setRecentlyViewed(recentResources);
    setLearningPathsInProgress(lpInProgress);
    setLearningPathsCompleted(lpCompleted);
    setModulesInProgress(mdInProgress);
    setModulesCompleted(mdCompleted);
    setStudyPaths(stdPaths);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const collectionRefs = useRef({});

  const scrollCollection = (direction, category) => {
    const collection = collectionRefs.current[category];
    if (collection) {
      collection.scrollBy({
        left: direction === "left" ? -500 : 500,
        behavior: "smooth",
      });
    }
  };

  const filteredResources = (category) => {
    const matchesSearch = (item) =>
      item.title?.toLowerCase().includes(searchQuery.toLowerCase());

    if (category === "Recently Viewed") {
      return recentlyViewed.filter(matchesSearch);
    }

    if (category === "My Study Paths") {
      return studyPaths.filter(matchesSearch);
    }

    if (category === "Bookmarked") {
      return bookmarkedResources.filter(matchesSearch);
    }

    if (category === "In Progress") {
      const combined = [...learningPathsInProgress, ...modulesInProgress];
      return combined.filter(matchesSearch);
    }

    if (category === "Completed") {
      const combined = [...learningPathsCompleted, ...modulesCompleted];
      return combined.filter(matchesSearch);
    }

    return resources.filter(matchesSearch);
  };

  return (
    <div className="mt-12 flex flex-col gap-6">
      <Input
        label="Search Resources"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="mb-4"
      />
      {collections.map((category) => {
        const filtered =
          category === "Recently Viewed"
            ? recentlyViewed
            : filteredResources(category);
        return (
          <Card
            key={category}
            className="col-span-3 border border-blue-gray-100 flex flex-col"
          >
            <CardBody>
              <div className="flex mb-2 justify-between items-center">
                <Typography variant="h6" color="blue-gray" className="mb-2">
                  {category}
                </Typography>
                <div className="flex">
                  <button
                    onClick={() => scrollCollection("left", category)}
                    className="p-2rounded-full transition"
                  >
                    <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
                  </button>
                  <button
                    onClick={() => scrollCollection("right", category)}
                    className="p-2 rounded-full transition"
                  >
                    <ChevronRightIcon className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
              </div>

              <div
                ref={(el) => (collectionRefs.current[category] = el)}
                className="flex overflow-x-auto gap-4 scroll-smooth"
              >
                {filtered.length > 0 ? (
                  filtered.map((item) => {
                    const isLearningPath =
                      item.hasOwnProperty("learning_path_id");
                    const isModule = item.hasOwnProperty("id");
                    const isStudyPath = item.creator_type === "student";

                    return (
                      <div
                        className="flex-shrink-0 w-[calc(33.33%-16px)]"
                        key={item.id}
                      >
                        {category === "In Progress" ||
                        category === "Completed" ? (
                          isLearningPath ? (
                            <LearningLPCard
                              key={`lp-${item.learning_path_id}`}
                              learningItem={item}
                            />
                          ) : isModule ? (
                            <LearningMDCard
                              key={`mod-${item.id}`}
                              moduleItem={item}
                            />
                          ) : null
                        ) : category === "Bookmarked" ||
                          category === "Recently Viewed" ? (
                          <ResourceCard
                            key={item.id}
                            resource={item}
                            userId={userId}
                            isBookmarked={bookmarkedResources.some(
                              (r) => r.id === item.id
                            )}
                            setBookmarkedResources={setBookmarkedResources}
                          />
                        ) : category === "My Study Paths" ? (
                          isStudyPath ? (
                            <LearningLPCard
                              key={`lp-${item.id}`}
                              learningItem={item}
                            />
                          ) : null
                        ) : null}
                      </div>
                    );
                  })
                ) : (
                  <Typography variant="small" color="gray">
                    No data found.
                  </Typography>
                )}
              </div>
            </CardBody>
          </Card>
        );
      })}
    </div>
  );
}

export default StudentResources;
