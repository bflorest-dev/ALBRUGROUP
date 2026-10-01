package pe.albrugroup.rrhh_service.entity.response;

import java.time.LocalDate;
import java.util.List;

public record EmpleadoPlanillaResponse(
        Long idEmpleado,
        String nombres,
        String apellidos,
        String tipoDocumento,
        String numeroDocumento,
        LocalDate primerContratoInicio,
        List<ContratoPlanillaResponse> contratos
) {
}
