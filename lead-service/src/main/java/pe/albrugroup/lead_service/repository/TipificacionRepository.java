package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.Tipificacion;
import pe.albrugroup.lead_service.entity.enums.Etapa;

import java.util.List;
import java.util.Optional;

@Repository
public interface TipificacionRepository extends JpaRepository<Tipificacion, Long> {

    // Cross-equipo, SOLO para la paleta de colores de las vistas de supervisor (bandeja diaria/ranking):
    // NO usar para resolver tipificaciones de un lead (eso es siempre por (etapa, idEquipo)).
    List<Tipificacion> findByEtapaAndActivoTrueOrderByOrdenAsc(Etapa etapa);

    // Consultas por (etapa, idEquipo): cada equipo tiene su propia matriz.
    List<Tipificacion> findByEtapaAndIdEquipoAndActivoTrueOrderByOrdenAsc(Etapa etapa, Long idEquipo);
    List<Tipificacion> findByEtapaAndIdEquipoOrderByOrdenAsc(Etapa etapa, Long idEquipo);
    Optional<Tipificacion> findByEtapaAndIdEquipoAndCodigo(Etapa etapa, Long idEquipo, String codigo);
    Optional<Tipificacion> findByEtapaAndIdEquipoAndCodigoAndActivoTrue(Etapa etapa, Long idEquipo, String codigo);
    boolean existsByEtapaAndIdEquipoAndActivoTrue(Etapa etapa, Long idEquipo);
}
