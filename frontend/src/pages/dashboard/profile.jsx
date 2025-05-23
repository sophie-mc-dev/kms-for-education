import { useEffect, useState } from "react";
import {
  Card,
  CardBody,
  Typography,
  Input,
  Spinner,
} from "@material-tailwind/react";
import { useUser } from "@/context/userContext";
import UserPreferencesForm from "@/widgets/layout/userPreferencesForm";

export function Profile() {
  const { userId } = useUser();
  const [user, setUser] = useState({
    first_name: "",
    last_name: "",
    email: "",
    user_role: "",
  });
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    educationLevel: "",
    fieldOfStudy: "",
    topicInterests: [],
    preferredContentTypes: [],
    languagePreference: "",
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) return;

      try {
        const response = await fetch(
          `http://localhost:8080/api/users/${userId}`
        );
        if (!response.ok) throw new Error("Failed to fetch user profile");

        const data = await response.json();
        setUser(data);

        setFormData({
          educationLevel: data.education_level || "",
          fieldOfStudy: data.field_of_study || "",
          topicInterests: data.topic_interests || [],
          preferredContentTypes: data.preferred_content_types || [],
          languagePreference: data.language_preference || "",
        });
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUser((prevUser) => ({ ...prevUser, [name]: value }));
  };

  const handleSave = async () => {
    const updatedData = {
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      user_role: user.user_role,
      education_level: formData.educationLevel,
      field_of_study: formData.fieldOfStudy,
      topic_interests: formData.topicInterests,
      preferred_content_types: formData.preferredContentTypes,
      language_preference: formData.languagePreference,
    };

    try {
      const response = await fetch(
        `http://localhost:8080/api/users/${userId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatedData),
        }
      );

      console.log(updatedData);

      if (!response.ok) throw new Error("Failed to update user profile");
      alert("Profile updated successfully");
    } catch (error) {
      console.error("Error updating user profile:", error);
      alert("Failed to update profile");
    }
  };

  // Helper: get initials for avatar
  const getInitials = () => {
    const first = user.first_name?.charAt(0) || "";
    const last = user.last_name?.charAt(0) || "";
    return (first + last).toUpperCase();
  };

  return (
    <>
      {/* Background header with overlay and user initials */}
      <div className="relative mt-8 h-72 w-full overflow-hidden rounded-xl bg-[url('/img/background-image.png')] bg-cover bg-center">
        {" "}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-transparent rounded-b-xl" />
        <div className="absolute bottom-4 left-6 flex items-center space-x-4">
          {/* Custom circle with initials */}
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-xl uppercase shadow-md select-none">
            {getInitials()}
          </div>
          <div>
            <Typography variant="h5" color="white" className="font-semibold">
              {user.first_name} {user.last_name}
            </Typography>
            <Typography
              variant="small"
              color="white"
              className="uppercase tracking-widest"
            >
              {user.user_role || "User"}
            </Typography>
          </div>
        </div>
      </div>

      {/* Main card container */}
      <Card className="max-w-3xl mx-auto -mt-4 mb-10 border border-blue-gray-100 shadow-md">
        <CardBody className="p-8">
          {isLoading ? (
            <Spinner className="text-center w-full" />
          ) : (
            <form
              className="flex flex-col space-y-6"
              onSubmit={(e) => {
                e.preventDefault();
                handleSave();
              }}
            >
              {/* Personal info section */}
              <section>
                <Typography className="text-xs font-semibold uppercase text-black mb-4">
                  Personal Information
                </Typography>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Input
                    label="First Name"
                    name="first_name"
                    value={user.first_name}
                    onChange={handleChange}
                    required
                  />
                  <Input
                    label="Last Name"
                    name="last_name"
                    value={user.last_name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <Input
                  label="Email"
                  name="email"
                  value={user.email}
                  disabled
                  className="mt-6"
                />
              </section>

              {/* User Preferences form */}
              <section>
                <Typography className="text-xs font-semibold uppercase text-black mb-2 mt-6">
                  Preferences
                </Typography>
                <UserPreferencesForm
                  formData={formData}
                  setFormData={setFormData}
                  onSubmit={handleSave}
                />
              </section>
            </form>
          )}
        </CardBody>
      </Card>
    </>
  );
}

export default Profile;
