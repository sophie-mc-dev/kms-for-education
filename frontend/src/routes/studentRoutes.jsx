import {
  HomeIcon,
  UserCircleIcon,
  ClipboardDocumentCheckIcon,
  ServerStackIcon,
  RectangleStackIcon,
  MagnifyingGlassIcon,
  BookOpenIcon
} from "@heroicons/react/24/solid";
import {
  Home,
  Profile,
  Tables,
  Notifications,
  Search,
  StudentResources,
  StudentLearningPath,
} from "@/pages/dashboard";
import { SignIn, SignUp } from "@/pages/auth";



const icon = {
  className: "w-5 h-5 text-inherit",
};

export const studentRoutes = [
  {
    layout: "dashboard",
    pages: [
      {
        icon: <HomeIcon {...icon} />,
        name: "dashboard",
        path: "/home",
        element: <Home />,
      },
      {
        icon: <MagnifyingGlassIcon {...icon} />,
        name: "search",
        path: "/search",
        element: <Search />,
      },
      {
        icon: <BookOpenIcon {...icon} />,
        name: "my resources",
        path: "/resources",
        element: <StudentResources />,
      },
      {
        icon: <ClipboardDocumentCheckIcon {...icon} />,
        name: "learning paths",
        path: "/learningpaths",
        element: <StudentLearningPath />,
      },
      {
        icon: <UserCircleIcon {...icon} />,
        name: "profile",
        path: "/profile",
        element: <Profile />,
      },
      
    ],
  },
  {
    title: "auth pages",
    layout: "auth",
    pages: [
      {
        icon: <ServerStackIcon {...icon} />,
        name: "sign in",
        path: "/sign-in",
        element: <SignIn />,
      },
      {
        icon: <RectangleStackIcon {...icon} />,
        name: "sign up",
        path: "/sign-up",
        element: <SignUp />,
      },
      // TODO: add logout button that takes user to homepage
    ],
  },
];

export default studentRoutes;
