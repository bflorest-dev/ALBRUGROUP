package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CampanaGastoRegistroEstadoResponse {

    private Boolean esPrimerRegistroDelDia;
    private LocalDate fechaMinima;
    private LocalDate fechaMaxima;
    private LocalDateTime ultimoReportedAt;
}
