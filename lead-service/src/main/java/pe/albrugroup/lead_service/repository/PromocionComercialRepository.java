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
            select p
            from PromocionComercial p
            where p.activo = true
              and (
                    :idProveedor is null
                    or (p.interno = false and p.proveedor is not null and p.proveedor.id = :idProveedor)
                    or (p.interno = true and (p.proveedor is null or p.proveedor.id = :idProveedor))
              )
              and (:interno is null or p.interno = :interno)
              and (:idZona is null or (p.zona is not null and p.zona.id = :idZona))
            order by p.nombre asc
            """)
    List<PromocionComercial> listarActivas(
            @Param("idProveedor") Long idProveedor,
            @Param("interno") Boolean interno,
            @Param("idZona") Long idZona
    );
}
