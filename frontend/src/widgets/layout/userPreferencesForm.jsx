import Select from "react-select";
import { Button } from "@material-tailwind/react";
import { resourceCategories } from "@/data/resource-categories";
import { resourceTypes } from "@/data/resource-types.jsx";

const educationLevelOptions = [
  { value: "high_school", label: "High School" },
  { value: "bachelor", label: "Bachelor's Degree" },
  { value: "master", label: "Master's Degree" },
  { value: "phd", label: "PhD" },
  { value: "other", label: "Other" },
];

const fieldOfStudyOptions = [
  { value: "computer_science", label: "Computer Science" },
  { value: "electrical_engineering", label: "Electrical Engineering" },
  { value: "mechanical_engineering", label: "Mechanical Engineering" },
  { value: "civil_engineering", label: "Civil Engineering" },
  { value: "data_science", label: "Data Science" },
  { value: "mathematics", label: "Mathematics" },
  { value: "physics", label: "Physics" },
  { value: "other", label: "Other" },
];

const languageOptions = [
  { value: "english", label: "English" },
  { value: "portuguese", label: "Portuguese" },
  { value: "spanish", label: "Spanish" },
  { value: "french", label: "French" },
  { value: "german", label: "German" },
];

export default function UserPreferencesForm({
  formData,
  setFormData,
  onSubmit,
  onSkip,
  showSkip = false,
}) {
  const handleTopicsChange = (selectedValues) => {
    setFormData({
      ...formData,
      topicInterests: selectedValues.map((option) => option.label),
    });
  };

  const handleContentTypesChange = (selectedValues) => {
    setFormData({
      ...formData,
      preferredContentTypes: selectedValues.map((option) => option.value),
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <Select
        placeholder="Current Educational Level"
        value={educationLevelOptions.find(
          (opt) => opt.value === formData.educationLevel
        )}
        onChange={(opt) =>
          setFormData({ ...formData, educationLevel: opt.value })
        }
        options={educationLevelOptions}
      />

      <Select
        placeholder="Field of Study"
        value={fieldOfStudyOptions.find(
          (opt) => opt.value === formData.fieldOfStudy
        )}
        onChange={(opt) =>
          setFormData({ ...formData, fieldOfStudy: opt.value })
        }
        options={fieldOfStudyOptions}
      />

      <Select
        placeholder="Topic Interests"
        value={resourceCategories.filter((c) =>
          formData.topicInterests.includes(c.label)
        )}
        onChange={handleTopicsChange}
        options={resourceCategories}
        isMulti
        closeMenuOnSelect={false}
      />

      <Select
        placeholder="Preferred Content Types"
        value={resourceTypes.filter((c) =>
          formData.preferredContentTypes.includes(c.value)
        )}
        onChange={handleContentTypesChange}
        options={resourceTypes}
        isMulti
        closeMenuOnSelect={false}
      />

      <Select
        placeholder="Preferred Language"
        value={languageOptions.find(
          (opt) => opt.value === formData.languagePreference
        )}
        onChange={(opt) =>
          setFormData({ ...formData, languagePreference: opt.value })
        }
        options={languageOptions}
      />

      <Button type="button" onClick={onSubmit} fullWidth>
        Save Changes
      </Button>

      {showSkip && (
        <Button type="button" onClick={onSkip} variant="outlined" fullWidth>
          Do this later
        </Button>
      )}
    </div>
  );
}
