package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.CampanaGastoRegistro;

import java.time.Instant;
import java.util.List;

@Repository
public interface CampanaGastoRegistroRepository extends JpaRepository<CampanaGastoRegistro, Long> {

    List<CampanaGastoRegistro> findByCampanaIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtAsc(
            Long idCampana,
            Instant inicio,
            Instant fin
    );

    List<CampanaGastoRegistro> findByCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtAsc(
            Instant inicio,
            Instant fin
    );
}
