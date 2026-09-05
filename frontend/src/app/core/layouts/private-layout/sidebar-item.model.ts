export type SidebarItem = {
  label: string;
  key?: string;
  domainId?: string;
  route?: string;
  icon: string;
  badge?: string | number;
  alertActive?: boolean;
  alertLabel?: string;
  exact?: boolean;
  children?: SidebarItem[];
  startsGroup?: boolean;
};

export type SidebarDomainDefinition = {
  id: string;
  label: string;
  description: string;
  icon: string;
};

export type SidebarProviderOption = {
  id: number;
  nombre: string;
};
