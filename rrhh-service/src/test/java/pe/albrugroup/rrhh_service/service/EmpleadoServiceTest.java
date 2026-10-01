package pe.albrugroup.rrhh_service.service;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import pe.albrugroup.rrhh_service.entity.Contrato;
import pe.albrugroup.rrhh_service.entity.Empleado;
import pe.albrugroup.rrhh_service.entity.enums.EstadoOperativo;
import pe.albrugroup.rrhh_service.entity.request.contrato.CerrarContratoRequest;
import pe.albrugroup.rrhh_service.entity.response.EmpleadoResponse;
import pe.albrugroup.rrhh_service.integration.auth.AuthServiceClient;
import pe.albrugroup.rrhh_service.integration.schedule.ScheduleServiceClient;
import pe.albrugroup.rrhh_service.repository.ContratoRepository;
import pe.albrugroup.rrhh_service.repository.EmpleadoRepository;
import pe.albrugroup.rrhh_service.repository.EmpresaContratistaRepository;
import pe.albrugroup.rrhh_service.service.mapper.EmpleadoMapper;
import pe.albrugroup.rrhh_service.service.mapper.EmpleadoRolMapper;

import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EmpleadoServiceTest {

    private static final Long EMPLEADO_ID = 17L;

    @Mock private EmpleadoRepository repository;
    @Mock private ContratoRepository contratoRepository;
    @Mock private EmpresaContratistaRepository empresaContratistaRepository;
    @Mock private EmpleadoMapper mapper;
    @Mock private EmpleadoRolMapper empleadoRolMapper;
    @Mock private EventoService eventoService;
    @Mock private PaginationService paginationService;
    @Mock private AuthServiceClient authServiceClient;
    @Mock private ScheduleServiceClient scheduleServiceClient;

    @InjectMocks
    private EmpleadoService empleadoService;

    @BeforeEach
    void iniciarSincronizacionTransaccional() {
        TransactionSynchronizationManager.initSynchronization();
    }

    @AfterEach
    void limpiarSincronizacionTransaccional() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    void daDeBajaUsandoLaFechaSolicitadaYConservaNotificacionesPostCommit() {
        Empleado empleado = Empleado.builder()
                .id(EMPLEADO_ID)
                .estadoOperativo(EstadoOperativo.ACTIVO)
                .build();
        Contrato contrato = Contrato.builder()
                .fechaInicio(LocalDate.now().minusDays(30))
                .empleado(empleado)
                .build();
        LocalDate fechaFin = LocalDate.now().minusDays(2);
        CerrarContratoRequest request = CerrarContratoRequest.builder().fechaFin(fechaFin).build();
        EmpleadoResponse response = new EmpleadoResponse();
        when(repository.findById(EMPLEADO_ID)).thenReturn(Optional.of(empleado));
        when(contratoRepository.findContratoVigenteByEmpleadoId(eq(EMPLEADO_ID), any(LocalDate.class)))
                .thenReturn(Optional.of(contrato));
        when(mapper.toResponse(empleado)).thenReturn(response);

        EmpleadoResponse resultado = empleadoService.darDeBajaEmpleado(EMPLEADO_ID, request, "Bearer token");

        assertThat(resultado).isSameAs(response);
        assertThat(contrato.getFechaFin()).isEqualTo(fechaFin);
        assertThat(empleado.getEstadoOperativo()).isEqualTo(EstadoOperativo.INACTIVO);
        verify(authServiceClient, never()).deshabilitarUsuario(any(), any());
        verify(scheduleServiceClient, never()).notificarBajaEmpleado(any(), any());

        TransactionSynchronizationManager.getSynchronizations()
                .forEach(TransactionSynchronization::afterCommit);
        verify(authServiceClient).deshabilitarUsuario("Bearer token", EMPLEADO_ID);
        verify(scheduleServiceClient).notificarBajaEmpleado("Bearer token", EMPLEADO_ID);
    }

    @Test
    void rechazaUnaFechaAnteriorAlInicioSinInactivarAlEmpleado() {
        Empleado empleado = Empleado.builder()
                .id(EMPLEADO_ID)
                .estadoOperativo(EstadoOperativo.ACTIVO)
                .build();
        Contrato contrato = Contrato.builder()
                .fechaInicio(LocalDate.now().minusDays(5))
                .empleado(empleado)
                .build();
        CerrarContratoRequest request = CerrarContratoRequest.builder()
                .fechaFin(contrato.getFechaInicio().minusDays(1))
                .build();
        when(repository.findById(EMPLEADO_ID)).thenReturn(Optional.of(empleado));
        when(contratoRepository.findContratoVigenteByEmpleadoId(eq(EMPLEADO_ID), any(LocalDate.class)))
                .thenReturn(Optional.of(contrato));

        assertThatThrownBy(() -> empleadoService.darDeBajaEmpleado(EMPLEADO_ID, request, "Bearer token"))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("fecha de fin");

        assertThat(contrato.getFechaFin()).isNull();
        assertThat(empleado.getEstadoOperativo()).isEqualTo(EstadoOperativo.ACTIVO);
        verify(mapper, never()).toResponse(any());
        verify(authServiceClient, never()).deshabilitarUsuario(any(), any());
        verify(scheduleServiceClient, never()).notificarBajaEmpleado(any(), any());
    }

    @Test
    void puedeInactivarAunqueNoExistaContratoVigente() {
        Empleado empleado = Empleado.builder()
                .id(EMPLEADO_ID)
                .estadoOperativo(EstadoOperativo.ACTIVO)
                .build();
        CerrarContratoRequest request = CerrarContratoRequest.builder().fechaFin(LocalDate.now()).build();
        EmpleadoResponse response = new EmpleadoResponse();
        when(repository.findById(EMPLEADO_ID)).thenReturn(Optional.of(empleado));
        when(contratoRepository.findContratoVigenteByEmpleadoId(eq(EMPLEADO_ID), any(LocalDate.class)))
                .thenReturn(Optional.empty());
        when(mapper.toResponse(empleado)).thenReturn(response);

        empleadoService.darDeBajaEmpleado(EMPLEADO_ID, request, "Bearer token");

        assertThat(empleado.getEstadoOperativo()).isEqualTo(EstadoOperativo.INACTIVO);
        verify(mapper).toResponse(empleado);
    }
}
