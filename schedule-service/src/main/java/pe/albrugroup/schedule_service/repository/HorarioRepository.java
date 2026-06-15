package pe.albrugroup.schedule_service.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pe.albrugroup.schedule_service.entity.Horario;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import jakarta.persistence.LockModeType;

public interface HorarioRepository extends JpaRepository<Horario, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT h FROM Horario h WHERE h.id = :id")
    Optional<Horario> findByIdForUpdate(@Param("id") Long id);

    @Query("""
            SELECT h FROM Horario h
            WHERE h.idEmpleado = :idEmpleado
            AND h.fechaInicio <= :fecha
            AND (h.fechaFin IS NULL OR h.fechaFin >= :fecha)
            """)
    Optional<Horario> findHorarioVigente(@Param("idEmpleado") Long idEmpleado, @Param("fecha") LocalDate fecha);

    @Query("""
            SELECT CASE WHEN COUNT(h) > 0 THEN true ELSE false END FROM Horario h
            WHERE h.idEmpleado = :idEmpleado
            AND (:excludeId IS NULL OR h.id <> :excludeId)
            AND (:fechaFin IS NULL OR h.fechaInicio <= :fechaFin)
            AND (h.fechaFin IS NULL OR h.fechaFin >= :fechaInicio)
            """)
    boolean existsSolapamiento(@Param("idEmpleado") Long idEmpleado,
                               @Param("fechaInicio") LocalDate fechaInicio,
                               @Param("fechaFin") LocalDate fechaFin,
                               @Param("excludeId") Long excludeId);

    @Query("""
            SELECT h FROM Horario h
            WHERE h.idEmpleado = :idEmpleado
            AND (:excludeId IS NULL OR h.id <> :excludeId)
            AND (:fechaFin IS NULL OR h.fechaInicio <= :fechaFin)
            AND (h.fechaFin IS NULL OR h.fechaFin >= :fechaInicio)
            ORDER BY h.fechaInicio ASC
            """)
    List<Horario> findSolapamientos(@Param("idEmpleado") Long idEmpleado,
                                    @Param("fechaInicio") LocalDate fechaInicio,
                                    @Param("fechaFin") LocalDate fechaFin,
                                    @Param("excludeId") Long excludeId);

    @Query("""
            SELECT h FROM Horario h
            WHERE h.idEmpleado = :idEmpleado
              AND h.fechaInicio <= :hasta
              AND (h.fechaFin IS NULL OR h.fechaFin >= :desde)
            ORDER BY h.fechaInicio ASC
            """)
    List<Horario> findHorariosEnRango(@Param("idEmpleado") Long idEmpleado,
                                      @Param("desde") LocalDate desde,
                                      @Param("hasta") LocalDate hasta);

    Page<Horario> findByIdEmpleado(Long idEmpleado, Pageable pageable);
}
