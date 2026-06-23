package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.CampanaGastoRegistro;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

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

    List<CampanaGastoRegistro> findByCampanaProveedorIdInAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtAsc(
            List<Long> proveedorIds,
            Instant inicio,
            Instant fin
    );

    Optional<CampanaGastoRegistro> findTopByCampanaIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThanOrderByCreatedAtDesc(
            Long idCampana,
            Instant inicio,
            Instant fin
    );
}
