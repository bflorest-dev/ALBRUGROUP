/**
 * App Configuration - Providers & Contexts
 * 🔗 Re-exports global state providers for clean imports
 * 
 * Location: src/app/config/providers
 * All global contexts and providers should be imported from here
 */

// Re-export all providers from src/contexts
// Located: src/contexts/
export { ApplicantsProvider, useApplicants, useData } from '../../../contexts/ApplicantsContext';
export { DataProvider, useData as useDataProvider } from '../../../contexts/DataContext';
export { DevRoleProvider, useDevRole } from '../../../contexts/DevRoleContext';
export { NotificationProvider } from '../../../contexts/NotificationContext';
export { SidebarProvider, useSidebar } from '../../../contexts/SidebarContext';

// Re-export hooks  
export { useNotification } from '../../../contexts/useNotification';
