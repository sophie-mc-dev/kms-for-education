import React from "react";
import { Card, CardBody, Typography, Chip } from "@material-tailwind/react";
import { ClockIcon } from "@heroicons/react/24/outline";
import { Bars3Icon } from "@heroicons/react/24/solid";

export function ModuleCard({ module, index }) {
  return (
    <Card className="border border-blue-gray-100 rounded-lg bg-blue-gray-50">
      <CardBody className="flex items-start justify-between gap-4">
        {/* Drag Handle */}
        <div className="flex items-center">
          <Bars3Icon className="h-6 w-6 text-blue-gray-500 cursor-grab" />
        </div>

        {/* Module Details */}
        <div className="flex-1">
          <Typography variant="h6" color="blue-gray" className="font-semibold">
            {`${index + 1}. ${module.title}`}
          </Typography>
          <Typography variant="small" className="text-blue-gray-600 mt-1">
            {module.description}
          </Typography>

          {/* Estimated Time & Resources */}
          <div className="flex gap-4 mt-2 text-sm text-blue-gray-500">
            <div className="flex items-center gap-1">
              <ClockIcon className="h-4 w-4 text-blue-gray-500" />
              <span>{module.estimated_time || "Unknown"} hours</span>
            </div>
            <div className="flex items-center gap-1">
              📚 <span>{module.resource_count || "0"} materials</span>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
