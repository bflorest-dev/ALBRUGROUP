import { lazy, Suspense, type ComponentType } from 'react';

/**
 * Problema #8: Lazy Loading & Code Splitting for Community Dashboard
 * 
 * Dynamically imports section components to reduce initial bundle size
 * Each section is loaded on-demand when needed
 * 
 * Sections are bundled separately:
 * - CampaignsSection → chunks/campaigns-section.[hash].js
 * - MetricsSection → chunks/metrics-section.[hash].js
 * - LeadsManagementSection → chunks/leads-section.[hash].js
 * - ModalsSection → chunks/modals-section.[hash].js
 * - DashboardSection → chunks/dashboard-section.[hash].js
 */

// Define lazy-loaded components
export const CampaignsSectionLazy = lazy(() =>
  import('../sections/CampaignsSection').then(mod => ({
    default: mod.CampaignsSection
  }))
);

export const MetricsSectionLazy = lazy(() =>
  import('../sections/MetricsSection').then(mod => ({
    default: mod.MetricsSection
  }))
);

export const LeadsManagementSectionLazy = lazy(() =>
  import('../sections/LeadsManagementSection').then(mod => ({
    default: mod.LeadsManagementSection
  }))
);

export const ModalsSectionLazy = lazy(() =>
  import('../sections/ModalsSection').then(mod => ({
    default: mod.ModalsSection
  }))
);

export const DashboardSectionLazy = lazy(() =>
  import('../sections/DashboardSection').then(mod => ({
    default: mod.DashboardSection
  }))
);

/**
 * Generic Loading Fallback Component
 * Shown while lazy component is being loaded
 */
export const LoadingFallback: ComponentType = () => (
  <div style={styles.loadingContainer}>
    <div style={styles.spinner} />
    <p style={styles.loadingText}>Cargando...</p>
  </div>
);

/**
 * Helper to wrap lazy components with Suspense
 * 
 * Usage:
 *   const CampaignsSectionWithSuspense = withSuspense(
 *     CampaignsSectionLazy,
 *     <CustomLoadingComponent />
 *   );
 */
export const withSuspense = <P extends Record<string, any> = Record<string, any>>(
  Component: ComponentType<P>,
  fallback = <LoadingFallback />
): ComponentType<P> => {
  const WithSuspenseComponent = (props: P) => (
    <Suspense fallback={fallback}>
      <Component {...props} />
    </Suspense>
  );
  WithSuspenseComponent.displayName = `withSuspense(${Component.displayName || Component.name || 'Component'})`;
  return WithSuspenseComponent;
};

const styles = {
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    minHeight: '200px',
    textAlign: 'center' as const
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #E5E7EB',
    borderTop: '4px solid #3B82F6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px'
  },
  loadingText: {
    margin: 0,
    fontSize: '14px',
    color: '#6B7280',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
  }
};

// CSS animation for spinner
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);
}
