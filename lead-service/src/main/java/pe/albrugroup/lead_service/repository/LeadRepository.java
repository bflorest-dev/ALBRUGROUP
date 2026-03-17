package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.entity.enums.Accion;
import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.response.LeadGtrResponse;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface LeadRepository extends JpaRepository<Lead, Long> {

    Optional<Lead> findByLead(String lead);
    Optional<Lead> findByIdAndIdAsesorAsignadoAndEtapa(Long id, Long idAsesorAsignado, Etapa etapa);

    @Query("""
            SELECT new pe.albrugroup.lead_service.entity.response.LeadGtrResponse(
                l.id,
                l.createdAt,
                c.nombre,
                p.nombre,
                l.base,
                dp.nombreTitularServicio,
                l.codigoTipificacion,
                l.codigoSubtipificacion,
                l.nombreAsesorAsignado,
                l.estado,
                (
                    SELECT COUNT(e.id)
                    FROM Evento e
                    WHERE e.idLead = l.id
                      AND e.accion = :accionAsignacion
                      AND e.createdAt >= :inicioDia
                      AND e.createdAt < :finDia
                )
            )
            FROM Lead l
            LEFT JOIN l.campana c
            LEFT JOIN c.proveedor p
            LEFT JOIN l.datosPreventa dp
            WHERE l.etapa = :etapa
              AND l.lastEntryAt >= :inicioDia
              AND l.lastEntryAt < :finDia
            ORDER BY l.lastEntryAt DESC
            """)
    List<LeadGtrResponse> listarBandejaGtr(
            @Param("etapa") Etapa etapa,
            @Param("accionAsignacion") Accion accionAsignacion,
            @Param("inicioDia") Instant inicioDia,
            @Param("finDia") Instant finDia
    );

    @Query("""
            SELECT l
            FROM Lead l
            LEFT JOIN FETCH l.datosPreventa
            WHERE l.idAsesorAsignado = :idAsesor
              AND l.etapa = :etapa
              AND l.codigoTipificacion IS NULL
              AND l.estado IN :estados
            ORDER BY l.lastEntryAt DESC
            """)
    List<Lead> listarPendientesAsesorVentas(
            @Param("idAsesor") Long idAsesor,
            @Param("etapa") Etapa etapa,
            @Param("estados") Collection<EstadoSeguimiento> estados
    );

    @Query("""
            SELECT l
            FROM Lead l
            LEFT JOIN FETCH l.campana c
            LEFT JOIN FETCH c.proveedor
            LEFT JOIN FETCH l.datosPreventa
            LEFT JOIN FETCH l.direccion
            WHERE l.id = :idLead
              AND l.idAsesorAsignado = :idAsesor
            """)
    Optional<Lead> buscarDetalleAsesor(
            @Param("idLead") Long idLead,
            @Param("idAsesor") Long idAsesor
    );
}
