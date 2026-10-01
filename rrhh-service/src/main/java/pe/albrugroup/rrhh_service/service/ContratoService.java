package pe.albrugroup.rrhh_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.rrhh_service.entity.Contrato;
import pe.albrugroup.rrhh_service.entity.Empleado;
import pe.albrugroup.rrhh_service.entity.enums.CategoriaPersonal;
import pe.albrugroup.rrhh_service.entity.enums.EstadoOperativo;
import pe.albrugroup.rrhh_service.entity.enums.PuestoTrabajo;
import pe.albrugroup.rrhh_service.entity.request.PageRequest;
import pe.albrugroup.rrhh_service.entity.request.contrato.ActualizarContratoVigenteRequest;
import pe.albrugroup.rrhh_service.entity.request.contrato.CerrarContratoRequest;
import pe.albrugroup.rrhh_service.entity.request.contrato.RegistrarContratoRequest;
import pe.albrugroup.rrhh_service.entity.response.ContratoResponse;
import pe.albrugroup.rrhh_service.entity.response.ContratoPlanillaResponse;
import pe.albrugroup.rrhh_service.entity.response.EmpleadoPlanillaResponse;
import pe.albrugroup.rrhh_service.entity.response.PageResponse;
import pe.albrugroup.rrhh_service.exception.*;
import pe.albrugroup.rrhh_service.integration.auth.AuthServiceClient;
import pe.albrugroup.rrhh_service.integration.auth.dto.RegistrarUsuarioRequest;
import pe.albrugroup.rrhh_service.integration.recruitment.RecruitmentServiceClient;
import pe.albrugroup.rrhh_service.integration.recruitment.dto.ConfirmarContratacionRequest;
import pe.albrugroup.rrhh_service.service.mapper.ContratoMapper;
import pe.albrugroup.rrhh_service.repository.ContratoRepository;
import pe.albrugroup.rrhh_service.repository.EmpleadoRepository;
import pe.albrugroup.rrhh_service.usecase.IContrato;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.IntStream;

@Service
@Transactional
@RequiredArgsConstructor
public class ContratoService implements IContrato {

    private final ContratoRepository contratoRepository;
    private final EmpleadoRepository empleadoRepository;
    private final ContratoMapper mapper;
    private final AuthServiceClient authServiceClient;
    private final RecruitmentServiceClient recruitmentServiceClient;
    private final EventoService eventoService;
    private final PaginationService paginationService;

    @Value("${billing.planilla.empleados-excluidos:}")
    private String empleadosExcluidosPlanilla;

    private static final Set<String> CONTRATO_SORT_FIELDS = Set.of(
            "id",
            "createdAt",
            "updatedAt",
            "fechaInicio",
            "fechaFin",
            "sueldoBase"
    );

    @Transactional(readOnly = true) @Override
    public PageResponse<ContratoResponse> listarContratosEmpleado(Long idEmpleado, PageRequest pageRequest) {
        var contratos = contratoRepository
                .findByEmpleadoId(idEmpleado, paginationService.toPageable(pageRequest, CONTRATO_SORT_FIELDS))
                .map(mapper::toResponse);
        return PageResponse.from(contratos);
    }
    @Transactional(readOnly = true) @Override
    public ContratoResponse getContratoVigente(Long idEmpleado) {
        Contrato contrato = contratoRepository
                .findContratoVigenteByEmpleadoId(idEmpleado, LocalDate.now())
                .orElseThrow(() -> new NotFoundException(Contrato.class, idEmpleado));
        return mapper.toResponse(contrato);
    }

    @Override
    public ContratoResponse actualizarContratoVigente(Long idEmpleado,
                                                      ActualizarContratoVigenteRequest request) {
        normalizarCategoriaPersonal(request);
        validarPuestoContratable(request.getPuestoTrabajo());

        LocalDate hoy = LocalDate.now();
        Contrato contrato = contratoRepository
                .findContratoVigenteByEmpleadoId(idEmpleado, hoy)
                .orElseThrow(() -> new NotFoundException(Contrato.class, idEmpleado));

        validarVigenciaContratoEditado(request.getFechaInicio(), request.getFechaFin(), hoy);
        boolean haySolapamiento = contratoRepository.existeSolapamientoContratosExceptoId(
                idEmpleado,
                contrato.getId(),
                request.getFechaInicio(),
                request.getFechaFin()
        );
        if (haySolapamiento) {
            throw new ConflictException(
                    "El rango de fechas [" + request.getFechaInicio() + " - "
                            + request.getFechaFin() + "] se solapa con un contrato existente."
            );
        }

        mapper.updateContrato(request, contrato);
        return mapper.toResponse(contratoRepository.save(contrato));
    }

