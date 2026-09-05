import type { EstadoAsistencia } from '../../../shared/models/schedule/estado-asistencia';

export type AttendanceLogoutContext = {
  alwaysOnlineRole: boolean;
  statusConfirmed: boolean;
  status: EstadoAsistencia;
  shiftEnded: boolean;
};

export function shouldGuideAttendanceLogout(context: AttendanceLogoutContext): boolean {
  return (
    !context.alwaysOnlineRole &&
    context.statusConfirmed &&
    context.status === 'ONLINE' &&
    context.shiftEnded
  );
}
