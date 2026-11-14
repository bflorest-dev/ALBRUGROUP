package pe.albrugroup.rrhh_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.albrugroup.rrhh_service.entity.UsuarioEmpresaContratista;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioEmpresaContratistaRepository extends JpaRepository<UsuarioEmpresaContratista, Long> {

    List<UsuarioEmpresaContratista> findByIdEmpleadoAndActivoTrueOrderByEmpresaContratistaNombreAsc(Long idEmpleado);

    Optional<UsuarioEmpresaContratista> findByIdEmpleadoAndEmpresaContratistaId(Long idEmpleado, Long idEmpresaContratista);

    void deleteByIdEmpleadoAndEmpresaContratistaId(Long idEmpleado, Long idEmpresaContratista);
}
