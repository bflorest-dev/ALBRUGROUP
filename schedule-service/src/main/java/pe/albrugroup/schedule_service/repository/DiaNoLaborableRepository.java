package pe.albrugroup.schedule_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.albrugroup.schedule_service.entity.DiaNoLaborable;
import pe.albrugroup.schedule_service.entity.enums.AlcanceDiaNoLaborable;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface DiaNoLaborableRepository extends JpaRepository<DiaNoLaborable, Long> {

    /** Todos los overrides de calendario de una fecha (pocos); la precedencia se resuelve en memoria. */
    List<DiaNoLaborable> findByFecha(LocalDate fecha);

    Optional<DiaNoLaborable> findFirstByAlcanceAndRefIdAndFecha(
            AlcanceDiaNoLaborable alcance, Long refId, LocalDate fecha);

    Optional<DiaNoLaborable> findFirstByAlcanceAndRefIdIsNullAndFecha(
            AlcanceDiaNoLaborable alcance, LocalDate fecha);
}
