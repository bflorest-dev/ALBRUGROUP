package pe.albrugroup.rrhh_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.rrhh_service.entity.Contrato;
import pe.albrugroup.rrhh_service.entity.Empleado;
import pe.albrugroup.rrhh_service.entity.enums.EstadoOperativo;
import pe.albrugroup.rrhh_service.entity.request.CerrarContratoRequest;
import pe.albrugroup.rrhh_service.entity.request.RegistrarContratoRequest;
import pe.albrugroup.rrhh_service.entity.response.ContratoResponse;
import pe.albrugroup.rrhh_service.exception.ContratoActivoNotFoundException;
import pe.albrugroup.rrhh_service.exception.ContratoNotFoundException;
import pe.albrugroup.rrhh_service.exception.EmpleadoNotFoundException;
import pe.albrugroup.rrhh_service.exception.FechaFinInvalidException;
import pe.albrugroup.rrhh_service.service.mapper.ContratoMapper;
import pe.albrugroup.rrhh_service.repository.ContratoRepository;
import pe.albrugroup.rrhh_service.repository.EmpleadoRepository;
import pe.albrugroup.rrhh_service.usecase.IContrato;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.IntStream;

@Service
@Transactional
@RequiredArgsConstructor
public class ContratoService implements IContrato {

    private final ContratoRepository contratoRepository;
    private final EmpleadoRepository empleadoRepository;
    private final ContratoMapper mapper;

    @Transactional(readOnly = true) @Override
    public List<ContratoResponse> listarContratosVigentes() {
        LocalDate hoy = LocalDate.now();
        return contratoRepository.findContratosVigentes(hoy).stream()
                .map(mapper::toResponse)
                .toList();
    }
    @Transactional(readOnly = true) @Override
    public List<ContratoResponse> listarContratosVencidos() {
        LocalDate hoy = LocalDate.now();
        return contratoRepository.findContratosVencidos(hoy).stream()
                .map(mapper::toResponse)
                .toList();
    }
    @Transactional(readOnly = true) @Override
    public List<ContratoResponse> listarContratosEmpleado(Long idEmpleado) {
        return contratoRepository.findByEmpleadoId(idEmpleado).stream()
                .map(mapper::toResponse)
                .toList();
    }
    @Transactional(readOnly = true) @Override
    public ContratoResponse getContratoVigente(Long idEmpleado) {
        LocalDate hoy = LocalDate.now();
        Contrato contrato = contratoRepository.findContratoVigenteByEmpleadoId(idEmpleado, hoy)
                .orElseThrow(() -> new ContratoNotFoundException(idEmpleado));
        return mapper.toResponse(contrato);
    }
    @Override
    public ContratoResponse registrarContrato(Long idEmpleado, RegistrarContratoRequest nuevoContrato) {
        Empleado empleado = empleadoRepository.findByIdAndEstadoOperativoNot(idEmpleado, EstadoOperativo.INACTIVO)
                .orElseThrow(() -> new EmpleadoNotFoundException(idEmpleado));

        LocalDate fechaInicioNuevo = nuevoContrato.getFechaInicio();
        LocalDate fechaCierreAnterior = fechaInicioNuevo.minusDays(1);
        contratoRepository.findContratoVigenteByEmpleadoId(idEmpleado, fechaInicioNuevo)
                .ifPresent(contrato -> contrato.setFechaFin(fechaCierreAnterior));
        empleado.setEstadoOperativo(EstadoOperativo.ACTIVO);
        Contrato contrato = mapper.toEntity(nuevoContrato);
        contrato.setEmpleado(empleado);
        return mapper.toResponse(contratoRepository.save(contrato));
    }

    @Override
    public ContratoResponse cerrarContrato(Long idEmpleado, CerrarContratoRequest contratoCerrado) {
        LocalDate fechaFin = contratoCerrado.getFechaFin();
        Contrato contrato = contratoRepository.findContratoVigenteByEmpleadoId(idEmpleado, fechaFin)
                .orElseThrow(() -> new ContratoActivoNotFoundException(idEmpleado));
        if(fechaFin.isBefore(contrato.getFechaInicio())) throw new FechaFinInvalidException();
        mapper.updateFechaFinContrato(contratoCerrado, contrato);
        LocalDate diaSiguiente = fechaFin.plusDays(1);
        if (!contratoRepository.tieneContratosVigentes(idEmpleado, diaSiguiente)) {
            Empleado empleado = contrato.getEmpleado();
            empleado.setEstadoOperativo(EstadoOperativo.INACTIVO);
        }
        return mapper.toResponse(contrato);
    }

    @Override
    public List<ContratoResponse> registrarContratos(List<Long> idEmpleados,
                                                     List<RegistrarContratoRequest> nuevosContratosVigentes) {
        return IntStream.range(0, idEmpleados.size())
                .mapToObj(i -> registrarContrato(
                        idEmpleados.get(i),
                        nuevosContratosVigentes.get(i)
                )).toList();
    }
}
