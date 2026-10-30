package pe.albrugroup.recruitment_service.entity.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import pe.albrugroup.recruitment_service.entity.enums.Negocio;
import pe.albrugroup.recruitment_service.entity.enums.Origen;
import pe.albrugroup.recruitment_service.entity.enums.PuestoObjetivo;

import java.time.LocalDate;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class AltaMetaPostulacionRequest {

    @NotBlank
    private String usuarioMeta;

    @NotNull
    private Origen origen;

    @NotNull
    private PuestoObjetivo puestoObjetivo;

    @NotNull
    private Negocio negocio;

    @NotNull
    private LocalDate fechaPostulacion;
}
