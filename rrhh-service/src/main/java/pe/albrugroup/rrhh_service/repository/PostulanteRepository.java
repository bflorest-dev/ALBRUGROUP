package pe.albrugroup.rrhh_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.albrugroup.rrhh_service.entity.Postulante;
import pe.albrugroup.rrhh_service.entity.enums.EtapaProceso;
import pe.albrugroup.rrhh_service.entity.enums.Origen;
import pe.albrugroup.rrhh_service.entity.enums.PuestoTrabajo;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

@Repository
public interface PostulanteRepository extends JpaRepository<Postulante, Long> {

    boolean existsByEmpleadoId(Long id);

    @Query("""
    SELECT p FROM Postulante p
    WHERE (:etapaProceso IS NULL OR p.etapaProceso = :etapaProceso)
      AND (:estadoProceso IS NULL OR p.estadoProceso = :estadoProceso)
      AND (:subestadoProceso IS NULL OR p.subestadoProceso = :subestadoProceso)
      AND (:origen IS NULL OR p.origen = :origen)
      AND (:puestoTrabajo IS NULL OR p.puestoTrabajo = :puestoTrabajo)
      AND (:fechaCreacionDesde IS NULL OR p.fechaCreacion >= :fechaCreacionDesde)
      AND (:fechaCreacionHasta IS NULL OR p.fechaCreacion <= :fechaCreacionHasta)
      AND (:listaNegra IS NULL OR p.empleado.listaNegra = :listaNegra)
    ORDER BY p.fechaCreacion DESC, p.id DESC
    """)
    List<Postulante> getPostulantes(
            @Param("etapaProceso") EtapaProceso etapaProceso,
            @Param("estadoProceso") String estadoProceso,
            @Param("subestadoProceso") String subestadoProceso,
            @Param("origen") Origen origen,
            @Param("puestoTrabajo") PuestoTrabajo puestoTrabajo,
            @Param("fechaCreacionDesde") Instant fechaCreacionDesde,
            @Param("fechaCreacionHasta") Instant fechaCreacionHasta,
            @Param("listaNegra") Boolean listaNegra
    );

    @Query("SELECT p FROM Postulante p JOIN FETCH p.empleado WHERE p.id IN :ids")
    List<Postulante> findAllByIdInWithEmpleado(@Param("ids") Collection<Long> ids);
}
