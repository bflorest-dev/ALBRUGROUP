package pe.albrugroup.schedule_service.repository;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import pe.albrugroup.schedule_service.entity.AjusteJornada;
import pe.albrugroup.schedule_service.entity.enums.EstadoAjusteJornada;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AjusteJornadaRepository extends JpaRepository<AjusteJornada, Long> {

    List<AjusteJornada> findByIdEmpleadoAndFechaOperativaAndEstadoOrderByInicioAsc(
            Long idEmpleado,
            LocalDate fechaOperativa,
            EstadoAjusteJornada estado
    );

    List<AjusteJornada> findByIdEmpleadoAndFechaOperativaOrderByCreatedAtDesc(
            Long idEmpleado,
            LocalDate fechaOperativa
    );

    List<AjusteJornada> findByIdEmpleadoAndFechaOperativaBetweenAndEstado(
            Long idEmpleado,
            LocalDate desde,
            LocalDate hasta,
            EstadoAjusteJornada estado
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    List<AjusteJornada> findForUpdateByIdEmpleadoAndFechaOperativaAndEstado(
            Long idEmpleado,
            LocalDate fechaOperativa,
            EstadoAjusteJornada estado
    );

    Optional<AjusteJornada> findByIdAndIdEmpleado(Long id, Long idEmpleado);
}
