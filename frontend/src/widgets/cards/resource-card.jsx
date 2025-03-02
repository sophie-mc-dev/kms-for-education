import React, { useState } from "react";
import {
  Card,
  CardBody,
  Typography,
  Chip,
  IconButton,
} from "@material-tailwind/react";
import { BookmarkIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { resourceTypes } from "@/data/resource-types.jsx";

const colorMap = {
  gray: { bg: "bg-gray-100", text: "text-gray-600" },
  blue: { bg: "bg-blue-100", text: "text-blue-600" },
  green: { bg: "bg-green-100", text: "text-green-600" },
  indigo: { bg: "bg-indigo-100", text: "text-indigo-600" },
  purple: { bg: "bg-purple-100", text: "text-purple-600" },
  orange: { bg: "bg-orange-100", text: "text-orange-600" },
  red: { bg: "bg-red-100", text: "text-red-600" },
  yellow: { bg: "bg-yellow-100", text: "text-yellow-600" },
  teal: { bg: "bg-teal-100", text: "text-teal-600" },
};

export function ResourceCard({ resource }) {
  const navigate = useNavigate();
  const [bookmarked, setBookmarked] = useState(false);

  const resourceData =
    resourceTypes.find((r) => r.name === resource.type) || {};
  const { icon, color = "gray" } = resourceData;

  const { bg, text } = colorMap[color];

  return (
    <Card
      className="border border-blue-gray-100 shadow-sm cursor-pointer hover:shadow-md transition h-full min-h-[250px] flex flex-col"
      onClick={() => navigate(`resources/${resource.id}`)}
    >
      <div
        className="absolute top-2 right-2"
        onClick={(e) => e.stopPropagation()}
      >
        <IconButton
          variant="text"
          className="text-blue-gray-500 hover:text-blue-gray-700"
          onClick={() => setBookmarked(!bookmarked)}
        >
          <BookmarkIcon
            className={`h-6 w-6 ${bookmarked ? "fill-blue-gray-700" : ""}`}
          />
        </IconButton>
      </div>

      <CardBody className="flex flex-col h-full">
        {/* Type Badge */}
        <div
          className={`inline-flex items-center mb-3 px-2 py-1 rounded-md w-fit ${bg}`}
        >
          {React.cloneElement(icon, { className: `h-5 w-5 ${text}` })}
          <Typography variant="small" className={`ml-2 font-medium ${text}`}>
            {resource.type}
          </Typography>
        </div>

        {/* Title and Description */}
        <Typography
          variant="h6"
          color="blue-gray"
          className="mb-2 font-semibold"
        >
          {resource.title}
        </Typography>
        <Typography
          variant="paragraph"
          color="blue-gray"
          className="mb-3 leading-relaxed"
        >
          <span
            dangerouslySetInnerHTML={{
              __html:
                resource.description.length > 70
                  ? resource.description.substring(0, 70) + "..."
                  : resource.description,
            }}
          ></span>
        </Typography>

        {/* Bottom-aligned container for Category & Tags */}
        <div className="mt-auto">
          <div className="flex flex-wrap gap-2 text-sm mb-2">
            <Typography variant="small" color="blue-gray">
              <span className="font-semibold">Category:</span>{" "}
              {resource.category}
            </Typography>
          </div>
          <div
            className="flex flex-wrap gap-1"
            onClick={(e) => e.stopPropagation()}
          >
            {resource.tags?.map((tag) => (
              <Chip
                key={tag}
                value={tag}
                size="sm"
                className="bg-blue-gray-100 text-blue-gray-700 font-medium"
              />
            ))}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
