package pe.albrugroup.billing_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.albrugroup.billing_service.entity.AdelantoSueldo;

import java.util.List;

public interface AdelantoSueldoRepository extends JpaRepository<AdelantoSueldo, Long> {

    List<AdelantoSueldo> findByAnioAndMes(Integer anio, Integer mes);

    List<AdelantoSueldo> findByIdEmpleadoAndAnioAndMes(Long idEmpleado, Integer anio, Integer mes);
}
