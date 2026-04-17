package pe.albrugroup.recruitment_service.entity.request;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;
import pe.albrugroup.recruitment_service.entity.enums.Modalidad;
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
    @NotNull private Modalidad modalidad;
    @NotNull private TurnoHorario horario;
    @NotNull @Positive private Integer cantidadInicial;
    @NotNull @FutureOrPresent private LocalDate plazoInicial;
}
