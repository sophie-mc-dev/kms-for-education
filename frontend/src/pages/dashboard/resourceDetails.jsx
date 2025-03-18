import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  CardBody,
  Typography,
  Chip,
  Button,
} from "@material-tailwind/react";
import ReactMarkdown from "react-markdown";

export function ResourceDetails() {
  const { resourceId } = useParams();
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
          width="60%"
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
                Category:
              </Typography>
              <Typography
                variant="small"
                className="font-normal text-blue-gray-500"
              >
                {resource.category}
              </Typography>
            </div>

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

        {/* Related Resources */}
        <Card className="border border-blue-gray-100 p-4">
          <CardBody>
            <Typography variant="h6" className="font-semibold mb-2">
              Related Resources
            </Typography>
            <Typography variant="small" className="text-gray-600 italic">
              Related resources not available yet.
            </Typography>
          </CardBody>
        </Card>
      </div>

      <div className="w-1/4">
        <Card className="border border-blue-gray-100 p-4 h-full">
          <CardBody>
            <Typography variant="h6" className="font-semibold mb-2">
              Related Modules
            </Typography>
            <Typography variant="small" className="text-gray-600 italic">
              Modules that include this resource will be displayed here.
            </Typography>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default ResourceDetails;