    @Override @Transactional
    public ContratoResponse registrarContrato(Long idEmpleado, RegistrarContratoRequest nuevoContrato, String authHeader, Long responsableId) {
        validarAuthorizationRequerida(authHeader);
        normalizarCategoriaPersonal(nuevoContrato);
        validarPuestoContratable(nuevoContrato);
        Empleado empleado = empleadoRepository.findById(idEmpleado)
                .orElseThrow(() -> new NotFoundException(Empleado.class, idEmpleado));
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

        ContratoResponse contratoResponse = mapper.toResponse(contratoRepository.save(contrato));
        eventoService.registrarEventoContratacion(empleado, responsableId);
        programarSincronizacionExternaPostCommit(empleado, nuevoContrato, authHeader);
        return contratoResponse;
    }

    private void validarPuestoContratable(RegistrarContratoRequest nuevoContrato) {
        validarPuestoContratable(nuevoContrato.getPuestoTrabajo());
    }

    private void validarPuestoContratable(PuestoTrabajo puestoTrabajo) {
        if (puestoTrabajo == PuestoTrabajo.OJT) {
            throw new BadRequestException("El puesto OJT solo puede crearse mediante el seeder operativo OJT");
        }
    }

    private void normalizarCategoriaPersonal(RegistrarContratoRequest nuevoContrato) {
        nuevoContrato.setCategoriaPersonal(resolverCategoriaPersonal(
                nuevoContrato.getCategoriaPersonal(),
                nuevoContrato.getPuestoTrabajo()
        ));
    }

    private void normalizarCategoriaPersonal(ActualizarContratoVigenteRequest request) {
        request.setCategoriaPersonal(resolverCategoriaPersonal(
                request.getCategoriaPersonal(),
                request.getPuestoTrabajo()
        ));
    }

    private CategoriaPersonal resolverCategoriaPersonal(CategoriaPersonal categoriaPersonal,
                                                         PuestoTrabajo puestoTrabajo) {
        CategoriaPersonal categoriaDerivada = CategoriaPersonal.desdePuestoTrabajo(puestoTrabajo);
        if (categoriaPersonal == null) {
            if (categoriaDerivada == null) {
                throw new BadRequestException("La categoria de personal es obligatoria");
            }
            return categoriaDerivada;
        }
        if (categoriaDerivada != null && categoriaPersonal != categoriaDerivada) {
            throw new BadRequestException("La categoria de personal no corresponde al puesto de trabajo legado");
        }
        return categoriaPersonal;
    }

    private void validarVigenciaContratoEditado(LocalDate fechaInicio,
                                                 LocalDate fechaFin,
                                                 LocalDate hoy) {
        if (fechaFin != null && fechaFin.isBefore(fechaInicio)) {
            throw new BadRequestException("La fecha de fin no puede ser anterior a la fecha de inicio");
        }
        if (fechaInicio.isAfter(hoy)) {
            throw new BadRequestException("La fecha de inicio debe mantener vigente el contrato actual");
        }
        if (fechaFin != null && fechaFin.isBefore(hoy)) {
            throw new BadRequestException("La fecha de fin debe mantener vigente el contrato actual");
        }
    }

