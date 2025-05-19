import React, { useState, useEffect, useRef } from "react";
import {
  Input,
  Card,
  CardBody,
  Typography,
  Spinner,
} from "@material-tailwind/react";
import { useUser } from "@/context/userContext";
import { ResourceCard } from "@/widgets/cards/";
import { LearningLPCard } from "@/widgets/cards/";
import { LearningMDCard } from "@/widgets/cards/";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

export function EducatorResources() {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const collectionRefs = useRef({});

  const collections = [
    "Public Resources",
    "Private Resources",
    "My Modules",
    "My Learning Paths",
  ];

  const fetchEducatorResources = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        "http://localhost:8080/api/resources/bycreator",
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!response.ok) throw new Error("Failed to fetch resources");

      const data = await response.json();
      setResources(data);
    } catch (error) {
      console.error("Error fetching resources:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEducatorResources();
  }, []);

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

    switch (category) {
      case "Public Resources":
        return resources.filter(
          (res) => res.visibility === "public" && matchesSearch(res)
        );
      case "Private Resources":
        return resources.filter(
          (res) => res.visibility === "private" && matchesSearch(res)
        );
      case "My Modules":
        return "";
      // todo: add modules by creator
      case "My Learning Paths":
        return "";
      // todo: add lps by creator
      default:
        return [];
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
        const filtered = filteredResources(category);

        if (!filtered || filtered.length === 0) {
          return null; 
        }

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
                    className="p-2 rounded-full transition"
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
                {loading ? (
                  <div className="flex justify-center items-center w-full">
                    <Spinner />
                  </div>
                ) : filtered.length > 0 ? (
                  filtered.map((item) => (
                    <div
                      className="flex-shrink-0 w-[calc(33.33%-16px)]"
                      key={`res-${item.id}`}
                    >
                      {item.resource_type === "learning_path" ? (
                        <LearningLPCard learningItem={item} />
                      ) : item.resource_type === "module" ? (
                        <LearningMDCard moduleItem={item} />
                      ) : (
                        <ResourceCard resource={item} userId={user.id} />
                      )}
                    </div>
                  ))
                ) : (
                  <Typography variant="small" color="gray">
                    No items found.
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

export default EducatorResources;
