package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import pe.albrugroup.lead_service.configuration.CurrentUser;
import pe.albrugroup.lead_service.exception.ForbiddenException;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
public class MetricasPeriodoGuard {

    private static final String ADMINISTRADOR = "ADMINISTRADOR";

    private final CurrentUser currentUser;

    public LocalDate validarFecha(LocalDate fecha) {
        if (fecha == null || esAdministrador()) {
            return fecha;
        }
        LocalDate fechaIngreso = fechaIngresoRequerida();
        if (fecha.isBefore(fechaIngreso)) {
            throw new ForbiddenException("No puedes consultar metricas anteriores a tu fecha de ingreso");
        }
        return fecha;
    }

    public Rango protegerRango(LocalDate desde, LocalDate hasta) {
        if ((desde == null && hasta == null) || esAdministrador()) {
            return new Rango(desde, hasta);
        }
        LocalDate fechaIngreso = fechaIngresoRequerida();
        LocalDate hastaEvaluado = hasta != null ? hasta : desde;
        if (hastaEvaluado != null && hastaEvaluado.isBefore(fechaIngreso)) {
            throw new ForbiddenException("No puedes consultar metricas anteriores a tu fecha de ingreso");
        }
        LocalDate desdeProtegido = desde != null && desde.isBefore(fechaIngreso) ? fechaIngreso : desde;
        return new Rango(desdeProtegido, hasta);
    }

    private LocalDate fechaIngresoRequerida() {
        LocalDate fechaIngreso = currentUser.fechaIngresoEmpleado();
        if (fechaIngreso == null) {
            throw new ForbiddenException("No se pudo validar tu fecha de ingreso. Vuelve a iniciar sesion");
        }
        return fechaIngreso;
    }

    private boolean esAdministrador() {
        return currentUser.roles().contains(ADMINISTRADOR);
    }

    public record Rango(LocalDate desde, LocalDate hasta) {
    }
}
