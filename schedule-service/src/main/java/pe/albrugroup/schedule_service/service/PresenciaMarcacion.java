package pe.albrugroup.schedule_service.service;

import pe.albrugroup.schedule_service.entity.Asistencia;
import pe.albrugroup.schedule_service.entity.AsistenciaTramo;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Presencia por marcaciones: tiempo entre la marca de ingreso y la de salida del dia,
 * sumando los tramos archivados de un dia partido. Es la base "fisica" de asistencia,
 * independiente del tiempo productivo/conectado que vive en {@code minutosTrabajados}.
 *
 * - bruta: ventana ingreso->salida (incluye almuerzo). La marca de salida ya viene topada
 *   en la salida programada, asi que las estancias tardias no inflan el valor.
 * - neta: bruta menos el almuerzo tomado (lo que se muestra como "horas trabajadas").
 */
public final class PresenciaMarcacion {

    private PresenciaMarcacion() {
    }

    public static int bruta(Asistencia asistencia, List<AsistenciaTramo> tramosArchivados) {
        int total = asistencia == null
                ? 0
                : minutosEntre(asistencia.getFechaHoraIngreso(), asistencia.getFechaHoraSalida());
        if (tramosArchivados != null) {
            for (AsistenciaTramo tramo : tramosArchivados) {
                total += minutosEntre(tramo.getFechaHoraIngreso(), tramo.getFechaHoraSalida());
            }
        }
        return total;
    }

    public static int almuerzo(Asistencia asistencia, List<AsistenciaTramo> tramosArchivados) {
        int total = asistencia == null ? 0 : nvl(asistencia.getMinutosAlmuerzoTomados());
        if (tramosArchivados != null) {
            for (AsistenciaTramo tramo : tramosArchivados) {
                total += nvl(tramo.getMinutosAlmuerzoTomados());
            }
        }
        return total;
    }

    public static int neta(Asistencia asistencia, List<AsistenciaTramo> tramosArchivados) {
        return Math.max(bruta(asistencia, tramosArchivados) - almuerzo(asistencia, tramosArchivados), 0);
    }

    private static int minutosEntre(LocalDateTime inicio, LocalDateTime fin) {
        if (inicio == null || fin == null || !fin.isAfter(inicio)) {
            return 0;
        }
        return (int) Duration.between(inicio, fin).toMinutes();
    }

    private static int nvl(Integer value) {
        return value == null ? 0 : value;
    }
}
