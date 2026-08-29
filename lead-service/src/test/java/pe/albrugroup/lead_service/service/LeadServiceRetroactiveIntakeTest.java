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
import pe.albrugroup.lead_service.entity.Contacto;
import pe.albrugroup.lead_service.entity.DatosPreventa;
import pe.albrugroup.lead_service.entity.Direccion;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.entity.Plan;
import pe.albrugroup.lead_service.entity.Proveedor;
import pe.albrugroup.lead_service.entity.Subtipificacion;
import pe.albrugroup.lead_service.entity.Tipificacion;
import pe.albrugroup.lead_service.entity.enums.Accion;
import pe.albrugroup.lead_service.entity.enums.Base;
import pe.albrugroup.lead_service.entity.enums.CampoConfigurable;
import pe.albrugroup.lead_service.entity.enums.ComportamientoTipificacion;
import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.enums.TipoDocumento;
import pe.albrugroup.lead_service.entity.enums.TipoDomicilio;
import pe.albrugroup.lead_service.entity.enums.TipoNumeroLlamada;
import pe.albrugroup.lead_service.entity.request.LeadIdentidadRequest;
import pe.albrugroup.lead_service.entity.request.LeadIntakeRequest;
import pe.albrugroup.lead_service.entity.request.LeadIntakeRetroactivoRequest;
import pe.albrugroup.lead_service.entity.request.LeadNumeroParaLlamarRequest;
import pe.albrugroup.lead_service.entity.request.LeadTipificacionRequest;
import pe.albrugroup.lead_service.entity.request.RegistrarEventoRequest;
import pe.albrugroup.lead_service.entity.response.CampoConfigResponse;
import pe.albrugroup.lead_service.entity.response.NumeroLlamadaResponse;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.exception.ConflictException;
import pe.albrugroup.lead_service.repository.AdicionalRepository;
import pe.albrugroup.lead_service.repository.CampanaRepository;
import pe.albrugroup.lead_service.repository.ContactoRepository;
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
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LeadServiceRetroactiveIntakeTest {

    @Mock private LeadRepository leadRepository;
    @Mock private ContactoRepository contactoRepository;
    @Mock private CampanaRepository campanaRepository;
    @Mock private EventoRepository eventoRepository;
    @Mock private EventoService eventoService;
    @Mock private EquipoCampoService equipoCampoService;
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
    @Mock private LeadEtapaResumenService leadEtapaResumenService;
    @Mock private ProveedorScopeService proveedorScopeService;

    @InjectMocks private LeadService leadService;

    @Test
    void listarNumerosLlamadaDevuelveJerarquiaSinDuplicados() {
        Lead lead = Lead.builder()
                .id(1L)
                .lead("912345678")
                .numeroParaLlamar("987654321")
                .datosPreventa(pe.albrugroup.lead_service.entity.DatosPreventa.builder()
                        .celularReferencia("923456789")
                        .celularRegistro("912345678")
                        .build())
                .build();
        when(leadRepository.findById(1L)).thenReturn(Optional.of(lead));
        when(leadMapper.trimToNull(any())).thenAnswer(invocation -> {
            String value = invocation.getArgument(0);
            if (value == null) {
                return null;
            }
            String trimmed = value.trim();
            return trimmed.isEmpty() ? null : trimmed;
        });

        List<NumeroLlamadaResponse> numeros = leadService.listarNumerosLlamada(1L);

        assertThat(numeros).extracting(NumeroLlamadaResponse::getTipo)
                .containsExactly(
                        TipoNumeroLlamada.NUMERO_PARA_LLAMAR,
                        TipoNumeroLlamada.LEAD,
                        TipoNumeroLlamada.CELULAR_REFERENCIA
                );
        assertThat(numeros).extracting(NumeroLlamadaResponse::getPrioridad)
                .containsExactly(1, 2, 3);
    }

    @Test
    void actualizarNumeroParaLlamarAceptaCelularValido() {
        Lead lead = Lead.builder().id(1L).etapa(Etapa.PREVENTA).build();
        LeadNumeroParaLlamarRequest request = new LeadNumeroParaLlamarRequest();
        request.setNumeroParaLlamar("987654321");
        when(leadRepository.findById(1L)).thenReturn(Optional.of(lead));
        when(leadRepository.save(lead)).thenReturn(lead);
        when(leadMapper.trimToNull("987654321")).thenReturn("987654321");

        leadService.actualizarNumeroParaLlamar(1L, request);

        assertThat(lead.getNumeroParaLlamar()).isEqualTo("987654321");
        verify(leadRepository).save(lead);
    }

    @Test
    void actualizarNumeroParaLlamarRechazaFormatoInvalido() {
        Lead lead = Lead.builder().id(1L).build();
        LeadNumeroParaLlamarRequest request = new LeadNumeroParaLlamarRequest();
        request.setNumeroParaLlamar("812345678");
        when(leadRepository.findById(1L)).thenReturn(Optional.of(lead));
        when(leadMapper.trimToNull("812345678")).thenReturn("812345678");

        assertThatThrownBy(() -> leadService.actualizarNumeroParaLlamar(1L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("9 digitos");

        verify(leadRepository, never()).save(any());
    }

    @Test
    void registraElEventoAyerYConservaElIngresoDelLeadEnElInstanteActual() {
        LeadIntakeRetroactivoRequest request = retroactiveRequest(LocalTime.of(19, 0));
        Campana campana = Campana.builder().id(7L).activo(true).build();
        ArgumentCaptor<Instant> lastEntryCaptor = ArgumentCaptor.forClass(Instant.class);
        Instant before = Instant.now();

        when(campanaRepository.findByIdAndActivoTrue(7L)).thenReturn(Optional.of(campana));
        Contacto contacto = contactoTelefono();
        when(contactoRepository.findByPrefijoAndLead("+51", "987654321")).thenReturn(Optional.of(contacto));
        when(leadRepository.findFirstByContactoIdAndEtapaOrderByLastEntryAtDescIdDesc(100L, Etapa.PREVENTA))
                .thenReturn(Optional.empty());
        when(leadRepository.findByContactoIdOrderByLastEntryAtDescIdDesc(100L)).thenReturn(List.of());
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
                .contacto(contacto)
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
        Contacto contacto = contactoTelefono();
        when(contactoRepository.findByPrefijoAndLead("+51", "987654321")).thenReturn(Optional.of(contacto));
        when(leadRepository.findFirstByContactoIdAndEtapaOrderByLastEntryAtDescIdDesc(100L, Etapa.PREVENTA))
                .thenReturn(Optional.empty());
        when(leadRepository.findByContactoIdOrderByLastEntryAtDescIdDesc(100L)).thenReturn(List.of());
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
        Contacto contacto = contactoTelefono();
        Lead existing = Lead.builder()
                .id(25202L)
                .prefijo("+51")
                .lead("987654321")
                .contacto(contacto)
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
        when(contactoRepository.findByPrefijoAndLead("+51", "987654321")).thenReturn(Optional.of(contacto));
        when(leadRepository.findFirstByContactoIdAndEtapaOrderByLastEntryAtDescIdDesc(100L, Etapa.PREVENTA))
                .thenReturn(Optional.empty());
        when(leadRepository.findByContactoIdOrderByLastEntryAtDescIdDesc(100L)).thenReturn(List.of(existing));
        when(leadRepository.save(existing)).thenReturn(existing);

        leadService.registrarIngresoLeadRetroactivo(request);

        assertThat(existing.getEtapa()).isEqualTo(Etapa.VENTA);
        assertThat(existing.getEstado()).isEqualTo(EstadoSeguimiento.EN_GESTION);
        assertThat(existing.getIdAsesorAsignado()).isEqualTo(99L);
        assertThat(existing.getCampana()).isSameAs(previousCampaign);
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
    void registraLeadNuevoSoloConUsermeta() {
        LeadIntakeRequest request = new LeadIntakeRequest();
        request.setUsermeta("@EfrainBay");
        request.setBase(Base.RECONTACTO);
        Contacto contacto = Contacto.builder().id(100L).usermeta("EfrainBay").build();
        Lead lead = Lead.builder()
                .id(25202L)
                .usermeta("EfrainBay")
                .contacto(contacto)
                .base(Base.RECONTACTO)
                .etapa(Etapa.PREVENTA)
                .estado(EstadoSeguimiento.NUEVO)
                .build();

        when(contactoRepository.findByUsermetaIgnoreCase("EfrainBay")).thenReturn(Optional.of(contacto));
        when(leadRepository.findFirstByContactoIdAndEtapaOrderByLastEntryAtDescIdDesc(100L, Etapa.PREVENTA))
                .thenReturn(Optional.empty());
        when(leadRepository.findByContactoIdOrderByLastEntryAtDescIdDesc(100L)).thenReturn(List.of());
        when(leadMapper.toNuevoLead(isNull(), isNull(), eq("EfrainBay"), eq(Base.RECONTACTO), isNull(), any(Instant.class)))
                .thenReturn(lead);
        when(leadRepository.save(lead)).thenReturn(lead);

        leadService.registrarIngresoLead(request);

        verify(leadRepository).save(lead);
        assertThat(lead.getPrefijo()).isNull();
        assertThat(lead.getLead()).isNull();
        assertThat(lead.getUsermeta()).isEqualTo("EfrainBay");
    }

    @Test
    void registraLeadRetroactivoSoloConUsermeta() {
        LeadIntakeRetroactivoRequest request = new LeadIntakeRetroactivoRequest();
        request.setUsermeta("@EfrainBay");
        request.setBase(Base.RECONTACTO);
        request.setHoraRegistro(LocalTime.of(21, 0));
        Contacto contacto = Contacto.builder().id(100L).usermeta("EfrainBay").build();
        Lead lead = Lead.builder()
                .id(25202L)
                .usermeta("EfrainBay")
                .contacto(contacto)
                .base(Base.RECONTACTO)
                .etapa(Etapa.PREVENTA)
                .estado(EstadoSeguimiento.NUEVO)
                .build();

        when(contactoRepository.findByUsermetaIgnoreCase("EfrainBay")).thenReturn(Optional.of(contacto));
        when(leadRepository.findFirstByContactoIdAndEtapaOrderByLastEntryAtDescIdDesc(100L, Etapa.PREVENTA))
                .thenReturn(Optional.empty());
        when(leadRepository.findByContactoIdOrderByLastEntryAtDescIdDesc(100L)).thenReturn(List.of());
        when(leadMapper.toNuevoLead(isNull(), isNull(), eq("EfrainBay"), eq(Base.RECONTACTO), isNull(), any(Instant.class)))
                .thenReturn(lead);
        when(leadRepository.save(lead)).thenReturn(lead);

        leadService.registrarIngresoLeadRetroactivo(request);

        verify(eventoService).registrarEvento(
                any(RegistrarEventoRequest.class),
                eq(OperationalDateTime.today()
                        .minusDays(1)
                        .atTime(21, 0)
                        .atZone(OperationalDateTime.ZONE)
                        .toInstant())
        );
    }

    @Test
    void completaTelefonoCuandoElContactoExistePorUsermeta() {
        LeadIntakeRequest request = normalRequest();
        request.setUsermeta("@EfrainBay");
        Campana campana = Campana.builder().id(7L).activo(true).build();
        Contacto contacto = Contacto.builder().id(100L).usermeta("EfrainBay").build();
        Lead existing = Lead.builder()
                .id(25202L)
                .usermeta("EfrainBay")
                .contacto(contacto)
                .campana(campana)
                .base(Base.WHATSAPP)
                .etapa(Etapa.PREVENTA)
                .estado(EstadoSeguimiento.NUEVO)
                .build();

        when(campanaRepository.findByIdAndActivoTrue(7L)).thenReturn(Optional.of(campana));
        when(contactoRepository.findByPrefijoAndLead("+51", "987654321")).thenReturn(Optional.empty());
        when(contactoRepository.findByUsermetaIgnoreCase("EfrainBay")).thenReturn(Optional.of(contacto));
        when(contactoRepository.save(contacto)).thenReturn(contacto);
        when(leadRepository.findFirstByContactoIdAndEtapaOrderByLastEntryAtDescIdDesc(100L, Etapa.PREVENTA))
                .thenReturn(Optional.of(existing));
        when(leadRepository.save(existing)).thenReturn(existing);

        leadService.registrarIngresoLead(request);

        assertThat(contacto.getPrefijo()).isEqualTo("+51");
        assertThat(contacto.getLead()).isEqualTo("987654321");
        assertThat(existing.getPrefijo()).isEqualTo("+51");
        assertThat(existing.getLead()).isEqualTo("987654321");
        assertThat(existing.getUsermeta()).isEqualTo("EfrainBay");
    }

    @Test
    void completaUsermetaCuandoElContactoExistePorTelefono() {
        LeadIntakeRequest request = normalRequest();
        request.setUsermeta("@EfrainBay");
        Campana campana = Campana.builder().id(7L).activo(true).build();
        Contacto contacto = contactoTelefono();
        Lead existing = Lead.builder()
                .id(25202L)
                .prefijo("+51")
                .lead("987654321")
                .contacto(contacto)
                .campana(campana)
                .base(Base.WHATSAPP)
                .etapa(Etapa.PREVENTA)
                .estado(EstadoSeguimiento.NUEVO)
                .build();

        when(campanaRepository.findByIdAndActivoTrue(7L)).thenReturn(Optional.of(campana));
        when(contactoRepository.findByPrefijoAndLead("+51", "987654321")).thenReturn(Optional.of(contacto));
        when(contactoRepository.findByUsermetaIgnoreCase("EfrainBay")).thenReturn(Optional.empty());
        when(contactoRepository.save(contacto)).thenReturn(contacto);
        when(leadRepository.findFirstByContactoIdAndEtapaOrderByLastEntryAtDescIdDesc(100L, Etapa.PREVENTA))
                .thenReturn(Optional.of(existing));
        when(leadRepository.save(existing)).thenReturn(existing);

        leadService.registrarIngresoLead(request);

        assertThat(contacto.getUsermeta()).isEqualTo("EfrainBay");
        assertThat(existing.getUsermeta()).isEqualTo("EfrainBay");
    }

    @Test
    void reregistroPorTelefonoNoBorraUsermetaExistente() {
        LeadIntakeRequest request = normalRequest();
        Campana campana = Campana.builder().id(7L).activo(true).build();
        Contacto contacto = Contacto.builder()
                .id(100L)
                .prefijo("+51")
                .lead("987654321")
                .usermeta("EfrainBay")
                .build();
        Lead existing = Lead.builder()
                .id(25202L)
                .prefijo("+51")
                .lead("987654321")
                .usermeta("EfrainBay")
                .contacto(contacto)
                .campana(campana)
                .base(Base.WHATSAPP)
                .etapa(Etapa.PREVENTA)
                .estado(EstadoSeguimiento.NUEVO)
                .build();

        when(campanaRepository.findByIdAndActivoTrue(7L)).thenReturn(Optional.of(campana));
        when(contactoRepository.findByPrefijoAndLead("+51", "987654321")).thenReturn(Optional.of(contacto));
        when(leadRepository.findFirstByContactoIdAndEtapaOrderByLastEntryAtDescIdDesc(100L, Etapa.PREVENTA))
                .thenReturn(Optional.of(existing));
        when(leadRepository.save(existing)).thenReturn(existing);

        leadService.registrarIngresoLead(request);

        assertThat(existing.getUsermeta()).isEqualTo("EfrainBay");
    }

    @Test
    void rechazaTelefonoYUsermetaDeContactosDistintos() {
        LeadIntakeRequest request = normalRequest();
        request.setUsermeta("@EfrainBay");
        Campana campana = Campana.builder().id(7L).activo(true).build();
        Contacto porTelefono = contactoTelefono();
        Contacto porUsermeta = Contacto.builder().id(200L).usermeta("EfrainBay").build();

        when(campanaRepository.findByIdAndActivoTrue(7L)).thenReturn(Optional.of(campana));
        when(contactoRepository.findByPrefijoAndLead("+51", "987654321")).thenReturn(Optional.of(porTelefono));
        when(contactoRepository.findByUsermetaIgnoreCase("EfrainBay")).thenReturn(Optional.of(porUsermeta));

        assertThatThrownBy(() -> leadService.registrarIngresoLead(request))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("contactos distintos");
    }

    @Test
    void lookupGtrEncuentraPorUsermetaConArroba() {
        Contacto contacto = Contacto.builder().id(100L).usermeta("EfrainBay").build();
        Lead lead = Lead.builder()
                .id(25202L)
                .usermeta("EfrainBay")
                .contacto(contacto)
                .etapa(Etapa.PREVENTA)
                .estado(EstadoSeguimiento.NUEVO)
                .build();

        when(leadRepository.findFirstByUsermetaIgnoreCaseOrderByLastEntryAtDescIdDesc("EfrainBay"))
                .thenReturn(Optional.of(lead));

        var response = leadService.buscarContextoLeadGtr("@EfrainBay");

        assertThat(response.isExiste()).isTrue();
        assertThat(response.getUsermeta()).isEqualTo("EfrainBay");
    }

    @Test
    void lookupGtrConEquipoEncuentraSoloDentroDelEquipoPermitido() {
        Lead lead = Lead.builder()
                .id(25203L)
                .idEquipo(10L)
                .lead("987654321")
                .etapa(Etapa.PREVENTA)
                .estado(EstadoSeguimiento.NUEVO)
                .build();

        when(currentUser.tieneVisibilidadGlobalEquipos()).thenReturn(false);
        when(currentUser.equipos()).thenReturn(List.of(10L));
        when(leadRepository.findFirstByLeadAndIdEquipoInOrderByLastEntryAtDescIdDesc("987654321", List.of(10L)))
                .thenReturn(Optional.of(lead));

        var response = leadService.buscarContextoLeadGtr("987654321", 10L);

        assertThat(response.isExiste()).isTrue();
        assertThat(response.getIdLead()).isEqualTo(25203L);
    }

    @Test
    void lookupGtrConEquipoOcultaLeadsDeOtroEquipo() {
        when(currentUser.tieneVisibilidadGlobalEquipos()).thenReturn(false);
        when(currentUser.equipos()).thenReturn(List.of(10L));
        when(leadRepository.findFirstByLeadAndIdEquipoInOrderByLastEntryAtDescIdDesc("987654321", List.of(10L)))
                .thenReturn(Optional.empty());

        var response = leadService.buscarContextoLeadGtr("987654321", 10L);

        assertThat(response.isExiste()).isFalse();
        assertThat(response.getMensajeUsuario()).isEqualTo("No encontramos ese lead en el sistema.");
    }

    @Test
    void tipificarPreventaCompletaRechazaLeadSinNumero() {
        Lead lead = leadCompletoParaCierrePreventa();
        lead.setPrefijo(null);
        lead.setLead(null);
        LeadTipificacionRequest request = cierrePreventaRequest();
        Tipificacion tipificacion = tipificacionPreventaCompleta();
        Subtipificacion subtipificacion = subtipificacionCierrePreventa(tipificacion);

        when(currentUser.empleadoID()).thenReturn(7L);
        when(leadRepository.findByIdAndIdAsesorAsignado(25202L, 7L)).thenReturn(Optional.of(lead));
        when(tipificacionRepository.findByEtapaAndIdEquipoAndCodigoAndActivoTrue(
                Etapa.PREVENTA,
                10L,
                "PREVENTA_COMPLETA"
        )).thenReturn(Optional.of(tipificacion));
        when(subtipificacionRepository.findByTipificacionIdAndCodigoAndActivoTrue(
                80L,
                "VENTA_CERRADA"
        )).thenReturn(Optional.of(subtipificacion));

        assertThatThrownBy(() -> leadService.tipificarLead(25202L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Falta numero de lead");

        verify(leadRepository, never()).save(any());
    }

    @Test
    void tipificarPreventaCompletaAceptaLeadConNumero() {
        Lead lead = leadCompletoParaCierrePreventa();
        LeadTipificacionRequest request = cierrePreventaRequest();
        Tipificacion tipificacion = tipificacionPreventaCompleta();
        Subtipificacion subtipificacion = subtipificacionCierrePreventa(tipificacion);

        when(currentUser.empleadoID()).thenReturn(7L);
        when(leadRepository.findByIdAndIdAsesorAsignado(25202L, 7L)).thenReturn(Optional.of(lead));
        when(tipificacionRepository.findByEtapaAndIdEquipoAndCodigoAndActivoTrue(
                Etapa.PREVENTA,
                10L,
                "PREVENTA_COMPLETA"
        )).thenReturn(Optional.of(tipificacion));
        when(subtipificacionRepository.findByTipificacionIdAndCodigoAndActivoTrue(
                80L,
                "VENTA_CERRADA"
        )).thenReturn(Optional.of(subtipificacion));
        when(equipoCampoService.resolverConfig(10L)).thenReturn(List.of());
        when(leadRepository.save(lead)).thenReturn(lead);

        leadService.tipificarLead(25202L, request);

        assertThat(lead.getEtapa()).isEqualTo(Etapa.VENTA);
        verify(leadRepository).save(lead);
    }

    @Test
    void tipificarPreventaCompletaConPlanWinExigeTitularCelularDelProveedorOfrecido() {
        Lead lead = leadCompletoParaCierrePreventa();
        lead.setPlan(Plan.builder()
                .id(5L)
                .proveedor(Proveedor.builder().id(1L).nombre("WIN").build())
                .build());
        LeadTipificacionRequest request = cierrePreventaRequest();
        Tipificacion tipificacion = tipificacionPreventaCompleta();
        Subtipificacion subtipificacion = subtipificacionCierrePreventa(tipificacion);

        when(currentUser.empleadoID()).thenReturn(7L);
        when(leadRepository.findByIdAndIdAsesorAsignado(25202L, 7L)).thenReturn(Optional.of(lead));
        when(tipificacionRepository.findByEtapaAndIdEquipoAndCodigoAndActivoTrue(
                Etapa.PREVENTA,
                10L,
                "PREVENTA_COMPLETA"
        )).thenReturn(Optional.of(tipificacion));
        when(subtipificacionRepository.findByTipificacionIdAndCodigoAndActivoTrue(
                80L,
                "VENTA_CERRADA"
        )).thenReturn(Optional.of(subtipificacion));
        when(equipoCampoService.resolverConfigPorProveedorVisible(1L)).thenReturn(List.of(
                campoConfig(CampoConfigurable.DOC_TITULAR_CELULAR, true, true),
                campoConfig(CampoConfigurable.NOMBRE_TITULAR_CELULAR, true, true)
        ));

        assertThatThrownBy(() -> leadService.tipificarLead(25202L, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Falta numeroDocumentoTitularCelularRegistro");

        verify(leadRepository, never()).save(any());
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

    private Lead leadCompletoParaCierrePreventa() {
        return Lead.builder()
                .id(25202L)
                .prefijo("+51")
                .lead("987654321")
                .idEquipo(10L)
                .etapa(Etapa.PREVENTA)
                .estado(EstadoSeguimiento.EN_GESTION)
                .idAsesorAsignado(7L)
                .nombreAsesorAsignado("Asesor Venta")
                .datosPreventa(DatosPreventa.builder()
                        .tipoDocumento(TipoDocumento.DNI)
                        .numeroDocumentoTitularServicio("12345678")
                        .nombreTitularServicio("Juan Perez")
                        .celularRegistro("987654321")
                        .correo("cliente@correo.com")
                        .build())
                .direccion(Direccion.builder()
                        .ubigeoDomicilio("150101")
                        .tipoDomicilio(TipoDomicilio.HOGAR)
                        .direccion("Av Lima 123")
                        .referencia("Frente al parque")
                        .build())
                .plan(Plan.builder().id(5L).build())
                .build();
    }

    private LeadTipificacionRequest cierrePreventaRequest() {
        LeadTipificacionRequest request = new LeadTipificacionRequest();
        request.setCodigoTipificacion("PREVENTA_COMPLETA");
        request.setCodigoSubtipificacion("VENTA_CERRADA");
        return request;
    }

    private Tipificacion tipificacionPreventaCompleta() {
        Tipificacion tipificacion = new Tipificacion();
        tipificacion.setId(80L);
        tipificacion.setIdEquipo(10L);
        tipificacion.setEtapa(Etapa.PREVENTA);
        tipificacion.setCodigo("PREVENTA_COMPLETA");
        tipificacion.setOrden(8);
        tipificacion.setActivo(true);
        return tipificacion;
    }

    private Subtipificacion subtipificacionCierrePreventa(Tipificacion tipificacion) {
        Subtipificacion subtipificacion = new Subtipificacion();
        subtipificacion.setId(81L);
        subtipificacion.setTipificacion(tipificacion);
        subtipificacion.setCodigo("VENTA_CERRADA");
        subtipificacion.setOrden(1);
        subtipificacion.setEtapaCambio(Etapa.VENTA);
        subtipificacion.setActivo(true);
        subtipificacion.setComportamientos(Set.of(ComportamientoTipificacion.ES_CIERRE_PREVENTA));
        return subtipificacion;
    }

    private CampoConfigResponse campoConfig(CampoConfigurable campo, boolean visible, boolean requerido) {
        return CampoConfigResponse.builder()
                .campo(campo)
                .tab(campo.getTab())
                .descripcion(campo.getDescripcion())
                .visible(visible)
                .requerido(requerido)
                .build();
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

    @Test
    void completarIdentidadCompletaTelefonoCuandoContactoSoloTieneUsermeta() {
        Contacto contacto = Contacto.builder().id(100L).usermeta("EfrainBay").build();
        Lead principal = Lead.builder().id(25202L).usermeta("EfrainBay").contacto(contacto).etapa(Etapa.PREVENTA).build();
        Lead hermana = Lead.builder().id(25203L).usermeta("EfrainBay").contacto(contacto).etapa(Etapa.PREVENTA).build();
        LeadIdentidadRequest request = identidadRequest("+51", "987654321", null);

        when(leadRepository.findById(25202L)).thenReturn(Optional.of(principal));
        when(contactoRepository.findByPrefijoAndLead("+51", "987654321")).thenReturn(Optional.empty());
        when(contactoRepository.save(contacto)).thenReturn(contacto);
        when(leadRepository.findByContactoIdOrderByLastEntryAtDescIdDesc(100L)).thenReturn(List.of(principal, hermana));
        when(leadRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));

        leadService.completarIdentidadLead(25202L, request);

        assertThat(contacto.getPrefijo()).isEqualTo("+51");
        assertThat(contacto.getLead()).isEqualTo("987654321");
        assertThat(principal.getPrefijo()).isEqualTo("+51");
        assertThat(hermana.getLead()).isEqualTo("987654321");
        verify(eventoService, never()).registrarEvento(any(RegistrarEventoRequest.class));
        verify(leadRealtimeNotifier, times(2)).publishAfterCommit(any());
    }

    @Test
    void completarIdentidadCompletaUsermetaCuandoContactoSoloTieneTelefono() {
        Contacto contacto = contactoTelefono();
        Lead lead = Lead.builder().id(25202L).prefijo("+51").lead("987654321").contacto(contacto).etapa(Etapa.PREVENTA).build();
        LeadIdentidadRequest request = identidadRequest(null, null, "@EfrainBay");

        when(leadRepository.findById(25202L)).thenReturn(Optional.of(lead));
        when(contactoRepository.findByUsermetaIgnoreCase("EfrainBay")).thenReturn(Optional.empty());
        when(contactoRepository.save(contacto)).thenReturn(contacto);
        when(leadRepository.findByContactoIdOrderByLastEntryAtDescIdDesc(100L)).thenReturn(List.of(lead));
        when(leadRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));

        leadService.completarIdentidadLead(25202L, request);

        assertThat(contacto.getUsermeta()).isEqualTo("EfrainBay");
        assertThat(lead.getUsermeta()).isEqualTo("EfrainBay");
        verify(eventoService, never()).registrarEvento(any(RegistrarEventoRequest.class));
    }

    @Test
    void completarIdentidadCompletaTelefonoYUsermetaCuandoFaltanAmbos() {
        Contacto contacto = Contacto.builder().id(100L).build();
        Lead lead = Lead.builder().id(25202L).contacto(contacto).etapa(Etapa.PREVENTA).build();
        LeadIdentidadRequest request = identidadRequest("+51", "987654321", "@EfrainBay");

        when(leadRepository.findById(25202L)).thenReturn(Optional.of(lead));
        when(contactoRepository.findByPrefijoAndLead("+51", "987654321")).thenReturn(Optional.empty());
        when(contactoRepository.findByUsermetaIgnoreCase("EfrainBay")).thenReturn(Optional.empty());
        when(contactoRepository.save(contacto)).thenReturn(contacto);
        when(leadRepository.findByContactoIdOrderByLastEntryAtDescIdDesc(100L)).thenReturn(List.of(lead));
        when(leadRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));

        leadService.completarIdentidadLead(25202L, request);

        assertThat(lead.getPrefijo()).isEqualTo("+51");
        assertThat(lead.getLead()).isEqualTo("987654321");
        assertThat(lead.getUsermeta()).isEqualTo("EfrainBay");
    }

    @Test
    void completarIdentidadRechazaCambioDeTelefonoExistente() {
        Contacto contacto = contactoTelefono();
        Lead lead = Lead.builder().id(25202L).contacto(contacto).etapa(Etapa.PREVENTA).build();
        LeadIdentidadRequest request = identidadRequest("+51", "912345678", null);

        when(leadRepository.findById(25202L)).thenReturn(Optional.of(lead));
        when(contactoRepository.findByPrefijoAndLead("+51", "912345678")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> leadService.completarIdentidadLead(25202L, request))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("otro telefono");
    }

    @Test
    void completarIdentidadRechazaCambioDeUsermetaExistente() {
        Contacto contacto = Contacto.builder()
                .id(100L)
                .prefijo("+51")
                .lead("987654321")
                .usermeta("EfrainBay")
                .build();
        Lead lead = Lead.builder().id(25202L).contacto(contacto).etapa(Etapa.PREVENTA).build();
        LeadIdentidadRequest request = identidadRequest(null, null, "OtroUsuario");

        when(leadRepository.findById(25202L)).thenReturn(Optional.of(lead));
        when(contactoRepository.findByUsermetaIgnoreCase("OtroUsuario")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> leadService.completarIdentidadLead(25202L, request))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("otro usermeta");
    }

    @Test
    void completarIdentidadRechazaTelefonoDeOtroContacto() {
        Contacto contacto = Contacto.builder().id(100L).usermeta("EfrainBay").build();
        Contacto otroContacto = Contacto.builder().id(200L).prefijo("+51").lead("987654321").build();
        Lead lead = Lead.builder().id(25202L).contacto(contacto).etapa(Etapa.PREVENTA).build();
        LeadIdentidadRequest request = identidadRequest("+51", "987654321", null);

        when(leadRepository.findById(25202L)).thenReturn(Optional.of(lead));
        when(contactoRepository.findByPrefijoAndLead("+51", "987654321")).thenReturn(Optional.of(otroContacto));

        assertThatThrownBy(() -> leadService.completarIdentidadLead(25202L, request))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("telefono pertenece a otro contacto");
    }

    @Test
    void completarIdentidadRechazaTelefonoQueFiguraEnOtroLead() {
        Contacto contacto = Contacto.builder().id(100L).usermeta("EfrainBay").build();
        Contacto otroContacto = Contacto.builder().id(200L).build();
        Lead lead = Lead.builder().id(25202L).contacto(contacto).etapa(Etapa.PREVENTA).build();
        Lead otroLead = Lead.builder().id(25203L).prefijo("+51").lead("987654321").contacto(otroContacto).etapa(Etapa.PREVENTA).build();
        LeadIdentidadRequest request = identidadRequest("+51", "987654321", null);

        when(leadRepository.findById(25202L)).thenReturn(Optional.of(lead));
        when(contactoRepository.findByPrefijoAndLead("+51", "987654321")).thenReturn(Optional.empty());
        when(leadRepository.findByPrefijoAndLead("+51", "987654321")).thenReturn(Optional.of(otroLead));

        assertThatThrownBy(() -> leadService.completarIdentidadLead(25202L, request))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("telefono ya figura en otro lead");
    }

    @Test
    void completarIdentidadRechazaUsermetaDeOtroContacto() {
        Contacto contacto = contactoTelefono();
        Contacto otroContacto = Contacto.builder().id(200L).usermeta("EfrainBay").build();
        Lead lead = Lead.builder().id(25202L).contacto(contacto).etapa(Etapa.PREVENTA).build();
        LeadIdentidadRequest request = identidadRequest(null, null, "EfrainBay");

        when(leadRepository.findById(25202L)).thenReturn(Optional.of(lead));
        when(contactoRepository.findByUsermetaIgnoreCase("EfrainBay")).thenReturn(Optional.of(otroContacto));

        assertThatThrownBy(() -> leadService.completarIdentidadLead(25202L, request))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("usermeta pertenece a otro contacto");
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

    private LeadIdentidadRequest identidadRequest(String prefijo, String lead, String usermeta) {
        LeadIdentidadRequest request = new LeadIdentidadRequest();
        request.setPrefijo(prefijo);
        request.setLead(lead);
        request.setUsermeta(usermeta);
        return request;
    }

    private Contacto contactoTelefono() {
        return Contacto.builder()
                .id(100L)
                .prefijo("+51")
                .lead("987654321")
                .build();
    }
}
