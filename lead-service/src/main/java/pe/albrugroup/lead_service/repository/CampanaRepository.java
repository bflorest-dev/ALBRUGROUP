package pe.albrugroup.lead_service.repository;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.Campana;

import java.util.List;
import java.util.Optional;

@Repository
public interface CampanaRepository extends JpaRepository<Campana, Long> {

    Optional<Campana> findByNombre(String nombre);
    Optional<Campana> findByIdAndActivoTrue(Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM Campana c WHERE c.id = :id AND c.activo = true")
    Optional<Campana> findActiveByIdForUpdate(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT c FROM Campana c WHERE c.id = :id")
    Optional<Campana> findByIdForSubsanacion(@Param("id") Long id);

    @Query("SELECT c FROM Campana c WHERE (:activo IS NULL OR c.activo = :activo)")
    List<Campana> listarPorActivo(@Param("activo") Boolean activo);

      @Query("""
              SELECT c
              FROM Campana c
              WHERE c.proveedor.id = :idProveedor
                AND (:activo IS NULL OR c.activo = :activo)
              ORDER BY c.nombre ASC
              """)
      List<Campana> listarPorProveedorYActivo(
              @Param("idProveedor") Long idProveedor,
              @Param("activo") Boolean activo
      );

    @Query("""
            SELECT c
            FROM Campana c
            WHERE c.proveedor.id IN :proveedorIds
              AND c.activo = true
            ORDER BY c.nombre ASC
            """)
    List<Campana> listarActivasPorProveedorIds(@Param("proveedorIds") java.util.Collection<Long> proveedorIds);

    @Query("""
            SELECT c
            FROM Campana c
            JOIN EquipoCampana ec ON ec.campana = c
            WHERE c.activo = true
              AND ec.idEquipo = :idEquipo
            ORDER BY c.nombre ASC
            """)
    List<Campana> listarActivasPorEquipo(@Param("idEquipo") Long idEquipo);

    @Query("""
            SELECT c
            FROM Campana c
            JOIN EquipoCampana ec ON ec.campana = c
            WHERE ec.idEquipo = :idEquipo
            ORDER BY c.nombre ASC
            """)
    List<Campana> listarTodasPorEquipo(@Param("idEquipo") Long idEquipo);
}
