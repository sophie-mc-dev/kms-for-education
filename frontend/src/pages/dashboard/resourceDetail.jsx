import React from 'react';
import { useParams } from 'react-router-dom';
import {
  Card,
  CardBody,
  Typography,
  Chip,
  Button,
} from '@material-tailwind/react';
import {
  VideoCameraIcon,
  DocumentTextIcon,
  PuzzlePieceIcon,
  LinkIcon,
  CodeBracketSquareIcon,
  BriefcaseIcon,
} from '@heroicons/react/24/outline';
import { exampleResources } from '@/data/exampleResources';

export function ResourceDetail() {
  const { resourceId } = useParams();
  const resource = exampleResources.find((res) => res.id === parseInt(resourceId));

  if (!resource) {
    return <div className="p-4">Resource not found</div>;
  }

  const getIcon = (type) => {
    switch (type) {
      case 'video': return <VideoCameraIcon className="h-6 w-6 mr-2 text-red-500" />;
      case 'document': return <DocumentTextIcon className="h-6 w-6 mr-2 text-blue-500" />;
      case 'exercise': return <PuzzlePieceIcon className="h-6 w-6 mr-2 text-green-500" />;
      case 'link': return <LinkIcon className="h-6 w-6 mr-2 text-purple-500" />;
      case 'tutorial': return <CodeBracketSquareIcon className="h-6 w-6 mr-2 text-yellow-500" />;
      case 'dataset': return <CodeBracketSquareIcon className="h-6 w-6 mr-2 text-orange-500" />;
      case 'case-study': return <BriefcaseIcon className="h-6 w-6 mr-2 text-teal-500" />;
      default: return null;
    }
  };

  const relatedResources = exampleResources
    .filter((res) => res.category === resource.category && res.id !== resource.id)
    .slice(0, 3);

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="md:w-3/4">
          <Card className="border border-gray-200 shadow-md p-4 flex flex-col min-h-screen">
            <CardBody className="flex-grow">
            <div className="flex items-center mb-6">
    {getIcon(resource.type)}
    <Typography variant="h4" color="blue-gray" className="font-semibold ml-2">
      {resource.title}
    </Typography>
  </div>

  <Typography variant="paragraph" color="blue-gray" className="mb-6 leading-relaxed">
    {resource.description}
  </Typography>

  <div className="mb-6">
    <div className="flex flex-wrap gap-4">
      <div className="flex items-center">
        <Typography variant="small" color="blue-gray" className="font-semibold mr-1">
          Category:
        </Typography>
        <Typography variant="small" color="blue-gray">
          {resource.category}
        </Typography>
      </div>
      <div className="flex items-center">
        <Typography variant="small" color="blue-gray" className="font-semibold mr-1">
          Type:
        </Typography>
        <Typography variant="small" color="blue-gray">
          {resource.type}
        </Typography>
      </div>
      <div className="flex items-center">
        <Typography variant="small" color="blue-gray" className="font-semibold mr-1">
          Author:
        </Typography>
        <Typography variant="small" color="blue-gray">
          {resource.author}
        </Typography>
      </div>
    </div>
  </div>

  <div className="mb-6">
    <Typography variant="small" color="blue-gray" className="font-semibold mb-2">
      Tags:
    </Typography>
    <div className="flex flex-wrap gap-2">
      {resource.tags.map((tag) => (
        <Chip
          key={tag}
          value={tag}
          className="bg-blue-gray-100 text-blue-gray-700 font-medium"
        />
      ))}
    </div>
  </div>
              {resource.type === 'link' && (
                <Button color="blue-gray" onClick={() => window.open(resource.url, '_blank', 'noopener, noreferrer')} className="mt-4">
                  Visit Resource
                </Button>
              )}
              {resource.type === 'video' && (
                <iframe title={resource.title} width="100%" height="315" src={resource.url} allowFullScreen></iframe>
              )}
              {resource.type === 'document' && (
                <iframe title={resource.title} src={resource.url} width="100%" height="600px"></iframe>
              )}
              {resource.type === 'exercise' && (
                <Typography variant="paragraph">Exercise content and submission form will be here...</Typography>
              )}
            </CardBody>
          </Card>
        </div>
        <div className="md:w-1/4">
          <Card className="border border-gray-200 shadow-md p-4 flex flex-col min-h-screen">
            <CardBody className="flex-grow">
              <Typography variant="h6" className="font-semibold mb-2">Related Resources</Typography>
              {relatedResources.map((related) => (
                <div key={related.id} className="mb-2">
                  <Typography variant="body2" className="font-semibold">{related.title}</Typography>
                  <Typography variant="small" className="text-gray-600">{related.description.substring(0, 50)}...</Typography>
                </div>
              ))}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default ResourceDetail;
