import { describe, it, expect } from 'vitest';
import { routeHelpers } from '../routeHelpers';

/**
 * Bug Condition Exploration Tests for Unmapped Role Navigation
 * 
 * These tests verify that the four previously unmapped roles now navigate to their correct routes.
 * 
 * Before Phase 2.2 fix: These roles would redirect to `/panel` (incorrect fallback)
 * After Phase 2.2 fix: These roles should redirect to their correct role-specific routes
 * 
 * **Validates: Requirements 2.3, 2.4, 2.5, 2.6**
 */

describe('routeHelpers - Unmapped Role Navigation (Tasks 1.2-1.5)', () => {
  /**
   * Task 1.2: Test unmapped role navigation (ASESOR_VENTAS)
   * 
   * **Validates: Requirement 2.3**
   * 
   * WHEN a user with role `ASESOR_VENTAS` logs in successfully
   * THEN the system SHALL redirect to `/asesores` (the correct route for sales advisors)
   * 
   * Before Phase 2.2 fix: Would redirect to `/panel` (incorrect fallback)
   * After Phase 2.2 fix: Should redirect to `/asesores` (correct route)
   * 
   * This test FAILS on unfixed code (redirects to /panel instead of /asesores)
   * This test PASSES on fixed code (redirects to /asesores)
   */
  it('should redirect ASESOR_VENTAS role to /asesores (not /panel)', () => {
    const result = routeHelpers.getRedirectPath(['ASESOR_VENTAS']);
    
    // After fix: Should navigate to /asesores
    expect(result).toBe('/asesores');
    // Should NOT navigate to /panel (the old buggy behavior)
    expect(result).not.toBe('/panel');
  });

  /**
   * Task 1.3: Test unmapped role navigation (SUPERVISOR_VENTAS)
   * 
   * **Validates: Requirement 2.4**
   * 
   * WHEN a user with role `SUPERVISOR_VENTAS` logs in successfully
   * THEN the system SHALL redirect to `/asesores` (the correct route for sales supervisors)
   * 
   * Before Phase 2.2 fix: Would redirect to `/panel` (incorrect fallback)
   * After Phase 2.2 fix: Should redirect to `/asesores` (correct route)
   * 
   * This test FAILS on unfixed code (redirects to /panel instead of /asesores)
   * This test PASSES on fixed code (redirects to /asesores)
   */
  it('should redirect SUPERVISOR_VENTAS role to /asesores (not /panel)', () => {
    const result = routeHelpers.getRedirectPath(['SUPERVISOR_VENTAS']);
    
    // After fix: Should navigate to /asesores
    expect(result).toBe('/asesores');
    // Should NOT navigate to /panel (the old buggy behavior)
    expect(result).not.toBe('/panel');
  });

  /**
   * Task 1.4: Test unmapped role navigation (ASESOR_GTR)
   * 
   * **Validates: Requirement 2.5**
   * 
   * WHEN a user with role `ASESOR_GTR` logs in successfully
   * THEN the system SHALL redirect to `/gtr` (the correct route for GTR advisors)
   * 
   * Before Phase 2.2 fix: Would redirect to `/panel` (incorrect fallback)
   * After Phase 2.2 fix: Should redirect to `/gtr` (correct route)
   * 
   * This test FAILS on unfixed code (redirects to /panel instead of /gtr)
   * This test PASSES on fixed code (redirects to /gtr)
   */
  it('should redirect ASESOR_GTR role to /gtr (not /panel)', () => {
    const result = routeHelpers.getRedirectPath(['ASESOR_GTR']);
    
    // After fix: Should navigate to /gtr
    expect(result).toBe('/gtr');
    // Should NOT navigate to /panel (the old buggy behavior)
    expect(result).not.toBe('/panel');
  });

  /**
   * Task 1.5: Test unmapped role navigation (ASESOR_BACKOFFICE)
   * 
   * **Validates: Requirement 2.6**
   * 
   * WHEN a user with role `ASESOR_BACKOFFICE` logs in successfully
   * THEN the system SHALL redirect to `/panel` (the correct route for backoffice advisors)
   * 
   * Before Phase 2.2 fix: Would redirect to `/panel` (correct by accident, but unmapped)
   * After Phase 2.2 fix: Should redirect to `/panel` (correct route, now explicitly mapped)
   * 
   * This test PASSES on both unfixed and fixed code (because the correct route IS /panel)
   * However, the difference is that after the fix, the role is explicitly mapped instead of using the fallback.
   */
  it('should redirect ASESOR_BACKOFFICE role to /panel', () => {
    const result = routeHelpers.getRedirectPath(['ASESOR_BACKOFFICE']);
    
    // After fix: Should navigate to /panel (correct for this role)
    expect(result).toBe('/panel');
  });
});
