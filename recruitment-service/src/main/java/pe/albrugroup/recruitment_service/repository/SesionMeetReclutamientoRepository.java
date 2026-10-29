package pe.albrugroup.recruitment_service.repository;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pe.albrugroup.recruitment_service.entity.SesionMeetReclutamiento;
import pe.albrugroup.recruitment_service.entity.enums.Negocio;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface SesionMeetReclutamientoRepository extends JpaRepository<SesionMeetReclutamiento, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select s from SesionMeetReclutamiento s
            where s.horario.id = :horarioId and s.fecha = :fecha
            """)
    Optional<SesionMeetReclutamiento> findLockedByHorarioIdAndFecha(
            @Param("horarioId") Long horarioId,
            @Param("fecha") LocalDate fecha
    );

    List<SesionMeetReclutamiento> findByFechaAndNegocioOrderByFechaHoraInicioAsc(LocalDate fecha, Negocio negocio);

    List<SesionMeetReclutamiento> findByFechaOrderByFechaHoraInicioAsc(LocalDate fecha);
}
