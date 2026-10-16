package pe.albrugroup.rrhh_service.entity.response;

import lombok.*;

import java.time.LocalDate;

@Getter @Setter @Builder
@AllArgsConstructor @NoArgsConstructor
public class EmpleadoReporteAsistenciaResponse {
    private Long idEmpleado;
    private String nombreCompleto;
    private String numeroDocumento;
    private String rolPrincipal;
    private String modalidad;
    private LocalDate fechaIngreso;
    private LocalDate fechaBaja;
    private Integer diasConsiderados;
}
