package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.configuration.CacheNames;
import pe.albrugroup.lead_service.entity.*;
import pe.albrugroup.lead_service.entity.request.AdicionalRequest;
import pe.albrugroup.lead_service.entity.request.PlanAdicionalRequest;
import pe.albrugroup.lead_service.entity.request.PlanRequest;
import pe.albrugroup.lead_service.entity.request.PlanUpdateRequest;
import pe.albrugroup.lead_service.entity.request.TelefonoRequest;
import pe.albrugroup.lead_service.entity.response.AdicionalResponse;
import pe.albrugroup.lead_service.entity.response.PlanAdicionalResponse;
import pe.albrugroup.lead_service.entity.response.PlanResponse;
import pe.albrugroup.lead_service.entity.response.ServiciosProveedorResponse;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.exception.ConflictException;
import pe.albrugroup.lead_service.exception.NotFoundException;
import pe.albrugroup.lead_service.repository.*;
import pe.albrugroup.lead_service.service.mapper.PlanMapper;

import java.time.LocalDate;
import java.util.*;

@Service
@Transactional
@RequiredArgsConstructor
public class PlanService {

    private final PlanMapper mapper;
    private final PlanRepository planRepository;
    private final PlanAdicionalRepository planAdicionalRepository;
    private final AdicionalRepository adicionalRepository;
    private final ProveedorRepository proveedorRepository;
    private final InternetRepository internetRepository;
    private final TelevisionRepository televisionRepository;
    private final TelefonoRepository telefonoRepository;

    @CacheEvict(value = CacheNames.ADICIONALES, allEntries = true)
    public AdicionalResponse registrarAdicional(AdicionalRequest request) {
        Proveedor proveedor = buscarProveedorActivo(request.getIdProveedor());
        if (adicionalRepository.existsByProveedorIdAndNombreIgnoreCaseAndActivoTrue(
                request.getIdProveedor(),
                request.getNombre()
        )) {
            throw new ConflictException(
                    "Ya existe un adicional activo con ese nombre para el proveedor",
                    null,
                    Map.of("idProveedor", request.getIdProveedor(), "nombre", request.getNombre())
            );
        }

        Adicional adicional = mapper.toEntity(request);
        adicional.setProveedor(proveedor);
        adicional.setActivo(Boolean.TRUE);
        return mapper.toResponse(adicionalRepository.save(adicional));
    }

    @CacheEvict(value = CacheNames.PLANES, allEntries = true)
    public PlanResponse registrarPlan(PlanRequest request) {
        Proveedor proveedor = buscarProveedorActivo(request.getIdProveedor());
        LocalDate fechaActual = LocalDate.now();

        Plan plan = mapper.toEntity(request);
        plan.setProveedor(proveedor);
        plan.setActivo(Boolean.TRUE);
        normalizarVigencias(plan, fechaActual);
        plan.setInternet(resolverInternet(request, proveedor));
        plan.setTelevision(resolverTelevision(request, proveedor));
        plan.setTelefono(resolverTelefono(request, proveedor));

        Plan planGuardado = planRepository.save(plan);
        Set<PlanAdicional> adicionales = construirPlanAdicionales(
                planGuardado,
                proveedor,
                Objects.requireNonNullElse(request.getAdicionales(), List.of())
        );
        planGuardado.setAdicionales(adicionales);

        return toPlanResponse(planRepository.save(planGuardado));
    }

    @Transactional(readOnly = true)
    @Cacheable(value = CacheNames.SERVICIOS_PROVEEDOR, key = "#idProveedor")
    public ServiciosProveedorResponse listarServicios(Long idProveedor) {
        Proveedor proveedor = buscarProveedorActivo(idProveedor);
        return new ServiciosProveedorResponse(
                proveedor.getId(),
                proveedor.getNombre(),
                internetRepository.findByProveedorIdAndActivoTrueOrderByVelocidadAsc(idProveedor).stream()
                        .map(mapper::toResponse)
                        .toList(),
                televisionRepository.findByProveedorIdAndActivoTrueOrderByCantidadCanalesAsc(idProveedor).stream()
                        .map(mapper::toResponse)
                        .toList(),
                telefonoRepository.findByProveedorIdAndActivoTrueOrderByMinutosAsc(idProveedor).stream()
                        .map(mapper::toResponse)
                        .toList()
        );
    }

