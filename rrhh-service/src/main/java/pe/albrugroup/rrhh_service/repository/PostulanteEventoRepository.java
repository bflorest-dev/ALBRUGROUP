package pe.albrugroup.rrhh_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.albrugroup.rrhh_service.entity.PostulanteEvento;

import java.time.Instant;
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
}
