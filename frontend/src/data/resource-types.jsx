import {
  NewspaperIcon,
  BookOpenIcon,
  ClipboardDocumentIcon,
  DocumentTextIcon,
  TableCellsIcon,
  DeviceTabletIcon,
  AcademicCapIcon,
  PuzzlePieceIcon,
  VideoCameraIcon,
  PlayCircleIcon,
  PresentationChartBarIcon,
  BeakerIcon,
  ArchiveBoxIcon,
  FilmIcon,
  LinkIcon,
  WrenchScrewdriverIcon,
  CodeBracketSquareIcon,
  QuestionMarkCircleIcon,
  CursorArrowRaysIcon,
  CloudArrowDownIcon,
  FolderOpenIcon,
  LightBulbIcon,
} from "@heroicons/react/24/outline";

export const resourceTypes = [
  // Text-Based Resources
  { value: "Article", label: "Article", color: "orange", icon: <NewspaperIcon className="h-5 w-5" /> },
  { value: "Research Paper", label: "Research Paper", color: "indigo", icon: <BeakerIcon className="h-5 w-5" /> },
  { value: "Thesis", label: "Thesis / Dissertation", color: "blue", icon: <ArchiveBoxIcon className="h-5 w-5" /> },
  { value: "Report", label: "Report", color: "gray", icon: <BookOpenIcon className="h-5 w-5" /> },
  { value: "Book", label: "Book", color: "blue", icon: <BookOpenIcon className="h-5 w-5" /> },
  { value: "E-Book", label: "E-Book", color: "sky", icon: <DeviceTabletIcon className="h-5 w-5" /> },
  { value: "Documentation", label: "Documentation", color: "red", icon: <BookOpenIcon className="h-5 w-5" /> },
  { value: "Case Study", label: "Case Study", color: "green", icon: <ClipboardDocumentIcon className="h-5 w-5" /> },
  { value: "White Paper", label: "White Paper", color: "gray", icon: <DocumentTextIcon className="h-5 w-5" /> },

  // Multimedia Resources
  { value: "Video", label: "Video", color: "purple", icon: <VideoCameraIcon className="h-5 w-5" /> },
  { value: "Lecture Recording", label: "Lecture Recording", color: "purple", icon: <FilmIcon className="h-5 w-5" /> },
  { value: "Tutorial", label: "Tutorial (Video/Interactive)", color: "violet", icon: <PlayCircleIcon className="h-5 w-5" /> },
  { value: "Presentation Slides", label: "Presentation Slides", color: "green", icon: <PresentationChartBarIcon className="h-5 w-5" /> },

  // Interactive / Practice
  { value: "Cheat Sheet", label: "Cheat Sheet", color: "indigo", icon: <DocumentTextIcon className="h-5 w-5" /> },
  { value: "Exercise", label: "Exercise / Problem Set", color: "cyan", icon: <PuzzlePieceIcon className="h-5 w-5" /> },
  { value: "Project", label: "Project / Capstone", color: "yellow", icon: <WrenchScrewdriverIcon className="h-5 w-5" /> },
  { value: "Lab", label: "Lab / Practical", color: "amber", icon: <BeakerIcon className="h-5 w-5" /> },
  { value: "Code Example", label: "Code Example / Snippet", color: "lime", icon: <CodeBracketSquareIcon className="h-5 w-5" /> },

  // Reference & Support
  { value: "Glossary", label: "Glossary", color: "red", icon: <AcademicCapIcon className="h-5 w-5" /> },
  { value: "FAQ", label: "FAQ", color: "gray", icon: <QuestionMarkCircleIcon className="h-5 w-5" /> },
  { value: "Walkthrough", label: "Walkthrough / How-To", color: "teal", icon: <CursorArrowRaysIcon className="h-5 w-5" /> },

  // Data & Tools
  { value: "Dataset", label: "Dataset", color: "orange", icon: <TableCellsIcon className="h-5 w-5" /> },
  { value: "Tool", label: "Tool / Simulator", color: "fuchsia", icon: <LightBulbIcon className="h-5 w-5" /> },
  { value: "Software", label: "Software / App", color: "blue", icon: <CloudArrowDownIcon className="h-5 w-5" /> },

  // External
  { value: "Link", label: "External Link", color: "gray", icon: <LinkIcon className="h-5 w-5" /> },
  { value: "Repository", label: "Code Repository", color: "gray", icon: <FolderOpenIcon className="h-5 w-5" /> },
];
