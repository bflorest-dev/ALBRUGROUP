package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.albrugroup.lead_service.entity.Adicional;

import java.util.List;
import java.util.Optional;

public interface AdicionalRepository extends JpaRepository<Adicional, Long> {

    Optional<Adicional> findByIdAndActivoTrue(Long id);

    boolean existsByProveedorIdAndNombreIgnoreCaseAndActivoTrue(Long idProveedor, String nombre);

    List<Adicional> findByProveedorIdAndActivoTrueOrderByNombreAsc(Long idProveedor);
}
