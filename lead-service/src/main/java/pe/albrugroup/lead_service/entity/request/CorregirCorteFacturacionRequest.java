package pe.albrugroup.lead_service.entity.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class CorregirCorteFacturacionRequest {

    @NotNull(message = "mesCorteBase es obligatorio")
    private LocalDate mesCorteBase;

    @NotNull(message = "numeroCorteBase es obligatorio")
    @Min(value = 1, message = "numeroCorteBase debe ser 1 o 2")
    @Max(value = 2, message = "numeroCorteBase debe ser 1 o 2")
    private Integer numeroCorteBase;
}
