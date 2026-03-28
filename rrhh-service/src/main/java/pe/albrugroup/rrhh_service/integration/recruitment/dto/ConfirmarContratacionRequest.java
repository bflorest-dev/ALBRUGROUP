package pe.albrugroup.rrhh_service.integration.recruitment.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Builder
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class ConfirmarContratacionRequest {

    private Long idEmpleadoContratado;
    private LocalDate fechaContratacion;
}
