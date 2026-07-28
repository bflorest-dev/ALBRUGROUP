package pe.albrugroup.lead_service.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.CalendarioFacturacionPostventa;
import pe.albrugroup.lead_service.entity.enums.Etapa;

import java.util.Optional;

@Repository
public interface CalendarioFacturacionPostventaRepository extends JpaRepository<CalendarioFacturacionPostventa, Long> {

    Optional<CalendarioFacturacionPostventa> findByLeadId(Long idLead);

    @EntityGraph(attributePaths = {"lead"})
    @Query("SELECT c FROM CalendarioFacturacionPostventa c WHERE c.id = :id")
    Optional<CalendarioFacturacionPostventa> findWithLeadById(@Param("id") Long id);

    @EntityGraph(attributePaths = {
            "lead",
            "lead.datosPreventa",
            "lead.plan",
            "lead.plataformaDigitalOfrecida"
    })
    @Query("""
            SELECT c
            FROM CalendarioFacturacionPostventa c
            JOIN c.lead l
            WHERE l.etapa = :etapa
              AND c.activo = true
            """)
    Page<CalendarioFacturacionPostventa> listarBandejaPostventa(
            @Param("etapa") Etapa etapa,
            Pageable pageable
    );
}
