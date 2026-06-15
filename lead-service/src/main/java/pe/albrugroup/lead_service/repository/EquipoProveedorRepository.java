package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.EquipoProveedor;

import java.util.Collection;
import java.util.List;

@Repository
public interface EquipoProveedorRepository extends JpaRepository<EquipoProveedor, Long> {

    List<EquipoProveedor> findByIdEquipo(Long idEquipo);
    List<EquipoProveedor> findByIdEquipoIn(Collection<Long> idEquipos);
    boolean existsByIdEquipoAndProveedorId(Long idEquipo, Long proveedorId);
    void deleteByIdEquipo(Long idEquipo);
}
