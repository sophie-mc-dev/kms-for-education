import { useEffect, useState } from "react";
import {
  Card,
  CardBody,
  Typography,
  Input,
  Button,
} from "@material-tailwind/react";
import { HomeIcon, Cog6ToothIcon, PencilIcon } from "@heroicons/react/24/solid";
import { ProfileInfoCard } from "@/widgets/cards";
import { useUser } from "@/context/userContext";

export function Profile() {
  const { userId } = useUser();
  const [user, setUser] = useState({
    first_name: "",
    last_name: "",
    email: "",
    user_role: "",
  });  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) {
        console.warn("No userId available, skipping fetch.");
        return;
      }

      try {
        const response = await fetch(`http://localhost:8080/api/users/${userId}`);
        if (!response.ok) throw new Error("Failed to fetch user profile");

        const data = await response.json();
        setUser(data);
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
    try {
      const response = await fetch(`http://localhost:8080/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(user),
      });

      if (!response.ok) throw new Error("Failed to update user profile");
      alert("Profile updated successfully");
    } catch (error) {
      console.error("Error updating user profile:", error);
      alert("Failed to update profile");
    }
  };
  return (
    <>
      <div className="relative mt-8 h-72 w-full overflow-hidden rounded-xl bg-[url('/img/background-image.png')] bg-cover bg-center">
        <div className="absolute inset-0 h-full w-full bg-gray-900/75" />
      </div>

      <Card className="mx-8 -mt-16 mb-6 lg:mx-4 border border-blue-gray-100">
          <CardBody className="flex flex-col items-center">
          {isLoading ? (
            <Typography variant="small">Loading...</Typography>
          ) : (
            <form className="flex flex-col items-center space-y-4 w-64">
              <Input
                label="First Name"
                name="first_name"
                value={user.first_name}
                onChange={handleChange}
              />
              <Input
                label="Last Name"
                name="last_name"
                value={user.last_name}
                onChange={handleChange}
              />
              <Input
                label="Email"
                name="email"
                value={user.email}
                onChange={handleChange}
                disabled
              />
              <Button color="gray" className="w-40 mt-4" onClick={handleSave}>
                Save Changes
              </Button>
            </form>
          )}
        </CardBody>
      </Card>
    </>
  );
}

export default Profile;
