import React, { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import { Cog6ToothIcon } from "@heroicons/react/24/solid";
import { IconButton } from "@material-tailwind/react";
import { Sidenav, DashboardNavbar, Configurator } from "@/widgets/layout";
import { useMaterialTailwindController, setOpenConfigurator } from "@/context";
import { useUser } from "@/context/UserContext";
import {
  ResourceDetails,
  UploadResource,
  CreateLearningPath,
  CreateStudyPath,
  CreateModule,
  LearningPathDetails,
  ModuleDetails,
} from "@/pages/dashboard";

export function Dashboard() {
  const [controller, dispatch] = useMaterialTailwindController();
  const { sidenavType } = controller;
  const { userRole } = useUser();
  const [routes, setRoutes] = useState([]);

  // Dynamically import routes based on user role
  useEffect(() => {
    const loadRoutes = async () => {
      if (userRole === "educator") {
        const educatorRoutes = await import("@/routes/educatorRoutes");
        setRoutes(educatorRoutes.default);
      } else {
        const studentRoutes = await import("@/routes/studentRoutes");
        setRoutes(studentRoutes.default);
      }
    };
    loadRoutes();
  }, [userRole]);

  return (
    <div className="min-h-screen bg-blue-gray-50/50">
      <Sidenav
        routes={routes}
        brandImg={
          sidenavType === "dark" ? "/img/logo-ct.png" : "/img/logo-ct-dark.png"
        }
      />
      <div className="p-4 xl:ml-80">
        <DashboardNavbar />
        <Configurator />
        <IconButton
          size="lg"
          color="white"
          className="fixed bottom-8 right-8 z-40 rounded-full shadow-blue-gray-900/10"
          ripple={false}
          onClick={() => setOpenConfigurator(dispatch, true)}
        >
          <Cog6ToothIcon className="h-5 w-5" />
        </IconButton>
        <Routes>
          {routes.map(
            ({ layout, pages }) =>
              layout === "dashboard" &&
              pages.map(({ path, element }) => (
                <Route key={path} exact path={path} element={element} />
              ))
          )}
          <Route
            path="search/resources/:resourceId"
            element={<ResourceDetails />}
          />
          <Route
            path="home/resources/:resourceId"
            element={<ResourceDetails />}
          />
          <Route
            path="learning/module/:moduleId/resources/:resourceId"
            element={<ResourceDetails />}
          />
          <Route
            path="learning/learning-path/:learningPathId"
            element={<LearningPathDetails />}
          />
          <Route path="learning/module/:moduleId" element={<ModuleDetails />} />
          <Route
            path="search/upload-resource"
            element={<UploadResource />}
          />
          <Route
            path="learning/upload-learning-path"
            element={<CreateLearningPath />}
          />
          <Route
            path="learning/create-learning-path"
            element={<CreateStudyPath />}
          />
          <Route path="learning/upload-module" element={<CreateModule />} />
        </Routes>
        <div className="text-blue-gray-600">{/* <Footer /> */}</div>
      </div>
    </div>
  );
}

Dashboard.displayName = "/src/layout/dashboard.jsx";

export default Dashboard;
