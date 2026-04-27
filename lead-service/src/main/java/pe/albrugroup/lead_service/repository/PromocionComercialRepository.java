package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pe.albrugroup.lead_service.entity.PromocionComercial;

import java.util.List;
import java.util.Optional;

public interface PromocionComercialRepository extends JpaRepository<PromocionComercial, Long> {

    Optional<PromocionComercial> findByIdAndActivoTrue(Long id);

    @Query("""
            select distinct p
            from PromocionComercial p
            left join p.planes plan
            where p.activo = true
              and (:idProveedor is null or (p.proveedor is not null and p.proveedor.id = :idProveedor))
              and (:idZona is null or (p.zona is not null and p.zona.id = :idZona))
              and (:idPlan is null or plan.id = :idPlan)
            order by p.reglaComercial asc
            """)
    List<PromocionComercial> listarActivas(
            @Param("idProveedor") Long idProveedor,
            @Param("idZona") Long idZona,
            @Param("idPlan") Long idPlan
    );
}
