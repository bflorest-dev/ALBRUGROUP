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

    @Query("""
            select a
            from ActividadReclutamiento a, Postulacion p
            where a.postulacionId = p.id
              and a.meetSesionId = :meetSesionId
              and a.estado not in ('REPROGRAMADA', 'CANCELADA')
              and a.id = (
                  select max(a2.id)
                  from ActividadReclutamiento a2, Postulacion p2
                  where a2.postulacionId = p2.id
                    and a2.meetSesionId = :meetSesionId
                    and a2.estado not in ('REPROGRAMADA', 'CANCELADA')
                    and p2.postulante.id = p.postulante.id
              )
            order by a.fechaHora asc, a.id asc
            """)
    List<ActividadReclutamiento> findLatestByMeetSesionIdOrderByFechaHoraAscIdAsc(Long meetSesionId);
 Optional<ActividadReclutamiento> findByMeetSesionIdAndPostulacionId(Long meetSesionId, Long postulacionId);

 @Query("""
        select count(a)
        from ActividadReclutamiento a, Postulacion p
        where a.postulacionId = p.id
          and a.meetSesionId = :meetSesionId
          and p.postulante.id = :idPostulante
        """)
 long countByMeetSesionIdAndPostulanteId(
        @Param("meetSesionId") Long meetSesionId,
        @Param("idPostulante") Long idPostulante
 );

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
