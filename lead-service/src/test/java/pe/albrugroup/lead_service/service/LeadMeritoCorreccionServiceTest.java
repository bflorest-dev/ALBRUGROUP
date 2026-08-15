package pe.albrugroup.lead_service.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.albrugroup.lead_service.configuration.CurrentUser;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.entity.LeadEtapaResumen;
import pe.albrugroup.lead_service.entity.LeadMeritoCorreccion;
import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.request.LeadMeritoCorreccionRequest;
import pe.albrugroup.lead_service.entity.response.UsuarioRolAuthResponse;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.exception.ConflictException;
import pe.albrugroup.lead_service.repository.LeadEtapaResumenRepository;
import pe.albrugroup.lead_service.repository.LeadMeritoCorreccionRepository;
import pe.albrugroup.lead_service.repository.LeadRepository;

import java.time.Instant;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LeadMeritoCorreccionServiceTest {

    @Mock private LeadRepository leadRepository;
    @Mock private LeadEtapaResumenRepository leadEtapaResumenRepository;
    @Mock private LeadMeritoCorreccionRepository correccionRepository;
    @Mock private AuthEquipoClient authEquipoClient;
    @Mock private CurrentUser currentUser;

    @InjectMocks private LeadMeritoCorreccionService service;

    @Test
    void corregirMeritoActualizaResumenCreaAuditoriaYConservaFechaMerito() {
        Instant fechaMerito = Instant.parse("2026-08-07T20:04:52Z");
        Lead lead = lead(100L, Etapa.POSTVENTA);
        LeadEtapaResumen resumen = resumen(fechaMerito, 900L, "Supervisor Turno");
        LeadMeritoCorreccionRequest request = request(14L);
        UsuarioRolAuthResponse asesorNuevo = new UsuarioRolAuthResponse(
                14L,
                "Xiomara Vega Magallanes",
                Set.of("ASESOR_VENTAS"),
                Set.of(3L)
        );

        when(leadRepository.findById(100L)).thenReturn(Optional.of(lead));
        when(leadEtapaResumenRepository.findByIdLeadAndEtapa(100L, Etapa.PREVENTA)).thenReturn(Optional.of(resumen));
        when(correccionRepository.existsByIdLeadAndEtapaMerito(100L, Etapa.PREVENTA)).thenReturn(false);
        when(authEquipoClient.obtenerAsesorVentasDelEquipo(3L, 14L)).thenReturn(asesorNuevo);
        when(currentUser.empleadoID()).thenReturn(1L);
        when(currentUser.nombreCompleto()).thenReturn("Admin Principal");
        when(currentUser.rolPrincipal()).thenReturn("ADMINISTRADOR");
        when(correccionRepository.saveAndFlush(any(LeadMeritoCorreccion.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.corregirMerito(100L, request);

        assertEquals(14L, resumen.getIdAsesorMerito());
        assertEquals("Xiomara Vega Magallanes", resumen.getNombreAsesorMerito());
        assertSame(fechaMerito, resumen.getFechaMerito());
        assertEquals(900L, response.getIdAsesorAnterior());
        assertEquals(14L, response.getIdAsesorNuevo());
        assertSame(fechaMerito, response.getFechaMeritoPreventa());

        ArgumentCaptor<LeadMeritoCorreccion> auditoria = ArgumentCaptor.forClass(LeadMeritoCorreccion.class);
        verify(correccionRepository).saveAndFlush(auditoria.capture());
        assertEquals(100L, auditoria.getValue().getIdLead());
        assertEquals(900L, auditoria.getValue().getIdAsesorAnterior());
        assertEquals(14L, auditoria.getValue().getIdAsesorNuevo());
        assertEquals("ADMINISTRADOR", auditoria.getValue().getRolActor());
        verify(leadEtapaResumenRepository).save(resumen);
    }

    @Test
    void rechazaSegundaCorreccionDelMismoLead() {
        Lead lead = lead(100L, Etapa.VENTA);
        LeadEtapaResumen resumen = resumen(Instant.parse("2026-08-07T20:04:52Z"), 900L, "Supervisor Turno");

        when(leadRepository.findById(100L)).thenReturn(Optional.of(lead));
        when(leadEtapaResumenRepository.findByIdLeadAndEtapa(100L, Etapa.PREVENTA)).thenReturn(Optional.of(resumen));
        when(correccionRepository.existsByIdLeadAndEtapaMerito(100L, Etapa.PREVENTA)).thenReturn(true);

        assertThrows(ConflictException.class, () -> service.corregirMerito(100L, request(14L)));
        verify(leadEtapaResumenRepository, never()).save(any());
    }

    @Test
    void rechazaLeadQueSigueEnPreventa() {
        when(leadRepository.findById(100L)).thenReturn(Optional.of(lead(100L, Etapa.PREVENTA)));

        assertThrows(BadRequestException.class, () -> service.corregirMerito(100L, request(14L)));
        verify(leadEtapaResumenRepository, never()).save(any());
    }

    @Test
    void rechazaPreventaSinFechaMerito() {
        Lead lead = lead(100L, Etapa.VENTA);
        LeadEtapaResumen resumen = resumen(null, 900L, "Supervisor Turno");

        when(leadRepository.findById(100L)).thenReturn(Optional.of(lead));
        when(leadEtapaResumenRepository.findByIdLeadAndEtapa(100L, Etapa.PREVENTA)).thenReturn(Optional.of(resumen));

        assertThrows(BadRequestException.class, () -> service.corregirMerito(100L, request(14L)));
        verify(leadEtapaResumenRepository, never()).save(any());
    }

    @Test
    void rechazaAsesorQueNoEsAsesorVentasDelEquipo() {
        Lead lead = lead(100L, Etapa.POSTVENTA);
        LeadEtapaResumen resumen = resumen(Instant.parse("2026-08-07T20:04:52Z"), 900L, "Supervisor Turno");

        when(leadRepository.findById(100L)).thenReturn(Optional.of(lead));
        when(leadEtapaResumenRepository.findByIdLeadAndEtapa(100L, Etapa.PREVENTA)).thenReturn(Optional.of(resumen));
        when(correccionRepository.existsByIdLeadAndEtapaMerito(100L, Etapa.PREVENTA)).thenReturn(false);
        when(authEquipoClient.obtenerAsesorVentasDelEquipo(3L, 14L)).thenReturn(null);

        assertThrows(BadRequestException.class, () -> service.corregirMerito(100L, request(14L)));
        verify(leadEtapaResumenRepository, never()).save(any());
    }

    private Lead lead(Long id, Etapa etapa) {
        Lead lead = Lead.builder()
                .lead("989383554")
                .idEquipo(3L)
                .etapa(etapa)
                .estado(EstadoSeguimiento.GESTIONADO)
                .build();
        lead.setId(id);
        return lead;
    }

    private LeadEtapaResumen resumen(Instant fechaMerito, Long idAsesor, String nombreAsesor) {
        return LeadEtapaResumen.builder()
                .idLead(100L)
                .etapa(Etapa.PREVENTA)
                .fechaMerito(fechaMerito)
                .idAsesorMerito(idAsesor)
                .nombreAsesorMerito(nombreAsesor)
                .build();
    }

    private LeadMeritoCorreccionRequest request(Long idAsesorMerito) {
        LeadMeritoCorreccionRequest request = new LeadMeritoCorreccionRequest();
        request.setIdAsesorMerito(idAsesorMerito);
        request.setMotivo("Venta subida por supervisor fuera de horario");
        return request;
    }
}
