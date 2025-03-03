import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Card,
  CardBody,
  Typography,
  Chip,
  Button,
} from "@material-tailwind/react";

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

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error || !resource) {
    return (
      <div className="p-4 text-red-500">{error || "Resource not found"}</div>
    );
  }

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
                  Authored By:
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
                Type:
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
              <Typography
                variant="small"
                color="blue-gray"
                className="font-semibold capitalize"
              >
                Content:
                {/* show files, links, embedded videos, exercises, etc... */}
              </Typography>
              <Button
                color="blue-gray"
                onClick={() =>
                  window.open(resource.url, "_blank", "noopener, noreferrer")
                }
              >
                View Now
              </Button>
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
              Related Learning Paths
            </Typography>
            <Typography variant="small" className="text-gray-600 italic">
              Learning paths that include this resource will be displayed here.
            </Typography>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

export default ResourceDetails;
