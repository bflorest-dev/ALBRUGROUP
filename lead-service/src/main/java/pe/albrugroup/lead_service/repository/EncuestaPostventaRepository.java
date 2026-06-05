package pe.albrugroup.lead_service.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.EncuestaPostventa;

import java.util.List;

@Repository
public interface EncuestaPostventaRepository extends JpaRepository<EncuestaPostventa, Long> {

    Page<EncuestaPostventa> findByLeadIdOrderByCreatedAtDesc(Long idLead, Pageable pageable);
    List<EncuestaPostventa> findByLeadId(Long idLead);

    @Modifying
    @Query("DELETE FROM EncuestaPostventa e WHERE e.lead.id = :idLead")
    void deleteByLeadId(@Param("idLead") Long idLead);
}
