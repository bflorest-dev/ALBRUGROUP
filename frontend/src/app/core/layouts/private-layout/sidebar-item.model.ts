export type SidebarItem = {
  label: string;
  key?: string;
  route?: string;
  icon: string;
  badge?: string | number;
  alertActive?: boolean;
  alertLabel?: string;
  exact?: boolean;
  children?: SidebarItem[];
  startsGroup?: boolean;
};
