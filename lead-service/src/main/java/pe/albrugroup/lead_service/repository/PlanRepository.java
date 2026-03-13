package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pe.albrugroup.lead_service.entity.Plan;

import java.time.LocalDate;
import java.util.List;

public interface PlanRepository extends JpaRepository<Plan, Long> {

    @Query("""
            select p
            from Plan p
            where p.activo = true
              and (:idProveedor is null or p.proveedor.id = :idProveedor)
              and (
                    :soloVigentes = false
                    or (
                        p.vigenciaDesde <= :fechaActual
                        and (p.vigenciaHasta is null or p.vigenciaHasta >= :fechaActual)
                    )
              )
            order by p.proveedor.nombre asc, p.nombre asc
            """)
    List<Plan> listarActivos(
            @Param("idProveedor") Long idProveedor,
            @Param("soloVigentes") boolean soloVigentes,
            @Param("fechaActual") LocalDate fechaActual
    );
}
