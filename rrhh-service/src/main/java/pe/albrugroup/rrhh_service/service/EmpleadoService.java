package pe.albrugroup.rrhh_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import pe.albrugroup.rrhh_service.entity.Empleado;
import pe.albrugroup.rrhh_service.entity.EmpresaContratista;
import pe.albrugroup.rrhh_service.entity.enums.Banco;
import pe.albrugroup.rrhh_service.entity.enums.Distrito;
import pe.albrugroup.rrhh_service.entity.enums.EstadoOperativo;
import pe.albrugroup.rrhh_service.entity.enums.Origen;
import pe.albrugroup.rrhh_service.entity.enums.PuestoTrabajo;
import pe.albrugroup.rrhh_service.entity.request.PageRequest;
import pe.albrugroup.rrhh_service.entity.request.empleado.*;
import pe.albrugroup.rrhh_service.entity.response.EmpleadoRolResponse;
import pe.albrugroup.rrhh_service.entity.response.EmpleadoResponse;
import pe.albrugroup.rrhh_service.entity.response.PageResponse;
import pe.albrugroup.rrhh_service.exception.ConflictException;
import pe.albrugroup.rrhh_service.exception.EmpleadoInactivoException;
import pe.albrugroup.rrhh_service.exception.NotFoundException;
import pe.albrugroup.rrhh_service.exception.UnprocessableEntityException;
import pe.albrugroup.rrhh_service.integration.auth.AuthServiceClient;
import pe.albrugroup.rrhh_service.integration.auth.dto.RegistrarUsuarioRequest;
import pe.albrugroup.rrhh_service.integration.schedule.ScheduleServiceClient;
import pe.albrugroup.rrhh_service.repository.ContratoRepository;
import pe.albrugroup.rrhh_service.repository.EmpresaContratistaRepository;
import pe.albrugroup.rrhh_service.service.mapper.EmpleadoRolMapper;
import pe.albrugroup.rrhh_service.service.mapper.EmpleadoMapper;
import pe.albrugroup.rrhh_service.repository.EmpleadoRepository;
import pe.albrugroup.rrhh_service.usecase.IEmpleado;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Service @Transactional
@RequiredArgsConstructor
public class EmpleadoService implements IEmpleado {

    private final EmpleadoRepository repository;
    private final ContratoRepository contratoRepository;
    private final EmpresaContratistaRepository empresaContratistaRepository;
    private final EmpleadoMapper mapper;
    private final EmpleadoRolMapper empleadoRolMapper;
    private final EventoService eventoService;
    private final PaginationService paginationService;
    private final AuthServiceClient authServiceClient;
    private final ScheduleServiceClient scheduleServiceClient;

    private static final Set<String> EMPLEADO_SORT_FIELDS = Set.of(
            "id",
            "createdAt",
            "updatedAt",
            "nombres",
            "apellidos",
            "numeroDocumento",
            "celularPersonal",
            "correoPersonal",
            "estadoOperativo"
    );

    @Override
    public EmpleadoResponse darDeBajaEmpleado(Long idEmpleado, String authHeader) {
        Empleado empleado = repository.findById(idEmpleado)
                .orElseThrow(() -> new NotFoundException(Empleado.class, idEmpleado));
        if (empleado.getEstadoOperativo() == EstadoOperativo.INACTIVO) {
            throw new EmpleadoInactivoException(idEmpleado);
        }
        LocalDate hoy = LocalDate.now();
        contratoRepository.findContratoVigenteByEmpleadoId(idEmpleado, hoy)
                .ifPresent(contrato -> contrato.setFechaFin(hoy));
        empleado.setEstadoOperativo(EstadoOperativo.INACTIVO);
        programarBajaPostCommit(authHeader, idEmpleado);
        return mapper.toResponse(empleado);
    }

    @Override
    public EmpleadoResponse listaNegraEmpleado(Long idEmpleado, Long responsableId) {
        Empleado empleado = repository.findById(idEmpleado)
                .orElseThrow(() -> new NotFoundException(Empleado.class, idEmpleado));
        if(empleado.getListaNegra()) throw new UnprocessableEntityException("Se encuentra en la Lista Negra", idEmpleado);
        empleado.setListaNegra(true);
        eventoService.registrarEventoListaNegra(empleado, responsableId);
        return mapper.toResponse(empleado);
    }

    @Override @Transactional(readOnly = true)
    public PageResponse<EmpleadoResponse> getEmpleados(String q, String dni, String celular, Distrito distrito, Banco banco,
                                                       Long idEmpresaContratista, Origen origen, EstadoOperativo estado,
                                                       PageRequest pageRequest)
    {
        EstadoOperativo estadoOperativo = estado != null ? estado : EstadoOperativo.ACTIVO;
        var empleados = repository
                .getEmpleados(q, dni, celular, distrito, banco, idEmpresaContratista, origen, estadoOperativo,
                        paginationService.toPageable(pageRequest, EMPLEADO_SORT_FIELDS))
                .map(mapper::toResponse);
        return PageResponse.from(empleados);
    }
    @Override @Transactional(readOnly = true)
    public EmpleadoResponse getEmpleadoDocumento(String documento) {
        Empleado empleado = repository.findByNumeroDocumento(documento)
                .orElseThrow(() -> new NotFoundException(Empleado.class, documento));
        return mapper.toResponse(empleado);
    }
    @Override @Transactional(readOnly = true)
    public PageResponse<EmpleadoResponse> getEmpleadoUniversal(String dato, PageRequest pageRequest) {
        var empleados = repository.busquedaUniversal(dato, paginationService.toPageable(pageRequest, EMPLEADO_SORT_FIELDS))
                .map(mapper::toResponse);
        return PageResponse.from(empleados);
    }

