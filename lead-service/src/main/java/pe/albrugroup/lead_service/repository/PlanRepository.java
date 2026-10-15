package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import pe.albrugroup.lead_service.entity.Plan;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface PlanRepository extends JpaRepository<Plan, Long> {

    Optional<Plan> findByIdAndActivoTrue(Long id);

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

    @Query("""
            select distinct p
            from Plan p
            left join fetch p.proveedor proveedor
            left join fetch p.internet internet
            left join fetch p.television television
            left join fetch p.telefono telefono
            left join fetch p.zona zona
            left join fetch p.adicionales planAdicional
            left join fetch planAdicional.adicional adicional
            where p.activo = true
              and p.proveedor.id = :idProveedor
              and (:ignorarZona = true or p.zona.id = :idZona)
              and p.vigenciaDesde <= :fechaActual
              and (p.vigenciaHasta is null or p.vigenciaHasta >= :fechaActual)
              and (
                    :tienePrecioPromocional is null
                    or (:tienePrecioPromocional = true and p.precioPromocional is not null)
                    or (:tienePrecioPromocional = false and p.precioPromocional is null)
              )
              and (
                    :tieneVelocidadPromocional is null
                    or (:tieneVelocidadPromocional = true and p.velocidadPromocional is not null)
                    or (:tieneVelocidadPromocional = false and p.velocidadPromocional is null)
              )
              and (
                    :composicion is null
                    or (:composicion = 'INTERNET' and internet.id is not null and television.id is null and telefono.id is null)
                    or (:composicion = 'INTERNET_TV' and internet.id is not null and television.id is not null and telefono.id is null)
                    or (:composicion = 'INTERNET_TELEFONIA' and internet.id is not null and television.id is null and telefono.id is not null)
                    or (:composicion = 'INTERNET_TV_TELEFONIA' and internet.id is not null and television.id is not null and telefono.id is not null)
                    or (:composicion = 'TV' and internet.id is null and television.id is not null and telefono.id is null)
                    or (:composicion = 'TELEFONIA' and internet.id is null and television.id is null and telefono.id is not null)
                    or (:composicion = 'TV_TELEFONIA' and internet.id is null and television.id is not null and telefono.id is not null)
              )
              and (
                    :tienePromocionInterna is null
                    or (
                        :tienePromocionInterna = true
                        and exists (
                            select 1
                            from PromocionComercial promocion
                            left join promocion.zonas promoZona
                            where promocion.activo = true
                              and (promocion.proveedor is null or promocion.proveedor.id = :idProveedor)
                              and (promocion.zonas is empty or promoZona.id = :idZona)
                              and (promocion.planes is empty or p member of promocion.planes)
                        )
                    )
                    or (
                        :tienePromocionInterna = false
                        and not exists (
                            select 1
                            from PromocionComercial promocion
                            left join promocion.zonas promoZona
                            where promocion.activo = true
                              and (promocion.proveedor is null or promocion.proveedor.id = :idProveedor)
                              and (promocion.zonas is empty or promoZona.id = :idZona)
                              and (promocion.planes is empty or p member of promocion.planes)
                        )
                    )
              )
            order by p.nombre asc
            """)
    List<Plan> buscarParaOferta(
            @Param("idProveedor") Long idProveedor,
            @Param("idZona") Long idZona,
            @Param("ignorarZona") boolean ignorarZona,
            @Param("tienePrecioPromocional") Boolean tienePrecioPromocional,
            @Param("tieneVelocidadPromocional") Boolean tieneVelocidadPromocional,
            @Param("tienePromocionInterna") Boolean tienePromocionInterna,
            @Param("composicion") String composicion,
            @Param("fechaActual") LocalDate fechaActual
    );

    @Query("""
            SELECT p
            FROM Plan p
            JOIN FETCH p.proveedor pr
            WHERE (:idProveedor IS NULL OR pr.id = :idProveedor)
            ORDER BY pr.nombre ASC, p.nombre ASC
            """)
    List<Plan> listarTodosPorProveedor(@Param("idProveedor") Long idProveedor);
}
