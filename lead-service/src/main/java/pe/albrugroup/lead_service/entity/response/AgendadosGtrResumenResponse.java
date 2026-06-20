package pe.albrugroup.lead_service.entity.response;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.Map;

@Getter
@AllArgsConstructor
public class AgendadosGtrResumenResponse {

    private final long totalActivos;
    private final Map<String, Long> programadosHoyPorHora;
}
