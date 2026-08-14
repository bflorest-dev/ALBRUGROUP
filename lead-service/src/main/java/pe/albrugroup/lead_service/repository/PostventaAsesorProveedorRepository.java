package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.PostventaAsesorProveedor;

import java.util.Collection;
import java.util.List;

@Repository
public interface PostventaAsesorProveedorRepository extends JpaRepository<PostventaAsesorProveedor, Long> {

    List<PostventaAsesorProveedor> findByIdEmpleadoAndActivoTrueOrderByProveedorNombreAsc(Long idEmpleado);

    void deleteByIdEmpleado(Long idEmpleado);

    boolean existsByIdEmpleadoAndProveedorIdInAndActivoTrue(Long idEmpleado, Collection<Long> proveedorIds);
}
