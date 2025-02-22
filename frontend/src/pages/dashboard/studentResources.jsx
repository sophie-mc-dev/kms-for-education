import React from "react";
import { Card, CardBody, Typography } from "@material-tailwind/react";
import { StarIcon, ClockIcon } from "@heroicons/react/24/solid";
import { exampleResources } from "@/data/exampleResources";
import { useNavigate } from "react-router-dom";

export function StudentResources() {
  const navigate = useNavigate();

  const ResourceSection = ({ title, icon: Icon, data, extraInfo }) => (
    <Card className="p-6 shadow-md border border-gray-200">
      <CardBody>
        <Typography variant="h6" color="blue-gray" className="mb-3 flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-blue-gray-500" />} {title}
        </Typography>
        <div className="flex overflow-x-auto space-x-4 p-2 snap-x">
          {data.map((resource) => (
            <Card
              key={resource.id}
              className="border border-blue-gray-100 shadow-sm min-w-[250px] cursor-pointer snap-start"
              onClick={() => navigate(`resources/${resource.id}`)}
            >
              <CardBody>
                <Typography variant="h6" className="mb-2 font-semibold">{resource.title}</Typography>
                {extraInfo ? extraInfo(resource) : <Typography className="text-sm text-gray-600">{resource.category}</Typography>}
              </CardBody>
            </Card>
          ))}
        </div>
      </CardBody>
    </Card>
  );

  return (
    <div className="p-6 flex flex-col gap-6">
      <ResourceSection title="Saved Resources" data={exampleResources} />
      <ResourceSection
        title="Recommended Resources"
        icon={StarIcon}
        data={exampleResources}
        extraInfo={(resource) => (
          <div className="flex items-center">
            <StarIcon className="h-5 w-5 text-yellow-500 mr-1" />
            <Typography>{resource.rating}</Typography>
          </div>
        )}
      />
      <ResourceSection
        title="Learning Path Resources"
        data={exampleResources}
        extraInfo={(resource) => <Typography className="text-sm text-gray-600">Path: {resource.path}</Typography>}
      />
      <ResourceSection
        title="Analyze Later"
        icon={ClockIcon}
        data={exampleResources}
        extraInfo={(resource) => (
          <div className="flex items-center mb-2">
            <ClockIcon className="h-5 w-5 text-gray-500 mr-2" />
            <Typography variant="h6" className="font-semibold">{resource.title}</Typography>
          </div>
        )}
      />
    </div>
  );
}

export default StudentResources;
