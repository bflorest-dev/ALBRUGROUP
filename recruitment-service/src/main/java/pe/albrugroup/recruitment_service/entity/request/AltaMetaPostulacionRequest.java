package pe.albrugroup.recruitment_service.entity.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
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

    @NotBlank @Size(max = 80)
    @Pattern(regexp = "^@*[A-Za-z0-9._-]+$")
    private String usuarioMeta;

    @NotNull
    private Origen origen;

    @NotNull
    private PuestoObjetivo puestoObjetivo;

    @NotNull
    private Negocio negocio;

    @NotNull @PastOrPresent
    private LocalDate fechaPostulacion;

    private Long idOfertaLaboral;
}
