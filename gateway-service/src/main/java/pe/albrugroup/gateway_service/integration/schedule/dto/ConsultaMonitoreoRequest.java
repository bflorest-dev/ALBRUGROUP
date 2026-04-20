package pe.albrugroup.gateway_service.integration.schedule.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsultaMonitoreoRequest {

    private List<Long> empleadoIds;
    private LocalDate fecha;
}
