import React, { useState } from 'react';
import {
  Input,
  Chip,
  Card,
  CardBody,
  Typography,
} from '@material-tailwind/react';
import {
  VideoCameraIcon,
  DocumentTextIcon,
  PuzzlePieceIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { exampleResources } from '@/data/exampleResources';

export function Search() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState([]);
  const [tagFilter, setTagFilter] = useState([]);
  const [typeFilter, setTypeFilter] = useState('');

  const categories = ['Databases', 'Programming', 'Algorithms', 'Web Development'];
  const tags = [
    'SQL',
    'Database',
    'Java',
    'OOP',
    'Data Structures',
    'Exercises',
    'HTML',
    'CSS',
    'Javascript',
  ];
  const types = ['video', 'document', 'exercise', 'link'];

  const filteredResources = exampleResources.filter((resource) => {
    const searchMatch =
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase());

    const categoryMatch =
      categoryFilter.length > 0 ? categoryFilter.includes(resource.category) : true;

    const tagMatch =
      tagFilter.length > 0 ? resource.tags.some((tag) => tagFilter.includes(tag)) : true;

    const typeMatch = typeFilter ? resource.type === typeFilter : true;

    return searchMatch && categoryMatch && tagMatch && typeMatch;
  });

  const handleCategoryChange = (category) => {
    setCategoryFilter((prev) =>
      prev.includes(category) ? prev.filter((item) => item !== category) : [...prev, category]
    );
  };

  const handleTagChange = (tag) => {
    setTagFilter((prev) =>
      prev.includes(tag) ? prev.filter((item) => item !== tag) : [...prev, tag]
    );
  };

  const getIcon = (type) => {
    switch (type) {
      case 'video':
        return <VideoCameraIcon className="h-6 w-6 mr-2 text-red-500" />;
      case 'document':
        return <DocumentTextIcon className="h-6 w-6 mr-2 text-blue-500" />;
      case 'exercise':
        return <PuzzlePieceIcon className="h-6 w-6 mr-2 text-green-500" />;
      case 'link':
        return <LinkIcon className="h-6 w-6 mr-2 text-brown-500" />;
      default:
        return null;
    }
  };

  const getTypeColor = (type, isSelected) => {
    switch (type) {
      case 'video':
        return isSelected ? 'bg-red-500 text-white' : 'border-red-500 text-red-500';
      case 'document':
        return isSelected ? 'bg-blue-500 text-white' : 'border-blue-500 text-blue-500';
      case 'exercise':
        return isSelected ? 'bg-green-500 text-white' : 'border-green-500 text-green-500';
      case 'link':
        return isSelected ? 'bg-brown-500 text-white' : 'border-brown-500 text-brown-500';
      default:
        return '';
    }
  };

  return (
    <div className="p-4 grid grid-cols-4 gap-4">
      <Card className="col-span-4 mb-6 border border-gray-300 shadow-md rounded-lg">
        <CardBody className="space-y-6 p-6">
          <Input
            label="Search Resources"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-4"
          />
          <div className="mb-4">
            <div className="flex flex-wrap gap-3">
              {types.map((type) => {
                const isSelected = typeFilter === type;
                return (
                  <Chip
                    key={type}
                    value={
                      <span className="flex items-center">
                        {getIcon(type)}
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </span>
                    }
                    onClick={() => setTypeFilter(isSelected ? '' : type)}
                    variant={isSelected ? 'filled' : 'outlined'}
                    className={`cursor-pointer ${getTypeColor(type, isSelected)}`}
                  />
                );
              })}
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="col-span-3 border border-gray-300 shadow-md flex flex-col min-h-screen">
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filteredResources.map((resource) => (
              <Card
                key={resource.id}
                className="border border-blue-gray-100 shadow-sm cursor-pointer"
                onClick={() => navigate(`resources/${resource.id}`)}
              >
                <CardBody>
                  <div className="flex items-center mb-3">
                    {getIcon(resource.type)}
                    <Typography variant="small" color="blue-gray" className="ml-1">
                      {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
                    </Typography>
                  </div>
                  <Typography variant="h6" color="blue-gray" className="mb-2 font-semibold">
                    {resource.title}
                  </Typography>
                  <Typography variant="paragraph" color="blue-gray" className="mb-3 leading-relaxed">
                    {resource.description.substring(0, 70) + '...'}
                  </Typography>

                  <div className="flex flex-wrap gap-2 mb-2">
                    <Typography variant="caption" color="blue-gray" className="mr-1">
                      Author: <span className="font-semibold">{resource.author}</span>
                    </Typography>
                    <Typography variant="caption" color="blue-gray">
                      Category: <span className="font-semibold">{resource.category}</span>
                    </Typography>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {resource.tags.map((tag) => (
                      <Chip
                        key={tag}
                        value={tag}
                        size="sm"
                        className="bg-blue-gray-100 text-blue-gray-700 font-medium"
                      />
                    ))}
                  </div>
                </CardBody>
              </Card>
            ))}
          </div>
        </CardBody>
      </Card>

      <Card className="col-span-1 border border-gray-300 shadow-md flex flex-col min-h-screen">
        <CardBody>
          <Typography variant="h6" color="blue-gray" className="mb-2">
            Filters
          </Typography>
          <div className="mb-4">
            <Typography variant="small" color="blue-gray">
              Categories:
            </Typography>
            {categories.map((category) => (
              <div key={category} className="flex items-center">
                <input
                  className="cursor-pointer"
                  type="checkbox"
                  checked={categoryFilter.includes(category)}
                  onChange={() => handleCategoryChange(category)}
                />
                <Typography color="blue-gray" className="ml-2">
                  {category}
                </Typography>
              </div>
            ))}
          </div>

          <div className="mb-4">
            <Typography variant="small" color="blue-gray">
              Tags:
            </Typography>
            {tags.map((tag) => (
              <div key={tag} className="flex items-center">
                <input
                  className="cursor-pointer"
                  type="checkbox"
                  checked={tagFilter.includes(tag)}
                  onChange={() => handleTagChange(tag)}
                />
                <Typography color="blue-gray" className="ml-2">
                  {tag}
                </Typography>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

export default Search;