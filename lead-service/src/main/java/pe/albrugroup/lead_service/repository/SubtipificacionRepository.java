package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.Subtipificacion;
import pe.albrugroup.lead_service.entity.Tipificacion;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubtipificacionRepository extends JpaRepository<Subtipificacion, Long> {

    List<Subtipificacion> findByTipificacionInAndActivoTrueOrderByTipificacion_IdAscOrdenAsc(List<Tipificacion> tipificaciones);
    Optional<Subtipificacion> findByTipificacionIdAndCodigo(Long tipificacionId, String codigo);
}
