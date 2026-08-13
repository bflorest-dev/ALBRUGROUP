package pe.albrugroup.schedule_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.albrugroup.schedule_service.entity.ResumenAsistenciaMensual;

import java.util.Optional;

public interface ResumenAsistenciaMensualRepository extends JpaRepository<ResumenAsistenciaMensual, Long> {

    Optional<ResumenAsistenciaMensual> findByIdEmpleadoAndAnioAndMes(Long idEmpleado, Integer anio, Integer mes);

    void deleteByIdEmpleadoAndAnioAndMes(Long idEmpleado, Integer anio, Integer mes);
}
