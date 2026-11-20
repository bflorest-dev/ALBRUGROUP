package pe.albrugroup.schedule_service.entity.request.asistencia;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ExportReporteAsistenciaRequest {

    @NotNull(message = "desde es obligatorio")
    private LocalDate desde;

    @NotNull(message = "hasta es obligatorio")
    private LocalDate hasta;

    @NotEmpty(message = "empleados es obligatorio")
    @Valid
    private List<EmpleadoExportInfo> empleados;
}
