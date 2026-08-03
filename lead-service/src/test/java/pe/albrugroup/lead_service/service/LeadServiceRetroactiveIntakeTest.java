package pe.albrugroup.lead_service.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.support.TransactionTemplate;
import pe.albrugroup.lead_service.configuration.CurrentUser;
import pe.albrugroup.lead_service.configuration.OperationalDateTime;
import pe.albrugroup.lead_service.entity.Campana;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.entity.enums.Accion;
import pe.albrugroup.lead_service.entity.enums.Base;
import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.request.LeadIntakeRequest;
import pe.albrugroup.lead_service.entity.request.LeadIntakeRetroactivoRequest;
import pe.albrugroup.lead_service.entity.request.RegistrarEventoRequest;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.repository.AdicionalRepository;
import pe.albrugroup.lead_service.repository.CampanaRepository;
import pe.albrugroup.lead_service.repository.DistritoRepository;
import pe.albrugroup.lead_service.repository.EncuestaPostventaRepository;
import pe.albrugroup.lead_service.repository.EventoRepository;
import pe.albrugroup.lead_service.repository.LeadRepository;
import pe.albrugroup.lead_service.repository.PagoPostventaRepository;
import pe.albrugroup.lead_service.repository.PlanRepository;
import pe.albrugroup.lead_service.repository.PromocionComercialRepository;
import pe.albrugroup.lead_service.repository.SubtipificacionRepository;
import pe.albrugroup.lead_service.repository.TipificacionRepository;
import pe.albrugroup.lead_service.repository.ZonaReglaRepository;
import pe.albrugroup.lead_service.service.mapper.LeadMapper;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LeadServiceRetroactiveIntakeTest {

    @Mock private LeadRepository leadRepository;
    @Mock private CampanaRepository campanaRepository;
    @Mock private EventoRepository eventoRepository;
    @Mock private EventoService eventoService;
    @Mock private CurrentUser currentUser;
    @Mock private PlanRepository planRepository;
    @Mock private PagoPostventaRepository pagoPostventaRepository;
    @Mock private EncuestaPostventaRepository encuestaPostventaRepository;
    @Mock private PromocionComercialRepository promocionComercialRepository;
    @Mock private AdicionalRepository adicionalRepository;
    @Mock private TipificacionRepository tipificacionRepository;
    @Mock private SubtipificacionRepository subtipificacionRepository;
    @Mock private LeadMapper leadMapper;
    @Mock private DistritoRepository distritoRepository;
    @Mock private ZonaReglaRepository zonaReglaRepository;
    @Mock private PaginationService paginationService;
    @Mock private TransactionTemplate transactionTemplate;
    @Mock private LeadRealtimeNotifier leadRealtimeNotifier;
    @Mock private LeadAsignacionCounterService leadAsignacionCounterService;

    @InjectMocks private LeadService leadService;

    @Test
    void registraElEventoAyerYConservaElIngresoDelLeadEnElInstanteActual() {
        LeadIntakeRetroactivoRequest request = retroactiveRequest(LocalTime.of(19, 0));
        Campana campana = Campana.builder().id(7L).activo(true).build();
        ArgumentCaptor<Instant> lastEntryCaptor = ArgumentCaptor.forClass(Instant.class);
        Instant before = Instant.now();

        when(campanaRepository.findByIdAndActivoTrue(7L)).thenReturn(Optional.of(campana));
        when(leadRepository.findByPrefijoAndLead("+51", "987654321")).thenReturn(Optional.empty());
        when(leadMapper.toNuevoLead(
                eq("+51"),
                eq("987654321"),
                isNull(),
                eq(Base.WHATSAPP),
                eq(campana),
                lastEntryCaptor.capture()
        )).thenReturn(Lead.builder()
                .id(25202L)
                .prefijo("+51")
                .lead("987654321")
                .campana(campana)
                .base(Base.WHATSAPP)
                .etapa(Etapa.PREVENTA)
                .estado(EstadoSeguimiento.NUEVO)
                .build());
        when(leadRepository.save(any(Lead.class))).thenAnswer(invocation -> invocation.getArgument(0));

        leadService.registrarIngresoLeadRetroactivo(request);

        Instant after = Instant.now();
        Instant expectedEventAt = OperationalDateTime.today()
                .minusDays(1)
                .atTime(19, 0)
                .atZone(OperationalDateTime.ZONE)
                .toInstant();
        ArgumentCaptor<RegistrarEventoRequest> eventCaptor =
                ArgumentCaptor.forClass(RegistrarEventoRequest.class);
        verify(eventoService).registrarEvento(eventCaptor.capture(), eq(expectedEventAt));
        assertThat(eventCaptor.getValue().getAccion()).isEqualTo(Accion.REGISTRO);
        assertThat(lastEntryCaptor.getValue()).isBetween(before, after);
    }

    @Test
    void elIngresoNormalNoFuerzaTimestampEnElEvento() {
        LeadIntakeRequest request = normalRequest();
        Campana campana = Campana.builder().id(7L).activo(true).build();
        Lead lead = Lead.builder()
                .id(25202L)
                .campana(campana)
                .etapa(Etapa.PREVENTA)
                .estado(EstadoSeguimiento.NUEVO)
                .build();

        when(campanaRepository.findByIdAndActivoTrue(7L)).thenReturn(Optional.of(campana));
        when(leadRepository.findByPrefijoAndLead("+51", "987654321")).thenReturn(Optional.empty());
        when(leadMapper.toNuevoLead(eq("+51"), eq("987654321"), isNull(), eq(Base.WHATSAPP), eq(campana), any(Instant.class)))
                .thenReturn(lead);
        when(leadRepository.save(lead)).thenReturn(lead);

        leadService.registrarIngresoLead(request);

        verify(eventoService).registrarEvento(any(RegistrarEventoRequest.class));
        verify(eventoService, never()).registrarEvento(any(RegistrarEventoRequest.class), any(Instant.class));
    }

    @Test
    void conservaLaEtapaYGestionDeUnLeadExistenteFueraDePreventa() {
        LeadIntakeRetroactivoRequest request = retroactiveRequest(LocalTime.of(20, 30));
        Campana previousCampaign = Campana.builder().id(3L).activo(true).build();
        Campana selectedCampaign = Campana.builder().id(7L).activo(true).build();
        Lead existing = Lead.builder()
                .id(25202L)
                .prefijo("+51")
                .lead("987654321")
                .campana(previousCampaign)
                .base(Base.MESSENGER)
                .etapa(Etapa.VENTA)
                .estado(EstadoSeguimiento.EN_GESTION)
                .idAsesorAsignado(99L)
                .nombreAsesorAsignado("Asesor Venta")
                .build();
        Instant previousEntryAt = Instant.parse("2026-06-09T14:00:00Z");
        existing.setLastEntryAt(previousEntryAt);

        when(campanaRepository.findByIdAndActivoTrue(7L)).thenReturn(Optional.of(selectedCampaign));
        when(leadRepository.findByPrefijoAndLead("+51", "987654321")).thenReturn(Optional.of(existing));
        when(leadRepository.save(existing)).thenReturn(existing);

        leadService.registrarIngresoLeadRetroactivo(request);

        assertThat(existing.getEtapa()).isEqualTo(Etapa.VENTA);
        assertThat(existing.getEstado()).isEqualTo(EstadoSeguimiento.EN_GESTION);
        assertThat(existing.getIdAsesorAsignado()).isEqualTo(99L);
        assertThat(existing.getCampana()).isSameAs(selectedCampaign);
        assertThat(existing.getLastEntryAt()).isAfter(previousEntryAt);
        verify(eventoService).registrarEvento(
                any(RegistrarEventoRequest.class),
                eq(OperationalDateTime.today()
                        .minusDays(1)
                        .atTime(20, 30)
                        .atZone(OperationalDateTime.ZONE)
                        .toInstant())
        );
    }

    @Test
    void aceptaLosLimitesDeHoraYRechazaValoresFueraDelRango() {
        assertThat(leadService.calcularRegistroRetroactivo(LocalDate.of(2026, 6, 10), LocalTime.of(18, 0)))
                .isNotNull();
        assertThat(leadService.calcularRegistroRetroactivo(LocalDate.of(2026, 6, 10), LocalTime.of(23, 59)))
                .isNotNull();

        assertThatThrownBy(() ->
                leadService.calcularRegistroRetroactivo(LocalDate.of(2026, 6, 10), LocalTime.of(17, 59)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("18:00");
        assertThatThrownBy(() ->
                leadService.calcularRegistroRetroactivo(LocalDate.of(2026, 6, 10), LocalTime.of(23, 59, 1)))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("23:59");
    }

    @Test
    void calculaAyerCorrectamenteAlCambiarDeMesYAnio() {
        ZoneId lima = ZoneId.of("America/Lima");

        assertThat(leadService.calcularRegistroRetroactivo(
                LocalDate.of(2026, 1, 1),
                LocalTime.of(19, 0)
        ).atZone(lima).toLocalDate()).isEqualTo(LocalDate.of(2025, 12, 31));

        assertThat(leadService.calcularRegistroRetroactivo(
                LocalDate.of(2026, 3, 1),
                LocalTime.of(19, 0)
        ).atZone(lima).toLocalDate()).isEqualTo(LocalDate.of(2026, 2, 28));
    }

    private LeadIntakeRequest normalRequest() {
        LeadIntakeRequest request = new LeadIntakeRequest();
        request.setPrefijo("+51");
        request.setLead("987654321");
        request.setIdCampana(7L);
        request.setBase(Base.WHATSAPP);
        return request;
    }

    private LeadIntakeRetroactivoRequest retroactiveRequest(LocalTime hour) {
        LeadIntakeRetroactivoRequest request = new LeadIntakeRetroactivoRequest();
        request.setPrefijo("+51");
        request.setLead("987654321");
        request.setIdCampana(7L);
        request.setBase(Base.WHATSAPP);
        request.setHoraRegistro(hour);
        return request;
    }
}
