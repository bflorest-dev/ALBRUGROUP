package pe.albrugroup.rrhh_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.albrugroup.rrhh_service.entity.PostulanteEvento;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

@Repository
public interface PostulanteEventoRepository extends JpaRepository<PostulanteEvento, Long> {

    @Query("""
        SELECT e FROM PostulanteEvento e
        WHERE (:postulanteId IS NULL OR e.postulante.id = :postulanteId)
          AND (:desde IS NULL OR e.fechaCreacion >= :desde)
          AND (:hasta IS NULL OR e.fechaCreacion <= :hasta)
        ORDER BY e.fechaCreacion DESC, e.id DESC
        """)
    List<PostulanteEvento> buscarEventos(
            @Param("postulanteId") Long postulanteId,
            @Param("desde") Instant desde,
            @Param("hasta") Instant hasta
    );

    @Query("""
        SELECT e FROM PostulanteEvento e
        WHERE e.postulante.id IN :postulanteIds
          AND NOT EXISTS (
              SELECT 1
              FROM PostulanteEvento e2
              WHERE e2.postulante.id = e.postulante.id
                AND (
                    e2.fechaCreacion > e.fechaCreacion
                    OR (e2.fechaCreacion = e.fechaCreacion AND e2.id > e.id)
                )
          )
        """)
    List<PostulanteEvento> buscarUltimosEventosPorPostulanteIds(@Param("postulanteIds") Collection<Long> postulanteIds);
}
