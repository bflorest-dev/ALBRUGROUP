package pe.albrugroup.schedule_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.albrugroup.schedule_service.entity.PresenciaTramo;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface PresenciaTramoRepository extends JpaRepository<PresenciaTramo, Long> {

    Optional<PresenciaTramo> findFirstByIdEmpleadoAndFechaAndFinIsNullOrderByIdDesc(Long idEmpleado, LocalDate fecha);

    List<PresenciaTramo> findByIdEmpleadoAndFechaOrderByInicioAsc(Long idEmpleado, LocalDate fecha);
}
