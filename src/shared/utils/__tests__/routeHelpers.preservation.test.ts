import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { routeHelpers } from '../routeHelpers';

/**
 * Preservation Property Tests for routeHelpers.getRedirectPath()
 * 
 * These tests verify that existing role mappings continue to work correctly
 * on unfixed code. They establish a baseline of expected behavior that must
 * be preserved after the bugfix is implemented.
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8**
 */

describe('routeHelpers.preservation', () => {
  /**
   * Test 1: Verify ADMINISTRADOR role maps to /panel
   * 
   * Requirement 3.1: WHEN a user with role ADMINISTRADOR logs in successfully
   * THEN the system SHALL CONTINUE TO redirect to /panel
   */
  it('should map ADMINISTRADOR role to /panel', () => {
    const result = routeHelpers.getRedirectPath(['ADMINISTRADOR']);
    expect(result).toBe('/panel');
  });

  /**
   * Test 2: Verify RRHH role maps to /rrhh
   * 
   * Requirement 3.2: WHEN a user with role RRHH logs in successfully
   * THEN the system SHALL CONTINUE TO redirect to /rrhh
   */
  it('should map RRHH role to /rrhh', () => {
    const result = routeHelpers.getRedirectPath(['RRHH']);
    expect(result).toBe('/rrhh');
  });

  /**
   * Test 3: Verify RECLUTAMIENTO role maps to /reclutamiento
   * 
   * Requirement 3.3: WHEN a user with role RECLUTAMIENTO logs in successfully
   * THEN the system SHALL CONTINUE TO redirect to /reclutamiento
   */
  it('should map RECLUTAMIENTO role to /reclutamiento', () => {
    const result = routeHelpers.getRedirectPath(['RECLUTAMIENTO']);
    expect(result).toBe('/reclutamiento');
  });

  /**
   * Test 4: Verify RECLUTADOR role maps to /reclutamiento
   * 
   * Requirement 3.4: WHEN a user with role RECLUTADOR logs in successfully
   * THEN the system SHALL CONTINUE TO redirect to /reclutamiento
   */
  it('should map RECLUTADOR role to /reclutamiento', () => {
    const result = routeHelpers.getRedirectPath(['RECLUTADOR']);
    expect(result).toBe('/reclutamiento');
  });

  /**
   * Test 5: Verify CAPACITACIÓN role maps to /capacitacion
   * 
   * Requirement 3.5: WHEN a user with role CAPACITACIÓN logs in successfully
   * THEN the system SHALL CONTINUE TO redirect to /capacitacion
   */
  it('should map CAPACITACIÓN role to /capacitacion', () => {
    const result = routeHelpers.getRedirectPath(['CAPACITACIÓN']);
    expect(result).toBe('/capacitacion');
  });

  /**
   * Test 6: Verify COMMUNITY role maps to /community
   * 
   * Requirement 3.6: WHEN a user with role COMMUNITY logs in successfully
   * THEN the system SHALL CONTINUE TO redirect to /community
   */
  it('should map COMMUNITY role to /community', () => {
    const result = routeHelpers.getRedirectPath(['COMMUNITY']);
    expect(result).toBe('/community');
  });

  /**
   * Test 7: Verify GTR role maps to /gtr
   * 
   * Requirement 3.7: WHEN a user with role GTR logs in successfully
   * THEN the system SHALL CONTINUE TO redirect to /gtr
   */
  it('should map GTR role to /gtr', () => {
    const result = routeHelpers.getRedirectPath(['GTR']);
    expect(result).toBe('/gtr');
  });

  /**
   * Test 8: Verify ASESOR_DE_VENTAS role maps to /asesores
   * 
   * Requirement 3.8: WHEN a user with role ASESOR_DE_VENTAS logs in successfully
   * THEN the system SHALL CONTINUE TO redirect to /asesores
   */
  it('should map ASESOR_DE_VENTAS role to /asesores', () => {
    const result = routeHelpers.getRedirectPath(['ASESOR_DE_VENTAS']);
    expect(result).toBe('/asesores');
  });

  /**
   * Property-Based Test: Verify all existing mapped roles produce correct destinations
   * 
   * This property-based test generates multiple test cases to verify that
   * the role-to-route mapping is consistent and correct for all existing roles.
   * 
   * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8**
   */
  it('should consistently map all existing roles to their correct destinations (property-based)', () => {
    // Define the expected mappings for existing roles
    const expectedMappings: Record<string, string> = {
      'ADMINISTRADOR': '/panel',
      'RRHH': '/rrhh',
      'RECLUTAMIENTO': '/reclutamiento',
      'RECLUTADOR': '/reclutamiento',
      'CAPACITACIÓN': '/capacitacion',
      'COMMUNITY': '/community',
      'GTR': '/gtr',
      'ASESOR_DE_VENTAS': '/asesores',
    };

    const existingRoles = Object.keys(expectedMappings);

    // Property: For any existing role, getRedirectPath should return the expected destination
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: existingRoles.length - 1 }),
        (roleIndex) => {
          const role = existingRoles[roleIndex];
          const result = routeHelpers.getRedirectPath([role]);
          const expected = expectedMappings[role];

          // Assert that the result matches the expected mapping
          expect(result).toBe(expected);
        }
      )
    );
  });

  /**
   * Property-Based Test: Verify role priority when multiple roles are provided
   * 
   * When a user has multiple roles, the function should return the path for
   * the first role in the array that has a mapping.
   * 
   * **Validates: Requirements 3.1-3.8**
   */
  it('should return the path for the first mapped role when multiple roles are provided (property-based)', () => {
    const rolesList = [
      ['ADMINISTRADOR', 'RRHH'],
      ['RRHH', 'RECLUTAMIENTO'],
      ['RECLUTAMIENTO', 'COMMUNITY'],
      ['GTR', 'ASESOR_DE_VENTAS'],
      ['ASESOR_DE_VENTAS', 'ADMINISTRADOR'],
    ];

    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: rolesList.length - 1 }),
        (rolesIndex) => {
          const roles = rolesList[rolesIndex];
          const result = routeHelpers.getRedirectPath(roles);
          const firstRoleMapping = routeHelpers.getRedirectPath([roles[0]]);

          // Assert that the result matches the first role's mapping
          expect(result).toBe(firstRoleMapping);
        }
      )
    );
  });

  /**
   * Test: Verify fallback to /panel for unmapped roles
   * 
   * When a role is not in the mapping, the function should return the default
   * fallback route /panel. This is the current behavior on unfixed code.
   * 
   * Note: This test documents the current behavior for unmapped roles.
   * After the fix, unmapped roles like ASESOR_VENTAS, SUPERVISOR_VENTAS,
   * ASESOR_GTR, and ASESOR_BACKOFFICE should have explicit mappings.
   */
  it('should return /panel as fallback for unmapped roles', () => {
    const unmappedRoles = ['UNKNOWN_ROLE', 'INVALID_ROLE', 'NONEXISTENT'];

    unmappedRoles.forEach((role) => {
      const result = routeHelpers.getRedirectPath([role]);
      expect(result).toBe('/panel');
    });
  });

  /**
   * Test: Verify new backend roles are now correctly mapped
   * 
   * These roles are valid in the backend and are now mapped in routeHelpers.
   * After the fix, these roles should have explicit mappings:
   * - ASESOR_VENTAS → /asesores
   * - SUPERVISOR_VENTAS → /asesores
   * - ASESOR_GTR → /gtr
   * - ASESOR_BACKOFFICE → /panel
   * 
   * Requirement 2.3, 2.4, 2.5, 2.6: All valid backend roles map to correct routes
   */
  it('should map new backend roles to their correct destinations (ASESOR_VENTAS, SUPERVISOR_VENTAS, ASESOR_GTR, ASESOR_BACKOFFICE)', () => {
    // These are valid backend roles now mapped in routeHelpers
    const newRoleMappings: Record<string, string> = {
      'ASESOR_VENTAS': '/asesores',
      'SUPERVISOR_VENTAS': '/asesores',
      'ASESOR_GTR': '/gtr',
      'ASESOR_BACKOFFICE': '/panel',
    };

    // Verify each new role maps to its correct destination
    Object.entries(newRoleMappings).forEach(([role, expectedPath]) => {
      const result = routeHelpers.getRedirectPath([role]);
      expect(result).toBe(expectedPath);
    });
  });
});
