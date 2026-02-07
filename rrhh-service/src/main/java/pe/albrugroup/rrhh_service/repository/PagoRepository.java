package pe.albrugroup.rrhh_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.albrugroup.rrhh_service.entity.Pago;

import java.util.List;

@Repository
public interface PagoRepository extends JpaRepository<Pago, Long> {

    // Pagos de un contrato específicopago
    List<Pago> findByContratoId(Long contratoId);

    // Pagos de un empleado (a través de sus contratos)
    @Query("SELECT p FROM Pago p WHERE p.contrato.empleado.id = :empleadoId")
    List<Pago> findPagosByEmpleadoId(@Param("empleadoId") Long empleadoId);

    // Pagos en un rango de fechas
    @Query("SELECT p FROM Pago p WHERE p.fechaInicio >= :fechaInicio AND p.fechaFin <= :fechaFin")
    List<Pago> findPagosByRangoFechas(@Param("fechaInicio") java.time.LocalDate fechaInicio, 
                                      @Param("fechaFin") java.time.LocalDate fechaFin);

    // Pagos de un empleado en un rango de fechas
    @Query("SELECT p FROM Pago p WHERE p.contrato.empleado.id = :empleadoId AND p.fechaInicio >= :fechaInicio AND p.fechaFin <= :fechaFin")
    List<Pago> findPagosByEmpleadoAndRangoFechas(@Param("empleadoId") Long empleadoId,
                                                 @Param("fechaInicio") java.time.LocalDate fechaInicio,
                                                 @Param("fechaFin") java.time.LocalDate fechaFin);
}
