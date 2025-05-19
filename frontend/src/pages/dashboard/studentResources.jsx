import React, { useState, useEffect, useRef } from "react";
import {
  Input,
  Card,
  CardBody,
  Typography,
  Spinner,
} from "@material-tailwind/react";
import { useUser } from "@/context/UserContext";
import { ResourceCard } from "@/widgets/cards/";
import { LearningLPCard } from "@/widgets/cards/";
import { LearningMDCard } from "@/widgets/cards/";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

export function StudentResources() {
  const { user, userId } = useUser();
  const [resources, setResources] = useState([]);
  const [bookmarkedResources, setBookmarkedResources] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [studyPaths, setStudyPaths] = useState([]);
  const [learningPathsInProgress, setLearningPathsInProgress] = useState([]);
  const [learningPathsCompleted, setLearningPathsCompleted] = useState([]);
  const [modulesInProgress, setModulesInProgress] = useState([]);
  const [modulesCompleted, setModulesCompleted] = useState([]);
  const [recommendedResources, setRecommendedResources] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [loading, setLoading] = useState({
    resources: true,
    bookmarks: true,
    studyPaths: true,
    inProgress: true,
    completed: true,
    modules: true,
    recommended: true,
  });

  const collections = [
    "Recently Viewed",
    "Recommended Resources",
    "My Study Paths",
    "In Progress",
    "Completed",
    "Bookmarked",
  ];

  const loadingKeys = {
    "Recently Viewed": "resources",
    "Recommended Resources": "recommended",
    "My Study Paths": "studyPaths",
    "In Progress": "inProgress",
    Completed: "completed",
    Bookmarked: "bookmarks",
  };

  const collectionRefs = useRef({});

  const fetchData = async () => {
    try {
      setLoading((prev) => ({
        ...prev,
        resources: true,
        bookmarks: true,
        studyPaths: true,
        inProgress: true,
        completed: true,
        modules: true,
        recommended: true,
      }));

      const [
        allResources,
        bookmarks,
        lpInProgress,
        lpCompleted,
        mdInProgress,
        mdCompleted,
        stdPaths,
        recommendedR,
      ] = await Promise.all([
        fetch("http://localhost:8080/api/resources").then((res) => res.json()),
        fetch(`http://localhost:8080/api/bookmarks/${userId}`).then((res) =>
          res.json()
        ),
        fetch(
          `http://localhost:8080/api/learning-paths/in-progress/${userId}`
        ).then((res) => (res.ok ? res.json() : [])),
        fetch(
          `http://localhost:8080/api/learning-paths/completed/${userId}`
        ).then((res) => (res.ok ? res.json() : [])),
        fetch(`http://localhost:8080/api/modules/in-progress/${userId}`).then(
          (res) => (res.ok ? res.json() : [])
        ),
        fetch(`http://localhost:8080/api/modules/completed/${userId}`).then(
          (res) => (res.ok ? res.json() : [])
        ),
        fetch(
          `http://localhost:8080/api/learning-paths/student/${userId}`
        ).then((res) => res.json()),
        fetch(
          `http://localhost:8080/api/recommendations/${userId}/resources`
        ).then((res) => res.json()),
      ]);

      const recentlyViewedData =
        JSON.parse(localStorage.getItem(`recentlyViewed-${userId}`)) || [];

      setResources(allResources);
      setBookmarkedResources(
        allResources.filter((res) => bookmarks.some((b) => b.id === res.id))
      );
      setRecentlyViewed(
        recentlyViewedData
          .map((recent) => allResources.find((res) => res.id === recent.id))
          .filter(Boolean)
      );
      setLearningPathsInProgress(lpInProgress);
      setLearningPathsCompleted(lpCompleted);
      setModulesInProgress(mdInProgress);
      setModulesCompleted(mdCompleted);
      setStudyPaths(stdPaths);
      setRecommendedResources(recommendedR);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading((prev) => ({
        ...prev,
        resources: false,
        bookmarks: false,
        studyPaths: false,
        inProgress: false,
        completed: false,
        modules: false,
        recommended: false,
      }));
    }
  };

  useEffect(() => {
    if (userId) fetchData();
  }, [userId]);

  const scrollCollection = (direction, category) => {
    const collection = collectionRefs.current[category];
    if (collection) {
      const scrollAmount = collection.offsetWidth;
      collection.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const filteredResources = (category) => {
    const matchesSearch = (item) =>
      item.title?.toLowerCase().includes(searchQuery.toLowerCase());

    switch (category) {
      case "Recently Viewed":
        return recentlyViewed.filter(matchesSearch);
      case "My Study Paths":
        return studyPaths.filter(matchesSearch);
      case "Bookmarked":
        return bookmarkedResources.filter(matchesSearch);
      case "Recommended Resources":
        return recommendedResources.filter(matchesSearch);
      case "In Progress":
        return [...learningPathsInProgress, ...modulesInProgress].filter(
          matchesSearch
        );
      case "Completed":
        return [...learningPathsCompleted, ...modulesCompleted].filter(
          matchesSearch
        );
      default:
        return resources.filter(matchesSearch);
    }
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

        if (!filtered || filtered.length === 0) {
          return null;
        }

        const isLoading = loading[loadingKeys[category]];
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
                {isLoading ? (
                  <div className="flex justify-center items-center w-full">
                    <Spinner />
                  </div>
                ) : filtered.length > 0 ? (
                  filtered.map((item) => {
                    const isLearningPath =
                      item.hasOwnProperty("learning_path_id");
                    const isModule = item.hasOwnProperty("id");
                    const isStudyPath = item.creator_type === "student";

                    return (
                      <div
                        className="flex-shrink-0 w-[calc(33.33%-16px)]"
                        key={
                          isLearningPath
                            ? `lp-${item.learning_path_id}`
                            : isModule
                            ? `mod-${item.id}`
                            : isStudyPath
                            ? `sp-${item.id}`
                            : `res-${item.id}`
                        }
                      >
                        {category === "In Progress" ||
                        category === "Completed" ? (
                          isLearningPath ? (
                            <LearningLPCard learningItem={item} />
                          ) : isModule ? (
                            <LearningMDCard moduleItem={item} />
                          ) : null
                        ) : category === "Bookmarked" ||
                          category === "Recently Viewed" ||
                          category === "Recommended Resources" ? (
                          <ResourceCard
                            resource={item}
                            userId={userId}
                            isBookmarked={bookmarkedResources.some(
                              (r) => r.id === item.id
                            )}
                            setBookmarkedResources={setBookmarkedResources}
                          />
                        ) : category === "My Study Paths" ? (
                          isStudyPath ? (
                            <LearningLPCard learningItem={item} />
                          ) : null
                        ) : null}
                      </div>
                    );
                  })
                ) : (
                  <Typography variant="small" color="gray">
                    No learning content found.
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
