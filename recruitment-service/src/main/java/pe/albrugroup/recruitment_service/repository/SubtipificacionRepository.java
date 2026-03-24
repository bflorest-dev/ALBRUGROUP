package pe.albrugroup.recruitment_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.albrugroup.recruitment_service.entity.Subtipificacion;
import pe.albrugroup.recruitment_service.entity.Tipificacion;

import java.util.List;

public interface SubtipificacionRepository extends JpaRepository<Subtipificacion, Long> {

    List<Subtipificacion> findByTipificacionInAndActivoTrueOrderByTipificacion_IdAscOrdenAsc(List<Tipificacion> tipificaciones);

    List<Subtipificacion> findByTipificacionIdIn(List<Long> tipificacionIds);

    boolean existsByTipificacionIdAndCodigoIgnoreCase(Long tipificacionId, String codigo);
}
