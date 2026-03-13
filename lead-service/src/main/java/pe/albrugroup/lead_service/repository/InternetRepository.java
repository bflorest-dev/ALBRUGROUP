package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.albrugroup.lead_service.entity.Internet;
import pe.albrugroup.lead_service.entity.enums.Tecnologia;
import pe.albrugroup.lead_service.entity.enums.Unidad;

import java.util.List;
import java.util.Optional;

public interface InternetRepository extends JpaRepository<Internet, Long> {

    Optional<Internet> findByProveedorIdAndVelocidadAndUnidadAndTecnologiaAndActivoTrue(
            Long idProveedor,
            Integer velocidad,
            Unidad unidad,
            Tecnologia tecnologia
    );

    List<Internet> findByProveedorIdAndActivoTrueOrderByVelocidadAsc(Long idProveedor);
}
