package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalTime;

@Getter @Setter
public class LeadTipificacionVentaRequest {

    @NotBlank(message = "La tipificacion es obligatoria")
    private String codigoTipificacion;
    @NotBlank(message = "La subtipificacion es obligatoria")
    private String codigoSubtipificacion;
    private String comentario;
    private LocalDate fechaInstalacion;
    private LocalDate fechaProgramacion;
    private LocalDate fechaRechazo;
    private LocalTime horaProgramada;
    private String sec;
    private String sot;
}
