package pe.albrugroup.schedule_service.service;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import pe.albrugroup.schedule_service.entity.Horario;
import pe.albrugroup.schedule_service.repository.AsistenciaRepository;
import pe.albrugroup.schedule_service.repository.HorarioRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BajaEmpleadoServiceTest {

    private static final Long EMPLEADO_ID = 17L;

    @Mock
    private HorarioRepository horarioRepository;
    @Mock
    private AsistenciaRepository asistenciaRepository;
    @Mock
    private SimpMessagingTemplate messagingTemplate;

    private BajaEmpleadoService service;

    @BeforeEach
    void setUp() {
        service = new BajaEmpleadoService(horarioRepository, asistenciaRepository, messagingTemplate);
        TransactionSynchronizationManager.initSynchronization();
    }

    @AfterEach
    void tearDown() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    void cierraTodosLosHorariosVigentesConLaFechaDeBajaSolicitada() {
        LocalDate fechaFin = LocalDate.of(2026, 11, 20);
        Horario horarioActual = horario(1L, fechaFin.minusDays(30), null);
        Horario horarioSolapado = horario(2L, fechaFin.minusDays(5), fechaFin.plusDays(10));
        when(horarioRepository.findHorariosEnRango(EMPLEADO_ID, fechaFin, fechaFin))
                .thenReturn(List.of(horarioActual, horarioSolapado));
        when(asistenciaRepository.findByIdEmpleadoAndFecha(EMPLEADO_ID, any(LocalDate.class)))
                .thenReturn(Optional.empty());

        service.procesarBajaEmpleado(EMPLEADO_ID, fechaFin);

        assertThat(horarioActual.getFechaFin()).isEqualTo(fechaFin);
        assertThat(horarioSolapado.getFechaFin()).isEqualTo(fechaFin);
        verify(horarioRepository).save(horarioActual);
        verify(horarioRepository).save(horarioSolapado);
    }

    private Horario horario(Long id, LocalDate fechaInicio, LocalDate fechaFin) {
        return Horario.builder()
                .id(id)
                .idEmpleado(EMPLEADO_ID)
                .fechaInicio(fechaInicio)
                .fechaFin(fechaFin)
                .build();
    }
}
