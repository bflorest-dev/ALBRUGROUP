package pe.albrugroup.lead_service.repository;

import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.entity.enums.Accion;
import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.response.LeadAgendadoGtrResponse;
import pe.albrugroup.lead_service.entity.response.LeadGtrResponse;
import pe.albrugroup.lead_service.entity.response.LeadResponse;
import pe.albrugroup.lead_service.repository.projection.AsesorCantidadProjection;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface LeadRepository extends JpaRepository<Lead, Long> {

    Optional<Lead> findByPrefijoAndLead(String prefijo, String lead);
    Optional<Lead> findByIdAndIdAsesorAsignadoAndEtapa(Long id, Long idAsesorAsignado, Etapa etapa);
    Optional<Lead> findByIdAndIdAsesorAsignadoAndEtapaIn(Long id, Long idAsesorAsignado, Collection<Etapa> etapas);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Lead> findByIdAndEtapa(Long id, Etapa etapa);

    @Query("""
            SELECT new pe.albrugroup.lead_service.entity.response.LeadGtrResponse(
                l.id,
                l.createdAt,
                l.prefijo,
                l.lead,
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
    Page<LeadGtrResponse> listarBandejaGtr(
            @Param("etapa") Etapa etapa,
            @Param("accionAsignacion") Accion accionAsignacion,
            @Param("inicioDia") Instant inicioDia,
            @Param("finDia") Instant finDia,
            Pageable pageable
    );

    @Query("""
            SELECT l
            FROM Lead l
            LEFT JOIN FETCH l.datosPreventa
            WHERE l.idAsesorAsignado = :idAsesor
              AND l.etapa = :etapa
              AND (l.codigoTipificacion IS NULL OR l.codigoTipificacion = :codigoAgendado)
              AND l.estado IN :estados
            ORDER BY l.lastEntryAt DESC
            """)
    Page<Lead> listarPendientesAsesorVentas(
            @Param("idAsesor") Long idAsesor,
            @Param("etapa") Etapa etapa,
            @Param("codigoAgendado") String codigoAgendado,
            @Param("estados") Collection<EstadoSeguimiento> estados,
            Pageable pageable
    );

    @Query("""
            SELECT l.idAsesorAsignado AS idAsesor,
                   l.nombreAsesorAsignado AS nombreAsesor,
                   COUNT(l.id) AS cantidad
            FROM Lead l
            WHERE l.idAsesorAsignado IS NOT NULL
              AND l.etapa = :etapa
              AND l.estado IN :estados
              AND (:filtrarAsesores = false OR l.idAsesorAsignado IN :asesorIds)
            GROUP BY l.idAsesorAsignado, l.nombreAsesorAsignado
            """)
    List<AsesorCantidadProjection> resumirAsignadosActualesPorAsesor(
            @Param("etapa") Etapa etapa,
            @Param("estados") Collection<EstadoSeguimiento> estados,
            @Param("filtrarAsesores") boolean filtrarAsesores,
            @Param("asesorIds") Collection<Long> asesorIds
    );

    @Query("""
            SELECT new pe.albrugroup.lead_service.entity.response.LeadAgendadoGtrResponse(
                l.id,
                l.createdAt,
                l.prefijo,
                l.lead,
                c.nombre,
                p.nombre,
                l.base,
                dp.nombreTitularServicio,
                l.codigoTipificacion,
                l.codigoSubtipificacion,
                l.nombreAsesorAsignado,
                l.estado,
                (
                    SELECT COUNT(ea.id)
                    FROM Evento ea
                    WHERE ea.idLead = l.id
                      AND ea.accion = :accionAsignacion
                ),
                e.createdAt,
                e.comentario,
                e.horaProgramada
            )
            FROM Lead l
            JOIN Evento e ON e.idLead = l.id
            LEFT JOIN l.campana c
            LEFT JOIN c.proveedor p
            LEFT JOIN l.datosPreventa dp
            WHERE l.etapa = :etapa
              AND l.codigoTipificacion = :codigoAgendado
              AND e.accion = :accionTipificacion
              AND e.tipificacion = :codigoAgendado
              AND e.createdAt = (
                  SELECT MAX(es.createdAt)
                  FROM Evento es
                  WHERE es.idLead = l.id
                    AND es.accion = :accionTipificacion
                    AND es.tipificacion = :codigoAgendado
              )
            ORDER BY e.horaProgramada ASC, e.createdAt ASC
            """)
    Page<LeadAgendadoGtrResponse> listarLeadsAgendadosGtr(
            @Param("etapa") Etapa etapa,
            @Param("codigoAgendado") String codigoAgendado,
            @Param("accionTipificacion") Accion accionTipificacion,
            @Param("accionAsignacion") Accion accionAsignacion,
            Pageable pageable
    );

    @Query("""
            SELECT new pe.albrugroup.lead_service.entity.response.LeadResponse(
                l.id,
                l.prefijo,
                l.lead,
                l.etapa,
                l.estado,
                l.idAsesorAsignado,
                l.nombreAsesorAsignado,
                l.base,
                l.idTipificacion,
                l.codigoTipificacion,
                l.idSubtipificacion,
                l.codigoSubtipificacion,
                l.nombrePlanSnapshot,
                l.nombreProveedorSnapshot,
                l.precioPlanSnapshot,
                l.nombrePromocionInternaSnapshot,
                l.precioAdicionalesSnapshot,
                l.precioFinal,
                l.diaCorteFacturacion,
                l.mesesPermanenciaSnapshot,
                l.createdAt,
                l.lastEntryAt,
                l.updatedAt
            )
            FROM Lead l
            WHERE l.etapa = :etapa
              AND l.idAsesorAsignado IS NULL
              AND l.nombreAsesorAsignado IS NULL
              AND l.idTipificacion IS NULL
              AND l.codigoTipificacion IS NULL
              AND l.idSubtipificacion IS NULL
              AND l.codigoSubtipificacion IS NULL
            ORDER BY l.lastEntryAt DESC, l.id DESC
            """)
    Page<LeadResponse> listarLeadsDisponiblesPorEtapa(
            @Param("etapa") Etapa etapa,
            Pageable pageable
    );

    @Query("""
            SELECT new pe.albrugroup.lead_service.entity.response.LeadResponse(
                l.id,
                l.prefijo,
                l.lead,
                l.etapa,
                l.estado,
                l.idAsesorAsignado,
                l.nombreAsesorAsignado,
                l.base,
                l.idTipificacion,
                l.codigoTipificacion,
                l.idSubtipificacion,
                l.codigoSubtipificacion,
                l.nombrePlanSnapshot,
                l.nombreProveedorSnapshot,
                l.precioPlanSnapshot,
                l.nombrePromocionInternaSnapshot,
                l.precioAdicionalesSnapshot,
                l.precioFinal,
                l.diaCorteFacturacion,
                l.mesesPermanenciaSnapshot,
                l.createdAt,
                l.lastEntryAt,
                l.updatedAt
            )
            FROM Lead l
            WHERE l.etapa = :etapa
              AND l.idAsesorAsignado = :idAsesor
            ORDER BY l.lastEntryAt DESC, l.id DESC
            """)
    Page<LeadResponse> listarLeadsAsignadosPorEtapaYAsesor(
            @Param("etapa") Etapa etapa,
            @Param("idAsesor") Long idAsesor,
            Pageable pageable
    );

    @Query(value = """
            SELECT l
            FROM Lead l
            LEFT JOIN FETCH l.datosPreventa
            LEFT JOIN FETCH l.direccion
            WHERE l.etapa = :etapa
              AND l.idAsesorAsignado IS NULL
              AND l.nombreAsesorAsignado IS NULL
              AND l.idTipificacion IS NULL
              AND l.codigoTipificacion IS NULL
              AND l.idSubtipificacion IS NULL
              AND l.codigoSubtipificacion IS NULL
            ORDER BY l.lastEntryAt DESC, l.id DESC
            """,
            countQuery = """
            SELECT COUNT(l)
            FROM Lead l
            WHERE l.etapa = :etapa
              AND l.idAsesorAsignado IS NULL
              AND l.nombreAsesorAsignado IS NULL
              AND l.idTipificacion IS NULL
              AND l.codigoTipificacion IS NULL
              AND l.idSubtipificacion IS NULL
              AND l.codigoSubtipificacion IS NULL
            """)
    Page<Lead> listarLeadsPostventaDisponibles(
            @Param("etapa") Etapa etapa,
            Pageable pageable
    );

    @Query(value = """
            SELECT l
            FROM Lead l
            LEFT JOIN FETCH l.datosPreventa
            LEFT JOIN FETCH l.direccion
            WHERE l.etapa = :etapa
              AND l.idAsesorAsignado = :idAsesor
            ORDER BY l.lastEntryAt DESC, l.id DESC
            """,
            countQuery = """
            SELECT COUNT(l)
            FROM Lead l
            WHERE l.etapa = :etapa
              AND l.idAsesorAsignado = :idAsesor
            """)
    Page<Lead> listarLeadsPostventaAsignados(
            @Param("etapa") Etapa etapa,
            @Param("idAsesor") Long idAsesor,
            Pageable pageable
    );

    @Query("""
            SELECT DISTINCT l
            FROM Lead l
            LEFT JOIN FETCH l.campana c
            LEFT JOIN FETCH c.proveedor
            LEFT JOIN FETCH l.datosPreventa
            LEFT JOIN FETCH l.direccion
            LEFT JOIN FETCH l.plan
            LEFT JOIN FETCH l.plan.proveedor
            LEFT JOIN FETCH l.plan.internet
            LEFT JOIN FETCH l.plan.television
            LEFT JOIN FETCH l.plan.telefono
            LEFT JOIN FETCH l.plan.zona
            LEFT JOIN FETCH l.plan.adicionales pa
            LEFT JOIN FETCH pa.adicional
            LEFT JOIN FETCH l.promocionInterna
            LEFT JOIN FETCH l.promocionInterna.proveedor
            LEFT JOIN FETCH l.promocionInterna.zona
            LEFT JOIN FETCH l.adicionales la
            LEFT JOIN FETCH la.adicional
            WHERE l.id = :idLead
              AND l.idAsesorAsignado = :idAsesor
              AND l.etapa = :etapa
            """)
    Optional<Lead> buscarDetalleAsesor(
            @Param("idLead") Long idLead,
            @Param("idAsesor") Long idAsesor,
            @Param("etapa") Etapa etapa
    );

    @Query("""
            SELECT new pe.albrugroup.lead_service.entity.response.LeadGtrResponse(
                l.id,
                l.createdAt,
                l.prefijo,
                l.lead,
                c.nombre,
                p.nombre,
                l.base,
                dp.nombreTitularServicio,
                l.codigoTipificacion,
                l.codigoSubtipificacion,
                l.nombreAsesorAsignado,
                l.estado,
                0
            )
            FROM Lead l
            LEFT JOIN l.campana c
            LEFT JOIN c.proveedor p
            LEFT JOIN l.datosPreventa dp
            WHERE (:idProveedor IS NULL OR p.id = :idProveedor)
              AND (:etapa IS NULL OR l.etapa = :etapa)
              AND (l.codigoTipificacion IS NULL OR l.codigoTipificacion NOT IN :codigosTipificacionExcluidos)
              AND (:filtrarTipificaciones = false OR l.idTipificacion IN :tipificacionIds)
              AND (:filtrarSubtipificaciones = false OR l.idSubtipificacion IN :subtipificacionIds)
              AND (:fechaDesde IS NULL OR l.lastEntryAt >= :fechaDesde)
              AND (:fechaHasta IS NULL OR l.lastEntryAt < :fechaHasta)
            ORDER BY l.lastEntryAt DESC, l.id DESC
            """)
    Page<LeadGtrResponse> listarLeadsMasivo(
            @Param("idProveedor") Long idProveedor,
            @Param("etapa") Etapa etapa,
            @Param("filtrarTipificaciones") boolean filtrarTipificaciones,
            @Param("tipificacionIds") Collection<Long> tipificacionIds,
            @Param("filtrarSubtipificaciones") boolean filtrarSubtipificaciones,
            @Param("subtipificacionIds") Collection<Long> subtipificacionIds,
            @Param("codigosTipificacionExcluidos") Collection<String> codigosTipificacionExcluidos,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta,
            Pageable pageable
    );
}
