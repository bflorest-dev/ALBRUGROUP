package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.entity.enums.EstadoClientePostventa;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.response.billing.VentasValidasBillingResponse;
import pe.albrugroup.lead_service.repository.LeadSeguimientoRepository;

import java.time.YearMonth;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BillingVentasService {

    private final LeadSeguimientoRepository leadSeguimientoRepository;

    @Transactional(readOnly = true)
    public List<VentasValidasBillingResponse> ventasValidas(Integer anio, Integer mes) {
        YearMonth periodo = YearMonth.of(anio, mes);
        return leadSeguimientoRepository.contarVentasValidasParaBilling(
                        periodo.atDay(1),
                        periodo.atEndOfMonth(),
                        Etapa.PREVENTA,
                        Etapa.POSTVENTA,
                        EstadoClientePostventa.ACTIVO
                ).stream()
                .map(row -> new VentasValidasBillingResponse((Long) row[0], ((Number) row[1]).intValue()))
                .toList();
    }
}
