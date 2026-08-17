import { Injectable, signal } from '@angular/core';
import { EstadoAsistencia } from '../../shared/models/schedule/estado-asistencia';

@Injectable({ providedIn: 'root' })
export class AttendanceStatusState {
  private readonly _status = signal<EstadoAsistencia>('OFFLINE');
  readonly status = this._status.asReadonly();

  update(status: EstadoAsistencia): void {
    this._status.set(status);
  }
}
