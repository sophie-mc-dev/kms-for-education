import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardBody,
  CardHeader,
  CardFooter,
  Button,
  Input,
  Select,
  Typography,
  Radio,
  Option,
} from "@material-tailwind/react";

import { XMarkIcon, CloudArrowUpIcon } from "@heroicons/react/24/solid";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

import { resourceTypes } from "@/data/resource-types.jsx";
import { resourceCategories } from "@/data/resource-categories";
import { useUser } from "@/context/userContext";

export function UploadResource() {
  const navigate = useNavigate();
  const { user, setUser } = useUser();
  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    url: "",
    type: "",
    category: "",
    tags: [],
    file: null,
    visibility: "public",
    estimatedTime: "",
  });

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // todo
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, file }));
    }
  };

  const handleDescriptionChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      description: value,
    }));
  };

  const handleTagInput = (e) => {
    setTagInput(e.target.value);
  };

  const handleKeyDown = (e) => {
    if ((e.key === "Enter" || e.key === " ") && tagInput.trim() !== "") {
      e.preventDefault();
      const newTag = tagInput.trim();

      if (!formData.tags.includes(newTag)) {
        setFormData((prev) => ({ ...prev, tags: [...prev.tags, newTag] }));
      }
      setTagInput("");
    }
  };

  const removeTag = (index) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }));
  };

  const validateForm = () => {
    let newErrors = {};

    if (!formData.title.trim()) newErrors.title = "Title is required";
    if (!formData.type) newErrors.type = "Type is required";
    if (!formData.category) newErrors.category = "Category is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    const formattedData = {
      ...formData,
      tags: formData.tags,
    };

    if (validateForm()) {
      console.log("Form submitted:", formattedData);
    }

    // const createdBy = `${user.first_name} ${user.last_name}`;
    const formDataToSend = new FormData();

    console.log(user);

    // Append text fields
    formDataToSend.append("title", formData.title);
    formDataToSend.append("description", formData.description);
    formDataToSend.append("url", formData.url);
    formDataToSend.append("type", formData.type);
    formDataToSend.append("category", formData.category);
    formDataToSend.append("created_by", "Sample Author");
    formDataToSend.append("visibility", formData.visibility);
    formDataToSend.append("estimatedTime", formData.estimatedTime);

    // Append file (if exists)
    if (formData.file) {
      formDataToSend.append("file", formData.file);
    }

    formData.tags.forEach((tag) => {
      formDataToSend.append("tags[]", tag);
    });

    // Debugging: Log FormData contents
    for (let pair of formDataToSend.entries()) {
      // console.log(pair[0], pair[1]);
    }

    try {
      const response = await fetch(
        "http://localhost:8080/api/resources/upload",
        {
          method: "POST",
          body: formDataToSend,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to upload resource");
      }

      setSuccessMessage("Resource uploaded successfully!");
      setFormData({
        title: "",
        description: "",
        url: "",
        type: "",
        category: "",
        tags: [],
        file: null,
        visibility: "public",
      });
      setTagInput("");
    } catch (error) {
      console.error("Upload error:", error);
      setErrorMessage("Failed to upload resource. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-12 flex justify-center">
      <Card className="w-full h-full border border-gray-300 shadow-md rounded-lg">
        <CardHeader
          floated={false}
          shadow={false}
          color="transparent"
          className="m-0 flex items-center justify-between p-6"
        >
          <Typography variant="h6" color="blue-gray">
            Upload New Resource
          </Typography>
        </CardHeader>

        <CardBody className="p-6 space-y-6">
          <div>
            <Input
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-2">{errors.title}</p>
            )}
          </div>

          <ReactQuill
            theme="snow"
            value={formData.description}
            onChange={handleDescriptionChange}
          />

          <Input
            label="URL"
            name="url"
            value={formData.url}
            onChange={handleInputChange}
          />

          <div className="flex gap-4">
            {/* Type Select */}
            <div className="flex-1">
              <Select
                label="Type"
                name="type"
                value={formData.type}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, type: value }))
                }
                required
              >
                <Option value="" disabled>
                  Select the resource format
                </Option>
                {resourceTypes.map((type) => (
                  <Option key={type.id} value={type.name}>
                    {type.name}
                  </Option>
                ))}
              </Select>
              {errors.type && (
                <p className="text-red-500 text-sm mt-2">{errors.type}</p>
              )}
            </div>

            {/* Category Select */}
            <div className="flex-1">
              <Select
                label="Category"
                name="category"
                value={formData.category}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, category: value }))
                }
                required
              >
                <Option value="" disabled>
                  Select a category
                </Option>
                {resourceCategories.map((category) => (
                  <Option key={category.id} value={category.name}>
                    {category.name}
                  </Option>
                ))}
              </Select>
              {errors.category && (
                <p className="text-red-500 text-sm mt-2">{errors.category}</p>
              )}
            </div>
          </div>

          <div>
            <div className="border border-gray-300 p-2 rounded-md w-full flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <div
                  key={index}
                  className="flex items-center bg-green-200 px-2 py-1 rounded-md"
                >
                  <span className="text-sm text-green-900">{tag}</span>
                  <button
                    onClick={() => removeTag(index)}
                    className="ml-1 text-green-700"
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={handleTagInput}
                onKeyDown={handleKeyDown}
                placeholder="Insert tags..."
                className="outline-none flex-1"
              />
            </div>
          </div>

          <div>
            <input
              type="file"
              name="file"
              // onChange={handleFileChange}
              className="mt-1 block w-full text-sm text-gray-500"
            />
          </div>

          <Input
            label="Estimated Time (minutes)"
            name="estimatedTime"
            type="number"
            min="1"
            value={formData.estimatedTime}
            onChange={handleInputChange}
          />

          <div>
            <div className="flex gap-4">
              <Radio
                label="Public"
                name="visibility"
                value="public"
                checked={formData.visibility === "public"}
                onChange={() =>
                  setFormData((prev) => ({ ...prev, visibility: "public" }))
                }
              />
              <Radio
                label="Private"
                name="visibility"
                value="private"
                checked={formData.visibility === "private"}
                onChange={() =>
                  setFormData((prev) => ({ ...prev, visibility: "private" }))
                }
              />
            </div>
          </div>
        </CardBody>

        <CardFooter className="flex flex-col items-center gap-4 p-6">
          <div className="flex gap-4">
            <Button
              variant="text"
              onClick={() => navigate("/dashboard/resources")}
            >
              Cancel
            </Button>
            <Button
              variant="filled"
              onClick={handleSubmit}
              className="flex items-center gap-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <CloudArrowUpIcon className="w-5 h-5" />
                  Upload Resource
                </>
              )}
            </Button>
          </div>

          {successMessage && (
            <div className="text-green-600 text-center">{successMessage}</div>
          )}
          {errorMessage && (
            <div className="text-red-600 text-center">{errorMessage}</div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

export default UploadResource;
