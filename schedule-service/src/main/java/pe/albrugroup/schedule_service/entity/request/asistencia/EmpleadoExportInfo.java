package pe.albrugroup.schedule_service.entity.request.asistencia;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class EmpleadoExportInfo {

    @NotNull @Positive
    private Long id;

    @NotBlank
    private String nombre;

    private String dni;
    private String categoria;
    private String rol;
}
