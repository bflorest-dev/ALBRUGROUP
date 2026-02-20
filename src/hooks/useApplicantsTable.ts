import { useState, useMemo, useCallback } from 'react';
import type { Applicant } from '../types';

export const useApplicantsTable = (applicants: Applicant[]) => {
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({
    name: '',
    documentType: '',
    documentNumber: '',
    position: '',
    phone: '',
    campaign: '',
    company: '',
    status: '',
  });

  const handleFilterChange = useCallback((filterKey: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({
      name: '',
      documentType: '',
      documentNumber: '',
      position: '',
      phone: '',
      campaign: '',
      company: '',
      status: '',
    });
  }, []);

  const filteredApplicants = useMemo(() => {
    let result = applicants.filter(app => {
      if (filters.name && !app.fullName.toLowerCase().includes(filters.name.toLowerCase())) return false;
      if (filters.documentType && app.documentType !== filters.documentType) return false;
      if (filters.documentNumber && !app.documentNumber.includes(filters.documentNumber)) return false;
      if (filters.position && app.positionOfInterest !== filters.position) return false;
      if (filters.phone && !app.phoneMobile.includes(filters.phone)) return false;
      if (filters.campaign && app.campaign !== filters.campaign) return false;
      if (filters.company && app.company !== filters.company) return false;
      if (filters.status && app.status !== filters.status) return false;
      return true;
    });

    if (sortOrder) {
      result = [...result].sort((a, b) => {
        const aName = a.fullName.toLowerCase();
        const bName = b.fullName.toLowerCase();
        return sortOrder === 'asc' ? aName.localeCompare(bName) : bName.localeCompare(aName);
      });
    }

    return result;
  }, [applicants, filters, sortOrder]);

  const hasActiveFilters = useMemo(
    () => Object.values(filters).some(f => f !== ''),
    [filters]
  );

  const uniqueDocTypes = useMemo(
    () => Array.from(new Set(applicants.map(app => app.documentType))),
    [applicants]
  );
  const uniquePositions = useMemo(
    () => Array.from(new Set(applicants.map(app => app.positionOfInterest))),
    [applicants]
  );
  const uniqueCampaigns = useMemo(
    () => Array.from(new Set(applicants.map(app => app.campaign))),
    [applicants]
  );
  const uniqueCompanies = useMemo(
    () => Array.from(new Set(applicants.map(app => app.company))),
    [applicants]
  );
  const uniqueStatuses = useMemo(
    () => Array.from(new Set(applicants.map(app => app.status))),
    [applicants]
  );

  return {
    filteredApplicants,
    sortOrder,
    setSortOrder,
    activeFilter,
    setActiveFilter,
    filters,
    handleFilterChange,
    handleClearFilters,
    hasActiveFilters,
    uniqueDocTypes,
    uniquePositions,
    uniqueCampaigns,
    uniqueCompanies,
    uniqueStatuses,
  };
};
