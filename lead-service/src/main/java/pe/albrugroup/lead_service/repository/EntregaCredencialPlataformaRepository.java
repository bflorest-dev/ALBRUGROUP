package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.EntregaCredencialPlataforma;
import pe.albrugroup.lead_service.entity.enums.EstadoEntregaCredencial;

import java.util.Collection;
import java.util.List;

@Repository
public interface EntregaCredencialPlataformaRepository extends JpaRepository<EntregaCredencialPlataforma, Long> {

    @Query("""
            SELECT e
            FROM EntregaCredencialPlataforma e
            JOIN FETCH e.credencial c
            WHERE e.lead.id IN :leadIds
            ORDER BY e.createdAt DESC
            """)
    List<EntregaCredencialPlataforma> listarPorLeadIds(@Param("leadIds") Collection<Long> leadIds);

    @EntityGraph(attributePaths = {"credencial", "credencial.paquete", "credencial.paquete.plataforma"})
    List<EntregaCredencialPlataforma> findByLeadIdOrderByCreatedAtDesc(Long idLead);

    @Query("""
            SELECT COALESCE(SUM(e.cantidadUsuariosAsignados), 0)
            FROM EntregaCredencialPlataforma e
            WHERE e.credencial.id = :idCredencial
              AND e.estado = :estado
            """)
    Long sumarUsuariosAsignadosPorCredencialYEstado(
            @Param("idCredencial") Long idCredencial,
            @Param("estado") EstadoEntregaCredencial estado
    );
}
