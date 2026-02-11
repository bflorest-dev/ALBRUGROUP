package pe.albrugroup.rrhh_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.rrhh_service.entity.Empleado;
import pe.albrugroup.rrhh_service.entity.enums.Banco;
import pe.albrugroup.rrhh_service.entity.enums.Distrito;
import pe.albrugroup.rrhh_service.entity.enums.EstadoOperativo;
import pe.albrugroup.rrhh_service.entity.request.*;
import pe.albrugroup.rrhh_service.entity.response.EmpleadoResponse;
import pe.albrugroup.rrhh_service.exception.EmpleadoDocumentoNotFoundException;
import pe.albrugroup.rrhh_service.exception.EmpleadoNotFoundException;
import pe.albrugroup.rrhh_service.service.mapper.EmpleadoMapper;
import pe.albrugroup.rrhh_service.repository.EmpleadoRepository;
import pe.albrugroup.rrhh_service.usecase.IEmpleado;

import java.util.List;

@Service @Transactional
@RequiredArgsConstructor
public class EmpleadoService implements IEmpleado {

    private final EmpleadoRepository repository;
    private final EmpleadoMapper mapper;

    @Override @Transactional(readOnly = true)
    public Page<EmpleadoResponse> getEmpleados(String q, String dni, String celular, Distrito distrito, Banco banco,
                                              EstadoOperativo estado, Pageable pageable)
    {
        EstadoOperativo estadoOperativo = estado != null ? estado : EstadoOperativo.ACTIVO;
        return repository.getEmpleados(q, dni, celular, distrito, banco, estadoOperativo, pageable)
                .map(mapper::toResponse);
    }
    @Override @Transactional(readOnly = true)
    public EmpleadoResponse getEmpleadoDocumento(String documento) {
        Empleado empleado = repository.findByNumeroDocumento(documento)
                .orElseThrow(() -> new EmpleadoDocumentoNotFoundException(documento));
        return mapper.toResponse(empleado);
    }
    @Override @Transactional(readOnly = true)
    public Page<EmpleadoResponse> getEmpleadoUniversal(String dato, Pageable pageable) {
        return repository.busquedaUniversal(dato, pageable)
                .map(mapper::toResponse);
    }

    @Override
    public void registrarEmpleados(List<RegistrarEmpleadoRequest> nuevosEmpleados) {
        nuevosEmpleados.forEach(this::registrarEmpleado);
    }
    @Override
    public EmpleadoResponse registrarEmpleado(RegistrarEmpleadoRequest nuevoEmpleado) {
        Empleado empleado = mapper.toEntity(nuevoEmpleado);
        empleado.setEstadoOperativo(EstadoOperativo.POSTULANTE);
        return mapper.toResponse(repository.save(empleado));
    }

    @Override
    public EmpleadoResponse actualizarDatosPersonales(Long idEmpleado,
                                                      DatosPersonalesRequest datosPersonales) {
        Empleado empleado = repository.findById(idEmpleado)
                .orElseThrow(() -> new EmpleadoNotFoundException(idEmpleado));
        mapper.updateDatosPersonales(datosPersonales, empleado);
        return mapper.toResponse(empleado);
    }
    @Override
    public EmpleadoResponse actualizarContactoUbicacion(Long idEmpleado,
                                                        DatosContactoUbicacionRequest datosContactoUbicacion) {
        Empleado empleado = repository.findById(idEmpleado)
                .orElseThrow(() -> new EmpleadoNotFoundException(idEmpleado));
        mapper.updateDatosContactoUbicacion(datosContactoUbicacion, empleado);
        return mapper.toResponse(empleado);
    }
    @Override
    public EmpleadoResponse actualizarDatosFinancieros(Long idEmpleado,
                                                       DatosFinancierosRequest datosFinancieros) {
        Empleado empleado = repository.findById(idEmpleado)
                .orElseThrow(() -> new EmpleadoNotFoundException(idEmpleado));
        mapper.updateDatosFinancieros(datosFinancieros, empleado);
        return mapper.toResponse(empleado);
    }
    @Override
    public EmpleadoResponse actualizarContactoCorporativo(Long idEmpleado, DatosContactoCorporativoRequest datosCorporativos) {
        Empleado empleado = repository.findById(idEmpleado)
                .orElseThrow(() -> new EmpleadoNotFoundException(idEmpleado));
        mapper.updateDatosContactoCorporativo(datosCorporativos, empleado);
        return mapper.toResponse(empleado);
    }
}
