import { useEffect, useState } from "react";
import {
  Card,
  CardBody,
  Typography,
  Tabs,
  TabsHeader,
  Tab,
  Tooltip,
} from "@material-tailwind/react";
import { HomeIcon, Cog6ToothIcon, PencilIcon } from "@heroicons/react/24/solid";
import { ProfileInfoCard } from "@/widgets/cards";
import { useUser } from "@/context/userContext";

export function Profile() {
  const { userId } = useUser();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) {
        console.warn("No userId available, skipping fetch.");
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:8080/api/users/${userId}`
        );
        if (!response.ok) throw new Error("Failed to fetch user profile");

        const data = await response.json();
        // console.log("Fetched user data:", data); 
        setUser(data);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    fetchUserProfile();
  }, [userId]); 

  return (
    <>
      <div className="relative mt-8 h-72 w-full overflow-hidden rounded-xl bg-[url('/img/background-image.png')] bg-cover bg-center">
        <div className="absolute inset-0 h-full w-full bg-gray-900/75" />
      </div>

      <Card className="mx-8 -mt-16 mb-6 lg:mx-4 border border-blue-gray-100">
        <CardBody className="p-4">
          <div className="mb-10 flex items-center justify-between flex-wrap gap-6">
            <div className="flex items-center gap-6">
              <div>
                <Typography variant="h5" color="blue-gray" className="mb-1">
                  {user ? `${user.first_name} ${user.last_name}` : "Loading..."}
                </Typography>

                <Typography
                  variant="small"
                  className="font-normal text-blue-gray-600"
                >
                  {user?.user_role
                    ? user.user_role.charAt(0).toUpperCase() +
                      user.user_role.slice(1)
                    : "User Role"}
                </Typography>
              </div>
            </div>

            <div className="w-96">
              <Tabs value="app">
                <TabsHeader>
                  <Tab value="app">
                    <HomeIcon className="-mt-1 mr-2 inline-block h-5 w-5" />
                    App
                  </Tab>
                  <Tab value="settings">
                    <Cog6ToothIcon className="-mt-1 mr-2 inline-block h-5 w-5" />
                    Settings
                  </Tab>
                </TabsHeader>
              </Tabs>
            </div>
          </div>

          <div className="grid-cols-1 mb-12 grid gap-12 px-4 lg:grid-cols-2 xl:grid-cols-3">
            <ProfileInfoCard
              title="Profile Information"
              details={{
                "Full Name": user ? `${user.first_name} ${user.last_name}` : "N/A",
                Email: user?.email || "N/A",
              }}
              action={
                <Tooltip content="Edit Profile">
                  <PencilIcon className="h-4 w-4 cursor-pointer text-blue-gray-500" />
                </Tooltip>
              }
            />
          </div>
        </CardBody>
      </Card>
    </>
  );
}

export default Profile;
