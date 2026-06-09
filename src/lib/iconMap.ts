import * as LucideIcons from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export const availableIcons = [
  'LayoutDashboard',
  'MessageSquare',
  'Users',
  'Users2',
  'Briefcase',
  'Settings',
  'Layers',
  'ShieldCheck',
  'Database',
  'FileText',
  'CreditCard',
  'Bell',
  'Bot',
  'Phone',
  'Video',
  'Mail',
  'Calendar',
  'Clock',
  'Search',
  'Plus',
  'Trash2',
  'Edit',
  'Save',
  'Download',
  'Upload',
  'Key',
  'Lock',
  'Unlock',
  'LogOut',
  'User',
  'Globe',
  'BarChart2',
  'PieChart',
  'Activity',
  'CheckCircle',
  'AlertCircle',
  'HelpCircle',
  'Info',
  'Star',
  'Heart',
  'Home',
  'Menu',
  'MoreHorizontal',
  'MoreVertical',
  'RefreshCw',
  'ExternalLink',
  'Zap',
  'Link',
  'Unlink',
  'Scale',
  'Contact',
  'Image',
  'GitBranch'
];

export function getIcon(iconName: string | null | undefined): LucideIcon {
  if (!iconName) return LucideIcons.Circle;
  const icon = (LucideIcons as any)[iconName];
  return icon || LucideIcons.Circle;
}
