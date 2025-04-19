import {
  HomeIcon,
  UserCircleIcon,
  ServerStackIcon,
  RectangleStackIcon,
  BookOpenIcon,
  ClipboardDocumentCheckIcon,
  MagnifyingGlassIcon
} from "@heroicons/react/24/solid";
import {
  Home,
  Profile,
  EducatorResources,
  LearningPage,
  Search,
} from "@/pages/dashboard";
import { SignIn, SignUp } from "@/pages/auth";

const icon = {
  className: "w-5 h-5 text-inherit",
};

export const educatorRoutes = [
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
        name: "resources",
        path: "/resources",
        element: <EducatorResources />,
      },
      {
        icon: <ClipboardDocumentCheckIcon {...icon} />,
        name: "learning",
        path: "/learning",
        element: <LearningPage />,
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
    ],
  },
];

export default educatorRoutes;