    private void validarNoHayConflictosDeContrato(Long idEmpleado, LocalDate fechaInicio, LocalDate fechaFin) {
        if (fechaFin == null) {
            boolean hayContratosFuturos = contratoRepository.existenContratosFuturos(idEmpleado, fechaInicio);
            if (hayContratosFuturos) {
                throw new ConflictException(
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
                throw new ConflictException(
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

        if (!faltantes.isEmpty()) throw new UnprocessableEntityException("Empleado tiene datos incompletos", e.getId(), faltantes);
    }

    @Override
    public ContratoResponse finalizarContrato(Long idEmpleado, CerrarContratoRequest contratoCerrado, String authHeader) {
        validarAuthorizationRequerida(authHeader);
        LocalDate fechaFin = contratoCerrado.getFechaFin();
        Contrato contrato = contratoRepository.findContratoVigenteByEmpleadoId(idEmpleado, fechaFin)
                .orElseThrow(() -> new NotFoundException(Contrato.class, idEmpleado));
        mapper.updateFechaFinContrato(contratoCerrado, contrato);

        Empleado empleado = contrato.getEmpleado();
        empleado.setEstadoOperativo(EstadoOperativo.INACTIVO);
        programarDeshabilitacionUsuarioPostCommit(authHeader, empleado.getId());
        return mapper.toResponse(contrato);
    }

    @Override
    @Transactional(readOnly = true)
    public List<EmpleadoPlanillaResponse> listarEmpleadosPlanilla(YearMonth periodo) {
        List<Contrato> contratos = contratoRepository.findContratosSolapadosConPeriodo(periodo.atDay(1), periodo.atEndOfMonth());
        Set<Long> idsExcluidos = idsEmpleadosExcluidosPlanilla();
        Map<Long, List<Contrato>> porEmpleado = contratos.stream()
                .filter(contrato -> !idsExcluidos.contains(contrato.getEmpleado().getId()))
                .collect(java.util.stream.Collectors.groupingBy(
                        contrato -> contrato.getEmpleado().getId(),
                        LinkedHashMap::new,
                        java.util.stream.Collectors.toList()
                ));
        return porEmpleado.values().stream()
                .map(grupo -> {
                    Contrato primero = grupo.getFirst();
                    Empleado empleado = primero.getEmpleado();
                    LocalDate primerContrato = contratoRepository.findPrimerInicioContratoByEmpleadoId(empleado.getId()).orElse(primero.getFechaInicio());
                    List<ContratoPlanillaResponse> tramos = grupo.stream()
                            .sorted(Comparator.comparing(Contrato::getFechaInicio))
                            .map(contrato -> new ContratoPlanillaResponse(
                                    contrato.getId(),
                                    contrato.getModalidad() == null ? null : contrato.getModalidad().name(),
                                    contrato.getSueldoBase(),
                                    contrato.getFechaInicio(),
                                    contrato.getFechaFin()
                            ))
                            .toList();
                    return new EmpleadoPlanillaResponse(
                            empleado.getId(),
                            empleado.getNombres(),
                            empleado.getApellidos(),
                            empleado.getTipoDocumento() == null ? null : empleado.getTipoDocumento().name(),
                            empleado.getNumeroDocumento(),
                            primerContrato,
                            tramos
                    );
                })
                .toList();
    }

    private Set<Long> idsEmpleadosExcluidosPlanilla() {
        if (empleadosExcluidosPlanilla == null || empleadosExcluidosPlanilla.isBlank()) {
            return Set.of();
        }
        return Arrays.stream(empleadosExcluidosPlanilla.split(","))
                .map(String::trim)
                .filter(valor -> !valor.isBlank())
                .map(Long::valueOf)
                .collect(java.util.stream.Collectors.toSet());
    }

    @Override
    public void registrarContratos(List<Long> idEmpleados,
                                    List<RegistrarContratoRequest> nuevosContratosVigentes,
                                    String authHeader,
                                    Long responsableId) {
        IntStream.range(0, idEmpleados.size())
                .forEach(i -> registrarContrato(
                        idEmpleados.get(i),
                        nuevosContratosVigentes.get(i),
                        authHeader,
                        responsableId
                ));
    }

    private void registrarUsuarioAuth(Empleado empleado, String authHeader) {
        String email = (empleado.getCorreoCorporativo() != null && !empleado.getCorreoCorporativo().isBlank())
                ? empleado.getCorreoCorporativo()
                : empleado.getCorreoPersonal();

        RegistrarUsuarioRequest request = RegistrarUsuarioRequest.builder()
                .empleadoId(empleado.getId())
                .nombres(empleado.getNombres())
                .apellidos(empleado.getApellidos())
                .dni(empleado.getNumeroDocumento())
                .email(email)
                .build();

        authServiceClient.upsertUsuario(authHeader, request);
    }

    private void confirmarContratacionRecruitment(Empleado empleado,
                                                  RegistrarContratoRequest nuevoContrato,
                                                  String authHeader) {
        if (nuevoContrato.getIdPostulacion() == null) {
            return;
        }

        ConfirmarContratacionRequest request = ConfirmarContratacionRequest.builder()
                .idEmpleadoContratado(empleado.getId())
                .fechaContratacion(nuevoContrato.getFechaInicio())
                .build();

        recruitmentServiceClient.confirmarContratacion(
                authHeader,
                nuevoContrato.getIdPostulacion(),
                request
        );
    }

    private void validarAuthorizationRequerida(String authHeader) {
        if (authHeader == null || authHeader.isBlank()) {
            throw new AuthServiceException(
                    HttpStatus.UNAUTHORIZED,
                    "Falta Authorization para completar la operacion",
                    null
            );
        }
    }

    private void programarSincronizacionExternaPostCommit(Empleado empleado,
                                                          RegistrarContratoRequest nuevoContrato,
                                                          String authHeader) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                registrarUsuarioAuth(empleado, authHeader);
                confirmarContratacionRecruitment(empleado, nuevoContrato, authHeader);
            }
        });
    }

    private void programarDeshabilitacionUsuarioPostCommit(String authHeader, Long idEmpleado) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                authServiceClient.deshabilitarUsuario(authHeader, idEmpleado);
            }
        });
    }
}

