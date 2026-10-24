package pe.albrugroup.schedule_service.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.albrugroup.schedule_service.entity.PresenciaTramo;
import pe.albrugroup.schedule_service.entity.enums.OrigenPresencia;
import pe.albrugroup.schedule_service.repository.AsistenciaRepository;
import pe.albrugroup.schedule_service.repository.PresenciaTramoRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PresenciaTramoServiceTest {

    @Mock PresenciaTramoRepository presenciaTramoRepository;
    @Mock AsistenciaRepository asistenciaRepository;

    @Test
    void reemplazaSoloElCierreAutomaticoFinalPorCierreManual() {
        LocalDate fecha = LocalDate.of(2026, 8, 10);
        LocalDateTime salidaAutomatica = LocalDateTime.of(fecha, java.time.LocalTime.of(16, 30));
        LocalDateTime salidaManual = LocalDateTime.of(fecha, java.time.LocalTime.of(17, 0));
        PresenciaTramo anterior = PresenciaTramo.builder()
                .id(10L).idEmpleado(21L).fecha(fecha)
                .inicio(LocalDateTime.of(fecha, java.time.LocalTime.of(8, 0)))
                .fin(LocalDateTime.of(fecha, java.time.LocalTime.of(12, 0)))
                .origenInicio(OrigenPresencia.ONLINE_ENDPOINT)
                .origenFin(OrigenPresencia.INACTIVIDAD)
                .build();
        PresenciaTramo finalAutomatico = PresenciaTramo.builder()
                .id(11L).idEmpleado(21L).fecha(fecha)
                .inicio(LocalDateTime.of(fecha, java.time.LocalTime.of(13, 0)))
                .fin(salidaAutomatica)
                .origenInicio(OrigenPresencia.HEARTBEAT_RECOVERY)
                .origenFin(OrigenPresencia.AUTO_CIERRE)
                .build();
        when(presenciaTramoRepository.findByIdEmpleadoAndFechaOrderByInicioAsc(21L, fecha))
                .thenReturn(List.of(anterior, finalAutomatico));

        PresenciaTramoService service = new PresenciaTramoService(presenciaTramoRepository, asistenciaRepository);
        service.registrarCierreManual(21L, fecha, salidaAutomatica, salidaManual);

        assertThat(anterior.getFin()).isEqualTo(LocalDateTime.of(fecha, java.time.LocalTime.of(12, 0)));
        assertThat(finalAutomatico.getFin()).isEqualTo(salidaManual);
        assertThat(finalAutomatico.getOrigenFin()).isEqualTo(OrigenPresencia.CIERRE_MANUAL);
        verify(presenciaTramoRepository).save(finalAutomatico);
    }

    @Test
    void cierraElTramoAbiertoSinCrearUnoNuevo() {
        LocalDate fecha = LocalDate.of(2026, 8, 10);
        PresenciaTramo abierto = PresenciaTramo.builder()
                .id(12L).idEmpleado(21L).fecha(fecha)
                .inicio(LocalDateTime.of(fecha, java.time.LocalTime.of(8, 0)))
                .origenInicio(OrigenPresencia.ONLINE_ENDPOINT)
                .build();
        when(presenciaTramoRepository.findByIdEmpleadoAndFechaOrderByInicioAsc(21L, fecha))
                .thenReturn(List.of(abierto));

        PresenciaTramoService service = new PresenciaTramoService(presenciaTramoRepository, asistenciaRepository);
        LocalDateTime salidaManual = LocalDateTime.of(fecha, java.time.LocalTime.of(17, 0));
        service.registrarCierreManual(21L, fecha, null, salidaManual);

        assertThat(abierto.getFin()).isEqualTo(salidaManual);
        assertThat(abierto.getOrigenFin()).isEqualTo(OrigenPresencia.CIERRE_MANUAL);
        verify(presenciaTramoRepository).save(abierto);
    }

    @Test
    void noCreaPresenciaCuandoNoExisteTramoRelacionado() {
        LocalDate fecha = LocalDate.of(2026, 8, 10);
        when(presenciaTramoRepository.findByIdEmpleadoAndFechaOrderByInicioAsc(21L, fecha))
                .thenReturn(List.of());

        PresenciaTramoService service = new PresenciaTramoService(presenciaTramoRepository, asistenciaRepository);
        service.registrarCierreManual(21L, fecha, null,
                LocalDateTime.of(fecha, java.time.LocalTime.of(17, 0)));

        verify(presenciaTramoRepository, org.mockito.Mockito.never()).save(any(PresenciaTramo.class));
    }
}
