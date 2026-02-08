package pe.albrugroup.rrhh_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.albrugroup.rrhh_service.entity.Postulante;
import pe.albrugroup.rrhh_service.entity.enums.EstadoPostulacion;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface PostulanteRepository extends JpaRepository<Postulante, Long> {

    List<Postulante> findByEstadoPostulacionAndFechaInicioBetween(EstadoPostulacion estado,
                                                                  LocalDate desde, LocalDate hasta);
    boolean existsByEmpleadoIdAndEstadoPostulacion(Long empleadoId, EstadoPostulacion estado);
}
