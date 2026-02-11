package pe.albrugroup.rrhh_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.albrugroup.rrhh_service.entity.Pago;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface PagoRepository extends JpaRepository<Pago, Long> {

    @Query("""
        SELECT p FROM Pago p
        WHERE (:idContrato IS NULL OR p.contrato.id = :idContrato)
        AND (:idEmpleado IS NULL OR p.contrato.empleado.id = :idEmpleado)
        AND (:fechaDesde IS NULL OR p.fechaFin >= :fechaDesde)
        AND (:fechaHasta IS NULL OR p.fechaInicio <= :fechaHasta)
        ORDER BY p.fechaInicio DESC
    """)
    List<Pago> getPagosContratoEmpleadoFechas(@Param("idContrato") Long idContrato, @Param("idEmpleado") Long idEmpleado,
            @Param("fechaDesde") LocalDate desde, @Param("fechaHasta") LocalDate hasta);
}
