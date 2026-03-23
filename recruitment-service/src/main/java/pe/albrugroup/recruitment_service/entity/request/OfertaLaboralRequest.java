package pe.albrugroup.recruitment_service.entity.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import pe.albrugroup.recruitment_service.entity.enums.Negocio;
import pe.albrugroup.recruitment_service.entity.enums.PuestoObjetivo;
import pe.albrugroup.recruitment_service.entity.enums.TurnoHorario;

import java.time.LocalDate;

@Builder @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class OfertaLaboralRequest {

    @NotBlank private String codigo;
    @NotNull private Negocio negocio;
    @NotNull private PuestoObjetivo puestoObjetivo;
    @NotNull private TurnoHorario horario;
    @NotNull private Integer cantidadInicial;
    @NotNull private LocalDate plazoInicial;
}
