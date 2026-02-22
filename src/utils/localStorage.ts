// simple helpers for localStorage persistence

import type { Applicant } from '../types';

export const loadApplicantsFromStorage = (): Applicant[] | null => {
  try {
    const json = localStorage.getItem('applicantsData');
    if (!json) return null;
    return JSON.parse(json);
  } catch (e) {
    console.error('loadApplicantsFromStorage error', e);
    return null;
  }
};

export const saveApplicantsToStorage = (applicants: Applicant[]) => {
  try {
    localStorage.setItem('applicantsData', JSON.stringify(applicants));
    // notify any listeners that the applicants list changed
    window.dispatchEvent(new Event('applicantsUpdated'));
  } catch (e) {
    console.error('saveApplicantsToStorage error', e);
  }
};
