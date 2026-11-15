interface BaseMenuItem {
  id: string;
  label: string;
  disabled?: boolean;
  isLoading?: boolean;
}

export interface NavigationMenuItem extends BaseMenuItem {
  type: 'navigation';
  value?: string;
  onNavigate: () => void;
}

export interface ActionMenuItem extends BaseMenuItem {
  type: 'action';
  onAction: () => void;
  getStatusLabel?: () => Promise<string>;
}

export interface InfoMenuItem extends BaseMenuItem {
  type: 'info';
  value: string;
}

export interface ToggleMenuItem extends BaseMenuItem {
  type: 'toggle';
  description?: string;
  checked: boolean;
  onToggle: (checked: boolean) => void;
}

export type MenuItem =
  | NavigationMenuItem
  | ActionMenuItem
  | InfoMenuItem
  | ToggleMenuItem;

export interface MenuGroup {
  id: string;
  title: string;
  items: MenuItem[];
}
