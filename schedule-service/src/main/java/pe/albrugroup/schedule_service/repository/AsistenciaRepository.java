package pe.albrugroup.schedule_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.albrugroup.schedule_service.entity.Asistencia;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AsistenciaRepository extends JpaRepository<Asistencia, Long> {
    Optional<Asistencia> findByIdEmpleadoAndFecha(Long idEmpleado, LocalDate fecha);
    List<Asistencia> findByIdEmpleadoAndFechaBetweenOrderByFechaAsc(Long idEmpleado, LocalDate desde, LocalDate hasta);
    List<Asistencia> findByIdEmpleadoInAndFecha(List<Long> empleadoIds, LocalDate fecha);
}
