package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.albrugroup.lead_service.entity.Television;

import java.util.List;
import java.util.Optional;

public interface TelevisionRepository extends JpaRepository<Television, Long> {

    Optional<Television> findByProveedorIdAndNombreIgnoreCaseAndCantidadCanalesAndActivoTrue(
            Long idProveedor,
            String nombre,
            Integer cantidadCanales
    );

    List<Television> findByProveedorIdAndActivoTrueOrderByCantidadCanalesAsc(Long idProveedor);
}
