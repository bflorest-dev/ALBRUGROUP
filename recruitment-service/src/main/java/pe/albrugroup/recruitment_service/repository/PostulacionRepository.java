package pe.albrugroup.recruitment_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import pe.albrugroup.recruitment_service.entity.Postulacion;

public interface PostulacionRepository extends JpaRepository<Postulacion, Long>, JpaSpecificationExecutor<Postulacion> {

    @Query("""
            select count(gcd) > 0
            from GrupoCapacitacionDetalle gcd
            where gcd.postulacion.id = :idPostulacion
            """)
    boolean existsDetalleCapacitacionByIdPostulacion(Long idPostulacion);
}
