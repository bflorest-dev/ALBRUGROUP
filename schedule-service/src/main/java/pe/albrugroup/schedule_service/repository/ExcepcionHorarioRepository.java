package pe.albrugroup.schedule_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.albrugroup.schedule_service.entity.ExcepcionHorario;

import java.time.LocalDate;
import java.util.Optional;

public interface ExcepcionHorarioRepository extends JpaRepository<ExcepcionHorario, Long> {
    Optional<ExcepcionHorario> findByHorarioIdAndFecha(Long idHorario, LocalDate fecha);
}
