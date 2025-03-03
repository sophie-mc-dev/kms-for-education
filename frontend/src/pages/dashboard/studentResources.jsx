import React, { useState, useEffect } from "react";
import { Input, Card, CardBody, Typography } from "@material-tailwind/react";
import { useUser } from "@/context/UserContext";
import { ResourceCard } from "@/widgets/cards/";

export function StudentResources() {
  const { userId } = useUser();
  const [resources, setResources] = useState([]);
  const [bookmarkedResources, setBookmarkedResources] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const collections = ["Recently Viewed", "Bookmarked", "Recommended"];

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

  const getBookmarkedResources = async () => {
    if (!userId) return [];
    try {
      const response = await fetch(
        `http://localhost:8080/api/bookmarks/${userId}`
      );
      if (!response.ok) throw new Error("Failed to fetch bookmarks");

      return await response.json();
    } catch (error) {
      console.error("Error fetching bookmarks:", error);
      return [];
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      const allResources = await getAllResources();
      const bookmarks = await getBookmarkedResources();

      const bookmarked = allResources.filter((resource) =>
        bookmarks.some((b) => b.id === resource.id)
      );

      setResources(allResources);
      setBookmarkedResources(bookmarked);
    };

    fetchData();
  }, []);

  const filteredResources = (category) => {
    if (category === "Bookmarked") {
      return bookmarkedResources.filter((resource) =>
        resource.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return resources.filter(
      (resource) =>
        resource.category?.toLowerCase() === category.toLowerCase() &&
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
        const filtered = filteredResources(category);
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
                  filtered.map((resource) => (
                    <ResourceCard
                      key={resource.id}
                      resource={resource}
                      userId={userId}
                      isBookmarked={bookmarkedResources.some(
                        (r) => r.id === resource.id
                      )}
                      setBookmarkedResources={setBookmarkedResources}
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
        );
      })}
    </div>
  );
}

export default StudentResources;
