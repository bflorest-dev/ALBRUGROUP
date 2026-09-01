package pe.albrugroup.lead_service.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import pe.albrugroup.lead_service.configuration.CurrentUser;
import pe.albrugroup.lead_service.entity.enums.Accion;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.request.PageRequest;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.exception.NotFoundException;
import pe.albrugroup.lead_service.repository.EventoRepository;
import pe.albrugroup.lead_service.repository.LeadEtapaResumenRepository;
import pe.albrugroup.lead_service.repository.LeadRepository;
import pe.albrugroup.lead_service.service.mapper.EventoMapper;

import java.util.Collection;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anySet;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EventoServiceHistorialBackofficeTest {

    @Mock private EventoRepository eventoRepository;
    @Mock private LeadRepository leadRepository;
    @Mock private LeadEtapaResumenRepository leadEtapaResumenRepository;
    @Mock private CurrentUser currentUser;
    @Mock private EventoMapper eventoMapper;
    @Mock private PaginationService paginationService;
    @Mock private LeadAsignacionCounterService leadAsignacionCounterService;
    @Mock private ProveedorScopeService proveedorScopeService;

    @InjectMocks private EventoService eventoService;

    @Test
    void todoConsultaSoloLasCuatroAccionesPermitidasEnVenta() {
        PageRequest request = request();
        Pageable pageable = Pageable.unpaged();
        prepararConsultaGlobal(25L, request, pageable);

        eventoService.listarHistorialBackofficeVenta(25L, null, request);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<Collection<Accion>> acciones = ArgumentCaptor.forClass(Collection.class);
        verify(eventoRepository).listarEventosLeadVisiblesPorAccionesYEtapa(
                eq(25L),
                acciones.capture(),
                eq(Etapa.VENTA),
                eq(false),
                eq(List.of(-1L)),
                eq(pageable)
        );
        assertThat(acciones.getValue()).containsExactlyInAnyOrder(
                Accion.TIPIFICACION,
                Accion.ASIGNACION,
                Accion.CONTACTO,
                Accion.CORRECCION
        );
    }

    @ParameterizedTest
    @EnumSource(value = Accion.class, names = {"TIPIFICACION", "ASIGNACION", "CONTACTO", "CORRECCION"})
    void filtraCadaAccionPermitida(Accion accion) {
        PageRequest request = request();
        Pageable pageable = Pageable.unpaged();
        prepararConsultaGlobal(26L, request, pageable);

        eventoService.listarHistorialBackofficeVenta(26L, accion, request);

        verify(eventoRepository).listarEventosLeadVisiblesPorAccionesYEtapa(
                26L,
                List.of(accion),
                Etapa.VENTA,
                false,
                List.of(-1L),
                pageable
        );
    }

    @Test
    void rechazaAccionesAjenasAlHistorial() {
        PageRequest request = request();
        when(leadRepository.existsById(27L)).thenReturn(true);

        assertThatThrownBy(() -> eventoService.listarHistorialBackofficeVenta(27L, Accion.REGISTRO, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Accion no permitida");

        verify(eventoRepository, never()).listarEventosLeadVisiblesPorAccionesYEtapa(
                any(), anyCollection(), any(), any(Boolean.class), anyCollection(), any()
        );
    }

    @Test
    void conservaElScopeDeEquiposDelUsuario() {
        PageRequest request = request();
        Pageable pageable = Pageable.unpaged();
        when(leadRepository.existsById(28L)).thenReturn(true);
        when(currentUser.tieneVisibilidadGlobalEquipos()).thenReturn(false);
        when(currentUser.equipos()).thenReturn(List.of(7L, 9L));
        when(paginationService.toPageable(eq(request), anySet())).thenReturn(pageable);
        when(eventoRepository.listarEventosLeadVisiblesPorAccionesYEtapa(
                eq(28L), anyCollection(), eq(Etapa.VENTA), eq(true), eq(List.of(7L, 9L)), eq(pageable)
        )).thenReturn(Page.empty());

        eventoService.listarHistorialBackofficeVenta(28L, Accion.TIPIFICACION, request);

        verify(eventoRepository).listarEventosLeadVisiblesPorAccionesYEtapa(
                28L,
                List.of(Accion.TIPIFICACION),
                Etapa.VENTA,
                true,
                List.of(7L, 9L),
                pageable
        );
    }

    @Test
    void conservaNotFoundParaLeadInexistente() {
        PageRequest request = request();
        when(leadRepository.existsById(29L)).thenReturn(false);

        assertThatThrownBy(() -> eventoService.listarHistorialBackofficeVenta(29L, null, request))
                .isInstanceOf(NotFoundException.class);
    }

    private void prepararConsultaGlobal(Long idLead, PageRequest request, Pageable pageable) {
        when(leadRepository.existsById(idLead)).thenReturn(true);
        when(currentUser.tieneVisibilidadGlobalEquipos()).thenReturn(true);
        when(paginationService.toPageable(eq(request), anySet())).thenReturn(pageable);
        when(eventoRepository.listarEventosLeadVisiblesPorAccionesYEtapa(
                eq(idLead), anyCollection(), eq(Etapa.VENTA), eq(false), eq(List.of(-1L)), eq(pageable)
        )).thenReturn(Page.empty());
    }

    private PageRequest request() {
        return PageRequest.builder()
                .pageNumber(0)
                .pageSize(100)
                .sortBy("createdAt")
                .direction("desc")
                .build();
    }
}
