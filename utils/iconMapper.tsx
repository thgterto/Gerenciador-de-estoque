
import React from 'react';
import {
  PlusIcon,
  DeleteIcon,
  EditIcon,
  CheckIcon,
  AlertCircleIcon,
  InfoIcon,
  SearchIcon,
  FilterIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  MenuHorizontalIcon,
  XIcon,
  HomeIcon,
  CalendarIcon,
  ClockIcon,
  PersonIcon,
  ExitIcon,
  SettingsIcon,
  ImportIcon,
  ExportIcon,
  SaveIcon,
  PrintIcon,
  DuplicateIcon,
  ViewIcon,
  ExternalIcon
} from '@shopify/polaris-icons';

export const iconMap: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  add: PlusIcon,
  plus: PlusIcon,
  delete: DeleteIcon,
  trash: DeleteIcon,
  remove: DeleteIcon,
  edit: EditIcon,
  check: CheckIcon,
  success: CheckIcon,
  alert: AlertCircleIcon,
  error: AlertCircleIcon,
  warning: AlertCircleIcon, // Polaris uses similar icons for alerts
  info: InfoIcon,
  search: SearchIcon,
  filter: FilterIcon,
  back: ArrowLeftIcon,
  forward: ArrowRightIcon,
  'chevron-down': ChevronDownIcon,
  'chevron-up': ChevronUpIcon,
  'chevron-right': ChevronRightIcon,
  'chevron-left': ChevronLeftIcon,
  more: MenuHorizontalIcon,
  close: XIcon,
  cancel: XIcon,
  home: HomeIcon,
  calendar: CalendarIcon,
  clock: ClockIcon,
  user: PersonIcon,
  logout: ExitIcon,
  settings: SettingsIcon,
  upload: ImportIcon,
  download: ExportIcon,
  save: SaveIcon,
  print: PrintIcon,
  copy: DuplicateIcon,
  view: ViewIcon,
  external: ExternalIcon
};

export const getIcon = (name?: string) => {
  if (!name) return undefined;
  // Normalize name (lowercase, replace underscores with dashes, etc if needed)
  const normalized = name.toLowerCase().replace(/_/g, '-');
  return iconMap[normalized] || undefined;
};
