import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  CardBody,
  Typography,
  Chip,
  Button,
  IconButton,
} from "@material-tailwind/react";
import ReactMarkdown from "react-markdown";
import { LearningMDCard, ResourceCard } from "@/widgets/cards";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { useUser } from "@/context/UserContext";
import { BookmarkIcon } from "@heroicons/react/24/outline";
import { BookmarkIcon as SolidBookmarkIcon } from "@heroicons/react/24/solid";

export function ResourceDetails() {
  const { userId, userRole } = useUser();
  const { resourceId } = useParams();
  const [resource, setResource] = useState(null);
  const [recommendedModules, setRecommendedModules] = useState([]);
  const [recommendedResources, setRecommendedResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const containerRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [cardsPerRow, setCardsPerRow] = useState(1);

  const [bookmarked, setBookmarked] = useState(false);

  // Check if the resource is already bookmarked when the component mounts
  useEffect(() => {
    if (!userId || !resourceId) return;

    if (userRole === "educator") {
      return;
    }

    const fetchBookmarks = async () => {
      try {
        const res = await fetch(
          `http://localhost:8080/api/bookmarks/${userId}`
        );
        if (!res.ok) throw new Error("Failed to fetch bookmarks");

        const data = await res.json();

        // Check if the resource is in the fetched bookmarks
        const isBookmarked = data.some(
          (item) => Number(item.id) === Number(resourceId)
        );
        setBookmarked(isBookmarked);
      } catch (error) {
        console.error("Error fetching bookmarks:", error);
      }
    };

    fetchBookmarks();
  }, [userId, resourceId]);

  const handleBookmarkClick = async (e) => {
    e.stopPropagation();

    try {
      let response;

      if (bookmarked) {
        // Send DELETE request to remove the bookmark and interaction
        response = await fetch(
          `http://localhost:8080/api/bookmarks/${userId}/${resourceId}`,
          {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
          }
        );
      } else {
        // Send POST request to add the bookmark and interaction
        response = await fetch(
          `http://localhost:8080/api/bookmarks/${userId}/${resourceId}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: userId, resource_id: resourceId }),
          }
        );
      }

      if (!response.ok) throw new Error("Failed to update bookmark");

      setBookmarked(!bookmarked);
    } catch (error) {
      console.error("Error updating bookmark:", error);
    }
  };

  useEffect(() => {
    const fetchResourceById = async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/api/resources/${resourceId}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch resource");
        }
        const data = await response.json();
        setResource(data);
      } catch (error) {
        console.error("Error fetching resource:", error);
        setError("Resource not found");
      } finally {
        setLoading(false);
      }
    };

    fetchResourceById();
  }, [resourceId]);

  useEffect(() => {
    const fetchRecommendedModules = async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/api/recommendations/modules/${resourceId}`
        );
        const data = await response.json();
        setRecommendedModules(data);
      } catch (error) {
        console.error("Error fetching recommended modules:", error);
      }
    };
    fetchRecommendedModules();
  }, []);

  // Modify fetchRecommendedResources effect to replace, not append:
  useEffect(() => {
    const fetchRecommendedResources = async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/api/recommendations/resources/${resourceId}?user_id=${userId}`
        );
        const data = await response.json();
        setRecommendedResources(data);
        setCurrentPage(0);
      } catch (error) {
        console.error("Error fetching recommended resources:", error);
      }
    };
    fetchRecommendedResources();
  }, [resourceId]);

  useEffect(() => {
    const calculateCardsPerRow = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const cardWidth = 350;
        const gap = 16;

        const maxCards = Math.floor((containerWidth + gap) / (cardWidth + gap));
        setCardsPerRow(maxCards > 0 ? maxCards : 1);
        setCurrentPage(0);
      }
    };

    calculateCardsPerRow();
    window.addEventListener("resize", calculateCardsPerRow);
    return () => window.removeEventListener("resize", calculateCardsPerRow);
  }, []);

  const handleRefresh = () => {
    const totalPages = Math.ceil(recommendedResources.length / cardsPerRow);
    if (totalPages <= 1) return;
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  const visibleResources = recommendedResources.slice(
    currentPage * cardsPerRow,
    currentPage * cardsPerRow + cardsPerRow
  );

  const formattedDate = resource?.created_at
    ? new Date(resource.created_at).toLocaleString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "UTC",
      })
    : "N/A";

  if (loading) return <div className="p-4">Loading...</div>;
  if (error || !resource)
    return (
      <div className="p-4 text-red-500">{error || "Resource not found"}</div>
    );

  // Function to extract YouTube video ID from different formats
  const getYouTubeEmbedUrl = (url) => {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname.includes("youtube.com")) {
        return `https://www.youtube.com/embed/${urlObj.searchParams.get("v")}`;
      } else if (urlObj.hostname.includes("youtu.be")) {
        return `https://www.youtube.com/embed/${urlObj.pathname.substring(1)}`;
      }
    } catch (error) {
      console.error("Invalid YouTube URL:", error);
    }
    return null;
  };

  // Render content based on file type
  const renderResourceContent = () => {
    const { url, format, html_content } = resource;

    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const embedUrl = getYouTubeEmbedUrl(url);
      return embedUrl ? (
        <iframe
          width="100%"
          height="400"
          src={embedUrl}
          title="YouTube video"
          allowFullScreen
          className="rounded-md shadow-md"
        ></iframe>
      ) : null;
    }

    const imageFormats = ["jpg", "jpeg", "png", "gif"];

    if (
      resource.format &&
      imageFormats.includes(resource.format.toLowerCase())
    ) {
      return (
        <img src={url} alt={resource.title} className="max-w-full h-auto" />
      );
    }

    if (format === "pdf" || url.endsWith(".pdf")) {
      return (
        <div>
          <embed
            src={url}
            type="application/pdf"
            width="100%"
            height="700px"
            className="border rounded-md shadow-md"
          />
          <Button
            color="blue-gray"
            className="mt-2"
            onClick={() => window.open(url)}
          >
            Open PDF
          </Button>
        </div>
      );
    }

    if (["docx", "pptx", "xlsx"].includes(format)) {
      const officeViewerUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(
        url
      )}`;
      return (
        <div>
          <iframe
            src={officeViewerUrl}
            width="100%"
            height="500px"
            className="rounded-md shadow-md"
          ></iframe>
          <Button
            color="blue-gray"
            className="mt-2"
            onClick={() => window.open(url)}
          >
            Download File
          </Button>
        </div>
      );
    }

    // Render text and markdown files directly
    if (["txt", "md"].includes(format) && html_content) {
      // Extract content inside <pre> tags if present
      const extractedContent = html_content.replace(/<\/?pre>/g, "");

      return format === "md" ? (
        <ReactMarkdown className="prose">{extractedContent}</ReactMarkdown>
      ) : (
        <div className="prose whitespace-pre-wrap">{extractedContent}</div>
      );
    }

    return (
      <Button color="blue-gray" onClick={() => window.open(url, "_blank")}>
        View Resource
      </Button>
    );
  };

  return (
    <div className="mt-12 flex gap-4 h-full">
      <div className="w-3/4 flex flex-col gap-4">
        <Card className="border border-blue-gray-100 shadow-sm p-4 flex-1">
          <CardBody>
            <div className="flex items-center justify-between mb-2">
              <Typography
                variant="h4"
                color="blue-gray"
                className="font-semibold"
              >
                {resource.title}
              </Typography>

              {userRole !== "educator" && (
                <div
                  className=" top-2 right-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <IconButton
                    variant="text"
                    className="text-blue-gray-500 hover:text-blue-gray-700"
                    onClick={handleBookmarkClick}
                  >
                    {bookmarked ? (
                      <SolidBookmarkIcon className="h-6 w-6 text-blue-gray-700" />
                    ) : (
                      <BookmarkIcon className="h-6 w-6" />
                    )}
                  </IconButton>
                </div>
              )}
            </div>

            <div className="mb-6 flex items-center gap-x-4">
              {/* Left Section: Date and Author */}
              <div className="flex items-center gap-x-1">
                <Typography className="block text-xs font-semibold uppercase text-blue-gray-500">
                  Published On:
                </Typography>
                <Typography
                  variant="small"
                  className="font-normal text-blue-gray-500"
                >
                  {formattedDate}
                </Typography>
              </div>
              <div className="flex items-center gap-x-1">
                <Typography className="block text-xs font-semibold uppercase text-blue-gray-500">
                  Added By:
                </Typography>
                <Typography
                  variant="small"
                  className="font-normal text-blue-gray-500"
                >
                  {" "}
                  {resource.created_by}
                </Typography>
              </div>
            </div>

            <div className="mb-6 font-normal text-blue-gray-500 text-sm">
              <div
                className="[&>ul]:list-disc [&>ul]:pl-5 [&>ol]:list-decimal"
                dangerouslySetInnerHTML={{ __html: resource.description }}
              ></div>
            </div>

            <div className="mb-6">
              <Typography
                variant="small"
                color="blue-gray"
                className="font-semibold capitalize"
              >
                Resource Type:
              </Typography>
              <Typography
                variant="small"
                className="font-normal text-blue-gray-500"
              >
                {resource.type}
              </Typography>
            </div>

            {resource.estimated_time > 0 && (
              <div className="mb-6">
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="font-semibold capitalize"
                >
                  Estimated Time:
                </Typography>
                <Typography
                  variant="small"
                  className="font-normal text-blue-gray-500"
                >
                  {resource.estimated_time} min
                </Typography>
              </div>
            )}

            <div className="mb-6">
              <Typography
                variant="small"
                color="blue-gray"
                className="font-semibold capitalize"
              >
                Categories:
              </Typography>

              <div className="flex flex-wrap gap-2">
                {resource.category.map((category, index) => (
                  <Typography
                    key={`${category}-${index}`}
                    variant="small"
                    className="font-normal text-blue-gray-500"
                  >
                    {category}
                    {index < resource.category.length - 1 && ","}{" "}
                  </Typography>
                ))}
              </div>
            </div>

            {resource.format && (
              <div className="mb-6">
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="font-semibold capitalize"
                >
                  File Format:
                </Typography>
                <Typography
                  variant="small"
                  className="font-normal text-blue-gray-500 uppercase"
                >
                  {resource.format}
                </Typography>
              </div>
            )}

            {resource.tags && resource.tags.length > 0 && (
              <div className="mb-6">
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="font-semibold capitalize"
                >
                  Tags:
                </Typography>
                <div className="flex flex-wrap gap-2 ">
                  {resource.tags.map((tag) => (
                    <Chip
                      key={tag}
                      value={tag}
                      className="bg-blue-gray-100 text-blue-gray-700 font-medium"
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6">
              <div className="mb-6">
                <Typography
                  variant="small"
                  color="blue-gray"
                  className="font-semibold capitalize"
                >
                  Content:
                </Typography>
                {renderResourceContent()}
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Recommended Resources */}
        <Card className="border border-blue-gray-100 shadow-sm p-4 flex-1">
          <CardBody>
            <div className="flex mb-2 justify-between items-center">
              <Typography
                variant="h6"
                className="font-semibold text-gray-800 mb-3"
              >
                Recommended Resources
              </Typography>
              <button
                className="mb-4 transition-transform duration-300 hover:rotate-90"
                onClick={handleRefresh}
              >
                <ArrowPathIcon className="h-5 w-5 text-gray-600" />
              </button>
            </div>

            <div
              ref={containerRef}
              className="flex gap-4 transition-all duration-300 overflow-hidden"
            >
              {loading ? (
                <p className="text-gray-500 text-sm">
                  Loading recommended resources...
                </p>
              ) : visibleResources.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  Couldn't recommend resources.
                </p>
              ) : (
                visibleResources.map((item) => (
                  <div key={item.id} className="flex-shrink-0 w-[350px]">
                    <ResourceCard resource={item} userId={userId} />
                  </div>
                ))
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="w-1/4">
        <Card className="border border-blue-gray-100 p-4 h-full shadow-md rounded-lg">
          <CardBody className="space-y-4">
            <Typography variant="h6" className="font-semibold text-gray-800">
              Recommended Modules
            </Typography>
            <div className="flex flex-col gap-3">
              {recommendedModules.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  {loading
                    ? "Loading recommended modules..."
                    : "Couldn't recommend modules."}
                </p>
              ) : (
                recommendedModules.map((item) => (
                  <LearningMDCard
                    key={item.id}
                    moduleItem={item}
                    className="p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
                  />
                ))
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default ResourceDetails;
