package pe.albrugroup.billing_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import pe.albrugroup.billing_service.entity.BonoAdicionalEmpleado;

import java.util.List;

public interface BonoAdicionalEmpleadoRepository extends JpaRepository<BonoAdicionalEmpleado, Long> {

    List<BonoAdicionalEmpleado> findByAnioAndMes(Integer anio, Integer mes);

    List<BonoAdicionalEmpleado> findByIdEmpleadoAndAnioAndMes(Long idEmpleado, Integer anio, Integer mes);
}
