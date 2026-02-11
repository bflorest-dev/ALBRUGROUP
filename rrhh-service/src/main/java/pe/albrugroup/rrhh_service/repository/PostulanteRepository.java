package pe.albrugroup.rrhh_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.albrugroup.rrhh_service.entity.Postulante;
import pe.albrugroup.rrhh_service.entity.enums.EstadoPostulacion;
import pe.albrugroup.rrhh_service.entity.enums.PuestoTrabajo;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

@Repository
public interface PostulanteRepository extends JpaRepository<Postulante, Long> {

    @Query("""
    SELECT p FROM Postulante p
    WHERE (:estado IS NULL OR p.estadoPostulacion = :estado)
    AND (:puesto IS NULL OR p.puestoTrabajo = :puesto)
    AND (:desde IS NULL OR p.fechaInicio >= :desde)
    AND (:hasta IS NULL OR p.fechaInicio <= :hasta)
    ORDER BY p.fechaInicio DESC
    """)
    List<Postulante> getPostulantes(
            @Param("estado") EstadoPostulacion estado,
            @Param("puesto") PuestoTrabajo puesto,
            @Param("desde") LocalDate desde,
            @Param("hasta") LocalDate hasta
    );
    boolean existsByEmpleadoIdAndEstadoPostulacion(Long empleadoId, EstadoPostulacion estado);

    @Query("SELECT p FROM Postulante p JOIN FETCH p.empleado WHERE p.id IN :ids")
    List<Postulante> findAllByIdInWithEmpleado(@Param("ids") Collection<Long> ids);
}
