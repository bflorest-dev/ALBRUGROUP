package pe.albrugroup.lead_service.repository;

import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.entity.enums.Accion;
import pe.albrugroup.lead_service.entity.enums.ComportamientoTipificacion;
import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.response.LeadAgendadoGtrResponse;
import pe.albrugroup.lead_service.entity.response.LeadGtrResponse;
import pe.albrugroup.lead_service.entity.response.LeadInstalacionCorreccionCandidatoResponse;
import pe.albrugroup.lead_service.entity.response.LeadInstaladoBackofficeResponse;
import pe.albrugroup.lead_service.entity.response.LeadResponse;
import pe.albrugroup.lead_service.repository.projection.AsesorCantidadProjection;
import pe.albrugroup.lead_service.repository.projection.AsesorPreventaCantidadProjection;
import pe.albrugroup.lead_service.repository.projection.AsesorProveedorPreventaProjection;
import pe.albrugroup.lead_service.repository.projection.LeadGtrAgrupacionProjection;
import pe.albrugroup.lead_service.repository.projection.HoraProgramadaCantidadProjection;
import pe.albrugroup.lead_service.repository.projection.TipificacionCantidadProjection;
import pe.albrugroup.lead_service.repository.projection.SubtipificacionCantidadProjection;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface LeadRepository extends JpaRepository<Lead, Long> {

    Optional<Lead> findByPrefijoAndLead(String prefijo, String lead);
    // Dedup del intake tolerante a multi-titular: con varias oportunidades por teléfono+equipo
    // (hermanas), trabaja sobre la activa (lastEntryAt más reciente). El @Filter lo acota al equipo.
    Optional<Lead> findFirstByPrefijoAndLeadOrderByLastEntryAtDescIdDesc(String prefijo, String lead);
    Optional<Lead> findFirstByUsermetaIgnoreCaseOrderByLastEntryAtDescIdDesc(String usermeta);
    Optional<Lead> findFirstByUsermetaIgnoreCaseAndIdEquipoInOrderByLastEntryAtDescIdDesc(String usermeta, Collection<Long> idEquipos);
    // Intake: el lead PREVENTA del contacto (si existe) tiene prioridad para gestionarse;
    // si no hay PREVENTA, el más reciente en otra etapa se marca para atención GTR.
    Optional<Lead> findFirstByPrefijoAndLeadAndEtapaOrderByLastEntryAtDescIdDesc(String prefijo, String lead, Etapa etapa);
    Optional<Lead> findFirstByContactoIdAndEtapaOrderByLastEntryAtDescIdDesc(Long idContacto, Etapa etapa);
    // Oportunidades del mismo contacto (acotadas al equipo por @Filter): para multi-titular.
    List<Lead> findByContactoIdOrderByLastEntryAtDescIdDesc(Long idContacto);
    Optional<Lead> findFirstByLeadOrderByLastEntryAtDescIdDesc(String lead);
    Optional<Lead> findFirstByLeadAndIdEquipoInOrderByLastEntryAtDescIdDesc(String lead, Collection<Long> idEquipos);

    @Query("""
            SELECT l
            FROM Lead l
            LEFT JOIN FETCH l.datosPreventa dp
            LEFT JOIN FETCH l.plan pl
            LEFT JOIN FETCH pl.proveedor
            WHERE l.lead = :buscar
               OR l.numeroDocumentoTitularServicioSnapshot = :buscar
               OR dp.numeroDocumentoTitularServicio = :buscar
               OR l.sec = :buscar
               OR l.sot = :buscar
            ORDER BY l.lastEntryAt DESC, l.id DESC
            """)
    List<Lead> buscarPorLeadODocumento(@Param("buscar") String buscar);

    @Query("""
            SELECT l
            FROM Lead l
            LEFT JOIN FETCH l.datosPreventa dp
            LEFT JOIN FETCH l.plan pl
            LEFT JOIN FETCH pl.proveedor
            WHERE LOWER(l.usermeta) = LOWER(:usermeta)
            ORDER BY l.lastEntryAt DESC, l.id DESC
            """)
    List<Lead> buscarPorUsermeta(@Param("usermeta") String usermeta);

    // Buscador total de la tab de correccion (ADMIN): un solo patron LIKE case-insensitive contra
    // numero de lead, usermeta, documento (preventa o snapshot), celular de registro y titular del
    // servicio. Sin filtro de equipo: el ADMIN ve todos los leads. Los joins son *-to-one, asi que la
    // paginacion se resuelve en BD. `:patron` ya viene como '%texto%' en minusculas.
    @Query("""
            SELECT l
            FROM Lead l
            LEFT JOIN FETCH l.datosPreventa dp
            LEFT JOIN FETCH l.campana c
            LEFT JOIN FETCH l.plan pl
            LEFT JOIN FETCH pl.proveedor
            LEFT JOIN FETCH l.contacto
            WHERE LOWER(l.lead) LIKE :patron
               OR LOWER(l.usermeta) LIKE :patron
               OR LOWER(COALESCE(dp.numeroDocumentoTitularServicio, l.numeroDocumentoTitularServicioSnapshot)) LIKE :patron
               OR LOWER(dp.celularRegistro) LIKE :patron
               OR LOWER(dp.nombreTitularServicio) LIKE :patron
            ORDER BY l.lastEntryAt DESC, l.id DESC
            """)
    List<Lead> buscarParaCorreccionAdmin(@Param("patron") String patron, Pageable pageable);

    // Corrección de identidad (Bitácora ADMIN): al corregir el teléfono/usermeta del contacto,
    // sincroniza los campos denormalizados en las oportunidades HERMANAS (el lead corregido se
    // actualiza aparte, ya gestionado en memoria). Devuelve cuántas hermanas se sincronizaron.
    @Modifying
    @Query("""
            UPDATE Lead l
            SET l.prefijo = :prefijo, l.lead = :lead, l.usermeta = :usermeta
            WHERE l.contacto.id = :idContacto AND l.id <> :idLeadActual
            """)
    int sincronizarIdentidadHermanas(
            @Param("idContacto") Long idContacto,
            @Param("idLeadActual") Long idLeadActual,
            @Param("prefijo") String prefijo,
            @Param("lead") String lead,
            @Param("usermeta") String usermeta
    );

    // Reubicación/intercambio: sincroniza el teléfono denormalizado (prefijo+lead) en TODOS los leads
    // de un contacto (el usermeta no cambia en un intercambio de número).
    @Modifying
    @Query("UPDATE Lead l SET l.prefijo = :prefijo, l.lead = :lead WHERE l.contacto.id = :idContacto")
    int sincronizarTelefonoContacto(
            @Param("idContacto") Long idContacto,
            @Param("prefijo") String prefijo,
            @Param("lead") String lead
    );

    long countByContactoId(Long idContacto);

    @Query("""
            SELECT l
            FROM Lead l
            LEFT JOIN FETCH l.campana c
            LEFT JOIN FETCH c.proveedor
            WHERE l.lead = :buscar
               OR LOWER(l.usermeta) = LOWER(:buscar)
            ORDER BY l.lastEntryAt DESC, l.id DESC
            """)
    List<Lead> buscarCorreccionCampanaPorLeadOUsermeta(@Param("buscar") String buscar);

    @Query("""
            SELECT l
            FROM Lead l
            LEFT JOIN FETCH l.campana c
            LEFT JOIN FETCH c.proveedor
            WHERE l.lead = :lead
            ORDER BY l.lastEntryAt DESC, l.id DESC
            """)
    List<Lead> buscarCorreccionMeritoPreventaPorLead(@Param("lead") String lead);

    @Query("""
            SELECT l
            FROM Lead l
            LEFT JOIN FETCH l.campana c
            LEFT JOIN FETCH c.proveedor
            WHERE l.id = :idLead
            """)
    Optional<Lead> buscarParaCorreccionCampana(@Param("idLead") Long idLead);

    @Query("SELECT l.id, l.lead FROM Lead l WHERE l.id IN :ids")
    List<Object[]> findLeadNumerosByIds(@Param("ids") Collection<Long> ids);
    Optional<Lead> findByIdAndIdAsesorAsignadoAndEtapa(Long id, Long idAsesorAsignado, Etapa etapa);
    // Lead asignado al asesor en cualquier etapa: para crear oportunidades y para la
    // tipificación informativa de un lead que sigue gestionándose en otra etapa.
    Optional<Lead> findByIdAndIdAsesorAsignado(Long id, Long idAsesorAsignado);
    Optional<Lead> findByIdAndIdAsesorAsignadoAndEtapaIn(Long id, Long idAsesorAsignado, Collection<Etapa> etapas);
    // Gestiones aparcadas del asesor: para topar cuántos leads puede tener EN_GESTION en paralelo.
    long countByIdAsesorAsignadoAndEstado(Long idAsesorAsignado, EstadoSeguimiento estado);
    long countByIdAsesorAsignadoAndEstadoAndEtapa(Long idAsesorAsignado, EstadoSeguimiento estado, Etapa etapa);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<Lead> findByIdAndEtapa(Long id, Etapa etapa);

    @Query("""
            SELECT new pe.albrugroup.lead_service.entity.response.LeadGtrResponse(
                l.id,
                l.idEquipo,
                l.createdAt,
                l.lastEntryAt,
                l.prefijo,
                l.lead,
                l.usermeta,
                c.nombre,
                p.nombre,
                (SELECT peFallback.nombre
                 FROM EquipoProveedor epFallback
                 JOIN epFallback.proveedor peFallback
                 WHERE epFallback.idEquipo = l.idEquipo
                   AND epFallback.fallbackLeadSinCampana = true),
                c.numeroWhatsApp,
                l.base,
                null,
                l.numeroDocumentoTitularServicioSnapshot,
                l.direccionSnapshot,
                r.primeraCodigoTipificacion,
                r.primeraCodigoSubtipificacion,
                r.mayorRangoCodigoTipificacion,
                r.mayorRangoCodigoSubtipificacion,
                r.ultimaCodigoTipificacion,
                r.ultimaCodigoSubtipificacion,
                l.nombrePlanSnapshot,
                l.nombreAsesorAsignado,
                l.estado,
                0L,
                0L,
                0L,
                false,
                false,
                false,
                l.etapa
            )
            FROM Lead l
            LEFT JOIN l.campana c
            LEFT JOIN c.proveedor p
            LEFT JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = l.etapa
            LEFT JOIN Tipificacion tPrimera ON tPrimera.codigo = r.primeraCodigoTipificacion AND tPrimera.etapa = l.etapa AND tPrimera.idEquipo = l.idEquipo
            LEFT JOIN Subtipificacion sPrimera ON sPrimera.tipificacion = tPrimera AND sPrimera.codigo = r.primeraCodigoSubtipificacion
            LEFT JOIN Tipificacion tMayor ON tMayor.codigo = r.mayorRangoCodigoTipificacion AND tMayor.etapa = l.etapa AND tMayor.idEquipo = l.idEquipo
            LEFT JOIN Subtipificacion sMayor ON sMayor.tipificacion = tMayor AND sMayor.codigo = r.mayorRangoCodigoSubtipificacion
            LEFT JOIN Tipificacion tUltima ON tUltima.codigo = r.ultimaCodigoTipificacion AND tUltima.etapa = l.etapa AND tUltima.idEquipo = l.idEquipo
            LEFT JOIN Subtipificacion sUltima ON sUltima.tipificacion = tUltima AND sUltima.codigo = r.ultimaCodigoSubtipificacion
            WHERE (l.etapa = :etapa OR l.requiereAtencionGtr = true)
              AND l.lastEntryAt >= :inicioDia
              AND l.lastEntryAt < :finDia
              AND (l.lead LIKE :leadPattern OR LOWER(l.usermeta) LIKE LOWER(:leadPattern))
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
            ORDER BY
              CASE WHEN :sortBy = 'createdAt' AND :sortDesc = false THEN l.createdAt END ASC,
              CASE WHEN :sortBy = 'createdAt' AND :sortDesc = true THEN l.createdAt END DESC,
              CASE WHEN :sortBy = 'lastEntryAt' AND :sortDesc = false THEN l.lastEntryAt END ASC,
              CASE WHEN :sortBy = 'lastEntryAt' AND :sortDesc = true THEN l.lastEntryAt END DESC,
              CASE WHEN :sortBy = 'estado' AND :sortDesc = false THEN
                CASE
                  WHEN l.estado = :estadoNuevo THEN 1
                  WHEN l.estado = :estadoEnGestion THEN 2
                  WHEN l.estado = :estadoAsignado THEN 3
                  WHEN l.estado = :estadoGestionado THEN 4
                  ELSE 99
                END
              END ASC,
              CASE WHEN :sortBy = 'estado' AND :sortDesc = true THEN
                CASE
                  WHEN l.estado = :estadoNuevo THEN 1
                  WHEN l.estado = :estadoEnGestion THEN 2
                  WHEN l.estado = :estadoAsignado THEN 3
                  WHEN l.estado = :estadoGestionado THEN 4
                  ELSE 99
                END
              END DESC,
              CASE WHEN :sortBy = 'primeraTipificacion' THEN CASE WHEN tPrimera.orden IS NULL THEN 1 ELSE 0 END ELSE 0 END ASC,
              CASE WHEN :sortBy = 'primeraTipificacion' AND :sortDesc = false THEN tPrimera.orden END ASC,
              CASE WHEN :sortBy = 'primeraTipificacion' AND :sortDesc = true THEN tPrimera.orden END DESC,
              CASE WHEN :sortBy = 'primeraTipificacion' AND :sortDesc = false THEN sPrimera.orden END ASC,
              CASE WHEN :sortBy = 'primeraTipificacion' AND :sortDesc = true THEN sPrimera.orden END DESC,
              CASE WHEN :sortBy = 'primeraTipificacion' AND :sortDesc = false THEN r.primeraCodigoTipificacion END ASC,
              CASE WHEN :sortBy = 'primeraTipificacion' AND :sortDesc = true THEN r.primeraCodigoTipificacion END DESC,
              CASE WHEN :sortBy = 'primeraTipificacion' AND :sortDesc = false THEN r.primeraCodigoSubtipificacion END ASC,
              CASE WHEN :sortBy = 'primeraTipificacion' AND :sortDesc = true THEN r.primeraCodigoSubtipificacion END DESC,
              CASE WHEN :sortBy = 'mayorTipificacion' THEN CASE WHEN tMayor.orden IS NULL THEN 1 ELSE 0 END ELSE 0 END ASC,
              CASE WHEN :sortBy = 'mayorTipificacion' AND :sortDesc = false THEN tMayor.orden END ASC,
              CASE WHEN :sortBy = 'mayorTipificacion' AND :sortDesc = true THEN tMayor.orden END DESC,
              CASE WHEN :sortBy = 'mayorTipificacion' AND :sortDesc = false THEN sMayor.orden END ASC,
              CASE WHEN :sortBy = 'mayorTipificacion' AND :sortDesc = true THEN sMayor.orden END DESC,
              CASE WHEN :sortBy = 'mayorTipificacion' AND :sortDesc = false THEN r.mayorRangoCodigoTipificacion END ASC,
              CASE WHEN :sortBy = 'mayorTipificacion' AND :sortDesc = true THEN r.mayorRangoCodigoTipificacion END DESC,
              CASE WHEN :sortBy = 'mayorTipificacion' AND :sortDesc = false THEN r.mayorRangoCodigoSubtipificacion END ASC,
              CASE WHEN :sortBy = 'mayorTipificacion' AND :sortDesc = true THEN r.mayorRangoCodigoSubtipificacion END DESC,
              CASE WHEN :sortBy = 'ultimaTipificacion' THEN CASE WHEN tUltima.orden IS NULL THEN 1 ELSE 0 END ELSE 0 END ASC,
              CASE WHEN :sortBy = 'ultimaTipificacion' AND :sortDesc = false THEN tUltima.orden END ASC,
              CASE WHEN :sortBy = 'ultimaTipificacion' AND :sortDesc = true THEN tUltima.orden END DESC,
              CASE WHEN :sortBy = 'ultimaTipificacion' AND :sortDesc = false THEN sUltima.orden END ASC,
              CASE WHEN :sortBy = 'ultimaTipificacion' AND :sortDesc = true THEN sUltima.orden END DESC,
              CASE WHEN :sortBy = 'ultimaTipificacion' AND :sortDesc = false THEN r.ultimaCodigoTipificacion END ASC,
              CASE WHEN :sortBy = 'ultimaTipificacion' AND :sortDesc = true THEN r.ultimaCodigoTipificacion END DESC,
              CASE WHEN :sortBy = 'ultimaTipificacion' AND :sortDesc = false THEN r.ultimaCodigoSubtipificacion END ASC,
              CASE WHEN :sortBy = 'ultimaTipificacion' AND :sortDesc = true THEN r.ultimaCodigoSubtipificacion END DESC,
              CASE WHEN :sortBy = 'totalAsignacionesPreventa' AND :sortDesc = false THEN COALESCE(r.totalAsignaciones, 0) END ASC,
              CASE WHEN :sortBy = 'totalAsignacionesPreventa' AND :sortDesc = true THEN COALESCE(r.totalAsignaciones, 0) END DESC,
              CASE WHEN :sortBy = 'totalAsignacionesHoyPreventa' AND :sortDesc = false THEN (
                    SELECT COUNT(asignacion.id)
                    FROM Evento asignacion
                    WHERE asignacion.idLead = l.id
                      AND asignacion.accion = pe.albrugroup.lead_service.entity.enums.Accion.ASIGNACION
                      AND asignacion.etapa = :etapa
                      AND asignacion.createdAt >= :inicioDia
                      AND asignacion.createdAt < :finDia
              ) END ASC,
              CASE WHEN :sortBy = 'totalAsignacionesHoyPreventa' AND :sortDesc = true THEN (
                    SELECT COUNT(asignacion.id)
                    FROM Evento asignacion
                    WHERE asignacion.idLead = l.id
                      AND asignacion.accion = pe.albrugroup.lead_service.entity.enums.Accion.ASIGNACION
                      AND asignacion.etapa = :etapa
                      AND asignacion.createdAt >= :inicioDia
                      AND asignacion.createdAt < :finDia
              ) END DESC,
              l.lastEntryAt DESC,
              l.id DESC
            """)
    Page<LeadGtrResponse> listarBandejaGtr(
            @Param("etapa") Etapa etapa,
            @Param("leadPattern") String leadPattern,
            @Param("inicioDia") Instant inicioDia,
            @Param("finDia") Instant finDia,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds,
            @Param("sortBy") String sortBy,
            @Param("sortDesc") boolean sortDesc,
            @Param("estadoNuevo") EstadoSeguimiento estadoNuevo,
            @Param("estadoEnGestion") EstadoSeguimiento estadoEnGestion,
            @Param("estadoAsignado") EstadoSeguimiento estadoAsignado,
            @Param("estadoGestionado") EstadoSeguimiento estadoGestionado,
            Pageable pageable
    );

    @Query("""
            SELECT new pe.albrugroup.lead_service.entity.response.LeadGtrResponse(
                l.id,
                l.idEquipo,
                l.createdAt,
                l.lastEntryAt,
                l.prefijo,
                l.lead,
                l.usermeta,
                c.nombre,
                p.nombre,
                (SELECT peFallback.nombre
                 FROM EquipoProveedor epFallback
                 JOIN epFallback.proveedor peFallback
                 WHERE epFallback.idEquipo = l.idEquipo
                   AND epFallback.fallbackLeadSinCampana = true),
                c.numeroWhatsApp,
                l.base,
                null,
                l.numeroDocumentoTitularServicioSnapshot,
                l.direccionSnapshot,
                r.primeraCodigoTipificacion,
                r.primeraCodigoSubtipificacion,
                r.mayorRangoCodigoTipificacion,
                r.mayorRangoCodigoSubtipificacion,
                r.ultimaCodigoTipificacion,
                r.ultimaCodigoSubtipificacion,
                l.nombrePlanSnapshot,
                l.nombreAsesorAsignado,
                l.estado,
                0L,
                0L,
                0L,
                false,
                false,
                false,
                l.etapa
            )
            FROM Lead l
            LEFT JOIN l.campana c
            LEFT JOIN c.proveedor p
            LEFT JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = l.etapa
            LEFT JOIN Tipificacion tPrimera ON tPrimera.codigo = r.primeraCodigoTipificacion AND tPrimera.etapa = l.etapa AND tPrimera.idEquipo = l.idEquipo
            LEFT JOIN Subtipificacion sPrimera ON sPrimera.tipificacion = tPrimera AND sPrimera.codigo = r.primeraCodigoSubtipificacion
            LEFT JOIN Tipificacion tMayor ON tMayor.codigo = r.mayorRangoCodigoTipificacion AND tMayor.etapa = l.etapa AND tMayor.idEquipo = l.idEquipo
            LEFT JOIN Subtipificacion sMayor ON sMayor.tipificacion = tMayor AND sMayor.codigo = r.mayorRangoCodigoSubtipificacion
            LEFT JOIN Tipificacion tUltima ON tUltima.codigo = r.ultimaCodigoTipificacion AND tUltima.etapa = l.etapa AND tUltima.idEquipo = l.idEquipo
            LEFT JOIN Subtipificacion sUltima ON sUltima.tipificacion = tUltima AND sUltima.codigo = r.ultimaCodigoSubtipificacion
            WHERE l.etapa = :etapa
              AND l.lastEntryAt >= :inicioDia
              AND l.lastEntryAt < :finDia
              AND (l.lead LIKE :leadPattern OR LOWER(l.usermeta) LIKE LOWER(:leadPattern))
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
              AND (
                    :filtrarAsesor = false
                    OR (:sinValor = true AND l.idAsesorAsignado IS NULL)
                    OR (:sinValor = false AND l.idAsesorAsignado = :idGrupo)
              )
              AND (
                    :filtrarEstado = false
                    OR (:sinValor = true AND l.estado IS NULL)
                    OR (:sinValor = false AND l.estado = :estadoGrupo)
              )
              AND (
                    :filtrarCampana = false
                    OR (:sinValor = true AND c.id IS NULL)
                    OR (:sinValor = false AND c.id = :idGrupo)
              )
              AND (
                    :filtrarPrimeraTipificacion = false
                    OR (
                        :sinValor = true
                        AND r.primeraCodigoTipificacion IS NULL
                        AND r.primeraCodigoSubtipificacion IS NULL
                    )
                    OR (
                        :sinValor = false
                        AND r.primeraCodigoTipificacion = :codigoTipificacion
                        AND (
                            :codigoSubtipificacion IS NULL
                            OR r.primeraCodigoSubtipificacion = :codigoSubtipificacion
                        )
                    )
              )
              AND (
                    :filtrarUltimaTipificacion = false
                    OR (
                        :sinValor = true
                        AND r.ultimaCodigoTipificacion IS NULL
                        AND r.ultimaCodigoSubtipificacion IS NULL
                    )
                    OR (
                        :sinValor = false
                        AND r.ultimaCodigoTipificacion = :codigoTipificacion
                        AND (
                            :codigoSubtipificacion IS NULL
                            OR r.ultimaCodigoSubtipificacion = :codigoSubtipificacion
                        )
                    )
              )
              AND (
                    :filtrarMayorTipificacion = false
                    OR (
                        :sinValor = true
                        AND r.mayorRangoCodigoTipificacion IS NULL
                        AND r.mayorRangoCodigoSubtipificacion IS NULL
                    )
                    OR (
                        :sinValor = false
                        AND r.mayorRangoCodigoTipificacion = :codigoTipificacion
                        AND (
                            :codigoSubtipificacion IS NULL
                            OR r.mayorRangoCodigoSubtipificacion = :codigoSubtipificacion
                        )
                    )
              )
            ORDER BY
              CASE WHEN :sortBy = 'createdAt' AND :sortDesc = false THEN l.createdAt END ASC,
              CASE WHEN :sortBy = 'createdAt' AND :sortDesc = true THEN l.createdAt END DESC,
              CASE WHEN :sortBy = 'lastEntryAt' AND :sortDesc = false THEN l.lastEntryAt END ASC,
              CASE WHEN :sortBy = 'lastEntryAt' AND :sortDesc = true THEN l.lastEntryAt END DESC,
              CASE WHEN :sortBy = 'estado' AND :sortDesc = false THEN
                CASE
                  WHEN l.estado = :estadoNuevo THEN 1
                  WHEN l.estado = :estadoEnGestion THEN 2
                  WHEN l.estado = :estadoAsignado THEN 3
                  WHEN l.estado = :estadoGestionado THEN 4
                  ELSE 99
                END
              END ASC,
              CASE WHEN :sortBy = 'estado' AND :sortDesc = true THEN
                CASE
                  WHEN l.estado = :estadoNuevo THEN 1
                  WHEN l.estado = :estadoEnGestion THEN 2
                  WHEN l.estado = :estadoAsignado THEN 3
                  WHEN l.estado = :estadoGestionado THEN 4
                  ELSE 99
                END
              END DESC,
              CASE WHEN :sortBy = 'primeraTipificacion' THEN CASE WHEN tPrimera.orden IS NULL THEN 1 ELSE 0 END ELSE 0 END ASC,
              CASE WHEN :sortBy = 'primeraTipificacion' AND :sortDesc = false THEN tPrimera.orden END ASC,
              CASE WHEN :sortBy = 'primeraTipificacion' AND :sortDesc = true THEN tPrimera.orden END DESC,
              CASE WHEN :sortBy = 'primeraTipificacion' AND :sortDesc = false THEN sPrimera.orden END ASC,
              CASE WHEN :sortBy = 'primeraTipificacion' AND :sortDesc = true THEN sPrimera.orden END DESC,
              CASE WHEN :sortBy = 'primeraTipificacion' AND :sortDesc = false THEN r.primeraCodigoTipificacion END ASC,
              CASE WHEN :sortBy = 'primeraTipificacion' AND :sortDesc = true THEN r.primeraCodigoTipificacion END DESC,
              CASE WHEN :sortBy = 'primeraTipificacion' AND :sortDesc = false THEN r.primeraCodigoSubtipificacion END ASC,
              CASE WHEN :sortBy = 'primeraTipificacion' AND :sortDesc = true THEN r.primeraCodigoSubtipificacion END DESC,
              CASE WHEN :sortBy = 'mayorTipificacion' THEN CASE WHEN tMayor.orden IS NULL THEN 1 ELSE 0 END ELSE 0 END ASC,
              CASE WHEN :sortBy = 'mayorTipificacion' AND :sortDesc = false THEN tMayor.orden END ASC,
              CASE WHEN :sortBy = 'mayorTipificacion' AND :sortDesc = true THEN tMayor.orden END DESC,
              CASE WHEN :sortBy = 'mayorTipificacion' AND :sortDesc = false THEN sMayor.orden END ASC,
              CASE WHEN :sortBy = 'mayorTipificacion' AND :sortDesc = true THEN sMayor.orden END DESC,
              CASE WHEN :sortBy = 'mayorTipificacion' AND :sortDesc = false THEN r.mayorRangoCodigoTipificacion END ASC,
              CASE WHEN :sortBy = 'mayorTipificacion' AND :sortDesc = true THEN r.mayorRangoCodigoTipificacion END DESC,
              CASE WHEN :sortBy = 'mayorTipificacion' AND :sortDesc = false THEN r.mayorRangoCodigoSubtipificacion END ASC,
              CASE WHEN :sortBy = 'mayorTipificacion' AND :sortDesc = true THEN r.mayorRangoCodigoSubtipificacion END DESC,
              CASE WHEN :sortBy = 'ultimaTipificacion' THEN CASE WHEN tUltima.orden IS NULL THEN 1 ELSE 0 END ELSE 0 END ASC,
              CASE WHEN :sortBy = 'ultimaTipificacion' AND :sortDesc = false THEN tUltima.orden END ASC,
              CASE WHEN :sortBy = 'ultimaTipificacion' AND :sortDesc = true THEN tUltima.orden END DESC,
              CASE WHEN :sortBy = 'ultimaTipificacion' AND :sortDesc = false THEN sUltima.orden END ASC,
              CASE WHEN :sortBy = 'ultimaTipificacion' AND :sortDesc = true THEN sUltima.orden END DESC,
              CASE WHEN :sortBy = 'ultimaTipificacion' AND :sortDesc = false THEN r.ultimaCodigoTipificacion END ASC,
              CASE WHEN :sortBy = 'ultimaTipificacion' AND :sortDesc = true THEN r.ultimaCodigoTipificacion END DESC,
              CASE WHEN :sortBy = 'ultimaTipificacion' AND :sortDesc = false THEN r.ultimaCodigoSubtipificacion END ASC,
              CASE WHEN :sortBy = 'ultimaTipificacion' AND :sortDesc = true THEN r.ultimaCodigoSubtipificacion END DESC,
              CASE WHEN :sortBy = 'totalAsignacionesPreventa' AND :sortDesc = false THEN COALESCE(r.totalAsignaciones, 0) END ASC,
              CASE WHEN :sortBy = 'totalAsignacionesPreventa' AND :sortDesc = true THEN COALESCE(r.totalAsignaciones, 0) END DESC,
              CASE WHEN :sortBy = 'totalAsignacionesHoyPreventa' AND :sortDesc = false THEN (
                    SELECT COUNT(asignacion.id)
                    FROM Evento asignacion
                    WHERE asignacion.idLead = l.id
                      AND asignacion.accion = pe.albrugroup.lead_service.entity.enums.Accion.ASIGNACION
                      AND asignacion.etapa = :etapa
                      AND asignacion.createdAt >= :inicioDia
                      AND asignacion.createdAt < :finDia
              ) END ASC,
              CASE WHEN :sortBy = 'totalAsignacionesHoyPreventa' AND :sortDesc = true THEN (
                    SELECT COUNT(asignacion.id)
                    FROM Evento asignacion
                    WHERE asignacion.idLead = l.id
                      AND asignacion.accion = pe.albrugroup.lead_service.entity.enums.Accion.ASIGNACION
                      AND asignacion.etapa = :etapa
                      AND asignacion.createdAt >= :inicioDia
                      AND asignacion.createdAt < :finDia
              ) END DESC,
              l.lastEntryAt DESC,
              l.id DESC
            """)
    Page<LeadGtrResponse> listarBandejaGtrFiltrada(
            @Param("etapa") Etapa etapa,
            @Param("leadPattern") String leadPattern,
            @Param("inicioDia") Instant inicioDia,
            @Param("finDia") Instant finDia,
            @Param("filtrarAsesor") boolean filtrarAsesor,
            @Param("filtrarEstado") boolean filtrarEstado,
            @Param("filtrarCampana") boolean filtrarCampana,
            @Param("filtrarPrimeraTipificacion") boolean filtrarPrimeraTipificacion,
            @Param("filtrarUltimaTipificacion") boolean filtrarUltimaTipificacion,
            @Param("filtrarMayorTipificacion") boolean filtrarMayorTipificacion,
            @Param("idGrupo") Long idGrupo,
            @Param("estadoGrupo") EstadoSeguimiento estadoGrupo,
            @Param("codigoTipificacion") String codigoTipificacion,
            @Param("codigoSubtipificacion") String codigoSubtipificacion,
            @Param("sinValor") boolean sinValor,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds,
            @Param("sortBy") String sortBy,
            @Param("sortDesc") boolean sortDesc,
            @Param("estadoNuevo") EstadoSeguimiento estadoNuevo,
            @Param("estadoEnGestion") EstadoSeguimiento estadoEnGestion,
            @Param("estadoAsignado") EstadoSeguimiento estadoAsignado,
            @Param("estadoGestionado") EstadoSeguimiento estadoGestionado,
            Pageable pageable
    );

    @Query("""
            SELECT l.idAsesorAsignado AS idGrupo,
                   l.nombreAsesorAsignado AS etiqueta,
                   NULL AS codigoTipificacion,
                   NULL AS codigoSubtipificacion,
                   COUNT(l.id) AS cantidad
            FROM Lead l
            WHERE l.etapa = :etapa
              AND l.lastEntryAt >= :inicioDia
              AND l.lastEntryAt < :finDia
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
            GROUP BY l.idAsesorAsignado, l.nombreAsesorAsignado
            """)
    List<LeadGtrAgrupacionProjection> agruparBandejaGtrPorAsesor(
            @Param("etapa") Etapa etapa,
            @Param("inicioDia") Instant inicioDia,
            @Param("finDia") Instant finDia,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds
    );

    @Query("""
            SELECT c.id AS idGrupo,
                   c.nombre AS etiqueta,
                   NULL AS codigoTipificacion,
                   NULL AS codigoSubtipificacion,
                   COUNT(l.id) AS cantidad
            FROM Lead l
            LEFT JOIN l.campana c
            WHERE l.etapa = :etapa
              AND l.lastEntryAt >= :inicioDia
              AND l.lastEntryAt < :finDia
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
            GROUP BY c.id, c.nombre
            """)
    List<LeadGtrAgrupacionProjection> agruparBandejaGtrPorCampana(
            @Param("etapa") Etapa etapa,
            @Param("inicioDia") Instant inicioDia,
            @Param("finDia") Instant finDia,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds
    );

    @Query("""
            SELECT NULL AS idGrupo,
                   CONCAT('', l.estado) AS etiqueta,
                   NULL AS codigoTipificacion,
                   NULL AS codigoSubtipificacion,
                   COUNT(l.id) AS cantidad
            FROM Lead l
            WHERE l.etapa = :etapa
              AND l.lastEntryAt >= :inicioDia
              AND l.lastEntryAt < :finDia
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
            GROUP BY l.estado
            """)
    List<LeadGtrAgrupacionProjection> agruparBandejaGtrPorEstado(
            @Param("etapa") Etapa etapa,
            @Param("inicioDia") Instant inicioDia,
            @Param("finDia") Instant finDia,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds
    );

    @Query("""
            SELECT NULL AS idGrupo,
                   NULL AS etiqueta,
                   r.primeraCodigoTipificacion AS codigoTipificacion,
                   r.primeraCodigoSubtipificacion AS codigoSubtipificacion,
                   COUNT(l.id) AS cantidad
            FROM Lead l
            LEFT JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = l.etapa
            WHERE l.etapa = :etapa
              AND l.lastEntryAt >= :inicioDia
              AND l.lastEntryAt < :finDia
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
            GROUP BY r.primeraCodigoTipificacion, r.primeraCodigoSubtipificacion
            """)
    List<LeadGtrAgrupacionProjection> agruparBandejaGtrPorPrimeraTipificacion(
            @Param("etapa") Etapa etapa,
            @Param("inicioDia") Instant inicioDia,
            @Param("finDia") Instant finDia,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds
    );

    @Query("""
            SELECT NULL AS idGrupo,
                   NULL AS etiqueta,
                   r.mayorRangoCodigoTipificacion AS codigoTipificacion,
                   r.mayorRangoCodigoSubtipificacion AS codigoSubtipificacion,
                   COUNT(l.id) AS cantidad
            FROM Lead l
            LEFT JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = l.etapa
            WHERE l.etapa = :etapa
              AND l.lastEntryAt >= :inicioDia
              AND l.lastEntryAt < :finDia
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
            GROUP BY r.mayorRangoCodigoTipificacion, r.mayorRangoCodigoSubtipificacion
            """)
    List<LeadGtrAgrupacionProjection> agruparBandejaGtrPorMayorTipificacion(
            @Param("etapa") Etapa etapa,
            @Param("inicioDia") Instant inicioDia,
            @Param("finDia") Instant finDia,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds
    );

    @Query("""
            SELECT NULL AS idGrupo,
                   NULL AS etiqueta,
                   r.primeraCodigoTipificacion AS codigoTipificacion,
                   r.primeraCodigoSubtipificacion AS codigoSubtipificacion,
                   COUNT(l.id) AS cantidad
            FROM Lead l
            LEFT JOIN l.campana c
            LEFT JOIN c.proveedor p
            LEFT JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = :etapaResumen
            WHERE (:filtrarProveedor = false OR p.id = :idProveedor)
              AND (:filtrarEtapa = false OR l.etapa = :etapa)
              AND (r.ultimaCodigoTipificacion IS NULL OR r.ultimaCodigoTipificacion NOT IN :codigosTipificacionExcluidos)
              AND (:filtrarTipificaciones = false OR r.primeraCodigoTipificacion IN :codigosTipificacion)
              AND (:filtrarSubtipificaciones = false OR r.primeraCodigoSubtipificacion IN :codigosSubtipificacion)
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
              AND (:filtrarFechaDesde = false OR l.lastEntryAt >= :fechaDesde)
              AND (:filtrarFechaHasta = false OR l.lastEntryAt < :fechaHasta)
            GROUP BY r.primeraCodigoTipificacion, r.primeraCodigoSubtipificacion
            """)
    List<LeadGtrAgrupacionProjection> agruparLeadsMasivoPorPrimeraTipificacion(
            @Param("filtrarProveedor") boolean filtrarProveedor,
            @Param("idProveedor") Long idProveedor,
            @Param("filtrarEtapa") boolean filtrarEtapa,
            @Param("etapa") Etapa etapa,
            @Param("filtrarTipificaciones") boolean filtrarTipificaciones,
            @Param("codigosTipificacion") Collection<String> codigosTipificacion,
            @Param("filtrarSubtipificaciones") boolean filtrarSubtipificaciones,
            @Param("codigosSubtipificacion") Collection<String> codigosSubtipificacion,
            @Param("codigosTipificacionExcluidos") Collection<String> codigosTipificacionExcluidos,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds,
            @Param("filtrarFechaDesde") boolean filtrarFechaDesde,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("filtrarFechaHasta") boolean filtrarFechaHasta,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("etapaResumen") Etapa etapaResumen
    );

    @Query("""
            SELECT NULL AS idGrupo,
                   NULL AS etiqueta,
                   r.mayorRangoCodigoTipificacion AS codigoTipificacion,
                   r.mayorRangoCodigoSubtipificacion AS codigoSubtipificacion,
                   COUNT(l.id) AS cantidad
            FROM Lead l
            LEFT JOIN l.campana c
            LEFT JOIN c.proveedor p
            LEFT JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = :etapaResumen
            WHERE (:filtrarProveedor = false OR p.id = :idProveedor)
              AND (:filtrarEtapa = false OR l.etapa = :etapa)
              AND (r.ultimaCodigoTipificacion IS NULL OR r.ultimaCodigoTipificacion NOT IN :codigosTipificacionExcluidos)
              AND (:filtrarTipificaciones = false OR r.mayorRangoCodigoTipificacion IN :codigosTipificacion)
              AND (:filtrarSubtipificaciones = false OR r.mayorRangoCodigoSubtipificacion IN :codigosSubtipificacion)
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
              AND (:filtrarFechaDesde = false OR l.lastEntryAt >= :fechaDesde)
              AND (:filtrarFechaHasta = false OR l.lastEntryAt < :fechaHasta)
            GROUP BY r.mayorRangoCodigoTipificacion, r.mayorRangoCodigoSubtipificacion
            """)
    List<LeadGtrAgrupacionProjection> agruparLeadsMasivoPorMayorTipificacion(
            @Param("filtrarProveedor") boolean filtrarProveedor,
            @Param("idProveedor") Long idProveedor,
            @Param("filtrarEtapa") boolean filtrarEtapa,
            @Param("etapa") Etapa etapa,
            @Param("filtrarTipificaciones") boolean filtrarTipificaciones,
            @Param("codigosTipificacion") Collection<String> codigosTipificacion,
            @Param("filtrarSubtipificaciones") boolean filtrarSubtipificaciones,
            @Param("codigosSubtipificacion") Collection<String> codigosSubtipificacion,
            @Param("codigosTipificacionExcluidos") Collection<String> codigosTipificacionExcluidos,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds,
            @Param("filtrarFechaDesde") boolean filtrarFechaDesde,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("filtrarFechaHasta") boolean filtrarFechaHasta,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("etapaResumen") Etapa etapaResumen
    );

    @Query("""
            SELECT NULL AS idGrupo,
                   NULL AS etiqueta,
                   r.ultimaCodigoTipificacion AS codigoTipificacion,
                   r.ultimaCodigoSubtipificacion AS codigoSubtipificacion,
                   COUNT(l.id) AS cantidad
            FROM Lead l
            LEFT JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = l.etapa
            WHERE l.etapa = :etapa
              AND l.lastEntryAt >= :inicioDia
              AND l.lastEntryAt < :finDia
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
            GROUP BY r.ultimaCodigoTipificacion, r.ultimaCodigoSubtipificacion
            """)
    List<LeadGtrAgrupacionProjection> agruparBandejaGtrPorUltimaTipificacion(
            @Param("etapa") Etapa etapa,
            @Param("inicioDia") Instant inicioDia,
            @Param("finDia") Instant finDia,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds
    );

    @Query("""
            SELECT l
            FROM Lead l
            WHERE l.idAsesorAsignado IS NOT NULL
              AND l.etapa = :etapa
              AND l.estado IN :estados
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
            ORDER BY l.idAsesorAsignado ASC, l.lastEntryAt DESC
            """)
    List<Lead> listarPendientesGtrPorAsesor(
            @Param("etapa") Etapa etapa,
            @Param("estados") Collection<EstadoSeguimiento> estados,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds
    );

    long countByEtapaAndEstadoAndLastEntryAtGreaterThanEqualAndLastEntryAtLessThan(
            Etapa etapa,
            EstadoSeguimiento estado,
            Instant inicioDia,
            Instant finDia
    );

    @Query("""
            SELECT COUNT(l)
            FROM Lead l
            WHERE l.etapa = :etapa
              AND l.estado = :estado
              AND l.lastEntryAt >= :inicioDia
              AND l.lastEntryAt < :finDia
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
            """)
    long contarMetricasGtrPorEstado(
            @Param("etapa") Etapa etapa,
            @Param("estado") EstadoSeguimiento estado,
            @Param("inicioDia") Instant inicioDia,
            @Param("finDia") Instant finDia,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds
    );

    @Query("""
            SELECT COUNT(DISTINCT l.id)
            FROM Lead l
            WHERE l.campana.id = :idCampana
              AND l.lastEntryAt >= :fechaDesde
              AND l.lastEntryAt <= :fechaHasta
            """)
    long contarLeadsRealesPorCampanaYRango(
            @Param("idCampana") Long idCampana,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta
    );

    @Query("""
            SELECT l
            FROM Lead l
            LEFT JOIN FETCH l.datosPreventa
            LEFT JOIN FETCH l.direccion
            WHERE l.idAsesorAsignado = :idAsesor
              AND l.estado IN :estados
              AND (
                    (l.etapa = :etapa
                        AND (
                            l.codigoTipificacion IS NULL
                            OR EXISTS (
                                SELECT 1
                                FROM Subtipificacion sa
                                JOIN sa.tipificacion ta
                                WHERE ta.idEquipo = l.idEquipo
                                  AND ta.etapa = l.etapa
                                  AND ta.codigo = l.codigoTipificacion
                                  AND sa.codigo = l.codigoSubtipificacion
                                  AND :comportamiento MEMBER OF sa.comportamientos
                            )
                        ))
                    OR l.requiereAtencionGtr = true
              )
            ORDER BY l.lastEntryAt DESC
            """)
    Page<Lead> listarPendientesAsesorVentas(
            @Param("idAsesor") Long idAsesor,
            @Param("etapa") Etapa etapa,
            @Param("comportamiento") ComportamientoTipificacion comportamiento,
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
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
            GROUP BY l.idAsesorAsignado, l.nombreAsesorAsignado
            """)
    List<AsesorCantidadProjection> resumirAsignadosActualesPorAsesor(
            @Param("etapa") Etapa etapa,
            @Param("estados") Collection<EstadoSeguimiento> estados,
            @Param("filtrarAsesores") boolean filtrarAsesores,
            @Param("asesorIds") Collection<Long> asesorIds,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds
    );

    @Query("""
            SELECT new pe.albrugroup.lead_service.entity.response.LeadAgendadoGtrResponse(
                l.id,
                l.idEquipo,
                l.createdAt,
                l.prefijo,
                l.lead,
                l.usermeta,
                c.nombre,
                p.nombre,
                (SELECT peFallback.nombre
                 FROM EquipoProveedor epFallback
                 JOIN epFallback.proveedor peFallback
                 WHERE epFallback.idEquipo = l.idEquipo
                   AND epFallback.fallbackLeadSinCampana = true),
                l.base,
                dp.nombreTitularServicio,
                r.mayorRangoCodigoTipificacion,
                r.mayorRangoCodigoSubtipificacion,
                l.nombreAsesorAsignado,
                e.nombreActor,
                l.estado,
                0L,
                0L,
                0L,
                e.createdAt,
                e.comentario,
                e.horaProgramada,
                e.fechaProgramacion
            )
            FROM Lead l
            JOIN Evento e ON e.idLead = l.id
            JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = l.etapa
            LEFT JOIN l.campana c
            LEFT JOIN c.proveedor p
            LEFT JOIN l.datosPreventa dp
            LEFT JOIN Tipificacion tAgenda ON tAgenda.codigo = r.mayorRangoCodigoTipificacion
                AND tAgenda.etapa = l.etapa
                AND tAgenda.idEquipo = l.idEquipo
            LEFT JOIN Subtipificacion sAgenda ON sAgenda.tipificacion = tAgenda
                AND sAgenda.codigo = r.mayorRangoCodigoSubtipificacion
            WHERE l.etapa = :etapa
              AND EXISTS (
                  SELECT 1
                  FROM Subtipificacion sa
                  JOIN sa.tipificacion ta
                  WHERE ta.idEquipo = l.idEquipo
                    AND ta.etapa = l.etapa
                    AND ta.codigo = r.mayorRangoCodigoTipificacion
                    AND sa.codigo = r.mayorRangoCodigoSubtipificacion
                    AND :comportamiento MEMBER OF sa.comportamientos
              )
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
              AND e.accion = :accionTipificacion
              AND e.tipificacion = r.mayorRangoCodigoTipificacion
              AND e.subtipificacion = r.mayorRangoCodigoSubtipificacion
              AND e.horaProgramada IS NOT NULL
              AND e.createdAt = (
                  SELECT MAX(es.createdAt)
                  FROM Evento es
                  WHERE es.idLead = l.id
                    AND es.accion = :accionTipificacion
                    AND es.tipificacion = r.mayorRangoCodigoTipificacion
                    AND es.subtipificacion = r.mayorRangoCodigoSubtipificacion
                    AND es.horaProgramada IS NOT NULL
              )
            ORDER BY
              CASE WHEN :sortBy = 'programado' AND :sortDesc = false THEN e.fechaProgramacion END ASC,
              CASE WHEN :sortBy = 'programado' AND :sortDesc = true THEN e.fechaProgramacion END DESC,
              CASE WHEN :sortBy = 'programado' AND :sortDesc = false THEN e.horaProgramada END ASC,
              CASE WHEN :sortBy = 'programado' AND :sortDesc = true THEN e.horaProgramada END DESC,
              CASE WHEN :sortBy = 'programado' AND :sortDesc = false THEN e.createdAt END ASC,
              CASE WHEN :sortBy = 'programado' AND :sortDesc = true THEN e.createdAt END DESC,

              CASE WHEN :sortBy = 'agendado' AND :sortDesc = false THEN e.createdAt END ASC,
              CASE WHEN :sortBy = 'agendado' AND :sortDesc = true THEN e.createdAt END DESC,

              CASE WHEN :sortBy = 'estado' AND :sortDesc = false THEN
                CASE
                  WHEN l.estado = :estadoNuevo THEN 1
                  WHEN l.estado = :estadoEnGestion THEN 2
                  WHEN l.estado = :estadoAsignado THEN 3
                  WHEN l.estado = :estadoGestionado THEN 4
                  ELSE 99
                END
              END ASC,
              CASE WHEN :sortBy = 'estado' AND :sortDesc = true THEN
                CASE
                  WHEN l.estado = :estadoNuevo THEN 1
                  WHEN l.estado = :estadoEnGestion THEN 2
                  WHEN l.estado = :estadoAsignado THEN 3
                  WHEN l.estado = :estadoGestionado THEN 4
                  ELSE 99
                END
              END DESC,

              CASE WHEN :sortBy = 'tipificacion' AND tAgenda.orden IS NULL THEN 1 ELSE 0 END ASC,
              CASE WHEN :sortBy = 'tipificacion' AND :sortDesc = false THEN tAgenda.orden END ASC,
              CASE WHEN :sortBy = 'tipificacion' AND :sortDesc = true THEN tAgenda.orden END DESC,
              CASE WHEN :sortBy = 'tipificacion' AND :sortDesc = false THEN sAgenda.orden END ASC,
              CASE WHEN :sortBy = 'tipificacion' AND :sortDesc = true THEN sAgenda.orden END DESC,
              CASE WHEN :sortBy = 'tipificacion' AND :sortDesc = false THEN r.mayorRangoCodigoTipificacion END ASC,
              CASE WHEN :sortBy = 'tipificacion' AND :sortDesc = true THEN r.mayorRangoCodigoTipificacion END DESC,
              CASE WHEN :sortBy = 'tipificacion' AND :sortDesc = false THEN r.mayorRangoCodigoSubtipificacion END ASC,
              CASE WHEN :sortBy = 'tipificacion' AND :sortDesc = true THEN r.mayorRangoCodigoSubtipificacion END DESC,

              e.fechaProgramacion DESC,
              e.horaProgramada DESC,
              e.createdAt DESC,
              l.id DESC
            """)
    Page<LeadAgendadoGtrResponse> listarLeadsAgendadosGtrOrdenados(
            @Param("etapa") Etapa etapa,
            @Param("comportamiento") ComportamientoTipificacion comportamiento,
            @Param("accionTipificacion") Accion accionTipificacion,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds,
            @Param("sortBy") String sortBy,
            @Param("sortDesc") boolean sortDesc,
            @Param("estadoNuevo") EstadoSeguimiento estadoNuevo,
            @Param("estadoEnGestion") EstadoSeguimiento estadoEnGestion,
            @Param("estadoAsignado") EstadoSeguimiento estadoAsignado,
            @Param("estadoGestionado") EstadoSeguimiento estadoGestionado,
            Pageable pageable
    );

    @Query("""
            SELECT new pe.albrugroup.lead_service.entity.response.LeadAgendadoGtrResponse(
                l.id,
                l.idEquipo,
                l.createdAt,
                l.prefijo,
                l.lead,
                l.usermeta,
                c.nombre,
                p.nombre,
                (SELECT peFallback.nombre
                 FROM EquipoProveedor epFallback
                 JOIN epFallback.proveedor peFallback
                 WHERE epFallback.idEquipo = l.idEquipo
                   AND epFallback.fallbackLeadSinCampana = true),
                l.base,
                dp.nombreTitularServicio,
                r.mayorRangoCodigoTipificacion,
                r.mayorRangoCodigoSubtipificacion,
                l.nombreAsesorAsignado,
                e.nombreActor,
                l.estado,
                0L,
                0L,
                0L,
                e.createdAt,
                e.comentario,
                e.horaProgramada,
                e.fechaProgramacion
            )
            FROM Lead l
            JOIN Evento e ON e.idLead = l.id
            JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = l.etapa
            LEFT JOIN l.campana c
            LEFT JOIN c.proveedor p
            LEFT JOIN l.datosPreventa dp
            WHERE l.etapa = :etapa
              AND EXISTS (
                  SELECT 1
                  FROM Subtipificacion sa
                  JOIN sa.tipificacion ta
                  WHERE ta.idEquipo = l.idEquipo
                    AND ta.etapa = l.etapa
                    AND ta.codigo = r.mayorRangoCodigoTipificacion
                    AND sa.codigo = r.mayorRangoCodigoSubtipificacion
                    AND :comportamiento MEMBER OF sa.comportamientos
              )
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
              AND e.accion = :accionTipificacion
              AND e.tipificacion = r.mayorRangoCodigoTipificacion
              AND e.subtipificacion = r.mayorRangoCodigoSubtipificacion
              AND e.horaProgramada IS NOT NULL
              AND e.createdAt = (
                  SELECT MAX(es.createdAt)
                  FROM Evento es
                  WHERE es.idLead = l.id
                    AND es.accion = :accionTipificacion
                    AND es.tipificacion = r.mayorRangoCodigoTipificacion
                    AND es.subtipificacion = r.mayorRangoCodigoSubtipificacion
                    AND es.horaProgramada IS NOT NULL
              )
            ORDER BY e.fechaProgramacion ASC, e.horaProgramada ASC, e.createdAt ASC
            """)
    Page<LeadAgendadoGtrResponse> listarLeadsAgendadosGtrPorHoraAsc(
            @Param("etapa") Etapa etapa,
            @Param("comportamiento") ComportamientoTipificacion comportamiento,
            @Param("accionTipificacion") Accion accionTipificacion,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds,
            Pageable pageable
    );

    @Query("""
            SELECT new pe.albrugroup.lead_service.entity.response.LeadAgendadoGtrResponse(
                l.id,
                l.idEquipo,
                l.createdAt,
                l.prefijo,
                l.lead,
                l.usermeta,
                c.nombre,
                p.nombre,
                (SELECT peFallback.nombre
                 FROM EquipoProveedor epFallback
                 JOIN epFallback.proveedor peFallback
                 WHERE epFallback.idEquipo = l.idEquipo
                   AND epFallback.fallbackLeadSinCampana = true),
                l.base,
                dp.nombreTitularServicio,
                r.mayorRangoCodigoTipificacion,
                r.mayorRangoCodigoSubtipificacion,
                l.nombreAsesorAsignado,
                e.nombreActor,
                l.estado,
                0L,
                0L,
                0L,
                e.createdAt,
                e.comentario,
                e.horaProgramada,
                e.fechaProgramacion
            )
            FROM Lead l
            JOIN Evento e ON e.idLead = l.id
            JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = l.etapa
            LEFT JOIN l.campana c
            LEFT JOIN c.proveedor p
            LEFT JOIN l.datosPreventa dp
            WHERE l.etapa = :etapa
              AND EXISTS (
                  SELECT 1
                  FROM Subtipificacion sa
                  JOIN sa.tipificacion ta
                  WHERE ta.idEquipo = l.idEquipo
                    AND ta.etapa = l.etapa
                    AND ta.codigo = r.mayorRangoCodigoTipificacion
                    AND sa.codigo = r.mayorRangoCodigoSubtipificacion
                    AND :comportamiento MEMBER OF sa.comportamientos
              )
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
              AND e.accion = :accionTipificacion
              AND e.tipificacion = r.mayorRangoCodigoTipificacion
              AND e.subtipificacion = r.mayorRangoCodigoSubtipificacion
              AND e.horaProgramada IS NOT NULL
              AND e.createdAt = (
                  SELECT MAX(es.createdAt)
                  FROM Evento es
                  WHERE es.idLead = l.id
                    AND es.accion = :accionTipificacion
                    AND es.tipificacion = r.mayorRangoCodigoTipificacion
                    AND es.subtipificacion = r.mayorRangoCodigoSubtipificacion
                    AND es.horaProgramada IS NOT NULL
              )
            ORDER BY e.fechaProgramacion DESC, e.horaProgramada DESC, e.createdAt DESC
            """)
    Page<LeadAgendadoGtrResponse> listarLeadsAgendadosGtrPorHoraDesc(
            @Param("etapa") Etapa etapa,
            @Param("comportamiento") ComportamientoTipificacion comportamiento,
            @Param("accionTipificacion") Accion accionTipificacion,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds,
            Pageable pageable
    );

    @Query("""
            SELECT new pe.albrugroup.lead_service.entity.response.LeadAgendadoGtrResponse(
                l.id,
                l.idEquipo,
                l.createdAt,
                l.prefijo,
                l.lead,
                l.usermeta,
                c.nombre,
                p.nombre,
                (SELECT peFallback.nombre
                 FROM EquipoProveedor epFallback
                 JOIN epFallback.proveedor peFallback
                 WHERE epFallback.idEquipo = l.idEquipo
                   AND epFallback.fallbackLeadSinCampana = true),
                l.base,
                dp.nombreTitularServicio,
                r.mayorRangoCodigoTipificacion,
                r.mayorRangoCodigoSubtipificacion,
                l.nombreAsesorAsignado,
                e.nombreActor,
                l.estado,
                0L,
                0L,
                0L,
                e.createdAt,
                e.comentario,
                e.horaProgramada,
                e.fechaProgramacion
            )
            FROM Lead l
            JOIN Evento e ON e.idLead = l.id
            JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = l.etapa
            LEFT JOIN l.campana c
            LEFT JOIN c.proveedor p
            LEFT JOIN l.datosPreventa dp
            WHERE l.etapa = :etapa
              AND EXISTS (
                  SELECT 1
                  FROM Subtipificacion sa
                  JOIN sa.tipificacion ta
                  WHERE ta.idEquipo = l.idEquipo
                    AND ta.etapa = l.etapa
                    AND ta.codigo = r.mayorRangoCodigoTipificacion
                    AND sa.codigo = r.mayorRangoCodigoSubtipificacion
                    AND :comportamiento MEMBER OF sa.comportamientos
              )
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
              AND e.accion = :accionTipificacion
              AND e.tipificacion = r.mayorRangoCodigoTipificacion
              AND e.subtipificacion = r.mayorRangoCodigoSubtipificacion
              AND e.horaProgramada IS NOT NULL
              AND e.createdAt = (
                  SELECT MAX(es.createdAt)
                  FROM Evento es
                  WHERE es.idLead = l.id
                    AND es.accion = :accionTipificacion
                    AND es.tipificacion = r.mayorRangoCodigoTipificacion
                    AND es.subtipificacion = r.mayorRangoCodigoSubtipificacion
                    AND es.horaProgramada IS NOT NULL
              )
            ORDER BY e.createdAt ASC
            """)
    Page<LeadAgendadoGtrResponse> listarLeadsAgendadosGtrPorAgendadoAsc(
            @Param("etapa") Etapa etapa,
            @Param("comportamiento") ComportamientoTipificacion comportamiento,
            @Param("accionTipificacion") Accion accionTipificacion,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds,
            Pageable pageable
    );

    @Query("""
            SELECT new pe.albrugroup.lead_service.entity.response.LeadAgendadoGtrResponse(
                l.id,
                l.idEquipo,
                l.createdAt,
                l.prefijo,
                l.lead,
                l.usermeta,
                c.nombre,
                p.nombre,
                (SELECT peFallback.nombre
                 FROM EquipoProveedor epFallback
                 JOIN epFallback.proveedor peFallback
                 WHERE epFallback.idEquipo = l.idEquipo
                   AND epFallback.fallbackLeadSinCampana = true),
                l.base,
                dp.nombreTitularServicio,
                r.mayorRangoCodigoTipificacion,
                r.mayorRangoCodigoSubtipificacion,
                l.nombreAsesorAsignado,
                e.nombreActor,
                l.estado,
                0L,
                0L,
                0L,
                e.createdAt,
                e.comentario,
                e.horaProgramada,
                e.fechaProgramacion
            )
            FROM Lead l
            JOIN Evento e ON e.idLead = l.id
            JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = l.etapa
            LEFT JOIN l.campana c
            LEFT JOIN c.proveedor p
            LEFT JOIN l.datosPreventa dp
            WHERE l.etapa = :etapa
              AND EXISTS (
                  SELECT 1
                  FROM Subtipificacion sa
                  JOIN sa.tipificacion ta
                  WHERE ta.idEquipo = l.idEquipo
                    AND ta.etapa = l.etapa
                    AND ta.codigo = r.mayorRangoCodigoTipificacion
                    AND sa.codigo = r.mayorRangoCodigoSubtipificacion
                    AND :comportamiento MEMBER OF sa.comportamientos
              )
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
              AND e.accion = :accionTipificacion
              AND e.tipificacion = r.mayorRangoCodigoTipificacion
              AND e.subtipificacion = r.mayorRangoCodigoSubtipificacion
              AND e.horaProgramada IS NOT NULL
              AND e.createdAt = (
                  SELECT MAX(es.createdAt)
                  FROM Evento es
                  WHERE es.idLead = l.id
                    AND es.accion = :accionTipificacion
                    AND es.tipificacion = r.mayorRangoCodigoTipificacion
                    AND es.subtipificacion = r.mayorRangoCodigoSubtipificacion
                    AND es.horaProgramada IS NOT NULL
              )
            ORDER BY e.createdAt DESC
            """)
    Page<LeadAgendadoGtrResponse> listarLeadsAgendadosGtrPorAgendadoDesc(
            @Param("etapa") Etapa etapa,
            @Param("comportamiento") ComportamientoTipificacion comportamiento,
            @Param("accionTipificacion") Accion accionTipificacion,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds,
            Pageable pageable
    );

    @Query("""
            SELECT COUNT(l)
            FROM Lead l
            JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = l.etapa
            WHERE l.etapa = :etapa
              AND EXISTS (
                  SELECT 1
                  FROM Subtipificacion sa
                  JOIN sa.tipificacion ta
                  WHERE ta.idEquipo = l.idEquipo
                    AND ta.etapa = l.etapa
                    AND ta.codigo = r.mayorRangoCodigoTipificacion
                    AND sa.codigo = r.mayorRangoCodigoSubtipificacion
                    AND :comportamiento MEMBER OF sa.comportamientos
              )
              AND EXISTS (
                  SELECT 1
                  FROM Evento e
                  WHERE e.idLead = l.id
                    AND e.accion = :accionTipificacion
                    AND e.tipificacion = r.mayorRangoCodigoTipificacion
                    AND e.subtipificacion = r.mayorRangoCodigoSubtipificacion
                    AND e.horaProgramada IS NOT NULL
              )
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
            """)
    long contarAgendadosGtrActivos(
            @Param("etapa") Etapa etapa,
            @Param("comportamiento") ComportamientoTipificacion comportamiento,
            @Param("accionTipificacion") Accion accionTipificacion,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds
    );

    @Query("""
            SELECT e.horaProgramada AS horaProgramada, COUNT(l) AS cantidad
            FROM Lead l
            JOIN Evento e ON e.idLead = l.id
            JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = l.etapa
            WHERE l.etapa = :etapa
              AND EXISTS (
                  SELECT 1
                  FROM Subtipificacion sa
                  JOIN sa.tipificacion ta
                  WHERE ta.idEquipo = l.idEquipo
                    AND ta.etapa = l.etapa
                    AND ta.codigo = r.mayorRangoCodigoTipificacion
                    AND sa.codigo = r.mayorRangoCodigoSubtipificacion
                    AND :comportamiento MEMBER OF sa.comportamientos
              )
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
              AND e.accion = :accionTipificacion
              AND e.tipificacion = r.mayorRangoCodigoTipificacion
              AND e.subtipificacion = r.mayorRangoCodigoSubtipificacion
              AND e.horaProgramada IS NOT NULL
              AND e.createdAt = (
                  SELECT MAX(es.createdAt)
                  FROM Evento es
                  WHERE es.idLead = l.id
                    AND es.accion = :accionTipificacion
                    AND es.tipificacion = r.mayorRangoCodigoTipificacion
                    AND es.subtipificacion = r.mayorRangoCodigoSubtipificacion
                    AND es.horaProgramada IS NOT NULL
              )
              AND e.fechaProgramacion = :hoy
            GROUP BY e.horaProgramada
            """)
    List<HoraProgramadaCantidadProjection> contarAgendadosGtrHoyPorHora(
            @Param("etapa") Etapa etapa,
            @Param("comportamiento") ComportamientoTipificacion comportamiento,
            @Param("accionTipificacion") Accion accionTipificacion,
            @Param("hoy") LocalDate hoy,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds
    );

    @Query("""
            SELECT new pe.albrugroup.lead_service.entity.response.LeadResponse(
                l.id,
                l.prefijo,
                l.lead,
                l.usermeta,
                l.etapa,
                l.estado,
                l.idAsesorAsignado,
                l.nombreAsesorAsignado,
                dp.tipoDocumento,
                COALESCE(dp.numeroDocumentoTitularServicio, l.numeroDocumentoTitularServicioSnapshot),
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
                r.fechaIngresoEtapa,
                l.updatedAt,
                l.sec,
                l.sot,
                l.customerId,
                COALESCE(pp.requiereSecSotVenta, cp.requiereSecSotVenta, fp.requiereSecSotVenta, false),
                rp.nombreAsesorMerito,
                r.nombreAsesorUltimaGestion,
                r.fechaUltimaGestion,
                0L,
                prog.fechaProgramacion,
                prog.horaProgramada,
                rechazo.fechaRechazo,
                inter.velocidad,
                inter.unidad,
                pl.velocidadPromocional,
                pl.mesesPromocionVelocidad,
                ultTip.createdAt,
                ultTip.comentario
            )
            FROM Lead l
            LEFT JOIN Evento ultTip ON ultTip.id = (
                SELECT MAX(ev.id)
                FROM Evento ev
                WHERE ev.idLead = l.id
                  AND ev.accion = :accionTipificacion
            )
            LEFT JOIN Evento prog ON prog.id = (
                SELECT MAX(ev.id)
                FROM Evento ev
                WHERE ev.idLead = l.id
                  AND ev.accion = :accionTipificacion
                  AND ev.etapa = :etapa
                  AND ev.tipificacion = :codigoProgramado
                  AND ev.fechaProgramacion IS NOT NULL
                  AND ev.horaProgramada IS NOT NULL
            )
            LEFT JOIN Evento rechazo ON rechazo.id = (
                SELECT MAX(ev.id)
                FROM Evento ev
                WHERE ev.idLead = l.id
                  AND ev.accion = :accionTipificacion
                  AND ev.etapa = :etapa
                  AND ev.tipificacion IN :tipificacionesFechaRechazo
                  AND ev.fechaRechazo IS NOT NULL
            )
            LEFT JOIN l.datosPreventa dp
            LEFT JOIN l.plan pl
            LEFT JOIN pl.proveedor pp
            LEFT JOIN pl.internet inter
            LEFT JOIN l.campana c
            LEFT JOIN c.proveedor cp
            LEFT JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = l.etapa
            LEFT JOIN LeadEtapaResumen rp ON rp.idLead = l.id AND rp.etapa = :etapaPreventa
            LEFT JOIN Tipificacion tAct ON tAct.codigo = l.codigoTipificacion AND tAct.etapa = l.etapa AND tAct.idEquipo = l.idEquipo
            LEFT JOIN Subtipificacion sAct ON sAct.tipificacion = tAct AND sAct.codigo = l.codigoSubtipificacion
            LEFT JOIN EquipoProveedor epFallback
                ON epFallback.idEquipo = l.idEquipo
               AND epFallback.fallbackLeadSinCampana = true
            LEFT JOIN epFallback.proveedor fp
            WHERE l.etapa = :etapa
              AND (
                    (:campoFecha = 'INGRESO'
                        AND COALESCE(r.fechaIngresoEtapa, l.lastEntryAt) >= :fechaDesde
                        AND COALESCE(r.fechaIngresoEtapa, l.lastEntryAt) < :fechaHasta)
                    OR (:campoFecha = 'ULTIMA_GESTION'
                        AND r.fechaUltimaGestion >= :fechaDesde
                        AND r.fechaUltimaGestion < :fechaHasta)
              )
              AND (
                    :searchPattern = '%'
                    OR (:buscarPorUsermeta = false AND (
                        l.lead LIKE :searchPattern
                        OR COALESCE(dp.numeroDocumentoTitularServicio, l.numeroDocumentoTitularServicioSnapshot) LIKE :searchPattern
                        OR l.sec LIKE :searchPattern
                        OR l.sot LIKE :searchPattern
                    ))
                    OR (:buscarPorUsermeta = true AND LOWER(l.usermeta) LIKE LOWER(:searchPattern))
              )
              AND (
                    :filtrarGrupo = false
                    OR (:tipoGrupo = 'ESTADO'
                        AND ((:sinValor = true AND l.estado IS NULL) OR CONCAT('', l.estado) IN :valoresGrupo))
                    OR (:tipoGrupo = 'PROVEEDOR'
                        AND ((:sinValor = true AND COALESCE(l.nombreProveedorSnapshot, '') = '') OR l.nombreProveedorSnapshot IN :valoresGrupo))
                    OR (:tipoGrupo = 'PLAN'
                        AND ((:sinValor = true AND COALESCE(l.nombrePlanSnapshot, '') = '') OR l.nombrePlanSnapshot IN :valoresGrupo))
                    OR (:tipoGrupo = 'ULTIMO_GESTOR'
                        AND ((:sinValor = true AND COALESCE(r.nombreAsesorUltimaGestion, '') = '') OR r.nombreAsesorUltimaGestion IN :valoresGrupo))
                    OR (:tipoGrupo = 'TIPIFICACION'
                        AND ((:sinValor = true AND COALESCE(l.codigoTipificacion, '') = '') OR l.codigoTipificacion IN :valoresGrupo))
              )
              AND (:excluirTipificacionesSeparadas = false
                   OR COALESCE(l.codigoTipificacion, '') NOT IN :tipificacionesSeparadas)
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
            ORDER BY
              CASE WHEN :groupBy = 'ESTADO' THEN
                    CASE WHEN l.estado = :estadoNuevo THEN 0
                         WHEN l.estado = :estadoEnGestion THEN 1
                         WHEN l.estado = :estadoAsignado THEN 2
                         WHEN l.estado = :estadoGestionado THEN 3
                         ELSE 4 END
              END ASC,
              CASE WHEN :groupBy = 'PLAN' THEN l.nombrePlanSnapshot END ASC,
              CASE WHEN :groupBy = 'ULTIMO_GESTOR' THEN r.nombreAsesorUltimaGestion END ASC,
              CASE WHEN :groupBy = 'TIPIFICACION' THEN CASE WHEN tAct.orden IS NULL THEN 1 ELSE 0 END END ASC,
              CASE WHEN :groupBy = 'TIPIFICACION' THEN tAct.orden END ASC,
              CASE WHEN :groupBy = 'TIPIFICACION' THEN sAct.orden END ASC,
              CASE WHEN :sortBy = 'fechaIngresoEtapa' AND :sortDesc = false THEN COALESCE(r.fechaIngresoEtapa, l.lastEntryAt) END ASC,
              CASE WHEN :sortBy = 'fechaIngresoEtapa' AND :sortDesc = true THEN COALESCE(r.fechaIngresoEtapa, l.lastEntryAt) END DESC,
              CASE WHEN :sortBy = 'fechaUltimaGestion' AND :sortDesc = false THEN r.fechaUltimaGestion END ASC,
              CASE WHEN :sortBy = 'fechaUltimaGestion' AND :sortDesc = true THEN r.fechaUltimaGestion END DESC,
              CASE WHEN :sortBy = 'estado' AND :sortDesc = false THEN
                    CASE WHEN l.estado = :estadoNuevo THEN 0
                         WHEN l.estado = :estadoEnGestion THEN 1
                         WHEN l.estado = :estadoAsignado THEN 2
                         WHEN l.estado = :estadoGestionado THEN 3
                         ELSE 4 END
              END ASC,
              CASE WHEN :sortBy = 'estado' AND :sortDesc = true THEN
                    CASE WHEN l.estado = :estadoNuevo THEN 0
                         WHEN l.estado = :estadoEnGestion THEN 1
                         WHEN l.estado = :estadoAsignado THEN 2
                         WHEN l.estado = :estadoGestionado THEN 3
                         ELSE 4 END
              END DESC,
              CASE WHEN :sortBy = 'tipificacion' THEN CASE WHEN tAct.orden IS NULL THEN 1 ELSE 0 END ELSE 0 END ASC,
              CASE WHEN :sortBy = 'tipificacion' AND :sortDesc = false THEN tAct.orden END ASC,
              CASE WHEN :sortBy = 'tipificacion' AND :sortDesc = true THEN tAct.orden END DESC,
              CASE WHEN :sortBy = 'tipificacion' AND :sortDesc = false THEN sAct.orden END ASC,
              CASE WHEN :sortBy = 'tipificacion' AND :sortDesc = true THEN sAct.orden END DESC,
              COALESCE(r.fechaIngresoEtapa, l.lastEntryAt) DESC,
              l.id DESC
            """)
    Page<LeadResponse> listarBandejaVenta(
            @Param("etapa") Etapa etapa,
            @Param("searchPattern") String searchPattern,
            @Param("buscarPorUsermeta") boolean buscarPorUsermeta,
            @Param("campoFecha") String campoFecha,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("filtrarGrupo") boolean filtrarGrupo,
            @Param("tipoGrupo") String tipoGrupo,
            @Param("valoresGrupo") Collection<String> valoresGrupo,
            @Param("sinValor") boolean sinValor,
            @Param("accionTipificacion") Accion accionTipificacion,
            @Param("codigoProgramado") String codigoProgramado,
            @Param("tipificacionesFechaRechazo") Collection<String> tipificacionesFechaRechazo,
            @Param("etapaPreventa") Etapa etapaPreventa,
            @Param("excluirTipificacionesSeparadas") boolean excluirTipificacionesSeparadas,
            @Param("tipificacionesSeparadas") Collection<String> tipificacionesSeparadas,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds,
            @Param("groupBy") String groupBy,
            @Param("sortBy") String sortBy,
            @Param("sortDesc") boolean sortDesc,
            @Param("estadoNuevo") EstadoSeguimiento estadoNuevo,
            @Param("estadoEnGestion") EstadoSeguimiento estadoEnGestion,
            @Param("estadoAsignado") EstadoSeguimiento estadoAsignado,
            @Param("estadoGestionado") EstadoSeguimiento estadoGestionado,
            Pageable pageable
    );

    @Query("""
            SELECT NULL AS idGrupo,
                   CONCAT('', l.estado) AS etiqueta,
                   NULL AS codigoTipificacion,
                   NULL AS codigoSubtipificacion,
                   COUNT(l.id) AS cantidad
            FROM Lead l
            LEFT JOIN l.datosPreventa dp
            LEFT JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = l.etapa
            WHERE l.etapa = :etapa
              AND (:filtrarAsesor = false OR l.idAsesorAsignado = :idAsesor)
              AND COALESCE(r.fechaIngresoEtapa, l.lastEntryAt) >= :fechaDesde
              AND COALESCE(r.fechaIngresoEtapa, l.lastEntryAt) < :fechaHasta
              AND (
                    :searchPattern = '%'
                    OR (:buscarPorUsermeta = false AND (
                        l.lead LIKE :searchPattern
                        OR COALESCE(dp.numeroDocumentoTitularServicio, l.numeroDocumentoTitularServicioSnapshot) LIKE :searchPattern
                        OR l.sec LIKE :searchPattern
                        OR l.sot LIKE :searchPattern
                    ))
                    OR (:buscarPorUsermeta = true AND LOWER(l.usermeta) LIKE LOWER(:searchPattern))
              )
              AND (:excluirTipificacionesSeparadas = false
                   OR COALESCE(l.codigoTipificacion, '') NOT IN :tipificacionesSeparadas)
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
            GROUP BY l.estado
            """)
    List<LeadGtrAgrupacionProjection> agruparVentaPorEstado(
            @Param("etapa") Etapa etapa,
            @Param("searchPattern") String searchPattern,
            @Param("buscarPorUsermeta") boolean buscarPorUsermeta,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("filtrarAsesor") boolean filtrarAsesor,
            @Param("idAsesor") Long idAsesor,
            @Param("excluirTipificacionesSeparadas") boolean excluirTipificacionesSeparadas,
            @Param("tipificacionesSeparadas") Collection<String> tipificacionesSeparadas,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds
    );

    @Query("""
            SELECT NULL AS idGrupo,
                   l.nombreProveedorSnapshot AS etiqueta,
                   NULL AS codigoTipificacion,
                   NULL AS codigoSubtipificacion,
                   COUNT(l.id) AS cantidad
            FROM Lead l
            LEFT JOIN l.datosPreventa dp
            LEFT JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = l.etapa
            WHERE l.etapa = :etapa
              AND (:filtrarAsesor = false OR l.idAsesorAsignado = :idAsesor)
              AND COALESCE(r.fechaIngresoEtapa, l.lastEntryAt) >= :fechaDesde
              AND COALESCE(r.fechaIngresoEtapa, l.lastEntryAt) < :fechaHasta
              AND (
                    :searchPattern = '%'
                    OR (:buscarPorUsermeta = false AND (
                        l.lead LIKE :searchPattern
                        OR COALESCE(dp.numeroDocumentoTitularServicio, l.numeroDocumentoTitularServicioSnapshot) LIKE :searchPattern
                        OR l.sec LIKE :searchPattern
                        OR l.sot LIKE :searchPattern
                    ))
                    OR (:buscarPorUsermeta = true AND LOWER(l.usermeta) LIKE LOWER(:searchPattern))
              )
              AND (:excluirTipificacionesSeparadas = false
                   OR COALESCE(l.codigoTipificacion, '') NOT IN :tipificacionesSeparadas)
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
            GROUP BY l.nombreProveedorSnapshot
            """)
    List<LeadGtrAgrupacionProjection> agruparVentaPorProveedor(
            @Param("etapa") Etapa etapa,
            @Param("searchPattern") String searchPattern,
            @Param("buscarPorUsermeta") boolean buscarPorUsermeta,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("filtrarAsesor") boolean filtrarAsesor,
            @Param("idAsesor") Long idAsesor,
            @Param("excluirTipificacionesSeparadas") boolean excluirTipificacionesSeparadas,
            @Param("tipificacionesSeparadas") Collection<String> tipificacionesSeparadas,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds
    );

    @Query("""
            SELECT NULL AS idGrupo,
                   l.nombrePlanSnapshot AS etiqueta,
                   NULL AS codigoTipificacion,
                   NULL AS codigoSubtipificacion,
                   COUNT(l.id) AS cantidad
            FROM Lead l
            LEFT JOIN l.datosPreventa dp
            LEFT JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = l.etapa
            WHERE l.etapa = :etapa
              AND (:filtrarAsesor = false OR l.idAsesorAsignado = :idAsesor)
              AND COALESCE(r.fechaIngresoEtapa, l.lastEntryAt) >= :fechaDesde
              AND COALESCE(r.fechaIngresoEtapa, l.lastEntryAt) < :fechaHasta
              AND (
                    :searchPattern = '%'
                    OR (:buscarPorUsermeta = false AND (
                        l.lead LIKE :searchPattern
                        OR COALESCE(dp.numeroDocumentoTitularServicio, l.numeroDocumentoTitularServicioSnapshot) LIKE :searchPattern
                        OR l.sec LIKE :searchPattern
                        OR l.sot LIKE :searchPattern
                    ))
                    OR (:buscarPorUsermeta = true AND LOWER(l.usermeta) LIKE LOWER(:searchPattern))
              )
              AND (:excluirTipificacionesSeparadas = false
                   OR COALESCE(l.codigoTipificacion, '') NOT IN :tipificacionesSeparadas)
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
            GROUP BY l.nombrePlanSnapshot
            """)
    List<LeadGtrAgrupacionProjection> agruparVentaPorPlan(
            @Param("etapa") Etapa etapa,
            @Param("searchPattern") String searchPattern,
            @Param("buscarPorUsermeta") boolean buscarPorUsermeta,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("filtrarAsesor") boolean filtrarAsesor,
            @Param("idAsesor") Long idAsesor,
            @Param("excluirTipificacionesSeparadas") boolean excluirTipificacionesSeparadas,
            @Param("tipificacionesSeparadas") Collection<String> tipificacionesSeparadas,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds
    );

    @Query("""
            SELECT NULL AS idGrupo,
                   r.nombreAsesorUltimaGestion AS etiqueta,
                   NULL AS codigoTipificacion,
                   NULL AS codigoSubtipificacion,
                   COUNT(l.id) AS cantidad
            FROM Lead l
            LEFT JOIN l.datosPreventa dp
            LEFT JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = l.etapa
            WHERE l.etapa = :etapa
              AND (:filtrarAsesor = false OR l.idAsesorAsignado = :idAsesor)
              AND COALESCE(r.fechaIngresoEtapa, l.lastEntryAt) >= :fechaDesde
              AND COALESCE(r.fechaIngresoEtapa, l.lastEntryAt) < :fechaHasta
              AND (
                    :searchPattern = '%'
                    OR (:buscarPorUsermeta = false AND (
                        l.lead LIKE :searchPattern
                        OR COALESCE(dp.numeroDocumentoTitularServicio, l.numeroDocumentoTitularServicioSnapshot) LIKE :searchPattern
                        OR l.sec LIKE :searchPattern
                        OR l.sot LIKE :searchPattern
                    ))
                    OR (:buscarPorUsermeta = true AND LOWER(l.usermeta) LIKE LOWER(:searchPattern))
              )
              AND (:excluirTipificacionesSeparadas = false
                   OR COALESCE(l.codigoTipificacion, '') NOT IN :tipificacionesSeparadas)
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
            GROUP BY r.nombreAsesorUltimaGestion
            """)
    List<LeadGtrAgrupacionProjection> agruparVentaPorUltimoGestor(
            @Param("etapa") Etapa etapa,
            @Param("searchPattern") String searchPattern,
            @Param("buscarPorUsermeta") boolean buscarPorUsermeta,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("filtrarAsesor") boolean filtrarAsesor,
            @Param("idAsesor") Long idAsesor,
            @Param("excluirTipificacionesSeparadas") boolean excluirTipificacionesSeparadas,
            @Param("tipificacionesSeparadas") Collection<String> tipificacionesSeparadas,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds
    );

    @Query("""
            SELECT NULL AS idGrupo,
                   NULL AS etiqueta,
                   l.codigoTipificacion AS codigoTipificacion,
                   NULL AS codigoSubtipificacion,
                   COUNT(l.id) AS cantidad
            FROM Lead l
            LEFT JOIN l.datosPreventa dp
            LEFT JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = l.etapa
            WHERE l.etapa = :etapa
              AND (:filtrarAsesor = false OR l.idAsesorAsignado = :idAsesor)
              AND COALESCE(r.fechaIngresoEtapa, l.lastEntryAt) >= :fechaDesde
              AND COALESCE(r.fechaIngresoEtapa, l.lastEntryAt) < :fechaHasta
              AND (
                    :searchPattern = '%'
                    OR (:buscarPorUsermeta = false AND (
                        l.lead LIKE :searchPattern
                        OR COALESCE(dp.numeroDocumentoTitularServicio, l.numeroDocumentoTitularServicioSnapshot) LIKE :searchPattern
                        OR l.sec LIKE :searchPattern
                        OR l.sot LIKE :searchPattern
                    ))
                    OR (:buscarPorUsermeta = true AND LOWER(l.usermeta) LIKE LOWER(:searchPattern))
              )
              AND (:excluirTipificacionesSeparadas = false
                   OR COALESCE(l.codigoTipificacion, '') NOT IN :tipificacionesSeparadas)
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
            GROUP BY l.codigoTipificacion
            """)
    List<LeadGtrAgrupacionProjection> agruparVentaPorTipificacion(
            @Param("etapa") Etapa etapa,
            @Param("searchPattern") String searchPattern,
            @Param("buscarPorUsermeta") boolean buscarPorUsermeta,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("filtrarAsesor") boolean filtrarAsesor,
            @Param("idAsesor") Long idAsesor,
            @Param("excluirTipificacionesSeparadas") boolean excluirTipificacionesSeparadas,
            @Param("tipificacionesSeparadas") Collection<String> tipificacionesSeparadas,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds
    );

    @Query("""
            SELECT new pe.albrugroup.lead_service.entity.response.LeadResponse(
                l.id,
                l.prefijo,
                l.lead,
                l.usermeta,
                l.etapa,
                l.estado,
                l.idAsesorAsignado,
                l.nombreAsesorAsignado,
                dp.tipoDocumento,
                COALESCE(dp.numeroDocumentoTitularServicio, l.numeroDocumentoTitularServicioSnapshot),
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
                r.fechaIngresoEtapa,
                l.updatedAt,
                l.sec,
                l.sot,
                l.customerId,
                COALESCE(pp.requiereSecSotVenta, cp.requiereSecSotVenta, fp.requiereSecSotVenta, false),
                rp.nombreAsesorMerito,
                r.nombreAsesorUltimaGestion,
                r.fechaUltimaGestion,
                0L,
                e.fechaProgramacion,
                e.horaProgramada,
                null,
                inter.velocidad,
                inter.unidad,
                pl.velocidadPromocional,
                pl.mesesPromocionVelocidad,
                e.createdAt,
                e.comentario
            )
            FROM Lead l
            JOIN Evento e ON e.idLead = l.id
            LEFT JOIN l.datosPreventa dp
            LEFT JOIN l.plan pl
            LEFT JOIN pl.proveedor pp
            LEFT JOIN pl.internet inter
            LEFT JOIN l.campana c
            LEFT JOIN c.proveedor cp
            LEFT JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = l.etapa
            LEFT JOIN LeadEtapaResumen rp ON rp.idLead = l.id AND rp.etapa = :etapaPreventa
            LEFT JOIN Tipificacion tAct ON tAct.codigo = l.codigoTipificacion AND tAct.etapa = l.etapa AND tAct.idEquipo = l.idEquipo
            LEFT JOIN Subtipificacion sAct ON sAct.tipificacion = tAct AND sAct.codigo = l.codigoSubtipificacion
            LEFT JOIN EquipoProveedor epFallback
                ON epFallback.idEquipo = l.idEquipo
               AND epFallback.fallbackLeadSinCampana = true
            LEFT JOIN epFallback.proveedor fp
            WHERE l.etapa = :etapa
              AND l.codigoTipificacion = :codigoProgramado
              AND (l.codigoSubtipificacion IS NULL OR l.codigoSubtipificacion <> :codigoProgramacionCancelada)
              AND e.accion = :accionTipificacion
              AND e.tipificacion = :codigoProgramado
              AND e.fechaProgramacion IS NOT NULL
              AND e.horaProgramada IS NOT NULL
              AND (
                    (:campoFecha = 'PROGRAMACION' AND e.fechaProgramacion BETWEEN :fechaDesde AND :fechaHasta)
                    OR (:campoFecha = 'INGRESO' AND r.fechaIngresoEtapa >= :tsDesde AND r.fechaIngresoEtapa < :tsHasta)
                    OR (:campoFecha = 'ULTIMA_GESTION' AND r.fechaUltimaGestion >= :tsDesde AND r.fechaUltimaGestion < :tsHasta)
              )
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
              AND e.createdAt = (
                  SELECT MAX(es.createdAt)
                  FROM Evento es
                  WHERE es.idLead = l.id
                    AND es.accion = :accionTipificacion
                    AND es.tipificacion = :codigoProgramado
              )
            ORDER BY
              CASE WHEN :groupBy = 'ESTADO' THEN
                    CASE WHEN l.estado = :estadoNuevo THEN 0
                         WHEN l.estado = :estadoEnGestion THEN 1
                         WHEN l.estado = :estadoAsignado THEN 2
                         WHEN l.estado = :estadoGestionado THEN 3
                         ELSE 4 END
              END ASC,
              CASE WHEN :groupBy = 'PLAN' THEN l.nombrePlanSnapshot END ASC,
              CASE WHEN :groupBy = 'ULTIMO_GESTOR' THEN r.nombreAsesorUltimaGestion END ASC,
              CASE WHEN :sortBy = 'fechaProgramacion' AND :sortDesc = false THEN e.fechaProgramacion END ASC,
              CASE WHEN :sortBy = 'fechaProgramacion' AND :sortDesc = true THEN e.fechaProgramacion END DESC,
              CASE WHEN :sortBy = 'fechaProgramacion' AND :sortDesc = false THEN e.horaProgramada END ASC,
              CASE WHEN :sortBy = 'fechaProgramacion' AND :sortDesc = true THEN e.horaProgramada END DESC,
              CASE WHEN :sortBy = 'fechaIngresoEtapa' AND :sortDesc = false THEN r.fechaIngresoEtapa END ASC,
              CASE WHEN :sortBy = 'fechaIngresoEtapa' AND :sortDesc = true THEN r.fechaIngresoEtapa END DESC,
              CASE WHEN :sortBy = 'fechaUltimaGestion' AND :sortDesc = false THEN r.fechaUltimaGestion END ASC,
              CASE WHEN :sortBy = 'fechaUltimaGestion' AND :sortDesc = true THEN r.fechaUltimaGestion END DESC,
              CASE WHEN :sortBy = 'estado' AND :sortDesc = false THEN
                    CASE WHEN l.estado = :estadoNuevo THEN 0
                         WHEN l.estado = :estadoEnGestion THEN 1
                         WHEN l.estado = :estadoAsignado THEN 2
                         WHEN l.estado = :estadoGestionado THEN 3
                         ELSE 4 END
              END ASC,
              CASE WHEN :sortBy = 'estado' AND :sortDesc = true THEN
                    CASE WHEN l.estado = :estadoNuevo THEN 0
                         WHEN l.estado = :estadoEnGestion THEN 1
                         WHEN l.estado = :estadoAsignado THEN 2
                         WHEN l.estado = :estadoGestionado THEN 3
                         ELSE 4 END
              END DESC,
              CASE WHEN :sortBy = 'tipificacion' THEN CASE WHEN tAct.orden IS NULL THEN 1 ELSE 0 END ELSE 0 END ASC,
              CASE WHEN :sortBy = 'tipificacion' AND :sortDesc = false THEN tAct.orden END ASC,
              CASE WHEN :sortBy = 'tipificacion' AND :sortDesc = true THEN tAct.orden END DESC,
              CASE WHEN :sortBy = 'tipificacion' AND :sortDesc = false THEN sAct.orden END ASC,
              CASE WHEN :sortBy = 'tipificacion' AND :sortDesc = true THEN sAct.orden END DESC,
              e.fechaProgramacion ASC,
              e.horaProgramada ASC,
              e.createdAt ASC,
              l.id ASC
            """)
    Page<LeadResponse> listarLeadsProgramadosVentaAsignados(
            @Param("etapa") Etapa etapa,
            @Param("codigoProgramado") String codigoProgramado,
            @Param("codigoProgramacionCancelada") String codigoProgramacionCancelada,
            @Param("accionTipificacion") Accion accionTipificacion,
            @Param("etapaPreventa") Etapa etapaPreventa,
            @Param("campoFecha") String campoFecha,
            @Param("fechaDesde") java.time.LocalDate fechaDesde,
            @Param("fechaHasta") java.time.LocalDate fechaHasta,
            @Param("tsDesde") Instant tsDesde,
            @Param("tsHasta") Instant tsHasta,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds,
            @Param("groupBy") String groupBy,
            @Param("sortBy") String sortBy,
            @Param("sortDesc") boolean sortDesc,
            @Param("estadoNuevo") EstadoSeguimiento estadoNuevo,
            @Param("estadoEnGestion") EstadoSeguimiento estadoEnGestion,
            @Param("estadoAsignado") EstadoSeguimiento estadoAsignado,
            @Param("estadoGestionado") EstadoSeguimiento estadoGestionado,
            Pageable pageable
    );

    @Query("""
            SELECT new pe.albrugroup.lead_service.entity.response.LeadResponse(
                l.id,
                l.prefijo,
                l.lead,
                l.usermeta,
                l.etapa,
                l.estado,
                l.idAsesorAsignado,
                l.nombreAsesorAsignado,
                dp.tipoDocumento,
                COALESCE(dp.numeroDocumentoTitularServicio, l.numeroDocumentoTitularServicioSnapshot),
                l.base,
                l.idTipificacion,
                e.tipificacion,
                l.idSubtipificacion,
                e.subtipificacion,
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
                r.fechaIngresoEtapa,
                l.updatedAt,
                l.sec,
                l.sot,
                l.customerId,
                COALESCE(pp.requiereSecSotVenta, cp.requiereSecSotVenta, fp.requiereSecSotVenta, false),
                rp.nombreAsesorMerito,
                r.nombreAsesorUltimaGestion,
                r.fechaUltimaGestion,
                0L,
                null,
                null,
                e.fechaRechazo,
                inter.velocidad,
                inter.unidad,
                pl.velocidadPromocional,
                pl.mesesPromocionVelocidad,
                e.createdAt,
                e.comentario
            )
            FROM Lead l
            JOIN Evento e ON e.idLead = l.id
            LEFT JOIN l.datosPreventa dp
            LEFT JOIN l.plan pl
            LEFT JOIN pl.proveedor pp
            LEFT JOIN pl.internet inter
            LEFT JOIN l.campana c
            LEFT JOIN c.proveedor cp
            LEFT JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = l.etapa
            LEFT JOIN LeadEtapaResumen rp ON rp.idLead = l.id AND rp.etapa = :etapaPreventa
            LEFT JOIN Tipificacion tAct ON tAct.codigo = e.tipificacion AND tAct.etapa = :etapaVenta AND tAct.idEquipo = l.idEquipo
            LEFT JOIN Subtipificacion sAct ON sAct.tipificacion = tAct AND sAct.codigo = e.subtipificacion
            LEFT JOIN EquipoProveedor epFallback
                ON epFallback.idEquipo = l.idEquipo
               AND epFallback.fallbackLeadSinCampana = true
            LEFT JOIN epFallback.proveedor fp
            WHERE e.accion = :accionTipificacion
              AND e.etapa = :etapaVenta
              AND e.tipificacion IN :tipificacionesRechazo
              AND e.fechaRechazo IS NOT NULL
              AND (
                    (:campoFecha = 'RECHAZO' AND e.fechaRechazo BETWEEN :fechaDesde AND :fechaHasta)
                    OR (:campoFecha = 'INGRESO' AND r.fechaIngresoEtapa >= :tsDesde AND r.fechaIngresoEtapa < :tsHasta)
                    OR (:campoFecha = 'ULTIMA_GESTION' AND r.fechaUltimaGestion >= :tsDesde AND r.fechaUltimaGestion < :tsHasta)
              )
              AND l.etapa IN :etapasPermitidas
              AND (:exigirTipificacionActual = false OR l.codigoTipificacion IN :tipificacionesRechazo)
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
              AND e.createdAt = (
                  SELECT MAX(es.createdAt)
                  FROM Evento es
                  WHERE es.idLead = l.id
                    AND es.accion = :accionTipificacion
                    AND es.etapa = :etapaVenta
                    AND es.tipificacion IN :tipificacionesRechazo
                    AND es.fechaRechazo IS NOT NULL
              )
            ORDER BY
              CASE WHEN :groupBy = 'ESTADO' THEN
                    CASE WHEN l.estado = :estadoNuevo THEN 0
                         WHEN l.estado = :estadoEnGestion THEN 1
                         WHEN l.estado = :estadoAsignado THEN 2
                         WHEN l.estado = :estadoGestionado THEN 3
                         ELSE 4 END
              END ASC,
              CASE WHEN :groupBy = 'PLAN' THEN l.nombrePlanSnapshot END ASC,
              CASE WHEN :groupBy = 'ULTIMO_GESTOR' THEN r.nombreAsesorUltimaGestion END ASC,
              CASE WHEN :groupBy = 'TIPIFICACION' THEN CASE WHEN tAct.orden IS NULL THEN 1 ELSE 0 END END ASC,
              CASE WHEN :groupBy = 'TIPIFICACION' THEN tAct.orden END ASC,
              CASE WHEN :groupBy = 'TIPIFICACION' THEN sAct.orden END ASC,
              CASE WHEN :sortBy = 'fechaRechazo' AND :sortDesc = false THEN e.fechaRechazo END ASC,
              CASE WHEN :sortBy = 'fechaRechazo' AND :sortDesc = true THEN e.fechaRechazo END DESC,
              CASE WHEN :sortBy = 'fechaIngresoEtapa' AND :sortDesc = false THEN r.fechaIngresoEtapa END ASC,
              CASE WHEN :sortBy = 'fechaIngresoEtapa' AND :sortDesc = true THEN r.fechaIngresoEtapa END DESC,
              CASE WHEN :sortBy = 'fechaUltimaGestion' AND :sortDesc = false THEN r.fechaUltimaGestion END ASC,
              CASE WHEN :sortBy = 'fechaUltimaGestion' AND :sortDesc = true THEN r.fechaUltimaGestion END DESC,
              CASE WHEN :sortBy = 'lead' AND :sortDesc = false THEN l.lead END ASC,
              CASE WHEN :sortBy = 'lead' AND :sortDesc = true THEN l.lead END DESC,
              CASE WHEN :sortBy = 'createdAt' AND :sortDesc = false THEN l.createdAt END ASC,
              CASE WHEN :sortBy = 'createdAt' AND :sortDesc = true THEN l.createdAt END DESC,
              CASE WHEN :sortBy = 'lastEntryAt' AND :sortDesc = false THEN l.lastEntryAt END ASC,
              CASE WHEN :sortBy = 'lastEntryAt' AND :sortDesc = true THEN l.lastEntryAt END DESC,
              CASE WHEN :sortBy = 'estado' AND :sortDesc = false THEN
                    CASE WHEN l.estado = :estadoNuevo THEN 0
                         WHEN l.estado = :estadoEnGestion THEN 1
                         WHEN l.estado = :estadoAsignado THEN 2
                         WHEN l.estado = :estadoGestionado THEN 3
                         ELSE 4 END
              END ASC,
              CASE WHEN :sortBy = 'estado' AND :sortDesc = true THEN
                    CASE WHEN l.estado = :estadoNuevo THEN 0
                         WHEN l.estado = :estadoEnGestion THEN 1
                         WHEN l.estado = :estadoAsignado THEN 2
                         WHEN l.estado = :estadoGestionado THEN 3
                         ELSE 4 END
              END DESC,
              CASE WHEN :sortBy = 'tipificacion' THEN CASE WHEN tAct.orden IS NULL THEN 1 ELSE 0 END ELSE 0 END ASC,
              CASE WHEN :sortBy = 'tipificacion' AND :sortDesc = false THEN tAct.orden END ASC,
              CASE WHEN :sortBy = 'tipificacion' AND :sortDesc = true THEN tAct.orden END DESC,
              CASE WHEN :sortBy = 'tipificacion' AND :sortDesc = false THEN sAct.orden END ASC,
              CASE WHEN :sortBy = 'tipificacion' AND :sortDesc = true THEN sAct.orden END DESC,
              e.createdAt DESC,
              l.id DESC
            """)
    Page<LeadResponse> listarLeadsVentaRechazados(
            @Param("accionTipificacion") Accion accionTipificacion,
            @Param("etapaVenta") Etapa etapaVenta,
            @Param("etapaPreventa") Etapa etapaPreventa,
            @Param("tipificacionesRechazo") Collection<String> tipificacionesRechazo,
            @Param("campoFecha") String campoFecha,
            @Param("fechaDesde") java.time.LocalDate fechaDesde,
            @Param("fechaHasta") java.time.LocalDate fechaHasta,
            @Param("tsDesde") Instant tsDesde,
            @Param("tsHasta") Instant tsHasta,
            @Param("etapasPermitidas") Collection<Etapa> etapasPermitidas,
            @Param("exigirTipificacionActual") boolean exigirTipificacionActual,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds,
            @Param("groupBy") String groupBy,
            @Param("sortBy") String sortBy,
            @Param("sortDesc") boolean sortDesc,
            @Param("estadoNuevo") EstadoSeguimiento estadoNuevo,
            @Param("estadoEnGestion") EstadoSeguimiento estadoEnGestion,
            @Param("estadoAsignado") EstadoSeguimiento estadoAsignado,
            @Param("estadoGestionado") EstadoSeguimiento estadoGestionado,
            Pageable pageable
    );

    @Query("""
            SELECT new pe.albrugroup.lead_service.entity.response.LeadInstaladoBackofficeResponse(
                l.id,
                l.prefijo,
                l.lead,
                l.usermeta,
                dp.tipoDocumento,
                COALESCE(dp.numeroDocumentoTitularServicio, l.numeroDocumentoTitularServicioSnapshot),
                dp.nombreTitularServicio,
                l.nombreProveedorSnapshot,
                l.nombrePlanSnapshot,
                rp.nombreAsesorMerito,
                e.fechaInstalacion,
                e.createdAt,
                e.idActor,
                e.nombreActor,
                l.estadoClientePostventa,
                l.etapa
            )
            FROM Lead l
            JOIN Evento e ON e.idLead = l.id
            LEFT JOIN l.datosPreventa dp
            LEFT JOIN LeadEtapaResumen rp ON rp.idLead = l.id AND rp.etapa = :etapaPreventa
            WHERE e.accion = :accionTipificacion
              AND e.etapa = :etapaVenta
              AND e.tipificacion = :codigoInstalado
              AND e.fechaInstalacion IS NOT NULL
              AND (
                    (:campoFecha = 'INSTALACION' AND e.fechaInstalacion BETWEEN :fechaDesde AND :fechaHasta)
                    OR (:campoFecha = 'TIPIFICACION_INSTALADO' AND e.createdAt >= :tsDesde AND e.createdAt < :tsHasta)
              )
              AND l.etapa IN :etapasPermitidas
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
              AND e.createdAt = (
                  SELECT MAX(es.createdAt)
                  FROM Evento es
                  WHERE es.idLead = l.id
                    AND es.accion = :accionTipificacion
                    AND es.etapa = :etapaVenta
                    AND es.tipificacion = :codigoInstalado
                    AND es.fechaInstalacion IS NOT NULL
              )
            ORDER BY
              CASE WHEN :groupBy = 'ESTADO' THEN l.estadoClientePostventa END ASC,
              CASE WHEN :groupBy = 'PLAN' THEN l.nombrePlanSnapshot END ASC,
              CASE WHEN :groupBy = 'ULTIMO_GESTOR' THEN e.nombreActor END ASC,
              CASE WHEN :sortBy = 'fechaInstalacion' AND :sortDesc = false THEN e.fechaInstalacion END ASC,
              CASE WHEN :sortBy = 'fechaInstalacion' AND :sortDesc = true THEN e.fechaInstalacion END DESC,
              CASE WHEN :sortBy = 'fechaTipificacionInstalado' AND :sortDesc = false THEN e.createdAt END ASC,
              CASE WHEN :sortBy = 'fechaTipificacionInstalado' AND :sortDesc = true THEN e.createdAt END DESC,
              CASE WHEN :sortBy = 'lead' AND :sortDesc = false THEN l.lead END ASC,
              CASE WHEN :sortBy = 'lead' AND :sortDesc = true THEN l.lead END DESC,
              CASE WHEN :sortBy = 'estadoClientePostventa' AND :sortDesc = false THEN l.estadoClientePostventa END ASC,
              CASE WHEN :sortBy = 'estadoClientePostventa' AND :sortDesc = true THEN l.estadoClientePostventa END DESC,
              e.createdAt DESC,
              l.id DESC
            """)
    Page<LeadInstaladoBackofficeResponse> listarLeadsVentaInstalados(
            @Param("accionTipificacion") Accion accionTipificacion,
            @Param("etapaVenta") Etapa etapaVenta,
            @Param("etapaPreventa") Etapa etapaPreventa,
            @Param("codigoInstalado") String codigoInstalado,
            @Param("campoFecha") String campoFecha,
            @Param("fechaDesde") java.time.LocalDate fechaDesde,
            @Param("fechaHasta") java.time.LocalDate fechaHasta,
            @Param("tsDesde") Instant tsDesde,
            @Param("tsHasta") Instant tsHasta,
            @Param("etapasPermitidas") Collection<Etapa> etapasPermitidas,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds,
            @Param("groupBy") String groupBy,
            @Param("sortBy") String sortBy,
            @Param("sortDesc") boolean sortDesc,
            Pageable pageable
    );

    @Query("""
            SELECT new pe.albrugroup.lead_service.entity.response.LeadInstalacionCorreccionCandidatoResponse(
                l.id,
                l.lead,
                l.usermeta,
                dp.tipoDocumento,
                COALESCE(dp.numeroDocumentoTitularServicio, l.numeroDocumentoTitularServicioSnapshot),
                dp.nombreTitularServicio,
                l.nombreProveedorSnapshot,
                l.nombrePlanSnapshot,
                l.etapa,
                l.sec,
                l.sot,
                e.fechaInstalacion,
                e.createdAt,
                e.nombreActor,
                CASE WHEN l.sec IS NULL OR TRIM(l.sec) = '' THEN true ELSE false END,
                CASE WHEN l.sot IS NULL OR TRIM(l.sot) = '' THEN true ELSE false END,
                CASE WHEN e.fechaInstalacion IS NULL THEN true ELSE false END
            )
            FROM Lead l
            JOIN Evento e ON e.idLead = l.id
            JOIN l.plan pl
            JOIN pl.proveedor pp
            LEFT JOIN l.datosPreventa dp
            WHERE e.accion = :accionTipificacion
              AND e.etapa = :etapaVenta
              AND e.tipificacion = :codigoInstalado
              AND l.etapa IN :etapasPermitidas
              AND UPPER(TRIM(pp.nombre)) = :proveedorClaro
              AND (
                    l.sec IS NULL OR TRIM(l.sec) = ''
                    OR l.sot IS NULL OR TRIM(l.sot) = ''
                    OR e.fechaInstalacion IS NULL
                  )
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
              AND (
                    :buscando = false
                    OR l.lead LIKE :buscarPattern
                    OR COALESCE(dp.numeroDocumentoTitularServicio, l.numeroDocumentoTitularServicioSnapshot) LIKE :buscarPattern
                    OR LOWER(COALESCE(l.usermeta, '')) LIKE LOWER(:buscarPattern)
                    OR l.sec LIKE :buscarPattern
                    OR l.sot LIKE :buscarPattern
                  )
              AND NOT EXISTS (
                  SELECT 1
                  FROM Evento es
                  WHERE es.idLead = l.id
                    AND es.accion = :accionTipificacion
                    AND es.etapa = :etapaVenta
                    AND es.tipificacion = :codigoInstalado
                    AND (
                        es.createdAt > e.createdAt
                        OR (es.createdAt = e.createdAt AND es.id > e.id)
                    )
              )
            ORDER BY
              CASE WHEN :sortBy = 'fechaTipificacionInstalado' AND :sortDesc = false THEN e.createdAt END ASC,
              CASE WHEN :sortBy = 'fechaTipificacionInstalado' AND :sortDesc = true THEN e.createdAt END DESC,
              CASE WHEN :sortBy = 'fechaInstalacion' AND :sortDesc = false THEN e.fechaInstalacion END ASC,
              CASE WHEN :sortBy = 'fechaInstalacion' AND :sortDesc = true THEN e.fechaInstalacion END DESC,
              CASE WHEN :sortBy = 'lead' AND :sortDesc = false THEN l.lead END ASC,
              CASE WHEN :sortBy = 'lead' AND :sortDesc = true THEN l.lead END DESC,
              CASE WHEN :sortBy = 'numeroDocumento' AND :sortDesc = false THEN COALESCE(dp.numeroDocumentoTitularServicio, l.numeroDocumentoTitularServicioSnapshot) END ASC,
              CASE WHEN :sortBy = 'numeroDocumento' AND :sortDesc = true THEN COALESCE(dp.numeroDocumentoTitularServicio, l.numeroDocumentoTitularServicioSnapshot) END DESC,
              e.createdAt DESC,
              l.id DESC
            """)
    Page<LeadInstalacionCorreccionCandidatoResponse> listarCorreccionesInstalacionVenta(
            @Param("accionTipificacion") Accion accionTipificacion,
            @Param("etapaVenta") Etapa etapaVenta,
            @Param("codigoInstalado") String codigoInstalado,
            @Param("proveedorClaro") String proveedorClaro,
            @Param("etapasPermitidas") Collection<Etapa> etapasPermitidas,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds,
            @Param("buscando") boolean buscando,
            @Param("buscarPattern") String buscarPattern,
            @Param("sortBy") String sortBy,
            @Param("sortDesc") boolean sortDesc,
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

    // Igual que buscarDetalleAsesor pero sin filtrar etapa: el asesor de PREVENTA también atiende
    // (en modo solo lectura) leads asignados que siguen en otra etapa (atención GTR).
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
            """)
    Optional<Lead> buscarDetalleAsesorCualquierEtapa(
            @Param("idLead") Long idLead,
            @Param("idAsesor") Long idAsesor
    );

    // Detalle completo de un lead por id, sin filtro de asesor ni etapa (la autorizacion del caso
    // "mis preventas" se valida aparte contra el evento de cierre del asesor).
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
            """)
    Optional<Lead> buscarDetalleCompletoPorId(@Param("idLead") Long idLead);

    @Query("""
            SELECT new pe.albrugroup.lead_service.entity.response.LeadGtrResponse(
                l.id,
                l.idEquipo,
                l.createdAt,
                l.lastEntryAt,
                l.prefijo,
                l.lead,
                l.usermeta,
                c.nombre,
                p.nombre,
                (SELECT peFallback.nombre
                 FROM EquipoProveedor epFallback
                 JOIN epFallback.proveedor peFallback
                 WHERE epFallback.idEquipo = l.idEquipo
                   AND epFallback.fallbackLeadSinCampana = true),
                c.numeroWhatsApp,
                l.base,
                null,
                l.numeroDocumentoTitularServicioSnapshot,
                l.direccionSnapshot,
                r.primeraCodigoTipificacion,
                r.primeraCodigoSubtipificacion,
                r.mayorRangoCodigoTipificacion,
                r.mayorRangoCodigoSubtipificacion,
                r.ultimaCodigoTipificacion,
                r.ultimaCodigoSubtipificacion,
                l.nombrePlanSnapshot,
                l.nombreAsesorAsignado,
                l.estado,
                0L,
                0L,
                0L,
                false,
                false,
                false,
                l.etapa
            )
            FROM Lead l
            LEFT JOIN l.campana c
            LEFT JOIN c.proveedor p
            LEFT JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = :etapaResumen
            LEFT JOIN Tipificacion tPrimera ON tPrimera.codigo = r.primeraCodigoTipificacion AND tPrimera.etapa = :etapaResumen AND tPrimera.idEquipo = l.idEquipo
            LEFT JOIN Subtipificacion sPrimera ON sPrimera.tipificacion = tPrimera AND sPrimera.codigo = r.primeraCodigoSubtipificacion
            LEFT JOIN Tipificacion tMayor ON tMayor.codigo = r.mayorRangoCodigoTipificacion AND tMayor.etapa = :etapaResumen AND tMayor.idEquipo = l.idEquipo
            LEFT JOIN Subtipificacion sMayor ON sMayor.tipificacion = tMayor AND sMayor.codigo = r.mayorRangoCodigoSubtipificacion
            LEFT JOIN Tipificacion tUltima ON tUltima.codigo = r.ultimaCodigoTipificacion AND tUltima.etapa = :etapaResumen AND tUltima.idEquipo = l.idEquipo
            LEFT JOIN Subtipificacion sUltima ON sUltima.tipificacion = tUltima AND sUltima.codigo = r.ultimaCodigoSubtipificacion
            WHERE (:filtrarProveedor = false OR p.id = :idProveedor)
              AND (:filtrarEtapa = false OR l.etapa = :etapa)
              AND (r.ultimaCodigoTipificacion IS NULL OR r.ultimaCodigoTipificacion NOT IN :codigosTipificacionExcluidos)
              AND (
                    :filtrarTipificaciones = false
                    OR (:usarPrimeraTipificacion = true AND r.primeraCodigoTipificacion IN :codigosTipificacion)
                    OR (:usarMayorTipificacion = true AND r.mayorRangoCodigoTipificacion IN :codigosTipificacion)
                    OR (:usarUltimaTipificacion = true AND r.ultimaCodigoTipificacion IN :codigosTipificacion)
              )
              AND (
                    :filtrarSubtipificaciones = false
                    OR (:usarPrimeraTipificacion = true AND r.primeraCodigoSubtipificacion IN :codigosSubtipificacion)
                    OR (:usarMayorTipificacion = true AND r.mayorRangoCodigoSubtipificacion IN :codigosSubtipificacion)
                    OR (:usarUltimaTipificacion = true AND r.ultimaCodigoSubtipificacion IN :codigosSubtipificacion)
              )
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
              AND (:filtrarFechaDesde = false OR l.lastEntryAt >= :fechaDesde)
              AND (:filtrarFechaHasta = false OR l.lastEntryAt < :fechaHasta)
              AND (
                    :filtrarEstadoGrupo = false
                    OR (:sinValorGrupo = true AND l.estado IS NULL)
                    OR (:sinValorGrupo = false AND l.estado = :estadoGrupo)
              )
              AND (
                    :filtrarPrimeraTipificacionGrupo = false
                    OR (:sinValorGrupo = true AND r.primeraCodigoTipificacion IS NULL)
                    OR (
                        :sinValorGrupo = false
                        AND r.primeraCodigoTipificacion = :codigoTipificacionGrupo
                        AND (
                            (:codigoSubtipificacionGrupo IS NULL AND r.primeraCodigoSubtipificacion IS NULL)
                            OR r.primeraCodigoSubtipificacion = :codigoSubtipificacionGrupo
                        )
                    )
              )
              AND (
                    :filtrarMayorTipificacionGrupo = false
                    OR (:sinValorGrupo = true AND r.mayorRangoCodigoTipificacion IS NULL)
                    OR (
                        :sinValorGrupo = false
                        AND r.mayorRangoCodigoTipificacion = :codigoTipificacionGrupo
                        AND (
                            (:codigoSubtipificacionGrupo IS NULL AND r.mayorRangoCodigoSubtipificacion IS NULL)
                            OR r.mayorRangoCodigoSubtipificacion = :codigoSubtipificacionGrupo
                        )
                    )
              )
              AND (
                    :filtrarUltimaTipificacionGrupo = false
                    OR (:sinValorGrupo = true AND r.ultimaCodigoTipificacion IS NULL)
                    OR (
                        :sinValorGrupo = false
                        AND r.ultimaCodigoTipificacion = :codigoTipificacionGrupo
                        AND (
                            (:codigoSubtipificacionGrupo IS NULL AND r.ultimaCodigoSubtipificacion IS NULL)
                            OR r.ultimaCodigoSubtipificacion = :codigoSubtipificacionGrupo
                        )
                    )
              )
              AND (
                    :filtrarIngresoGrupo = false
                    OR (:sinValorGrupo = true AND l.lastEntryAt IS NULL)
                    OR (:sinValorGrupo = false AND l.lastEntryAt >= :ingresoInicio AND l.lastEntryAt < :ingresoFin)
              )
            ORDER BY
              CASE WHEN :sortBy = 'createdAt' AND :sortDesc = false THEN l.createdAt END ASC,
              CASE WHEN :sortBy = 'createdAt' AND :sortDesc = true THEN l.createdAt END DESC,
              CASE WHEN :sortBy = 'lastEntryAt' AND :sortDesc = false THEN l.lastEntryAt END ASC,
              CASE WHEN :sortBy = 'lastEntryAt' AND :sortDesc = true THEN l.lastEntryAt END DESC,
              CASE WHEN :sortBy = 'nombreAsesorAsignado' AND :sortDesc = false THEN l.nombreAsesorAsignado END ASC,
              CASE WHEN :sortBy = 'nombreAsesorAsignado' AND :sortDesc = true THEN l.nombreAsesorAsignado END DESC,

              CASE WHEN :sortBy = 'estado' AND :sortDesc = false THEN
                CASE
                  WHEN l.estado = :estadoNuevo THEN 1
                  WHEN l.estado = :estadoEnGestion THEN 2
                  WHEN l.estado = :estadoAsignado THEN 3
                  WHEN l.estado = :estadoGestionado THEN 4
                  ELSE 99
                END
              END ASC,
              CASE WHEN :sortBy = 'estado' AND :sortDesc = true THEN
                CASE
                  WHEN l.estado = :estadoNuevo THEN 1
                  WHEN l.estado = :estadoEnGestion THEN 2
                  WHEN l.estado = :estadoAsignado THEN 3
                  WHEN l.estado = :estadoGestionado THEN 4
                  ELSE 99
                END
              END DESC,

              CASE
                WHEN :sortBy = 'codigoTipificacion' THEN
                  CASE
                    WHEN :usarPrimeraTipificacion = true AND tPrimera.orden IS NULL THEN 1
                    WHEN :usarMayorTipificacion = true AND tMayor.orden IS NULL THEN 1
                    WHEN :usarUltimaTipificacion = true AND tUltima.orden IS NULL THEN 1
                    ELSE 0
                  END
                ELSE 0
              END ASC,
              CASE WHEN :sortBy = 'codigoTipificacion' AND :sortDesc = false AND :usarPrimeraTipificacion = true THEN tPrimera.orden END ASC,
              CASE WHEN :sortBy = 'codigoTipificacion' AND :sortDesc = true AND :usarPrimeraTipificacion = true THEN tPrimera.orden END DESC,
              CASE WHEN :sortBy = 'codigoTipificacion' AND :sortDesc = false AND :usarPrimeraTipificacion = true THEN sPrimera.orden END ASC,
              CASE WHEN :sortBy = 'codigoTipificacion' AND :sortDesc = true AND :usarPrimeraTipificacion = true THEN sPrimera.orden END DESC,
              CASE WHEN :sortBy = 'codigoTipificacion' AND :sortDesc = false AND :usarPrimeraTipificacion = true THEN r.primeraCodigoTipificacion END ASC,
              CASE WHEN :sortBy = 'codigoTipificacion' AND :sortDesc = true AND :usarPrimeraTipificacion = true THEN r.primeraCodigoTipificacion END DESC,
              CASE WHEN :sortBy = 'codigoTipificacion' AND :sortDesc = false AND :usarPrimeraTipificacion = true THEN r.primeraCodigoSubtipificacion END ASC,
              CASE WHEN :sortBy = 'codigoTipificacion' AND :sortDesc = true AND :usarPrimeraTipificacion = true THEN r.primeraCodigoSubtipificacion END DESC,

              CASE WHEN :sortBy = 'codigoTipificacion' AND :sortDesc = false AND :usarMayorTipificacion = true THEN tMayor.orden END ASC,
              CASE WHEN :sortBy = 'codigoTipificacion' AND :sortDesc = true AND :usarMayorTipificacion = true THEN tMayor.orden END DESC,
              CASE WHEN :sortBy = 'codigoTipificacion' AND :sortDesc = false AND :usarMayorTipificacion = true THEN sMayor.orden END ASC,
              CASE WHEN :sortBy = 'codigoTipificacion' AND :sortDesc = true AND :usarMayorTipificacion = true THEN sMayor.orden END DESC,
              CASE WHEN :sortBy = 'codigoTipificacion' AND :sortDesc = false AND :usarMayorTipificacion = true THEN r.mayorRangoCodigoTipificacion END ASC,
              CASE WHEN :sortBy = 'codigoTipificacion' AND :sortDesc = true AND :usarMayorTipificacion = true THEN r.mayorRangoCodigoTipificacion END DESC,
              CASE WHEN :sortBy = 'codigoTipificacion' AND :sortDesc = false AND :usarMayorTipificacion = true THEN r.mayorRangoCodigoSubtipificacion END ASC,
              CASE WHEN :sortBy = 'codigoTipificacion' AND :sortDesc = true AND :usarMayorTipificacion = true THEN r.mayorRangoCodigoSubtipificacion END DESC,

              CASE WHEN :sortBy = 'codigoTipificacion' AND :sortDesc = false AND :usarUltimaTipificacion = true THEN tUltima.orden END ASC,
              CASE WHEN :sortBy = 'codigoTipificacion' AND :sortDesc = true AND :usarUltimaTipificacion = true THEN tUltima.orden END DESC,
              CASE WHEN :sortBy = 'codigoTipificacion' AND :sortDesc = false AND :usarUltimaTipificacion = true THEN sUltima.orden END ASC,
              CASE WHEN :sortBy = 'codigoTipificacion' AND :sortDesc = true AND :usarUltimaTipificacion = true THEN sUltima.orden END DESC,
              CASE WHEN :sortBy = 'codigoTipificacion' AND :sortDesc = false AND :usarUltimaTipificacion = true THEN r.ultimaCodigoTipificacion END ASC,
              CASE WHEN :sortBy = 'codigoTipificacion' AND :sortDesc = true AND :usarUltimaTipificacion = true THEN r.ultimaCodigoTipificacion END DESC,
              CASE WHEN :sortBy = 'codigoTipificacion' AND :sortDesc = false AND :usarUltimaTipificacion = true THEN r.ultimaCodigoSubtipificacion END ASC,
              CASE WHEN :sortBy = 'codigoTipificacion' AND :sortDesc = true AND :usarUltimaTipificacion = true THEN r.ultimaCodigoSubtipificacion END DESC,

              l.lastEntryAt DESC,
              l.id DESC
            """)
    Page<LeadGtrResponse> listarLeadsMasivo(
            @Param("filtrarProveedor") boolean filtrarProveedor,
            @Param("idProveedor") Long idProveedor,
            @Param("filtrarEtapa") boolean filtrarEtapa,
            @Param("etapa") Etapa etapa,
            @Param("filtrarTipificaciones") boolean filtrarTipificaciones,
            @Param("codigosTipificacion") Collection<String> codigosTipificacion,
            @Param("filtrarSubtipificaciones") boolean filtrarSubtipificaciones,
            @Param("codigosSubtipificacion") Collection<String> codigosSubtipificacion,
            @Param("codigosTipificacionExcluidos") Collection<String> codigosTipificacionExcluidos,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds,
            @Param("filtrarFechaDesde") boolean filtrarFechaDesde,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("filtrarFechaHasta") boolean filtrarFechaHasta,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("etapaResumen") Etapa etapaResumen,
            @Param("usarPrimeraTipificacion") boolean usarPrimeraTipificacion,
            @Param("usarMayorTipificacion") boolean usarMayorTipificacion,
            @Param("usarUltimaTipificacion") boolean usarUltimaTipificacion,
            @Param("filtrarEstadoGrupo") boolean filtrarEstadoGrupo,
            @Param("estadoGrupo") EstadoSeguimiento estadoGrupo,
            @Param("filtrarPrimeraTipificacionGrupo") boolean filtrarPrimeraTipificacionGrupo,
            @Param("filtrarMayorTipificacionGrupo") boolean filtrarMayorTipificacionGrupo,
            @Param("filtrarUltimaTipificacionGrupo") boolean filtrarUltimaTipificacionGrupo,
            @Param("codigoTipificacionGrupo") String codigoTipificacionGrupo,
            @Param("codigoSubtipificacionGrupo") String codigoSubtipificacionGrupo,
            @Param("filtrarIngresoGrupo") boolean filtrarIngresoGrupo,
            @Param("ingresoInicio") Instant ingresoInicio,
            @Param("ingresoFin") Instant ingresoFin,
            @Param("sinValorGrupo") boolean sinValorGrupo,
            @Param("sortBy") String sortBy,
            @Param("sortDesc") boolean sortDesc,
            @Param("estadoNuevo") EstadoSeguimiento estadoNuevo,
            @Param("estadoEnGestion") EstadoSeguimiento estadoEnGestion,
            @Param("estadoAsignado") EstadoSeguimiento estadoAsignado,
            @Param("estadoGestionado") EstadoSeguimiento estadoGestionado,
            Pageable pageable
    );

    @Query("""
            SELECT NULL AS idGrupo,
                   CONCAT('', l.estado) AS etiqueta,
                   NULL AS codigoTipificacion,
                   NULL AS codigoSubtipificacion,
                   COUNT(l.id) AS cantidad
            FROM Lead l
            LEFT JOIN l.campana c
            LEFT JOIN c.proveedor p
            LEFT JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = :etapaResumen
            WHERE (:filtrarProveedor = false OR p.id = :idProveedor)
              AND (:filtrarEtapa = false OR l.etapa = :etapa)
              AND (r.ultimaCodigoTipificacion IS NULL OR r.ultimaCodigoTipificacion NOT IN :codigosTipificacionExcluidos)
              AND (
                    :filtrarTipificaciones = false
                    OR (:usarPrimeraTipificacion = true AND r.primeraCodigoTipificacion IN :codigosTipificacion)
                    OR (:usarMayorTipificacion = true AND r.mayorRangoCodigoTipificacion IN :codigosTipificacion)
                    OR (:usarUltimaTipificacion = true AND r.ultimaCodigoTipificacion IN :codigosTipificacion)
              )
              AND (
                    :filtrarSubtipificaciones = false
                    OR (:usarPrimeraTipificacion = true AND r.primeraCodigoSubtipificacion IN :codigosSubtipificacion)
                    OR (:usarMayorTipificacion = true AND r.mayorRangoCodigoSubtipificacion IN :codigosSubtipificacion)
                    OR (:usarUltimaTipificacion = true AND r.ultimaCodigoSubtipificacion IN :codigosSubtipificacion)
              )
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
              AND (:filtrarFechaDesde = false OR l.lastEntryAt >= :fechaDesde)
              AND (:filtrarFechaHasta = false OR l.lastEntryAt < :fechaHasta)
            GROUP BY l.estado
            """)
    List<LeadGtrAgrupacionProjection> agruparLeadsMasivoPorEstado(
            @Param("filtrarProveedor") boolean filtrarProveedor,
            @Param("idProveedor") Long idProveedor,
            @Param("filtrarEtapa") boolean filtrarEtapa,
            @Param("etapa") Etapa etapa,
            @Param("filtrarTipificaciones") boolean filtrarTipificaciones,
            @Param("codigosTipificacion") Collection<String> codigosTipificacion,
            @Param("filtrarSubtipificaciones") boolean filtrarSubtipificaciones,
            @Param("codigosSubtipificacion") Collection<String> codigosSubtipificacion,
            @Param("codigosTipificacionExcluidos") Collection<String> codigosTipificacionExcluidos,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds,
            @Param("filtrarFechaDesde") boolean filtrarFechaDesde,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("filtrarFechaHasta") boolean filtrarFechaHasta,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("etapaResumen") Etapa etapaResumen,
            @Param("usarPrimeraTipificacion") boolean usarPrimeraTipificacion,
            @Param("usarMayorTipificacion") boolean usarMayorTipificacion,
            @Param("usarUltimaTipificacion") boolean usarUltimaTipificacion
    );

    @Query("""
            SELECT NULL AS idGrupo,
                   NULL AS etiqueta,
                   r.ultimaCodigoTipificacion AS codigoTipificacion,
                   r.ultimaCodigoSubtipificacion AS codigoSubtipificacion,
                   COUNT(l.id) AS cantidad
            FROM Lead l
            LEFT JOIN l.campana c
            LEFT JOIN c.proveedor p
            LEFT JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = :etapaResumen
            WHERE (:filtrarProveedor = false OR p.id = :idProveedor)
              AND (:filtrarEtapa = false OR l.etapa = :etapa)
              AND (r.ultimaCodigoTipificacion IS NULL OR r.ultimaCodigoTipificacion NOT IN :codigosTipificacionExcluidos)
              AND (:filtrarTipificaciones = false OR r.ultimaCodigoTipificacion IN :codigosTipificacion)
              AND (:filtrarSubtipificaciones = false OR r.ultimaCodigoSubtipificacion IN :codigosSubtipificacion)
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
              AND (:filtrarFechaDesde = false OR l.lastEntryAt >= :fechaDesde)
              AND (:filtrarFechaHasta = false OR l.lastEntryAt < :fechaHasta)
            GROUP BY r.ultimaCodigoTipificacion, r.ultimaCodigoSubtipificacion
            """)
    List<LeadGtrAgrupacionProjection> agruparLeadsMasivoPorUltimaTipificacion(
            @Param("filtrarProveedor") boolean filtrarProveedor,
            @Param("idProveedor") Long idProveedor,
            @Param("filtrarEtapa") boolean filtrarEtapa,
            @Param("etapa") Etapa etapa,
            @Param("filtrarTipificaciones") boolean filtrarTipificaciones,
            @Param("codigosTipificacion") Collection<String> codigosTipificacion,
            @Param("filtrarSubtipificaciones") boolean filtrarSubtipificaciones,
            @Param("codigosSubtipificacion") Collection<String> codigosSubtipificacion,
            @Param("codigosTipificacionExcluidos") Collection<String> codigosTipificacionExcluidos,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds,
            @Param("filtrarFechaDesde") boolean filtrarFechaDesde,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("filtrarFechaHasta") boolean filtrarFechaHasta,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("etapaResumen") Etapa etapaResumen
    );

    @Query(value = """
            SELECT NULL AS "idGrupo",
                   to_char(l.last_entry_at AT TIME ZONE 'America/Lima', 'YYYY-MM-DD') AS "etiqueta",
                   NULL AS "codigoTipificacion",
                   NULL AS "codigoSubtipificacion",
                   COUNT(l.id) AS "cantidad"
            FROM lead l
            LEFT JOIN campana c ON c.id = l.id_campana
            LEFT JOIN proveedor p ON p.id = c.id_proveedor
            LEFT JOIN lead_etapa_resumen r ON r.id_lead = l.id AND r.etapa = CAST(:etapaResumen AS text)
            WHERE (:filtrarProveedor = false OR p.id = :idProveedor)
              AND (:filtrarEtapa = false OR l.etapa = CAST(:etapa AS text))
              AND (r.ultima_codigo_tipificacion IS NULL OR r.ultima_codigo_tipificacion NOT IN (:codigosTipificacionExcluidos))
              AND (
                    :filtrarTipificaciones = false
                    OR (:usarPrimeraTipificacion = true AND r.primera_codigo_tipificacion IN (:codigosTipificacion))
                    OR (:usarMayorTipificacion = true AND r.mayor_rango_codigo_tipificacion IN (:codigosTipificacion))
                    OR (:usarUltimaTipificacion = true AND r.ultima_codigo_tipificacion IN (:codigosTipificacion))
              )
              AND (
                    :filtrarSubtipificaciones = false
                    OR (:usarPrimeraTipificacion = true AND r.primera_codigo_subtipificacion IN (:codigosSubtipificacion))
                    OR (:usarMayorTipificacion = true AND r.mayor_rango_codigo_subtipificacion IN (:codigosSubtipificacion))
                    OR (:usarUltimaTipificacion = true AND r.ultima_codigo_subtipificacion IN (:codigosSubtipificacion))
              )
              AND (:filtrarEquipos = false OR l.id_equipo IN (:equipoIds))
              AND (:filtrarFechaDesde = false OR l.last_entry_at >= :fechaDesde)
              AND (:filtrarFechaHasta = false OR l.last_entry_at < :fechaHasta)
            GROUP BY to_char(l.last_entry_at AT TIME ZONE 'America/Lima', 'YYYY-MM-DD')
            """, nativeQuery = true)
    List<LeadGtrAgrupacionProjection> agruparLeadsMasivoPorIngreso(
            @Param("filtrarProveedor") boolean filtrarProveedor,
            @Param("idProveedor") Long idProveedor,
            @Param("filtrarEtapa") boolean filtrarEtapa,
            @Param("etapa") String etapa,
            @Param("filtrarTipificaciones") boolean filtrarTipificaciones,
            @Param("codigosTipificacion") Collection<String> codigosTipificacion,
            @Param("filtrarSubtipificaciones") boolean filtrarSubtipificaciones,
            @Param("codigosSubtipificacion") Collection<String> codigosSubtipificacion,
            @Param("codigosTipificacionExcluidos") Collection<String> codigosTipificacionExcluidos,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds,
            @Param("filtrarFechaDesde") boolean filtrarFechaDesde,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("filtrarFechaHasta") boolean filtrarFechaHasta,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("etapaResumen") String etapaResumen,
            @Param("usarPrimeraTipificacion") boolean usarPrimeraTipificacion,
            @Param("usarMayorTipificacion") boolean usarMayorTipificacion,
            @Param("usarUltimaTipificacion") boolean usarUltimaTipificacion
    );

    // ── Ranking GTR: preventas concretadas leidas del resumen por etapa (LeadEtapaResumen) ──
    // Fuente de verdad del cierre PREVENTA→VENTA = merito de la etapa PREVENTA (idAsesorMerito/
    // fechaMerito). Lead es raiz para conservar el @Filter por equipo; se joinea el resumen.
    //
    // Regla de coherencia (l.etapa <> 'PREVENTA'): el merito ya NO se borra al rechazar una preventa
    // (es permanente). Una preventa cuyo lead volvio a etapa PREVENTA (rechazada/pendiente) NO es una
    // preventa completa justificada, asi que se excluye de los contadores. Solo cuenta si el lead avanzo
    // (VENTA/POSTVENTA/COBRANZA). Esto reemplaza al viejo borrado de fechaMerito.

    @Query("""
            SELECT r.idAsesorMerito AS idAsesor,
                   COUNT(r.id) AS cantidad
            FROM Lead l
            JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = 'PREVENTA'
            WHERE r.idAsesorMerito IS NOT NULL
              AND r.fechaMerito >= :fechaDesde
              AND r.fechaMerito < :fechaHasta
              AND l.etapa <> 'PREVENTA'
              AND (:soloIngresados = false
                   OR EXISTS (SELECT 1 FROM Evento reg
                              WHERE reg.idLead = l.id
                                AND reg.accion = :accionRegistro
                                AND reg.createdAt >= :fechaDesde
                                AND reg.createdAt < :fechaHasta))
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
              AND (:soloActivos = false
                   OR EXISTS (SELECT 1 FROM Lead la
                              WHERE la.idAsesorAsignado = r.idAsesorMerito
                                AND la.etapa = 'PREVENTA'))
            GROUP BY r.idAsesorMerito
            """)
    List<AsesorPreventaCantidadProjection> resumirPreventasPorAsesorLeadGtr(
            @Param("soloIngresados") boolean soloIngresados,
            @Param("accionRegistro") Accion accionRegistro,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("soloActivos") boolean soloActivos,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds
    );

    @Query("""
            SELECT r.idAsesorMerito AS idAsesor,
                   p.id AS idProveedor,
                   p.nombre AS nombreProveedor,
                   COUNT(r.id) AS cantidad
            FROM Lead l
            JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = 'PREVENTA'
            JOIN l.plan pl
            JOIN pl.proveedor p
            WHERE r.idAsesorMerito IS NOT NULL
              AND r.fechaMerito >= :fechaDesde
              AND r.fechaMerito < :fechaHasta
              AND l.etapa <> 'PREVENTA'
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
              AND (:soloActivos = false
                   OR EXISTS (SELECT 1 FROM Lead la
                              WHERE la.idAsesorAsignado = r.idAsesorMerito
                                AND la.etapa = 'PREVENTA'))
            GROUP BY r.idAsesorMerito, p.id, p.nombre
            """)
    List<AsesorProveedorPreventaProjection> resumirPreventasMensualesPorProveedorLeadGtr(
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("soloActivos") boolean soloActivos,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds
    );

    // ── Ranking GTR: tipificaciones/subtipificaciones por LEADS (no eventos) ──
    // Cuenta LEADS distintos por su tipificacion en PREVENTA (uno por lead), no la suma de intentos.
    // El :campo elige el punto de tipificacion (PRIMERA/ULTIMA/MAYOR) tal como en el DASHBOARD del ADMIN.
    //
    // Dos cohortes (modo):
    //  - GESTIONADOS: el periodo filtra por la FECHA de la tipificacion del campo elegido (primera/
    //    ultima/mayorRangoAt), no por el registro del lead.
    //  - INGRESADOS: cohorte = leads con evento REGISTRO en el periodo (los "leads del dia"), agrupados
    //    por su tipificacion actual del campo elegido.
    // soloActivos no aplica (no hay un actor unico por lead). Lead es raiz (@Filter por equipo) y se
    // acota tambien por equipoIds explicitos, igual que el resto del ranking GTR.

    // El modo es un booleano :ingresados. GESTIONADOS (false): el periodo filtra por la fecha de la
    // tipificacion del campo. INGRESADOS (true): el lead entra si tuvo un evento REGISTRO en el periodo
    // (cohorte "leads del dia"), agrupado por su tipificacion actual del campo. El GROUP BY es una
    // expresion fija (sin parametro) para que Postgres lo empate con el SELECT.

    @Query("""
            SELECT TRIM(r.primeraCodigoTipificacion) AS tipificacion, COUNT(r.id) AS cantidad
            FROM Lead l
            JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = 'PREVENTA'
            WHERE r.primeraCodigoTipificacion IS NOT NULL AND TRIM(r.primeraCodigoTipificacion) <> ''
              AND ((:ingresados = false AND r.primeraTipificacionAt >= :fechaDesde AND r.primeraTipificacionAt < :fechaHasta)
                   OR (:ingresados = true AND EXISTS (SELECT 1 FROM Evento e
                              WHERE e.idLead = l.id AND e.accion = :accion
                                AND e.createdAt >= :fechaDesde AND e.createdAt < :fechaHasta)))
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
            GROUP BY TRIM(r.primeraCodigoTipificacion)
            """)
    List<TipificacionCantidadProjection> resumirTipiRankingGtrPrimera(
            @Param("ingresados") boolean ingresados,
            @Param("accion") Accion accion,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds
    );

    @Query("""
            SELECT TRIM(r.ultimaCodigoTipificacion) AS tipificacion, COUNT(r.id) AS cantidad
            FROM Lead l
            JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = 'PREVENTA'
            WHERE r.ultimaCodigoTipificacion IS NOT NULL AND TRIM(r.ultimaCodigoTipificacion) <> ''
              AND ((:ingresados = false AND r.ultimaTipificacionAt >= :fechaDesde AND r.ultimaTipificacionAt < :fechaHasta)
                   OR (:ingresados = true AND EXISTS (SELECT 1 FROM Evento e
                              WHERE e.idLead = l.id AND e.accion = :accion
                                AND e.createdAt >= :fechaDesde AND e.createdAt < :fechaHasta)))
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
            GROUP BY TRIM(r.ultimaCodigoTipificacion)
            """)
    List<TipificacionCantidadProjection> resumirTipiRankingGtrUltima(
            @Param("ingresados") boolean ingresados,
            @Param("accion") Accion accion,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds
    );

    @Query("""
            SELECT TRIM(r.mayorRangoCodigoTipificacion) AS tipificacion, COUNT(r.id) AS cantidad
            FROM Lead l
            JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = 'PREVENTA'
            WHERE r.mayorRangoCodigoTipificacion IS NOT NULL AND TRIM(r.mayorRangoCodigoTipificacion) <> ''
              AND ((:ingresados = false AND r.mayorRangoAt >= :fechaDesde AND r.mayorRangoAt < :fechaHasta)
                   OR (:ingresados = true AND EXISTS (SELECT 1 FROM Evento e
                              WHERE e.idLead = l.id AND e.accion = :accion
                                AND e.createdAt >= :fechaDesde AND e.createdAt < :fechaHasta)))
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
            GROUP BY TRIM(r.mayorRangoCodigoTipificacion)
            """)
    List<TipificacionCantidadProjection> resumirTipiRankingGtrMayor(
            @Param("ingresados") boolean ingresados,
            @Param("accion") Accion accion,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds
    );

    @Query("""
            SELECT COALESCE(NULLIF(TRIM(r.primeraCodigoSubtipificacion), ''), 'SIN_SUBTIPIFICACION') AS subtipificacion,
                   COUNT(r.id) AS cantidad
            FROM Lead l
            JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = 'PREVENTA'
            WHERE TRIM(r.primeraCodigoTipificacion) = :tipificacion
              AND ((:ingresados = false AND r.primeraTipificacionAt >= :fechaDesde AND r.primeraTipificacionAt < :fechaHasta)
                   OR (:ingresados = true AND EXISTS (SELECT 1 FROM Evento e
                              WHERE e.idLead = l.id AND e.accion = :accion
                                AND e.createdAt >= :fechaDesde AND e.createdAt < :fechaHasta)))
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
            GROUP BY COALESCE(NULLIF(TRIM(r.primeraCodigoSubtipificacion), ''), 'SIN_SUBTIPIFICACION')
            """)
    List<SubtipificacionCantidadProjection> resumirSubtipiRankingGtrPrimera(
            @Param("ingresados") boolean ingresados,
            @Param("accion") Accion accion,
            @Param("tipificacion") String tipificacion,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds
    );

    @Query("""
            SELECT COALESCE(NULLIF(TRIM(r.ultimaCodigoSubtipificacion), ''), 'SIN_SUBTIPIFICACION') AS subtipificacion,
                   COUNT(r.id) AS cantidad
            FROM Lead l
            JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = 'PREVENTA'
            WHERE TRIM(r.ultimaCodigoTipificacion) = :tipificacion
              AND ((:ingresados = false AND r.ultimaTipificacionAt >= :fechaDesde AND r.ultimaTipificacionAt < :fechaHasta)
                   OR (:ingresados = true AND EXISTS (SELECT 1 FROM Evento e
                              WHERE e.idLead = l.id AND e.accion = :accion
                                AND e.createdAt >= :fechaDesde AND e.createdAt < :fechaHasta)))
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
            GROUP BY COALESCE(NULLIF(TRIM(r.ultimaCodigoSubtipificacion), ''), 'SIN_SUBTIPIFICACION')
            """)
    List<SubtipificacionCantidadProjection> resumirSubtipiRankingGtrUltima(
            @Param("ingresados") boolean ingresados,
            @Param("accion") Accion accion,
            @Param("tipificacion") String tipificacion,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds
    );

    @Query("""
            SELECT COALESCE(NULLIF(TRIM(r.mayorRangoCodigoSubtipificacion), ''), 'SIN_SUBTIPIFICACION') AS subtipificacion,
                   COUNT(r.id) AS cantidad
            FROM Lead l
            JOIN LeadEtapaResumen r ON r.idLead = l.id AND r.etapa = 'PREVENTA'
            WHERE TRIM(r.mayorRangoCodigoTipificacion) = :tipificacion
              AND ((:ingresados = false AND r.mayorRangoAt >= :fechaDesde AND r.mayorRangoAt < :fechaHasta)
                   OR (:ingresados = true AND EXISTS (SELECT 1 FROM Evento e
                              WHERE e.idLead = l.id AND e.accion = :accion
                                AND e.createdAt >= :fechaDesde AND e.createdAt < :fechaHasta)))
              AND (:filtrarEquipos = false OR l.idEquipo IN :equipoIds)
            GROUP BY COALESCE(NULLIF(TRIM(r.mayorRangoCodigoSubtipificacion), ''), 'SIN_SUBTIPIFICACION')
            """)
    List<SubtipificacionCantidadProjection> resumirSubtipiRankingGtrMayor(
            @Param("ingresados") boolean ingresados,
            @Param("accion") Accion accion,
            @Param("tipificacion") String tipificacion,
            @Param("fechaDesde") Instant fechaDesde,
            @Param("fechaHasta") Instant fechaHasta,
            @Param("filtrarEquipos") boolean filtrarEquipos,
            @Param("equipoIds") Collection<Long> equipoIds
    );

    // Desvincula del equipo a los leads que apuntaban a él (al eliminar el equipo).
    @Modifying
    @Query(value = "UPDATE lead SET id_equipo = NULL WHERE id_equipo = :idEquipo", nativeQuery = true)
    int desvincularEquipo(@Param("idEquipo") Long idEquipo);

    // Todos los ids de lead (para iterar en el backfill de LeadEtapaResumen). Sin usuario => sin @Filter.
    @Query("SELECT l.id FROM Lead l ORDER BY l.id")
    List<Long> findAllLeadIds();

    @Query("SELECT l.id, l.idEquipo FROM Lead l ORDER BY l.id")
    List<Object[]> findAllLeadIdsAndEquipos();

    @Query("SELECT l.id, l.idEquipo FROM Lead l WHERE l.lead = :lead ORDER BY l.lastEntryAt DESC, l.id DESC")
    List<Object[]> findLeadIdsAndEquiposByLead(@Param("lead") String lead);
}
