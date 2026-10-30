package pe.albrugroup.recruitment_service.entity.request;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Builder @Getter @Setter
@AllArgsConstructor @NoArgsConstructor
public class ReprogramarGrupoCapacitacionRequest {

    @NotNull @FutureOrPresent private LocalDate fechaInicio;
}
