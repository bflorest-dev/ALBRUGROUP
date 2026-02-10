package pe.albrugroup.rrhh_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.albrugroup.rrhh_service.entity.Contrato;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ContratoRepository extends JpaRepository<Contrato, Long> {

    List<Contrato> findByEmpleadoId(Long empleadoId);
    @Query("SELECT c FROM Contrato c WHERE c.empleado.id = :empleadoId AND c.fechaInicio <= :fechaActual " +
            "AND (c.fechaFin IS NULL OR c.fechaFin >= :fechaActual)")
    Optional<Contrato> findContratoVigenteByEmpleadoId(@Param("empleadoId") Long empleadoId,
                                                       @Param("fechaActual") LocalDate fechaActual);
    @Query("SELECT c FROM Contrato c WHERE c.id = :contratoId AND c.fechaInicio <= :fechaActual " +
            "AND (c.fechaFin IS NULL OR c.fechaFin >= :fechaActual)")
    Optional<Contrato> findContratoVigenteById(@Param("contratoId") Long contratoId,
                                               @Param("fechaActual") LocalDate fechaActual);
}
