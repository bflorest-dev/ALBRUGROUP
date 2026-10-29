package pe.albrugroup.recruitment_service.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import pe.albrugroup.recruitment_service.entity.ActividadReclutamiento;
import java.util.*;
public interface ActividadReclutamientoRepository extends JpaRepository<ActividadReclutamiento,Long> {
 List<ActividadReclutamiento> findByPostulacionIdOrderByIdDesc(Long id);
 Optional<ActividadReclutamiento> findByPostulacionIdAndEstado(Long id,String estado);
 List<ActividadReclutamiento> findByMeetSesionIdOrderByFechaHoraAscIdAsc(Long meetSesionId);
}
