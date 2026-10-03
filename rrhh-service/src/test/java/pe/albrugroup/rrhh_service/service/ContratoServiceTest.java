package pe.albrugroup.rrhh_service.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.albrugroup.rrhh_service.entity.Contrato;
import pe.albrugroup.rrhh_service.entity.Empleado;
import pe.albrugroup.rrhh_service.entity.enums.CategoriaPersonal;
import pe.albrugroup.rrhh_service.entity.enums.EstadoOperativo;
import pe.albrugroup.rrhh_service.entity.enums.Modalidad;
import pe.albrugroup.rrhh_service.entity.enums.Regimen;
import pe.albrugroup.rrhh_service.entity.request.contrato.ActualizarContratoVigenteRequest;
import pe.albrugroup.rrhh_service.entity.request.contrato.CerrarContratoRequest;
import pe.albrugroup.rrhh_service.entity.response.ContratoResponse;
import pe.albrugroup.rrhh_service.exception.BadRequestException;
import pe.albrugroup.rrhh_service.exception.ConflictException;
import pe.albrugroup.rrhh_service.repository.ContratoRepository;
import pe.albrugroup.rrhh_service.repository.EmpleadoRepository;
import pe.albrugroup.rrhh_service.service.mapper.ContratoMapper;
import pe.albrugroup.rrhh_service.integration.auth.AuthServiceClient;
import pe.albrugroup.rrhh_service.integration.recruitment.RecruitmentServiceClient;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.same;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ContratoServiceTest {

    private static final Long EMPLEADO_ID = 10L;

    @Mock
    private ContratoRepository contratoRepository;
    @Mock
    private EmpleadoRepository empleadoRepository;
    @Mock
    private ContratoMapper mapper;
    @Mock
    private AuthServiceClient authServiceClient;
    @Mock
    private RecruitmentServiceClient recruitmentServiceClient;
    @Mock
    private EventoService eventoService;
    @Mock
    private PaginationService paginationService;

    @InjectMocks
    private ContratoService contratoService;

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
    void actualizaElMismoContratoSinCrearVersionHistorica() {
        Contrato contrato = contratoVigente();
        ActualizarContratoVigenteRequest request = requestVigente();
        ContratoResponse response = new ContratoResponse();
        when(contratoRepository.findContratoVigenteByEmpleadoId(eq(EMPLEADO_ID), any(LocalDate.class)))
                .thenReturn(Optional.of(contrato));
        when(contratoRepository.existeSolapamientoContratosExceptoId(
                eq(EMPLEADO_ID), eq(contrato.getId()), any(LocalDate.class), isNull()))
                .thenReturn(false);
        when(contratoRepository.save(same(contrato))).thenReturn(contrato);
        when(mapper.toResponse(same(contrato))).thenReturn(response);

        ContratoResponse resultado = contratoService.actualizarContratoVigente(EMPLEADO_ID, request);

        assertThat(resultado).isSameAs(response);
        verify(mapper).updateContrato(same(request), same(contrato));
        verify(contratoRepository).save(same(contrato));
    }

    @Test
    void permiteProgramarFechaFinFuturaSinDeshabilitarUsuario() {
        Contrato contrato = contratoVigente();
        ActualizarContratoVigenteRequest request = requestVigente();
        request.setFechaFin(LocalDate.now().plusDays(15));
        ContratoResponse response = new ContratoResponse();
        when(contratoRepository.findContratoVigenteByEmpleadoId(eq(EMPLEADO_ID), any(LocalDate.class)))
                .thenReturn(Optional.of(contrato));
        when(contratoRepository.existeSolapamientoContratosExceptoId(
                eq(EMPLEADO_ID), eq(contrato.getId()), any(LocalDate.class), eq(request.getFechaFin())))
                .thenReturn(false);
        when(contratoRepository.save(same(contrato))).thenReturn(contrato);
        when(mapper.toResponse(same(contrato))).thenReturn(response);

        ContratoResponse resultado = contratoService.actualizarContratoVigente(EMPLEADO_ID, request);

        assertThat(resultado).isSameAs(response);
        verify(mapper).updateContrato(same(request), same(contrato));
        verify(contratoRepository).save(same(contrato));
        verify(authServiceClient, never()).deshabilitarUsuario(any(), any());
    }

    @Test
    void rechazaUnSolapamientoConOtroContrato() {
        Contrato contrato = contratoVigente();
        when(contratoRepository.findContratoVigenteByEmpleadoId(eq(EMPLEADO_ID), any(LocalDate.class)))
                .thenReturn(Optional.of(contrato));
        when(contratoRepository.existeSolapamientoContratosExceptoId(
                eq(EMPLEADO_ID), eq(contrato.getId()), any(LocalDate.class), isNull()))
                .thenReturn(true);

        assertThatThrownBy(() -> contratoService.actualizarContratoVigente(EMPLEADO_ID, requestVigente()))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("se solapa");

        verify(mapper, never()).updateContrato(any(), any());
        verify(contratoRepository, never()).save(any());
    }

    @Test
    void rechazaUnaFechaDeFinAnteriorAlInicio() {
        Contrato contrato = contratoVigente();
        ActualizarContratoVigenteRequest request = requestVigente();
        request.setFechaInicio(LocalDate.now().minusDays(5));
        request.setFechaFin(LocalDate.now().minusDays(10));
        when(contratoRepository.findContratoVigenteByEmpleadoId(eq(EMPLEADO_ID), any(LocalDate.class)))
                .thenReturn(Optional.of(contrato));

        assertThatThrownBy(() -> contratoService.actualizarContratoVigente(EMPLEADO_ID, request))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("fecha de fin");

        verify(contratoRepository, never()).existeSolapamientoContratosExceptoId(any(), any(), any(), any());
    }

    @Test
    void finalizaContratoConFechaSolicitadaYUsaLaFechaActualParaBuscarVigente() {
        Empleado empleado = Empleado.builder()
                .id(EMPLEADO_ID)
                .estadoOperativo(EstadoOperativo.ACTIVO)
                .build();
        Contrato contrato = contratoVigente();
        contrato.setEmpleado(empleado);
        LocalDate fechaFin = LocalDate.now().minusDays(2);
        CerrarContratoRequest request = CerrarContratoRequest.builder().fechaFin(fechaFin).build();
        ContratoResponse response = new ContratoResponse();
        when(contratoRepository.findContratoVigenteByEmpleadoId(eq(EMPLEADO_ID), any(LocalDate.class)))
                .thenReturn(Optional.of(contrato));
        when(mapper.toResponse(contrato)).thenReturn(response);

        ContratoResponse resultado = contratoService.finalizarContrato(EMPLEADO_ID, request, "Bearer token");

        assertThat(resultado).isSameAs(response);
        assertThat(empleado.getEstadoOperativo()).isEqualTo(EstadoOperativo.INACTIVO);
        verify(contratoRepository).findContratoVigenteByEmpleadoId(eq(EMPLEADO_ID), eq(LocalDate.now()));
        verify(mapper).updateFechaFinContrato(request, contrato);
        TransactionSynchronizationManager.getSynchronizations()
                .forEach(TransactionSynchronization::afterCommit);
        verify(authServiceClient).deshabilitarUsuario("Bearer token", EMPLEADO_ID);
    }

    @Test
    void noModificaContratoCuandoLaFechaSolicitadaEsInvalida() {
        Empleado empleado = Empleado.builder()
                .id(EMPLEADO_ID)
                .estadoOperativo(EstadoOperativo.ACTIVO)
                .build();
        Contrato contrato = contratoVigente();
        contrato.setEmpleado(empleado);
        CerrarContratoRequest request = CerrarContratoRequest.builder()
                .fechaFin(contrato.getFechaInicio().minusDays(1))
                .build();
        when(contratoRepository.findContratoVigenteByEmpleadoId(eq(EMPLEADO_ID), any(LocalDate.class)))
                .thenReturn(Optional.of(contrato));

        assertThatThrownBy(() -> contratoService.finalizarContrato(EMPLEADO_ID, request, "Bearer token"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("fecha de fin");

        assertThat(empleado.getEstadoOperativo()).isEqualTo(EstadoOperativo.ACTIVO);
        verify(mapper, never()).updateFechaFinContrato(any(), any());
        verify(authServiceClient, never()).deshabilitarUsuario(any(), any());
    }

    private Contrato contratoVigente() {
        return Contrato.builder()
                .id(20L)
                .fechaInicio(LocalDate.now().minusDays(30))
                .build();
    }

    private ActualizarContratoVigenteRequest requestVigente() {
        return ActualizarContratoVigenteRequest.builder()
                .categoriaPersonal(CategoriaPersonal.ESTRUCTURAL)
                .regimen(Regimen.RECIBO_POR_HONORARIOS)
                .modalidad(Modalidad.FULL_TIME)
                .sueldoBase(new BigDecimal("1500.00"))
                .fechaInicio(LocalDate.now().minusDays(30))
                .build();
    }
}
