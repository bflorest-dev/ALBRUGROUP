package pe.albrugroup.lead_service.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.EncuestaPostventa;
import pe.albrugroup.lead_service.entity.enums.EstadoEncuestaPostventa;
import pe.albrugroup.lead_service.entity.enums.TipoEncuestaPostventa;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface EncuestaPostventaRepository extends JpaRepository<EncuestaPostventa, Long> {

    Page<EncuestaPostventa> findByLeadIdOrderByCreatedAtDesc(Long idLead, Pageable pageable);
    List<EncuestaPostventa> findByLeadId(Long idLead);

    Optional<EncuestaPostventa> findFirstByLeadIdAndTipoEncuestaAndEstadoOrderByFechaProgramadaAscCreatedAtAscIdAsc(
            Long idLead,
            TipoEncuestaPostventa tipoEncuesta,
            EstadoEncuestaPostventa estado
    );

    @Query("""
            SELECT e
            FROM EncuestaPostventa e
            WHERE e.lead.id IN :leadIds
              AND NOT EXISTS (
                    SELECT 1
                    FROM EncuestaPostventa posterior
                    WHERE posterior.lead.id = e.lead.id
                      AND (
                            posterior.createdAt > e.createdAt
                            OR (
                                posterior.createdAt = e.createdAt
                                AND posterior.id > e.id
                            )
                      )
              )
            """)
    List<EncuestaPostventa> listarUltimasPorLeadIds(@Param("leadIds") Collection<Long> leadIds);

    @Modifying
    @Query("DELETE FROM EncuestaPostventa e WHERE e.lead.id = :idLead")
    void deleteByLeadId(@Param("idLead") Long idLead);
}