    @Override
    public void registrarEmpleados(List<RegistrarEmpleadoRequest> nuevosEmpleados, Long responsableId) {
        nuevosEmpleados.forEach(nuevoEmpleado -> registrarEmpleado(nuevoEmpleado, responsableId));
    }
    @Override
    public EmpleadoResponse registrarEmpleado(RegistrarEmpleadoRequest nuevoEmpleado, Long responsableId) {
        validarDatosUnicosEmpleado(nuevoEmpleado);
        Empleado empleado = mapper.toEntity(nuevoEmpleado);
        empleado.setEmpresaContratista(obtenerEmpresaContratista(nuevoEmpleado.getIdEmpresaContratista()));
        empleado.setEstadoOperativo(EstadoOperativo.INACTIVO);
        empleado.setListaNegra(false);
        Empleado empleadoRegistrado = repository.save(empleado);
        eventoService.registrarEventoRegistro(empleadoRegistrado, responsableId);
        return mapper.toResponse(empleadoRegistrado);
    }

    private void validarDatosUnicosEmpleado(RegistrarEmpleadoRequest nuevoEmpleado) {
        List<String> detalles = new ArrayList<>();

        String numeroDocumento = normalizarTexto(nuevoEmpleado.getNumeroDocumento());
        String celularPersonal = normalizarTexto(nuevoEmpleado.getCelularPersonal());
        String correoPersonal = normalizarTexto(nuevoEmpleado.getCorreoPersonal());

        if (numeroDocumento != null && repository.existsByNumeroDocumento(numeroDocumento)) {
            detalles.add("El numero de documento ingresado ya esta registrado.");
        }

        if (celularPersonal != null && repository.existsByCelularPersonal(celularPersonal)) {
            detalles.add("El celular personal ingresado ya esta registrado.");
        }

        if (correoPersonal != null && repository.existsByCorreoPersonalIgnoreCase(correoPersonal)) {
            detalles.add("El correo personal ingresado ya esta registrado.");
        }

        if (!detalles.isEmpty()) {
            throw new ConflictException(
                    "No se pudo registrar el empleado porque hay datos repetidos",
                    null,
                    detalles
            );
        }
    }

    private String normalizarTexto(String value) {
        if (value == null) {
            return null;
        }

        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    @Override
    public EmpleadoResponse actualizarDatosPersonales(Long idEmpleado,
                                                      DatosPersonalesRequest datosPersonales,
                                                      String authHeader) {
        Empleado empleado = repository.findById(idEmpleado)
                .orElseThrow(() -> new NotFoundException(Empleado.class, idEmpleado));
        mapper.updateDatosPersonales(datosPersonales, empleado);
        programarSyncDatosPersonalesPostCommit(empleado, authHeader);
        return mapper.toResponse(empleado);
    }

    private void programarSyncDatosPersonalesPostCommit(Empleado empleado, String authHeader) {
        if (authHeader == null || authHeader.isBlank()) {
            return;
        }
        contratoRepository.findContratoVigenteByEmpleadoId(empleado.getId(), LocalDate.now())
                .ifPresent(contrato -> {
                    String email = (empleado.getCorreoCorporativo() != null && !empleado.getCorreoCorporativo().isBlank())
                            ? empleado.getCorreoCorporativo()
                            : empleado.getCorreoPersonal();
                    RegistrarUsuarioRequest request = RegistrarUsuarioRequest.builder()
                            .empleadoId(empleado.getId())
                            .nombres(empleado.getNombres())
                            .apellidos(empleado.getApellidos())
                            .dni(empleado.getNumeroDocumento())
                            .email(email)
                            .puestoTrabajo(contrato.getPuestoTrabajo())
                            .build();
                    TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                        @Override
                        public void afterCommit() {
                            authServiceClient.upsertUsuario(authHeader, request);
                        }
                    });
                });
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

    @Override
    @Transactional(readOnly = true)
    public List<EmpleadoRolResponse> listarEmpleadosLight(List<PuestoTrabajo> puestosTrabajo) {
        List<EmpleadoRolResponse> empleados = empleadoRolMapper.toResponseList(
                puestosTrabajo == null || puestosTrabajo.isEmpty()
                        ? contratoRepository.findEmpleadosActivos(EstadoOperativo.ACTIVO, LocalDate.now())
                        : contratoRepository.findEmpleadosActivosByPuestosTrabajo(
                                EstadoOperativo.ACTIVO,
                                LocalDate.now(),
                                puestosTrabajo
                        )
        );
        return empleados;
    }

    @Override
    @Transactional(readOnly = true)
    public List<EmpleadoRolResponse> listarPersonalRecruitment() {
        List<PuestoTrabajo> puestosRecruitment = List.of(
                PuestoTrabajo.CAPACITADOR,
                PuestoTrabajo.RECLUTADOR,
                PuestoTrabajo.RRHH
        );

        return empleadoRolMapper.toResponseList(
                contratoRepository.findEmpleadosActivosByPuestosTrabajo(
                        EstadoOperativo.ACTIVO,
                        LocalDate.now(),
                        puestosRecruitment
                )
        );
    }

    private void programarBajaPostCommit(String authHeader, Long idEmpleado) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                authServiceClient.deshabilitarUsuario(authHeader, idEmpleado);
                scheduleServiceClient.notificarBajaEmpleado(authHeader, idEmpleado);
            }
        });
    }

    private EmpresaContratista obtenerEmpresaContratista(Long idEmpresaContratista) {
        if (idEmpresaContratista == null) {
            return null;
        }
        return empresaContratistaRepository.findById(idEmpresaContratista)
                .orElseThrow(() -> new NotFoundException(EmpresaContratista.class, idEmpresaContratista));
    }
}
