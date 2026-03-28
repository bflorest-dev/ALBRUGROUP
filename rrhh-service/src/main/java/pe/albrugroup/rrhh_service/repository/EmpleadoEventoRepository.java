package pe.albrugroup.rrhh_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.albrugroup.rrhh_service.entity.EmpleadoEvento;

import java.util.List;

public interface EmpleadoEventoRepository extends JpaRepository<EmpleadoEvento, Long> {
    List<EmpleadoEvento> findByEmpleadoIdOrderByFechaCreacionDescIdDesc(Long idEmpleado);
}
