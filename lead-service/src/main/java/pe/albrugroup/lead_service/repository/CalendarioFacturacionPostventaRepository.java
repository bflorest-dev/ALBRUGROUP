package pe.albrugroup.lead_service.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.CalendarioFacturacionPostventa;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.response.CortePostventaResponse;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface CalendarioFacturacionPostventaRepository extends JpaRepository<CalendarioFacturacionPostventa, Long> {

    Optional<CalendarioFacturacionPostventa> findByLeadId(Long idLead);
    long countByLeadId(Long idLead);

    @Modifying
    @Query("DELETE FROM CalendarioFacturacionPostventa c WHERE c.lead.id = :idLead")
    void deleteByLeadId(@Param("idLead") Long idLead);

    @EntityGraph(attributePaths = {
            "lead",
            "lead.datosPreventa",
            "lead.plan",
            "lead.plataformaDigitalOfrecida"
    })
    Optional<CalendarioFacturacionPostventa> findWithLeadByLeadId(Long idLead);

    @EntityGraph(attributePaths = {"lead"})
    @Query("SELECT c FROM CalendarioFacturacionPostventa c WHERE c.id = :id")
    Optional<CalendarioFacturacionPostventa> findWithLeadById(@Param("id") Long id);

    @EntityGraph(attributePaths = {
            "lead",
            "lead.datosPreventa",
            "lead.plan",
            "lead.plataformaDigitalOfrecida"
    })
    @Query("""
            SELECT c
            FROM CalendarioFacturacionPostventa c
            JOIN c.lead l
            LEFT JOIN l.datosPreventa dp
            WHERE l.etapa = :etapa
              AND c.activo = true
              AND c.fechaInstalacion >= :fechaDesde
              AND c.fechaInstalacion <= :fechaHasta
              AND (:buscar = ''
                   OR l.lead LIKE CONCAT('%', :buscar, '%')
                   OR dp.numeroDocumentoTitularServicio LIKE CONCAT('%', :buscar, '%'))
            """)
    Page<CalendarioFacturacionPostventa> listarBandejaPostventa(
            @Param("etapa") Etapa etapa,
            @Param("buscar") String buscar,
            @Param("fechaDesde") LocalDate fechaDesde,
            @Param("fechaHasta") LocalDate fechaHasta,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {
            "lead",
            "lead.datosPreventa",
            "lead.plan",
            "lead.plan.proveedor",
            "lead.plataformaDigitalOfrecida"
    })
    @Query("""
            SELECT c
            FROM CalendarioFacturacionPostventa c
            JOIN c.lead l
            LEFT JOIN l.datosPreventa dp
            LEFT JOIN l.plan pl
            LEFT JOIN pl.proveedor pp
            WHERE l.etapa = :etapa
              AND c.activo = true
              AND (
                    pp.id IN :proveedorIds
                    OR UPPER(TRIM(COALESCE(c.proveedorSnapshot, ''))) IN :proveedorNombres
                  )
              AND c.fechaInstalacion >= :fechaDesde
              AND c.fechaInstalacion <= :fechaHasta
              AND (:buscar = ''
                   OR l.lead LIKE CONCAT('%', :buscar, '%')
                   OR dp.numeroDocumentoTitularServicio LIKE CONCAT('%', :buscar, '%'))
            """)
    Page<CalendarioFacturacionPostventa> listarBandejaPostventaPorProveedores(
            @Param("etapa") Etapa etapa,
            @Param("proveedorIds") java.util.Collection<Long> proveedorIds,
            @Param("proveedorNombres") java.util.Collection<String> proveedorNombres,
            @Param("buscar") String buscar,
            @Param("fechaDesde") LocalDate fechaDesde,
            @Param("fechaHasta") LocalDate fechaHasta,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {
            "lead",
            "lead.datosPreventa",
            "lead.plan",
            "lead.plataformaDigitalOfrecida"
    })
    @Query("""
            SELECT c
            FROM CalendarioFacturacionPostventa c
            JOIN c.lead l
            LEFT JOIN l.datosPreventa dp
            WHERE l.etapa = :etapa
              AND c.activo = true
              AND c.mesCorteBase = :mesCorteBase
              AND c.numeroCorteBase = :numeroCorteBase
              AND c.fechaInstalacion >= :fechaDesde
              AND c.fechaInstalacion <= :fechaHasta
              AND (:buscar = ''
                   OR l.lead LIKE CONCAT('%', :buscar, '%')
                   OR dp.numeroDocumentoTitularServicio LIKE CONCAT('%', :buscar, '%'))
            """)
    Page<CalendarioFacturacionPostventa> listarBandejaPostventaPorCorte(
            @Param("etapa") Etapa etapa,
            @Param("mesCorteBase") LocalDate mesCorteBase,
            @Param("numeroCorteBase") Integer numeroCorteBase,
            @Param("buscar") String buscar,
            @Param("fechaDesde") LocalDate fechaDesde,
            @Param("fechaHasta") LocalDate fechaHasta,
            Pageable pageable
    );

    @EntityGraph(attributePaths = {
            "lead",
            "lead.datosPreventa",
            "lead.plan",
            "lead.plan.proveedor",
            "lead.plataformaDigitalOfrecida"
    })
    @Query("""
            SELECT c
            FROM CalendarioFacturacionPostventa c
            JOIN c.lead l
            LEFT JOIN l.datosPreventa dp
            LEFT JOIN l.plan pl
            LEFT JOIN pl.proveedor pp
            WHERE l.etapa = :etapa
              AND c.activo = true
              AND c.mesCorteBase = :mesCorteBase
              AND c.numeroCorteBase = :numeroCorteBase
              AND (
                    pp.id IN :proveedorIds
                    OR UPPER(TRIM(COALESCE(c.proveedorSnapshot, ''))) IN :proveedorNombres
                  )
              AND c.fechaInstalacion >= :fechaDesde
              AND c.fechaInstalacion <= :fechaHasta
              AND (:buscar = ''
                   OR l.lead LIKE CONCAT('%', :buscar, '%')
                   OR dp.numeroDocumentoTitularServicio LIKE CONCAT('%', :buscar, '%'))
            """)
    Page<CalendarioFacturacionPostventa> listarBandejaPostventaPorCorteYProveedores(
            @Param("etapa") Etapa etapa,
            @Param("mesCorteBase") LocalDate mesCorteBase,
            @Param("numeroCorteBase") Integer numeroCorteBase,
            @Param("proveedorIds") java.util.Collection<Long> proveedorIds,
            @Param("proveedorNombres") java.util.Collection<String> proveedorNombres,
            @Param("buscar") String buscar,
            @Param("fechaDesde") LocalDate fechaDesde,
            @Param("fechaHasta") LocalDate fechaHasta,
            Pageable pageable
    );

    @Query("""
            SELECT new pe.albrugroup.lead_service.entity.response.CortePostventaResponse(
                    c.mesCorteBase, c.numeroCorteBase
            )
            FROM CalendarioFacturacionPostventa c
            JOIN c.lead l
            WHERE l.etapa = :etapa
              AND c.activo = true
              AND c.mesCorteBase IS NOT NULL
              AND c.numeroCorteBase IS NOT NULL
            GROUP BY c.mesCorteBase, c.numeroCorteBase
            ORDER BY c.mesCorteBase DESC, c.numeroCorteBase DESC
            """)
    List<CortePostventaResponse> listarCortesPostventa(@Param("etapa") Etapa etapa);

    @Query("""
            SELECT new pe.albrugroup.lead_service.entity.response.CortePostventaResponse(
                    c.mesCorteBase, c.numeroCorteBase
            )
            FROM CalendarioFacturacionPostventa c
            JOIN c.lead l
            LEFT JOIN l.plan pl
            LEFT JOIN pl.proveedor pp
            WHERE l.etapa = :etapa
              AND c.activo = true
              AND c.mesCorteBase IS NOT NULL
              AND c.numeroCorteBase IS NOT NULL
              AND (
                    pp.id IN :proveedorIds
                    OR UPPER(TRIM(COALESCE(c.proveedorSnapshot, ''))) IN :proveedorNombres
                  )
            GROUP BY c.mesCorteBase, c.numeroCorteBase
            ORDER BY c.mesCorteBase DESC, c.numeroCorteBase DESC
            """)
    List<CortePostventaResponse> listarCortesPostventaPorProveedores(
            @Param("etapa") Etapa etapa,
            @Param("proveedorIds") java.util.Collection<Long> proveedorIds,
            @Param("proveedorNombres") java.util.Collection<String> proveedorNombres
    );
}
