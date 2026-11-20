package pe.albrugroup.recruitment_service.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pe.albrugroup.recruitment_service.entity.ActividadReclutamiento;
import pe.albrugroup.recruitment_service.entity.enums.Negocio;
import java.util.*;
public interface ActividadReclutamientoRepository extends JpaRepository<ActividadReclutamiento,Long> {
 List<ActividadReclutamiento> findByPostulacionIdOrderByIdDesc(Long id);
 Optional<ActividadReclutamiento> findByPostulacionIdAndEstado(Long id,String estado);
 List<ActividadReclutamiento> findByMeetSesionIdOrderByFechaHoraAscIdAsc(Long meetSesionId);
 Optional<ActividadReclutamiento> findByMeetSesionIdAndPostulacionId(Long meetSesionId, Long postulacionId);

 @Query("""
        select count(distinct a.postulacionId)
        from ActividadReclutamiento a, Postulacion p
        where a.postulacionId = p.id
          and a.tipo = 'ENTREVISTA'
          and a.modalidad = 'MEET'
          and a.estado = 'PENDIENTE'
          and p.negocio = :negocio
        """)
 long countPendingMeetParticipantsByNegocio(@Param("negocio") Negocio negocio);
}
