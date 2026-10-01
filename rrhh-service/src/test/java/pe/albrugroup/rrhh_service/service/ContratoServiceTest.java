package pe.albrugroup.rrhh_service.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.albrugroup.rrhh_service.entity.Contrato;
import pe.albrugroup.rrhh_service.entity.enums.CategoriaPersonal;
import pe.albrugroup.rrhh_service.entity.enums.Modalidad;
import pe.albrugroup.rrhh_service.entity.enums.Regimen;
import pe.albrugroup.rrhh_service.entity.request.contrato.ActualizarContratoVigenteRequest;
import pe.albrugroup.rrhh_service.entity.response.ContratoResponse;
import pe.albrugroup.rrhh_service.exception.BadRequestException;
import pe.albrugroup.rrhh_service.exception.ConflictException;
import pe.albrugroup.rrhh_service.repository.ContratoRepository;
import pe.albrugroup.rrhh_service.repository.EmpleadoRepository;
import pe.albrugroup.rrhh_service.service.mapper.ContratoMapper;
import pe.albrugroup.rrhh_service.integration.auth.AuthServiceClient;
import pe.albrugroup.rrhh_service.integration.recruitment.RecruitmentServiceClient;

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
