package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.LeadSeguimiento;
import pe.albrugroup.lead_service.entity.enums.EstadoClientePostventa;
import pe.albrugroup.lead_service.entity.enums.Etapa;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface LeadSeguimientoRepository extends JpaRepository<LeadSeguimiento, Long> {

    Optional<LeadSeguimiento> findByIdLead(Long idLead);

    void deleteByIdLead(Long idLead);

    @Query("""
            SELECT r.idAsesorMerito, COUNT(DISTINCT l.id)
            FROM LeadSeguimiento s
            JOIN Lead l ON l.id = s.idLead
            JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = :etapaPreventa
            WHERE s.fechaInstalacion >= :desde
              AND s.fechaInstalacion <= :hasta
              AND l.etapa = :etapaPostventa
              AND l.estadoClientePostventa = :estadoActivo
              AND r.idAsesorMerito IS NOT NULL
            GROUP BY r.idAsesorMerito
            """)
    List<Object[]> contarVentasValidasParaBilling(
            @Param("desde") LocalDate desde,
            @Param("hasta") LocalDate hasta,
            @Param("etapaPreventa") Etapa etapaPreventa,
            @Param("etapaPostventa") Etapa etapaPostventa,
            @Param("estadoActivo") EstadoClientePostventa estadoActivo
    );
}
