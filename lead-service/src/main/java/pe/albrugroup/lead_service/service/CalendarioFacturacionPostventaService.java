package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.configuration.OperationalDateTime;
import pe.albrugroup.lead_service.entity.CalendarioFacturacionPostventa;
import pe.albrugroup.lead_service.entity.EncuestaPostventa;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.entity.PeriodoFacturacionPostventa;
import pe.albrugroup.lead_service.entity.enums.EstadoEncuestaPostventa;
import pe.albrugroup.lead_service.entity.enums.EstadoPeriodoFacturacionPostventa;
import pe.albrugroup.lead_service.entity.enums.PrioridadEncuestaPostventa;
import pe.albrugroup.lead_service.entity.enums.TipoEncuestaPostventa;
import pe.albrugroup.lead_service.repository.CalendarioFacturacionPostventaRepository;
import pe.albrugroup.lead_service.repository.EncuestaPostventaRepository;
import pe.albrugroup.lead_service.repository.PeriodoFacturacionPostventaRepository;
import pe.albrugroup.lead_service.service.facturacion.CalculadoraFacturacionPostventa;
import pe.albrugroup.lead_service.service.facturacion.CalculadoraFacturacionPostventaResolver;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class CalendarioFacturacionPostventaService {

    private final CalendarioFacturacionPostventaRepository calendarioRepository;
    private final PeriodoFacturacionPostventaRepository periodoRepository;
    private final EncuestaPostventaRepository encuestaRepository;
    private final CalculadoraFacturacionPostventaResolver calculadoraResolver;

    @Transactional
    public void inicializarGestionPostventa(Lead lead, LocalDate fechaInstalacion) {
        if (calendarioRepository.findByLeadId(lead.getId()).isPresent()) {
            return;
        }

        CalculadoraFacturacionPostventa calculadora = calculadoraResolver.resolver(lead.getNombreProveedorSnapshot());
        CalendarioFacturacionPostventa calendario = calendarioRepository.save(
                calculadora.crearCalendario(lead, fechaInstalacion)
        );

        PeriodoFacturacionPostventa primerPeriodo = calculadora.crearPeriodo(calendario, 1);
        primerPeriodo.setEstado(EstadoPeriodoFacturacionPostventa.ABIERTO);
        periodoRepository.save(primerPeriodo);

        encuestaRepository.save(crearEncuestaInicial(lead));
    }

    private EncuestaPostventa crearEncuestaInicial(Lead lead) {
        LocalDateTime ahora = LocalDateTime.now(OperationalDateTime.ZONE);
        return EncuestaPostventa.builder()
                .lead(lead)
                .tipoEncuesta(TipoEncuestaPostventa.SATISFACCION_ASESOR)
                .estado(EstadoEncuestaPostventa.PENDIENTE)
                .prioridad(PrioridadEncuestaPostventa.NORMAL)
                .fechaProgramada(ahora)
                .fechaLimite(ahora.plusHours(48))
                .numeroEncuesta(1)
                .build();
    }
}
