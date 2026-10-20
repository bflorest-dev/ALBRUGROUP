package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.albrugroup.lead_service.entity.TipoDomicilio;

import java.util.List;

public interface TipoDomicilioRepository extends JpaRepository<TipoDomicilio, Long> {

    List<TipoDomicilio> findByProveedorIdAndActivoTrue(Long idProveedor);
}
