package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.MatrizTipificacion;
import pe.albrugroup.lead_service.entity.enums.Etapa;

import java.util.Optional;

@Repository
public interface MatrizTipificacionRepository extends JpaRepository<MatrizTipificacion, Long> {

    Optional<MatrizTipificacion> findByEtapaAndProveedorId(Etapa etapa, Long idProveedor);

    Optional<MatrizTipificacion> findByEtapaAndProveedorIdAndActivoTrue(Etapa etapa, Long idProveedor);
}
