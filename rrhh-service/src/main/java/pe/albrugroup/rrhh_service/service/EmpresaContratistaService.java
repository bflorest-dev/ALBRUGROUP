package pe.albrugroup.rrhh_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.rrhh_service.entity.EmpresaContratista;
import pe.albrugroup.rrhh_service.entity.request.empresaContratista.RegistrarEmpresaContratistaRequest;
import pe.albrugroup.rrhh_service.entity.response.EmpresaContratistaResponse;
import pe.albrugroup.rrhh_service.exception.EmpresaContratistaConflictException;
import pe.albrugroup.rrhh_service.exception.EmpresaContratistaNotFoundException;
import pe.albrugroup.rrhh_service.repository.EmpresaContratistaRepository;
import pe.albrugroup.rrhh_service.service.mapper.EmpresaContratistaMapper;
import pe.albrugroup.rrhh_service.usecase.IEmpresaContratista;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
public class EmpresaContratistaService implements IEmpresaContratista {

    private final EmpresaContratistaRepository repository;
    private final EmpresaContratistaMapper mapper;

    @Override
    public EmpresaContratistaResponse registrarEmpresaContratista(RegistrarEmpresaContratistaRequest request) {
        String nombreNormalizado = request.getNombre().trim();
        if (repository.existsByNombreIgnoreCase(nombreNormalizado)) {
            throw new EmpresaContratistaConflictException(nombreNormalizado);
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
                .orElseThrow(() -> new EmpresaContratistaNotFoundException(idEmpresaContratista));

        empresaContratista.setActivo(false);
        return mapper.toResponse(empresaContratista);
    }
}
