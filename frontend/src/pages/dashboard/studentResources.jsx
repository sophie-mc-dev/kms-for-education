import React, { useState, useEffect } from "react";
import { Input, Card, CardBody, Typography } from "@material-tailwind/react";
import { useUser } from "@/context/UserContext";
import { ResourceCard } from "@/widgets/cards/";
import { LearningLPCard } from "@/widgets/cards/";

export function StudentResources() {
  const { userId } = useUser();
  const [resources, setResources] = useState([]);
  const [bookmarkedResources, setBookmarkedResources] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [learningPathsInProgress, setLearningPathsInProgress] = useState([]);
  const [learningPathsCompleted, setLearningPathsCompleted] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const collections = [
    "Recently Viewed",
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
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredResources = (category) => {
    if (category === "Recently Viewed") {
      return recentlyViewed.filter((resource) =>
        resource.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (category === "Bookmarked") {
      return bookmarkedResources.filter((resource) =>
        resource.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (category === "In Progress") {
      return learningPathsInProgress.filter((lp) =>
        lp.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (category === "Completed") {
      return learningPathsCompleted.filter((lp) =>
        lp.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return resources.filter((resource) =>
      resource.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
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
              <Typography variant="h6" color="blue-gray" className="mb-2">
                {category}
              </Typography>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filtered.length > 0 ? (
                  filtered.map((item) =>
                    category === "In Progress" || category === "Completed" ? (
                      <LearningLPCard
                        key={item.learning_path_id}
                        learningItem={item}
                      />
                    ) : category === "Bookmarked" ||
                      category === "Recently Viewed" ? (
                      <ResourceCard
                        key={item.id} // Use the item ID for key
                        resource={item}
                        userId={userId}
                        isBookmarked={bookmarkedResources.some(
                          (r) => r.id === item.id
                        )}
                        setBookmarkedResources={setBookmarkedResources}
                      />
                    ) : (
                      <Typography variant="small" color="gray" key={item.id}>
                        No data found for this category.
                      </Typography>
                    )
                  )
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
