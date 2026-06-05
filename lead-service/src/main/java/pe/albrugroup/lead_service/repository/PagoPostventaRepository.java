package pe.albrugroup.lead_service.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.PagoPostventa;

import java.util.Optional;

@Repository
public interface PagoPostventaRepository extends JpaRepository<PagoPostventa, Long> {

    Page<PagoPostventa> findByLeadIdOrderByFechaVencimientoAsc(Long idLead, Pageable pageable);

    @Modifying
    @Query("DELETE FROM PagoPostventa p WHERE p.lead.id = :idLead")
    void deleteByLeadId(@Param("idLead") Long idLead);

    @EntityGraph(attributePaths = {"lead"})
    @Query("SELECT p FROM PagoPostventa p WHERE p.id = :id")
    Optional<PagoPostventa> findWithLeadById(@Param("id") Long id);
}
