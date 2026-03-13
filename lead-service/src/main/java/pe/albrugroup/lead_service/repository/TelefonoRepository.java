package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.albrugroup.lead_service.entity.Telefono;

import java.util.List;
import java.util.Optional;

public interface TelefonoRepository extends JpaRepository<Telefono, Long> {

    Optional<Telefono> findByProveedorIdAndMinutosAndDescripcionIgnoreCaseAndActivoTrue(
            Long idProveedor,
            Integer minutos,
            String descripcion
    );

    List<Telefono> findByProveedorIdAndActivoTrueOrderByMinutosAsc(Long idProveedor);
}
