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
import pe.albrugroup.rrhh_service.exception.*;
import pe.albrugroup.rrhh_service.service.mapper.ContratoMapper;
import pe.albrugroup.rrhh_service.repository.ContratoRepository;
import pe.albrugroup.rrhh_service.repository.EmpleadoRepository;
import pe.albrugroup.rrhh_service.usecase.IContrato;

import java.time.LocalDate;
import java.util.ArrayList;
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
    public List<ContratoResponse> listarContratosEmpleado(Long idEmpleado) {
        return contratoRepository.findByEmpleadoId(idEmpleado).stream()
                .map(mapper::toResponse)
                .toList();
    }
    @Transactional(readOnly = true) @Override
    public ContratoResponse getContratoVigente(Long idEmpleado) {
        Contrato contrato = contratoRepository
                .findContratoVigenteByEmpleadoId(idEmpleado, LocalDate.now())
                .orElseThrow(() -> new ContratoNotFoundException(idEmpleado));
        return mapper.toResponse(contrato);
    }
    @Override @Transactional
    public ContratoResponse registrarContrato(Long idEmpleado, RegistrarContratoRequest nuevoContrato) {
        Empleado empleado = empleadoRepository.findById(idEmpleado)
                .orElseThrow(() -> new EmpleadoNotFoundException(idEmpleado));
        validarDatosCompletosEmpleado(empleado);

        LocalDate fechaInicioNuevo = nuevoContrato.getFechaInicio();
        LocalDate fechaFinNuevo = nuevoContrato.getFechaFin();
        validarNoHayConflictosDeContrato(idEmpleado, fechaInicioNuevo, fechaFinNuevo);

        LocalDate fechaCierreAnterior = fechaInicioNuevo.minusDays(1);
        contratoRepository.findContratoVigenteByEmpleadoId(idEmpleado, fechaInicioNuevo)
                .ifPresent(contrato -> contrato.setFechaFin(fechaCierreAnterior));

        empleado.setEstadoOperativo(EstadoOperativo.ACTIVO);
        Contrato contrato = mapper.toEntity(nuevoContrato);
        contrato.setEmpleado(empleado);
        return mapper.toResponse(contratoRepository.save(contrato));
    }

    private void validarNoHayConflictosDeContrato(Long idEmpleado, LocalDate fechaInicio, LocalDate fechaFin) {
        if (fechaFin == null) {
            boolean hayContratosFuturos = contratoRepository.existenContratosFuturos(idEmpleado, fechaInicio);
            if (hayContratosFuturos) {
                throw new ContratoConflictoException(
                        "Existe contrato vigente con fecha posterior a " + fechaInicio +
                        ". Por favor, especifica una fecha de fin para este contrato."
                );
            }
        }
        else {
            boolean haySolapamiento = contratoRepository.existeSolapamientoContratos(
                    idEmpleado, fechaInicio, fechaFin
            );
            if (haySolapamiento) {
                throw new ContratoConflictoException(
                        "El rango de fechas [" + fechaInicio + " - " + fechaFin + "] " +
                                "se solapa con un contrato existente."
                );
            }
        }
    }
    private void validarDatosCompletosEmpleado(Empleado e) {
        List<String> faltantes = new ArrayList<>();

        if (e.getNombres() == null || e.getNombres().isBlank()) faltantes.add("nombres");
        if (e.getApellidos() == null || e.getApellidos().isBlank()) faltantes.add("apellidos");
        if (e.getTipoDocumento() == null) faltantes.add("tipoDocumento");
        if (e.getNumeroDocumento() == null || e.getNumeroDocumento().isBlank()) faltantes.add("numeroDocumento");
        if(e.getNacionalidad() == null) faltantes.add("nacionalidad");
        if (e.getFechaNacimiento() == null) faltantes.add("fechaNacimiento");
        if(e.getEstadoCivil() == null) faltantes.add("estadoCivil");
        if(e.getTieneHijos() == null) faltantes.add("tieneHijos");
        if (e.getCelularPersonal() == null || e.getCelularPersonal().isBlank()) faltantes.add("celularPersonal");
        if (e.getCorreoPersonal() == null || e.getCorreoPersonal().isBlank()) faltantes.add("correoPersonal");
        if(e.getDistrito() == null) faltantes.add("distrito");
        if(e.getDireccion() == null || e.getDireccion().isBlank()) faltantes.add("direccion");
        if(e.getBanco() == null) faltantes.add("banco");
        if(e.getCuentaBancaria() == null || e.getCuentaBancaria().isBlank()) faltantes.add("cuentaBancaria");
        if(e.getCuentaInterbancaria() == null || e.getCuentaInterbancaria().isBlank()) faltantes.add("cuentaInterbancaria");

        if (!faltantes.isEmpty()) throw new EmpleadoIncompletoException(e.getId(), faltantes);
    }

    @Override
    public ContratoResponse finalizarContrato(Long idEmpleado, CerrarContratoRequest contratoCerrado) {
        LocalDate fechaFin = contratoCerrado.getFechaFin();
        Contrato contrato = contratoRepository.findContratoVigenteByEmpleadoId(idEmpleado, fechaFin)
                .orElseThrow(() -> new ContratoActivoNotFoundException(idEmpleado));
        mapper.updateFechaFinContrato(contratoCerrado, contrato);

        Empleado empleado = contrato.getEmpleado();
        empleado.setEstadoOperativo(EstadoOperativo.INACTIVO);
        return mapper.toResponse(contrato);
    }

    @Override
    public void registrarContratos(List<Long> idEmpleados,
                                   List<RegistrarContratoRequest> nuevosContratosVigentes) {
        IntStream.range(0, idEmpleados.size())
                .forEach(i -> registrarContrato(
                        idEmpleados.get(i),
                        nuevosContratosVigentes.get(i)
                ));
    }
}