    @Transactional(readOnly = true)
    @Cacheable(value = CacheNames.PLANES, key = "(#idProveedor == null ? 'all' : #idProveedor) + ':' + #soloVigentes")
    public List<PlanResponse> listarPlanes(Long idProveedor, boolean soloVigentes) {
        return planRepository.listarActivos(idProveedor, soloVigentes, LocalDate.now()).stream()
                .map(this::toPlanResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    @Cacheable(value = CacheNames.ADICIONALES, key = "#idProveedor")
    public List<AdicionalResponse> listarAdicionales(Long idProveedor) {
        buscarProveedorActivo(idProveedor);
        return adicionalRepository.findByProveedorIdAndActivoTrueOrderByNombreAsc(idProveedor).stream()
                .map(mapper::toResponse)
                .toList();
    }

    @CacheEvict(value = CacheNames.PLANES, allEntries = true)
    public PlanResponse actualizarPlan(Long idPlan, PlanUpdateRequest request) {
        Plan plan = planRepository.findById(idPlan)
                .orElseThrow(() -> new NotFoundException(Plan.class, idPlan));

        mapper.updatePlan(request, plan);
        normalizarVigencias(plan, LocalDate.now());
        return toPlanResponse(planRepository.save(plan));
    }

    @CacheEvict(value = CacheNames.PLANES, allEntries = true)
    public PlanResponse desactivarPlan(Long idPlan) {
        Plan plan = planRepository.findById(idPlan)
                .orElseThrow(() -> new NotFoundException(Plan.class, idPlan));

        plan.setActivo(Boolean.FALSE);
        return toPlanResponse(planRepository.save(plan));
    }

    private Proveedor buscarProveedorActivo(Long idProveedor) {
        return proveedorRepository.findByIdAndActivoTrue(idProveedor)
                .orElseThrow(() -> new NotFoundException(Proveedor.class, idProveedor));
    }

    private void normalizarVigencias(Plan plan, LocalDate fechaActual) {
        if (plan.getVigenciaDesde() == null) {
            plan.setVigenciaDesde(fechaActual);
        }
        if (plan.getVigenciaHasta() != null && plan.getVigenciaHasta().isBefore(plan.getVigenciaDesde())) {
            throw new BadRequestException(
                    "La vigenciaHasta no puede ser menor que la vigenciaDesde",
                    null,
                    Map.of(
                            "vigenciaDesde", plan.getVigenciaDesde(),
                            "vigenciaHasta", plan.getVigenciaHasta()
                    )
            );
        }
    }

    private Internet resolverInternet(PlanRequest request, Proveedor proveedor) {
        if (request.getInternet() == null) {
            return null;
        }

        return internetRepository.findByProveedorIdAndVelocidadAndUnidadAndTecnologiaAndActivoTrue(
                        proveedor.getId(),
                        request.getInternet().getVelocidad(),
                        request.getInternet().getUnidad(),
                        request.getInternet().getTecnologia()
                )
                .orElseGet(() -> {
                    Internet internet = mapper.toEntity(request.getInternet());
                    internet.setProveedor(proveedor);
                    internet.setActivo(Boolean.TRUE);
                    return internetRepository.save(internet);
                });
    }

    private Television resolverTelevision(PlanRequest request, Proveedor proveedor) {
        if (request.getTelevision() == null) {
            return null;
        }

        return televisionRepository.findByProveedorIdAndNombreIgnoreCaseAndCantidadCanalesAndActivoTrue(
                        proveedor.getId(),
                        request.getTelevision().getNombre(),
                        request.getTelevision().getCantidadCanales()
                )
                .orElseGet(() -> {
                    Television television = mapper.toEntity(request.getTelevision());
                    television.setProveedor(proveedor);
                    television.setActivo(Boolean.TRUE);
                    return televisionRepository.save(television);
                });
    }

    private Telefono resolverTelefono(PlanRequest request, Proveedor proveedor) {
        TelefonoRequest telefonoRequest = request.getTelefono();
        if (telefonoRequest == null) {
            return null;
        }

        return telefonoRepository.findByProveedorIdAndMinutosAndDescripcionIgnoreCaseAndActivoTrue(
                        proveedor.getId(),
                        telefonoRequest.getMinutos(),
                        telefonoRequest.getDescripcion()
                )
                .orElseGet(() -> {
                    Telefono telefono = mapper.toEntity(telefonoRequest);
                    telefono.setProveedor(proveedor);
                    telefono.setActivo(Boolean.TRUE);
                    return telefonoRepository.save(telefono);
                });
    }

    private Set<PlanAdicional> construirPlanAdicionales(
            Plan plan,
            Proveedor proveedor,
            List<PlanAdicionalRequest> adicionalesRequest
    ) {
        if (adicionalesRequest.isEmpty()) {
            return new HashSet<>();
        }

        Set<Long> ids = new HashSet<>();
        Set<PlanAdicional> adicionales = new HashSet<>();
        for (PlanAdicionalRequest adicionalRequest : adicionalesRequest) {
            if (!ids.add(adicionalRequest.getIdAdicional())) {
                throw new ConflictException(
                        "No se puede repetir el mismo adicional dentro del plan",
                        null,
                        Map.of("idAdicional", adicionalRequest.getIdAdicional())
                );
            }

            Adicional adicional = adicionalRepository.findByIdAndActivoTrue(adicionalRequest.getIdAdicional())
                    .orElseThrow(() -> new NotFoundException(Adicional.class, adicionalRequest.getIdAdicional()));

            if (!adicional.getProveedor().getId().equals(proveedor.getId())) {
                throw new BadRequestException(
                        "El adicional no pertenece al proveedor del plan",
                        null,
                        Map.of(
                                "idAdicional", adicionalRequest.getIdAdicional(),
                                "idProveedorPlan", proveedor.getId(),
                                "idProveedorAdicional", adicional.getProveedor().getId()
                        )
                );
            }

            PlanAdicional planAdicional = PlanAdicional.builder()
                    .plan(plan)
                    .adicional(adicional)
                    .cantidadIncluida(adicionalRequest.getCantidadIncluida())
                    .permiteCompraAdicional(adicionalRequest.getPermiteCompraAdicional())
                    .cantidadMaximaAdicional(adicionalRequest.getCantidadMaximaAdicional())
                    .precioUnitarioAdicional(adicionalRequest.getPrecioUnitarioAdicional())
                    .activo(Boolean.TRUE)
                    .build();
            adicionales.add(planAdicional);
        }

        planAdicionalRepository.saveAll(adicionales);
        return adicionales;
    }

    private PlanResponse toPlanResponse(Plan plan) {
        return new PlanResponse(
                plan.getId(),
                plan.getNombre(),
                plan.getPrecio(),
                plan.getVigenciaDesde(),
                plan.getVigenciaHasta(),
                plan.getProveedor().getId(),
                plan.getProveedor().getNombre(),
                mapper.toResponse(plan.getInternet()),
                mapper.toResponse(plan.getTelevision()),
                mapper.toResponse(plan.getTelefono()),
                plan.getAdicionales().stream()
                        .map(mapper::toResponse)
                        .sorted(Comparator.comparing(PlanAdicionalResponse::getNombreAdicional, String.CASE_INSENSITIVE_ORDER))
                        .toList(),
                plan.getActivo()
        );
    }
}
