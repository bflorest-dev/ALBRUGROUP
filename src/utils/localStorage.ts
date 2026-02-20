// simple helpers for localStorage persistence

export const loadApplicantsFromStorage = (): any[] | null => {
  try {
    const json = localStorage.getItem('applicantsData');
    if (!json) return null;
    return JSON.parse(json);
  } catch (e) {
    console.error('loadApplicantsFromStorage error', e);
    return null;
  }
};

export const saveApplicantsToStorage = (applicants: any[]) => {
  try {
    localStorage.setItem('applicantsData', JSON.stringify(applicants));
  } catch (e) {
    console.error('saveApplicantsToStorage error', e);
  }
};
