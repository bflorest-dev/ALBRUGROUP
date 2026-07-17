import { Injectable } from '@angular/core';
import { CampoTipificacion, LeadGtrResponse } from '../../../shared/models/preventa/preventa.models';

export type GtrHistoricosFiltersFormValue = {
  campoTipificacion: CampoTipificacion;
  tipificaciones: string[];
  subtipificaciones: string[];
  fechaDesde: string;
  fechaHasta: string;
};

export type GtrHistoricosState = {
  filters: GtrHistoricosFiltersFormValue;
  rows: LeadGtrResponse[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  searched: boolean;
  selectedIds: number[];
};

@Injectable({ providedIn: 'root' })
export class GtrHistoricosStateService {
  private state: GtrHistoricosState | null = null;

  get(): GtrHistoricosState | null {
    return this.state
      ? {
          ...this.state,
          filters: this.cloneFilters(this.state.filters),
          rows: [...this.state.rows],
          selectedIds: [...this.state.selectedIds]
        }
      : null;
  }

  set(state: GtrHistoricosState): void {
    this.state = {
      ...state,
      filters: this.cloneFilters(state.filters),
      rows: [...state.rows],
      selectedIds: [...state.selectedIds]
    };
  }

  clear(): void {
    this.state = null;
  }

  private cloneFilters(filters: GtrHistoricosFiltersFormValue): GtrHistoricosFiltersFormValue {
    return {
      ...filters,
      tipificaciones: [...filters.tipificaciones],
      subtipificaciones: [...filters.subtipificaciones]
    };
  }
}
