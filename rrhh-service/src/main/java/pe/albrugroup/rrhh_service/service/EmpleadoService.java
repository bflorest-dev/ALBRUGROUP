package pe.albrugroup.rrhh_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.rrhh_service.entity.Empleado;
import pe.albrugroup.rrhh_service.entity.enums.EstadoOperativo;
import pe.albrugroup.rrhh_service.entity.request.DatosContactoUbicacionRequest;
import pe.albrugroup.rrhh_service.entity.request.DatosFinancierosRequest;
import pe.albrugroup.rrhh_service.entity.request.DatosPersonalesRequest;
import pe.albrugroup.rrhh_service.entity.request.RegistrarEmpleadoRequest;
import pe.albrugroup.rrhh_service.entity.response.EmpleadoResponse;
import pe.albrugroup.rrhh_service.exception.EmpleadoInactivoException;
import pe.albrugroup.rrhh_service.exception.EmpleadoNotFoundException;
import pe.albrugroup.rrhh_service.exception.EmpleadoPostulanteException;
import pe.albrugroup.rrhh_service.service.mapper.EmpleadoMapper;
import pe.albrugroup.rrhh_service.repository.EmpleadoRepository;
import pe.albrugroup.rrhh_service.usecase.IEmpleado;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class EmpleadoService implements IEmpleado {

    private final EmpleadoRepository repository;
    private final EmpleadoMapper mapper;

    @Transactional(readOnly = true) @Override
    public List<EmpleadoResponse> getEmpleados() {
        return repository.findAll().stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Transactional(readOnly = true) @Override
    public EmpleadoResponse getEmpleado(Long idEmpleado) {
        Empleado empleado = repository.findById(idEmpleado)
                .orElseThrow(() -> new EmpleadoNotFoundException(idEmpleado));
        return mapper.toResponse(empleado);
    }

    @Override
    public List<EmpleadoResponse> registrarEmpleados(List<RegistrarEmpleadoRequest> nuevosEmpleados) {
        return nuevosEmpleados.stream()
                .map(this::registrarEmpleado)
                .toList();
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
    public void cambiarEstadoOperativo(Long idEmpleado) {
        Empleado empleado = repository.findById(idEmpleado)
                .orElseThrow(() -> new EmpleadoNotFoundException(idEmpleado));
        if(empleado.getEstadoOperativo() == EstadoOperativo.ACTIVO){
            throw new EmpleadoInactivoException(idEmpleado);
        }
        if(empleado.getEstadoOperativo() == EstadoOperativo.POSTULANTE){
            throw new EmpleadoPostulanteException(idEmpleado);
        }
        empleado.setEstadoOperativo(EstadoOperativo.INACTIVO);
    }
}
