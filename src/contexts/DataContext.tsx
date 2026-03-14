/**
 * DataContext - DEPRECATED
 * 
 * ⚠️ Este archivo ha sido deprecado.
 * 
 * La funcionalidad ha sido consolidada en ApplicantsContext.tsx
 * que ahora maneja tanto applicants como employees con localStorage sync.
 * 
 * MIGRACIÓN:
 * - Cambiar: import { useData } from './contexts/DataContext'
 * - Por:     import { useApplicants } from './contexts/ApplicantsContext'
 * 
 * La interfaz es la misma y proporciona los métodos legacy
 * (removeApplicant, hireApplicant) para compatibilidad.
 * 
 * Puede ser eliminado después de auditar que no hay referencias.
 */

// Re-export para compatibilidad temporal (si alguien lo sigue importando)
export { useApplicants as useData } from './ApplicantsContext';
export { ApplicantsProvider as DataProvider } from './ApplicantsContext';

