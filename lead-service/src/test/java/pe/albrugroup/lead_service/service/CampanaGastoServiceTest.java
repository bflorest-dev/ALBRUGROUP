package pe.albrugroup.lead_service.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.albrugroup.lead_service.entity.Campana;
import pe.albrugroup.lead_service.entity.GastoCampana;
import pe.albrugroup.lead_service.entity.request.ActualizarGastoCampanaRequest;
import pe.albrugroup.lead_service.entity.request.CampanaGastoRequest;
import pe.albrugroup.lead_service.entity.response.CampanaGastoResponse;
import pe.albrugroup.lead_service.repository.CampanaRepository;
import pe.albrugroup.lead_service.repository.EquipoProveedorRepository;
import pe.albrugroup.lead_service.repository.EventoRepository;
import pe.albrugroup.lead_service.repository.GastoCampanaRepository;
import pe.albrugroup.lead_service.repository.LeadEtapaResumenRepository;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CampanaGastoServiceTest {

    @Mock private GastoCampanaRepository registroRepository;
    @Mock private CampanaRepository campanaRepository;
    @Mock private EquipoProveedorRepository equipoProveedorRepository;
    @Mock private EventoRepository eventoRepository;
    @Mock private LeadEtapaResumenRepository leadEtapaResumenRepository;

    @InjectMocks private CampanaGastoService service;

    @Test
    void registraElMomentoOperativoYCalculaElEmbudo() {
        Campana campana = campana(Instant.parse("2026-09-20T05:00:00Z"));
        LocalDateTime reportedAt = LocalDateTime.of(2026, 9, 23, 16, 30);
        when(campanaRepository.findActiveByIdForUpdate(1L)).thenReturn(Optional.of(campana));
        when(registroRepository.findTopByCampanaIdAndReportedAtGreaterThanEqualAndReportedAtLessThanOrderByReportedAtDescIdDesc(
                anyLong(), any(), any())).thenReturn(Optional.empty());
        when(registroRepository.saveAndFlush(any(GastoCampana.class))).thenAnswer(invocation -> {
            GastoCampana gasto = invocation.getArgument(0);
            gasto.setId(7L);
            return gasto;
        });
        when(registroRepository.save(any(GastoCampana.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(eventoRepository.contarRegistrosPorCampanaYRango(anyLong(), any(), any(), any())).thenReturn(4L);
        when(leadEtapaResumenRepository.contarPreventasPorCampanaYRango(anyLong(), any(), any(), any(), any())).thenReturn(3L);
        when(leadEtapaResumenRepository.contarVentasPorCampanaYRango(anyLong(), any(), any(), any(), any(), any())).thenReturn(2L);

        CampanaGastoResponse response = service.registrarGasto(1L, request(12, reportedAt));

        assertThat(response.getReportedAt()).isEqualTo(reportedAt);
        assertThat(response.getCantidadPreventas()).isEqualTo(3);
        assertThat(response.getCantidadVentas()).isEqualTo(2);
        ArgumentCaptor<GastoCampana> captor = ArgumentCaptor.forClass(GastoCampana.class);
        verify(registroRepository).saveAndFlush(captor.capture());
        assertThat(captor.getValue().getReportedAt()).isEqualTo(reportedAt);
    }

    @Test
    void rechazaFechaFutura() {
        Campana campana = campana(Instant.parse("2026-09-20T05:00:00Z"));
        when(campanaRepository.findActiveByIdForUpdate(1L)).thenReturn(Optional.of(campana));

        assertThatThrownBy(() -> service.registrarGasto(1L,
                request(12, LocalDateTime.now().plusDays(1))))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("futuro");
    }

    @Test
    void rechazaRegistroFueraDeOrdenYLeadsDecrecientes() {
        Campana campana = campana(Instant.parse("2026-09-20T05:00:00Z"));
        GastoCampana ultimo = GastoCampana.builder().id(4L).campana(campana)
                .reportedAt(LocalDateTime.of(2026, 9, 23, 16, 0)).leadsReportados(20).build();
        when(campanaRepository.findActiveByIdForUpdate(1L)).thenReturn(Optional.of(campana));
        when(registroRepository.findTopByCampanaIdAndReportedAtGreaterThanEqualAndReportedAtLessThanOrderByReportedAtDescIdDesc(
                anyLong(), any(), any())).thenReturn(Optional.of(ultimo));

        assertThatThrownBy(() -> service.registrarGasto(1L,
                request(19, LocalDateTime.of(2026, 9, 23, 16, 30))))
                .isInstanceOf(RuntimeException.class).hasMessageContaining("menor");
        assertThatThrownBy(() -> service.registrarGasto(1L,
                request(20, LocalDateTime.of(2026, 9, 23, 15, 30))))
                .isInstanceOf(RuntimeException.class).hasMessageContaining("posterior");
    }

    @Test
    void soloPermiteEditarElUltimoRegistroDelDia() {
        Campana campana = campana(Instant.parse("2026-09-20T05:00:00Z"));
        GastoCampana anterior = GastoCampana.builder().id(3L).campana(campana)
                .reportedAt(LocalDateTime.of(2026, 9, 23, 15, 0)).leadsReportados(10).build();
        GastoCampana ultimo = GastoCampana.builder().id(4L).campana(campana)
                .reportedAt(LocalDateTime.of(2026, 9, 23, 16, 0)).leadsReportados(20).build();
        when(campanaRepository.findActiveByIdForUpdate(1L)).thenReturn(Optional.of(campana));
        when(registroRepository.findByIdAndCampanaId(3L, 1L)).thenReturn(Optional.of(anterior));
        when(registroRepository.findTopByCampanaIdAndReportedAtGreaterThanEqualAndReportedAtLessThanOrderByReportedAtDescIdDesc(
                anyLong(), any(), any())).thenReturn(Optional.of(ultimo));

        assertThatThrownBy(() -> service.actualizarGasto(1L, 3L, update(12)))
                .isInstanceOf(RuntimeException.class).hasMessageContaining("ultimo");
    }

    @Test
    void recalculaSoloElUltimoRegistroDeCadaDia() {
        Campana campana = campana(Instant.parse("2026-09-20T05:00:00Z"));
        GastoCampana intermedio = GastoCampana.builder().id(8L).campana(campana)
                .reportedAt(LocalDateTime.of(2026, 9, 23, 9, 0)).cantidadPreventas(1).build();
        GastoCampana ultimo = GastoCampana.builder().id(9L).campana(campana)
                .reportedAt(LocalDateTime.of(2026, 9, 23, 18, 0)).cantidadPreventas(2).build();
        when(registroRepository.findAllByOrderByReportedAtAscIdAsc()).thenReturn(List.of(intermedio, ultimo));
        when(leadEtapaResumenRepository.contarPreventasPorCampanaYRango(anyLong(), any(), any(), any(), any())).thenReturn(6L);
        when(leadEtapaResumenRepository.contarVentasPorCampanaYRango(anyLong(), any(), any(), any(), any(), any())).thenReturn(4L);

        int recalculados = service.recalcularUltimosRegistrosHistoricos();

        assertThat(recalculados).isEqualTo(1);
        assertThat(intermedio.getCantidadVentas()).isNull();
        assertThat(ultimo.getCantidadPreventas()).isEqualTo(6);
        assertThat(ultimo.getCantidadVentas()).isEqualTo(4);
        verify(registroRepository).saveAllAndFlush(List.of(intermedio, ultimo));
    }

    private Campana campana(Instant createdAt) {
        Campana campana = new Campana();
        campana.setId(1L);
        campana.setNombre("Campaña prueba");
        campana.setActivo(true);
        campana.setCreatedAt(createdAt);
        return campana;
    }

    private CampanaGastoRequest request(int leads, LocalDateTime reportedAt) {
        CampanaGastoRequest request = new CampanaGastoRequest();
        request.setLeadsReportados(leads);
        request.setCostoTotal(BigDecimal.valueOf(20));
        request.setReportedAt(reportedAt);
        return request;
    }

    private ActualizarGastoCampanaRequest update(int leads) {
        ActualizarGastoCampanaRequest request = new ActualizarGastoCampanaRequest();
        request.setLeadsReportados(leads);
        request.setCostoTotal(BigDecimal.valueOf(21));
        return request;
    }
}
