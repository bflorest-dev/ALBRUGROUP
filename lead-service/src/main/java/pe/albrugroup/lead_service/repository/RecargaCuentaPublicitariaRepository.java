package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.RecargaCuentaPublicitaria;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface RecargaCuentaPublicitariaRepository extends JpaRepository<RecargaCuentaPublicitaria, Long> {

    @Query("""
            SELECT r FROM RecargaCuentaPublicitaria r
            JOIN FETCH r.cuentaPublicitaria c
            WHERE c.id = :idCuenta
              AND r.fecha >= :desde
              AND r.fecha < :hasta
            ORDER BY r.fecha DESC
            """)
    List<RecargaCuentaPublicitaria> listarPorCuentaYRango(
            @Param("idCuenta") Long idCuenta,
            @Param("desde") LocalDateTime desde,
            @Param("hasta") LocalDateTime hasta);

    @Query("""
            SELECT r FROM RecargaCuentaPublicitaria r
            JOIN FETCH r.cuentaPublicitaria c
            WHERE c.proveedor.id = :idProveedor
              AND r.fecha >= :desde
              AND r.fecha < :hasta
            ORDER BY r.fecha DESC
            """)
    List<RecargaCuentaPublicitaria> listarPorProveedorYRango(
            @Param("idProveedor") Long idProveedor,
            @Param("desde") LocalDateTime desde,
            @Param("hasta") LocalDateTime hasta);

    @Query("""
            SELECT r FROM RecargaCuentaPublicitaria r
            JOIN FETCH r.cuentaPublicitaria c
            WHERE r.fecha >= :desde
              AND r.fecha < :hasta
            ORDER BY r.fecha DESC
            """)
    List<RecargaCuentaPublicitaria> listarPorRango(
            @Param("desde") LocalDateTime desde,
            @Param("hasta") LocalDateTime hasta);
}
