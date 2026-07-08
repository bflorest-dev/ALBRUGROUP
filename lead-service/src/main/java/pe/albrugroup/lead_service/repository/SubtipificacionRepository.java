package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.Subtipificacion;
import pe.albrugroup.lead_service.entity.Tipificacion;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubtipificacionRepository extends JpaRepository<Subtipificacion, Long> {

    List<Subtipificacion> findByTipificacionInAndActivoTrueOrderByTipificacion_IdAscOrdenAsc(List<Tipificacion> tipificaciones);
    List<Subtipificacion> findByTipificacionIdIn(List<Long> tipificacionIds);
    Optional<Subtipificacion> findByTipificacionIdAndCodigo(Long tipificacionId, String codigo);
    Optional<Subtipificacion> findByTipificacionIdAndCodigoAndActivoTrue(Long tipificacionId, String codigo);

    // Catalogo plano (etapa, codigoTipificacion, codigoSubtipificacion, etapaCambio) para el backfill.
    @Query("SELECT t.etapa, t.codigo, s.codigo, s.etapaCambio FROM Subtipificacion s JOIN s.tipificacion t")
    List<Object[]> listarCambiosEtapa();
}
