package pe.albrugroup.rrhh_service.service;

import pe.albrugroup.rrhh_service.exception.BadRequestException;

import java.time.LocalDate;

final class ContratoFechaValidator {

    private ContratoFechaValidator() {
    }

    static void validarFechaCierre(LocalDate fechaInicio, LocalDate fechaFin, LocalDate hoy) {
        if (fechaFin == null) {
            throw new BadRequestException("La fecha de fin es obligatoria");
        }
        if (fechaFin.isAfter(hoy)) {
            throw new BadRequestException("La fecha de fin no puede ser posterior a hoy");
        }
        if (fechaInicio != null && fechaFin.isBefore(fechaInicio)) {
            throw new BadRequestException("La fecha de fin no puede ser anterior a la fecha de inicio");
        }
    }
}
