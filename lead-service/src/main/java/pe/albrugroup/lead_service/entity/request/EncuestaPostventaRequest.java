package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;
import pe.albrugroup.lead_service.entity.enums.TipoContactoEncuesta;
import pe.albrugroup.lead_service.entity.enums.TipoEncuestaPostventa;

@Getter @Setter
public class EncuestaPostventaRequest {

    private Long idPeriodoFacturacion;
    private TipoEncuestaPostventa tipoEncuesta;
    private TipoContactoEncuesta tipoContacto;

    @Min(value = 1, message = "calificacion debe ser mayor o igual a 1")
    @Max(value = 10, message = "calificacion debe ser menor o igual a 10")
    private Integer calificacion;

    private String comentario;
}
