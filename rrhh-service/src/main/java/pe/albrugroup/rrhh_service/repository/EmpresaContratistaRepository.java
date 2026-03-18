package pe.albrugroup.rrhh_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.albrugroup.rrhh_service.entity.EmpresaContratista;

import java.util.List;

@Repository
public interface EmpresaContratistaRepository extends JpaRepository<EmpresaContratista, Long> {

    boolean existsByNombreIgnoreCase(String nombre);

    List<EmpresaContratista> findByActivoOrderByNombreAsc(Boolean activo);
}
