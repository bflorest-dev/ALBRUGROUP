package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class EncuestaPostventaRequest {

    @NotNull(message = "calificacionAsesor es obligatoria")
    @Min(value = 1, message = "calificacionAsesor debe ser mayor o igual a 1")
    @Max(value = 5, message = "calificacionAsesor debe ser menor o igual a 5")
    private Integer calificacionAsesor;

    @NotNull(message = "calificacionServicio es obligatoria")
    @Min(value = 1, message = "calificacionServicio debe ser mayor o igual a 1")
    @Max(value = 5, message = "calificacionServicio debe ser menor o igual a 5")
    private Integer calificacionServicio;
}
