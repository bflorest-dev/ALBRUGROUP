package pe.albrugroup.lead_service.entity.response;

import java.time.Instant;
import java.time.LocalDate;

public record LeadFichaDetalleResponse(
        QuienDetalle quien,
        CuandoDetalle cuando
) {

    public record ActorMomento(
            Long idPersona,
            String nombre,
            Instant fecha
    ) {}

    public record QuienDetalle(
            ActorMomento primeraAsignacion,
            ActorMomento primeraTipificacion,
            ActorMomento ultimaAsignacion,
            ActorMomento ultimaTipificacion,
            ActorMomento mayorTipificacion,
            String primeraCodigoTipificacion,
            String ultimaCodigoTipificacion,
            String mayorRangoCodigoTipificacion
    ) {}

    public record CuandoDetalle(
            Instant primerRegistro,
            Instant ultimoRegistro,
            Instant ingresoVenta,
            LocalDate fechaInstalacion,
            Instant ultimaGestionPostventa
    ) {}
}
