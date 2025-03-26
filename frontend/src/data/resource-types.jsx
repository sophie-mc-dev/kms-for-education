import {
  NewspaperIcon,
  BookOpenIcon,
  ClipboardDocumentIcon,
  DocumentTextIcon,
  TableCellsIcon,
  DeviceTabletIcon,
  AcademicCapIcon,
  ChartBarIcon,
  PuzzlePieceIcon,
  VideoCameraIcon,
  PlayCircleIcon,
  PresentationChartBarIcon,
  BeakerIcon,
  ArchiveBoxIcon,
  FilmIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";

export const resourceTypes = [
  { value: "Article", label: "Article", color: "orange", icon: <NewspaperIcon className="h-5 w-5" /> },
  { value: "Book", label: "Book", color: "blue", icon: <DeviceTabletIcon className="h-5 w-5" /> },
  { value: "Case Study", label: "Case Study", color: "green", icon: <ClipboardDocumentIcon className="h-5 w-5" /> },
  { value: "Cheat Sheet", label: "Cheat Sheet", color: "indigo", icon: <DocumentTextIcon className="h-5 w-5" /> },
  { value: "Dataset", label: "Dataset", color: "orange", icon: <TableCellsIcon className="h-5 w-5" /> },
  { value: "Documentation", label: "Documentation", color: "red", icon: <BookOpenIcon className="h-5 w-5" /> },
  { value: "E-Book", label: "E-Book", color: "blue", icon: <DeviceTabletIcon className="h-5 w-5" /> },
  { value: "Glossary", label: "Glossary", color: "red", icon: <AcademicCapIcon className="h-5 w-5" /> },
  { value: "Presentation Slides", label: "Presentation Slides", color: "green", icon: <PresentationChartBarIcon className="h-5 w-5" /> },
  { value: "Report", label: "Report", color: "gray", icon: <BookOpenIcon className="h-5 w-5" /> },
  { value: "Research Paper", label: "Research Paper", color: "indigo", icon: <BeakerIcon className="h-5 w-5" /> },
  { value: "Thesis", label: "Thesis / Dissertation", color: "blue", icon: <ArchiveBoxIcon className="h-5 w-5" /> },
  { value: "Video", label: "Video", color: "purple", icon: <VideoCameraIcon className="h-5 w-5" /> },
  { value: "Link", label: "Link", color: "gray", icon: <LinkIcon className="h-5 w-5" /> }
];

