package pe.albrugroup.lead_service.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.albrugroup.lead_service.entity.Evento;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.entity.enums.Accion;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.request.LeadInstalacionCorreccionRequest;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.repository.EventoRepository;
import pe.albrugroup.lead_service.repository.LeadRepository;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LeadInstalacionCorreccionServiceTest {

    @Mock private LeadRepository leadRepository;
    @Mock private EventoRepository eventoRepository;
    @Mock private CalendarioFacturacionPostventaService calendarioFacturacionPostventaService;
    @Mock private ProveedorScopeService proveedorScopeService;

    @Test
    void corregirInstalacionActualizaLeadEventoYCalendarioPostventa() {
        LeadInstalacionCorreccionService service = service();
        Lead lead = Lead.builder()
                .id(28248L)
                .lead("963087942")
                .etapa(Etapa.POSTVENTA)
                .sec("111111111")
                .sot("22222222")
                .nombreProveedorSnapshot("CLARO")
                .build();
        Evento evento = Evento.builder()
                .id(150482L)
                .idLead(28248L)
                .accion(Accion.TIPIFICACION)
                .etapa(Etapa.VENTA)
                .tipificacion("INSTALADO")
                .fechaInstalacion(LocalDate.of(2026, 7, 22))
                .build();
        LeadInstalacionCorreccionRequest request = new LeadInstalacionCorreccionRequest();
        request.setSec("123456789");
        request.setSot("87654321");
        request.setFechaInstalacion(LocalDate.of(2026, 7, 30));

        when(proveedorScopeService.ambitoActual()).thenReturn(null);
        when(proveedorScopeService.resolverScope(null)).thenReturn(ProveedorScopeService.Scope.sinRestriccion());
        when(leadRepository.findById(28248L)).thenReturn(Optional.of(lead));
        when(eventoRepository.findTopByIdLeadAndAccionAndEtapaAndTipificacionOrderByCreatedAtDescIdDesc(
                28248L,
                Accion.TIPIFICACION,
                Etapa.VENTA,
                "INSTALADO"
        )).thenReturn(Optional.of(evento));
        when(leadRepository.save(any(Lead.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(eventoRepository.save(any(Evento.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var response = service.corregirInstalacion(28248L, request);

        assertThat(response.getSecAnterior()).isEqualTo("111111111");
        assertThat(response.getSecNuevo()).isEqualTo("123456789");
        assertThat(response.getSotAnterior()).isEqualTo("22222222");
        assertThat(response.getSotNuevo()).isEqualTo("87654321");
        assertThat(response.getFechaInstalacionAnterior()).isEqualTo(LocalDate.of(2026, 7, 22));
        assertThat(response.getFechaInstalacionNueva()).isEqualTo(LocalDate.of(2026, 7, 30));
        assertThat(response.getIdEventoInstalado()).isEqualTo(150482L);

        ArgumentCaptor<Lead> leadCaptor = ArgumentCaptor.forClass(Lead.class);
        verify(leadRepository).save(leadCaptor.capture());
        assertThat(leadCaptor.getValue().getDiaCorteFacturacion()).isEqualTo(30);
        verify(calendarioFacturacionPostventaService)
                .sincronizarFechaInstalacionExistente(lead, LocalDate.of(2026, 7, 30));
    }

    @Test
    void rechazaCampoPresenteConNull() {
        LeadInstalacionCorreccionService service = service();
        LeadInstalacionCorreccionRequest request = new LeadInstalacionCorreccionRequest();
        request.setSec(null);

        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> service.corregirInstalacion(28248L, request)
        );

        assertThat(exception.getMessage()).contains("SEC es obligatorio");
        verify(leadRepository, never()).save(any());
    }

    @Test
    void rechazaLeadFueraDeVentaOPostventa() {
        LeadInstalacionCorreccionService service = service();
        Lead lead = Lead.builder()
                .id(28248L)
                .etapa(Etapa.PREVENTA)
                .build();
        LeadInstalacionCorreccionRequest request = new LeadInstalacionCorreccionRequest();
        request.setSot("87654321");

        when(leadRepository.findById(28248L)).thenReturn(Optional.of(lead));

        assertThrows(BadRequestException.class, () -> service.corregirInstalacion(28248L, request));
        verify(eventoRepository, never()).save(any());
    }

    @Test
    void rechazaLeadSinEventoInstaladoVenta() {
        LeadInstalacionCorreccionService service = service();
        Lead lead = Lead.builder()
                .id(28248L)
                .etapa(Etapa.POSTVENTA)
                .build();
        LeadInstalacionCorreccionRequest request = new LeadInstalacionCorreccionRequest();
        request.setSot("87654321");

        when(proveedorScopeService.ambitoActual()).thenReturn(null);
        when(proveedorScopeService.resolverScope(null)).thenReturn(ProveedorScopeService.Scope.sinRestriccion());
        when(leadRepository.findById(28248L)).thenReturn(Optional.of(lead));
        when(eventoRepository.findTopByIdLeadAndAccionAndEtapaAndTipificacionOrderByCreatedAtDescIdDesc(
                28248L,
                Accion.TIPIFICACION,
                Etapa.VENTA,
                "INSTALADO"
        )).thenReturn(Optional.empty());

        BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> service.corregirInstalacion(28248L, request)
        );

        assertThat(exception.getMessage()).contains("No se encontro una instalacion registrada");
        verify(leadRepository, never()).save(any());
    }

    private LeadInstalacionCorreccionService service() {
        return new LeadInstalacionCorreccionService(
                leadRepository,
                eventoRepository,
                calendarioFacturacionPostventaService,
                proveedorScopeService
        );
    }
}
