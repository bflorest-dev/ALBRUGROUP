package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.albrugroup.lead_service.entity.ProveedorCampo;

import java.util.List;

public interface ProveedorCampoRepository extends JpaRepository<ProveedorCampo, Long> {

    List<ProveedorCampo> findByProveedorId(Long proveedorId);
}
