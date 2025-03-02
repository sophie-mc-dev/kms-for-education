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
  LearningPage,
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
        icon: <ClipboardDocumentCheckIcon {...icon} />,
        name: "learning",
        path: "/learning",
        element: <LearningPage />,
      },
      {
        icon: <BookOpenIcon {...icon} />,
        name: "resources",
        path: "/resources",
        element: <StudentResources />,
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
