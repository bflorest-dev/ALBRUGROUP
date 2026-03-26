package pe.albrugroup.recruitment_service.entity.request;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.recruitment_service.entity.enums.SalaCapacitacion;
import pe.albrugroup.recruitment_service.entity.enums.TurnoHorario;

import java.time.LocalDate;

@Builder @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class GrupoCapacitacionRequest {

    @NotBlank private String codigo;
    @NotNull @Positive private Long idCapacitador;
    @NotNull private TurnoHorario turno;
    @NotNull private SalaCapacitacion sala;
    @NotNull @FutureOrPresent private LocalDate fechaInicio;
    @FutureOrPresent private LocalDate fechaFin;
}
