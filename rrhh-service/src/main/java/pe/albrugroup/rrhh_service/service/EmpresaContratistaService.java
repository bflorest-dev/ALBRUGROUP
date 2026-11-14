package pe.albrugroup.rrhh_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.rrhh_service.entity.EmpresaContratista;
import pe.albrugroup.rrhh_service.entity.UsuarioEmpresaContratista;
import pe.albrugroup.rrhh_service.entity.request.empresaContratista.AsignarEmpresaContratistaRequest;
import pe.albrugroup.rrhh_service.entity.request.empresaContratista.RegistrarEmpresaContratistaRequest;
import pe.albrugroup.rrhh_service.entity.response.EmpresaContratistaResponse;
import pe.albrugroup.rrhh_service.exception.ConflictException;
import pe.albrugroup.rrhh_service.exception.NotFoundException;
import pe.albrugroup.rrhh_service.repository.EmpresaContratistaRepository;
import pe.albrugroup.rrhh_service.repository.UsuarioEmpresaContratistaRepository;
import pe.albrugroup.rrhh_service.service.mapper.EmpresaContratistaMapper;
import pe.albrugroup.rrhh_service.usecase.IEmpresaContratista;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class EmpresaContratistaService implements IEmpresaContratista {

    private final EmpresaContratistaRepository repository;
    private final UsuarioEmpresaContratistaRepository asignacionRepository;
    private final EmpresaContratistaScopeService scopeService;
    private final EmpresaContratistaMapper mapper;

    @Override
    public EmpresaContratistaResponse registrarEmpresaContratista(RegistrarEmpresaContratistaRequest request) {
        String nombreNormalizado = request.getNombre().trim();
        if (repository.existsByNombreIgnoreCase(nombreNormalizado)) {
            throw new ConflictException("La empresa contratista ya existe", nombreNormalizado);
        }

        EmpresaContratista empresaContratista = mapper.toEntity(request);
        empresaContratista.setNombre(nombreNormalizado);
        empresaContratista.setActivo(true);

        return mapper.toResponse(repository.save(empresaContratista));
    }

    @Override
    @Transactional(readOnly = true)
    public List<EmpresaContratistaResponse> listarEmpresasContratistas(Boolean activo) {
        Boolean estadoActivo = activo != null ? activo : Boolean.TRUE;
        return repository.findByActivoOrderByNombreAsc(estadoActivo).stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    public EmpresaContratistaResponse desactivarEmpresaContratista(Long idEmpresaContratista) {
        EmpresaContratista empresaContratista = repository.findById(idEmpresaContratista)
                .orElseThrow(() -> new NotFoundException(EmpresaContratista.class, idEmpresaContratista));

        empresaContratista.setActivo(false);
        return mapper.toResponse(empresaContratista);
    }

    @Override
    @Transactional(readOnly = true)
    public List<EmpresaContratistaResponse> misEmpresasContratistas(Long empleadoId, List<String> roles) {
        return scopeService.misEmpresas(empleadoId, roles).stream()
                .map(mapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<EmpresaContratistaResponse> listarAsignacionesEmpleado(Long idEmpleado) {
        return asignacionRepository.findByIdEmpleadoAndActivoTrueOrderByEmpresaContratistaNombreAsc(idEmpleado)
                .stream()
                .map(uec -> mapper.toResponse(uec.getEmpresaContratista()))
                .toList();
    }

    @Override
    public void asignarEmpresasContratistas(AsignarEmpresaContratistaRequest request) {
        Long idEmpleado = request.getIdEmpleado();
        for (Long idEmpresa : request.getIdEmpresasContratistas()) {
            if (asignacionRepository.findByIdEmpleadoAndEmpresaContratistaId(idEmpleado, idEmpresa).isPresent()) {
                continue;
            }
            EmpresaContratista empresa = repository.findById(idEmpresa)
                    .orElseThrow(() -> new NotFoundException(EmpresaContratista.class, idEmpresa));
            asignacionRepository.save(UsuarioEmpresaContratista.builder()
                    .idEmpleado(idEmpleado)
                    .empresaContratista(empresa)
                    .activo(true)
                    .build());
        }
    }

    @Override
    public void desasignarEmpresaContratista(Long idEmpleado, Long idEmpresaContratista) {
        UsuarioEmpresaContratista asignacion = asignacionRepository
                .findByIdEmpleadoAndEmpresaContratistaId(idEmpleado, idEmpresaContratista)
                .orElseThrow(() -> new NotFoundException(UsuarioEmpresaContratista.class, idEmpresaContratista));
        asignacionRepository.delete(asignacion);
    }
}

