package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalTime;

@Getter @Setter
public class LeadTipificacionRequest {

    @NotBlank(message = "La tipificacion es obligatoria")
    private String codigoTipificacion;
    @NotBlank(message = "La subtipificacion es obligatoria")
    private String codigoSubtipificacion;
    private String comentario;
    private LocalTime horaProgramada;
    private Long idPlataformaDigitalOfrecida;
}
