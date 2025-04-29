import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  CardBody,
  Typography,
  Chip,
  Button,
} from "@material-tailwind/react";
import ReactMarkdown from "react-markdown";
import { LearningMDCard, ResourceCard } from "@/widgets/cards";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

export function ResourceDetails() {
  const { resourceId } = useParams();
  const [resource, setResource] = useState(null);
  const [recommendedModules, setRecommendedModules] = useState([]);
  const [recommendedResources, setRecommendedResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const containerRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [cardsPerRow, setCardsPerRow] = useState(1);

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

  useEffect(() => {
    const fetchRecommendedResources = async () => {
      try {
        const response = await fetch(
          `http://localhost:8080/api/recommendations/resources/${resourceId}`
        );
        const data = await response.json();
        setRecommendedResources((prev) => [...prev, ...data]);
      } catch (error) {
        console.error("Error fetching recommended resources:", error);
      }
    };
    fetchRecommendedResources();
  }, []);

  useEffect(() => {
    const calculateCardsPerRow = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const maxCards = Math.floor(containerWidth / 250);
        setCardsPerRow(maxCards || 1);
      }
    };

    calculateCardsPerRow();
    window.addEventListener("resize", calculateCardsPerRow);
    return () => window.removeEventListener("resize", calculateCardsPerRow);
  }, []);

  const handleRefresh = () => {
    const totalPages = Math.ceil(recommendedResources.length / cardsPerRow);
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

    if (/\.(jpg|jpeg|png|gif)$/i.test(url)) {
      return (
        <img
          src={url}
          alt={resource.title}
          className="max-w-full h-auto rounded-md shadow-md"
        />
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
          {/* <Button
            color="blue-gray"
            className="mt-2"
            onClick={() => window.open(url)}
          >
            Open PDF
          </Button> */}
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
            <div className="flex items-center mb-2">
              <Typography
                variant="h4"
                color="blue-gray"
                className="font-semibold"
              >
                {resource.title}
              </Typography>
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

            <div className="mb-6 font-normal text-blue-gray-900">
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
                    <ResourceCard resource={item} />
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
