package pe.albrugroup.rrhh_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.rrhh_service.entity.Empleado;
import pe.albrugroup.rrhh_service.entity.EmpresaContratista;
import pe.albrugroup.rrhh_service.entity.enums.Banco;
import pe.albrugroup.rrhh_service.entity.enums.Distrito;
import pe.albrugroup.rrhh_service.entity.enums.EstadoOperativo;
import pe.albrugroup.rrhh_service.entity.enums.Origen;
import pe.albrugroup.rrhh_service.entity.request.empleado.*;
import pe.albrugroup.rrhh_service.entity.response.EmpleadoResponse;
import pe.albrugroup.rrhh_service.exception.EmpleadoListaNegraException;
import pe.albrugroup.rrhh_service.exception.NotFoundException;
import pe.albrugroup.rrhh_service.repository.EmpresaContratistaRepository;
import pe.albrugroup.rrhh_service.service.mapper.EmpleadoMapper;
import pe.albrugroup.rrhh_service.repository.EmpleadoRepository;
import pe.albrugroup.rrhh_service.usecase.IEmpleado;

import java.util.List;

@Service @Transactional
@RequiredArgsConstructor
public class EmpleadoService implements IEmpleado {

    private final EmpleadoRepository repository;
    private final EmpresaContratistaRepository empresaContratistaRepository;
    private final EmpleadoMapper mapper;
    private final EmpleadoEventoService eventoService;

    @Override
    public EmpleadoResponse listaNegraEmpleado(Long idEmpleado, Long responsableId) {
        Empleado empleado = repository.findById(idEmpleado)
                .orElseThrow(() -> new NotFoundException(Empleado.class, idEmpleado));
        if(empleado.getListaNegra()) throw new EmpleadoListaNegraException(idEmpleado);
        empleado.setListaNegra(true);
        eventoService.registrarEventoListaNegra(empleado, responsableId);
        return mapper.toResponse(empleado);
    }

    @Override @Transactional(readOnly = true)
    public Page<EmpleadoResponse> getEmpleados(String q, String dni, String celular, Distrito distrito, Banco banco,
                                               Long idEmpresaContratista, Origen origen, EstadoOperativo estado, Pageable pageable)
    {
        EstadoOperativo estadoOperativo = estado != null ? estado : EstadoOperativo.ACTIVO;
        return repository.getEmpleados(q, dni, celular, distrito, banco, idEmpresaContratista, origen, estadoOperativo, pageable)
                .map(mapper::toResponse);
    }
    @Override @Transactional(readOnly = true)
    public EmpleadoResponse getEmpleadoDocumento(String documento) {
        Empleado empleado = repository.findByNumeroDocumento(documento)
                .orElseThrow(() -> new NotFoundException(Empleado.class, documento));
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
        empleado.setEmpresaContratista(obtenerEmpresaContratista(nuevoEmpleado.getIdEmpresaContratista()));
        empleado.setEstadoOperativo(EstadoOperativo.POSTULANTE);
        empleado.setListaNegra(false);
        return mapper.toResponse(repository.save(empleado));
    }

    @Override
    public EmpleadoResponse actualizarDatosPersonales(Long idEmpleado,
                                                      DatosPersonalesRequest datosPersonales) {
        Empleado empleado = repository.findById(idEmpleado)
                .orElseThrow(() -> new NotFoundException(Empleado.class, idEmpleado));
        mapper.updateDatosPersonales(datosPersonales, empleado);
        return mapper.toResponse(empleado);
    }
    @Override
    public EmpleadoResponse actualizarContactoUbicacion(Long idEmpleado,
                                                        DatosContactoUbicacionRequest datosContactoUbicacion) {
        Empleado empleado = repository.findById(idEmpleado)
                .orElseThrow(() -> new NotFoundException(Empleado.class, idEmpleado));
        mapper.updateDatosContactoUbicacion(datosContactoUbicacion, empleado);
        return mapper.toResponse(empleado);
    }
    @Override
    public EmpleadoResponse actualizarDatosFinancieros(Long idEmpleado,
                                                       DatosFinancierosRequest datosFinancieros) {
        Empleado empleado = repository.findById(idEmpleado)
                .orElseThrow(() -> new NotFoundException(Empleado.class, idEmpleado));
        mapper.updateDatosFinancieros(datosFinancieros, empleado);
        empleado.setEmpresaContratista(obtenerEmpresaContratista(datosFinancieros.getIdEmpresaContratista()));
        return mapper.toResponse(empleado);
    }
    @Override
    public EmpleadoResponse actualizarContactoCorporativo(Long idEmpleado, DatosContactoCorporativoRequest datosCorporativos) {
        Empleado empleado = repository.findById(idEmpleado)
                .orElseThrow(() -> new NotFoundException(Empleado.class, idEmpleado));
        mapper.updateDatosContactoCorporativo(datosCorporativos, empleado);
        return mapper.toResponse(empleado);
    }

    private EmpresaContratista obtenerEmpresaContratista(Long idEmpresaContratista) {
        if (idEmpresaContratista == null) {
            return null;
        }
        return empresaContratistaRepository.findById(idEmpresaContratista)
                .orElseThrow(() -> new NotFoundException(EmpresaContratista.class, idEmpresaContratista));
    }
}

