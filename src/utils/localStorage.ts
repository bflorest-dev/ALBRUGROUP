// simple helpers for localStorage persistence

import type { Applicant, Employee } from '@compartido/tipos';

export const loadApplicantsFromStorage = (): Applicant[] | null => {
  try {
    const json = localStorage.getItem('applicantsData');
    if (!json) return null;
    const applicants = JSON.parse(json) as Applicant[];
    // Remove duplicates by id
    const seen = new Set<string>();
    return applicants.filter((app) => {
      if (seen.has(app.id)) return false;
      seen.add(app.id);
      return true;
    });
  } catch (e) {
    console.error('loadApplicantsFromStorage error', e);
    return null;
  }
};

export const saveApplicantsToStorage = (applicants: Applicant[]) => {
  try {
    // Deduplicate by id before saving
    const seen = new Set<string>();
    const deduped = applicants.filter((app) => {
      if (seen.has(app.id)) return false;
      seen.add(app.id);
      return true;
    });
    localStorage.setItem('applicantsData', JSON.stringify(deduped));
    // notify any listeners that the applicants list changed
    window.dispatchEvent(new Event('applicantsUpdated'));
  } catch (e) {
    console.error('saveApplicantsToStorage error', e);
  }
};

// employee helpers (local-only storage during development)
export const loadEmployeesFromStorage = (): Employee[] | null => {
  try {
    const json = localStorage.getItem('employeesData');
    if (!json) return null;
    const employees = JSON.parse(json) as Employee[];
    const seen = new Set<string>();
    return employees.filter(emp => {
      if (seen.has(emp.id)) return false;
      seen.add(emp.id);
      return true;
    });
  } catch (e) {
    console.error('loadEmployeesFromStorage error', e);
    return null;
  }
};

export const saveEmployeesToStorage = (employees: Employee[]) => {
  try {
    const seen = new Set<string>();
    const deduped = employees.filter(emp => {
      if (seen.has(emp.id)) return false;
      seen.add(emp.id);
      return true;
    });
    localStorage.setItem('employeesData', JSON.stringify(deduped));
    window.dispatchEvent(new Event('employeesUpdated'));
  } catch (e) {
    console.error('saveEmployeesToStorage error', e);
  }
};

// Clear all app data from storage
export const clearAllStorage = () => {
  try {
    localStorage.removeItem('applicantsData');
    localStorage.removeItem('employeesData');
    localStorage.removeItem('sidebarCollapsed');
    window.dispatchEvent(new Event('applicantsUpdated'));
    window.dispatchEvent(new Event('employeesUpdated'));
  } catch (e) {
    console.error('clearAllStorage error', e);
  }
};

