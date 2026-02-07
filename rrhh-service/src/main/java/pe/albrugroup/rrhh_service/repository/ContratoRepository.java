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

    // Contratos vigentes: sin fechaFin o con fechaFin posterior a hoy
    @Query("SELECT c FROM Contrato c WHERE c.fechaInicio <= :hoy AND (c.fechaFin IS NULL OR c.fechaFin >= :hoy)")
    List<Contrato> findContratosVigentes(@Param("hoy") LocalDate hoy);
    // Contratos vencidos: con fechaFin anterior a hoy
    @Query("SELECT c FROM Contrato c WHERE c.fechaFin IS NOT NULL AND c.fechaFin < :hoy")
    List<Contrato> findContratosVencidos(@Param("hoy") LocalDate hoy);

    // Contratos de un empleado específico
    List<Contrato> findByEmpleadoId(Long empleadoId);
    // Contrato vigente de un empleado específico
    @Query("SELECT c FROM Contrato c WHERE c.empleado.id = :empleadoId AND (c.fechaFin IS NULL OR c.fechaFin >= :fechaActual)")
    Optional<Contrato> findContratoVigenteByEmpleadoId(@Param("empleadoId") Long empleadoId, @Param("fechaActual") LocalDate fechaActual);
    // Contrato por ID que esté vigente/activo
    @Query("SELECT c FROM Contrato c WHERE c.id = :contratoId AND (c.fechaFin IS NULL OR c.fechaFin >= :fechaActual)")
    Optional<Contrato> findContratoVigenteById(@Param("contratoId") Long contratoId, @Param("fechaActual") LocalDate fechaActual);

    // Verificar si un empleado tiene contratos vigentes
    @Query("SELECT COUNT(c) > 0 FROM Contrato c WHERE c.empleado.id = :empleadoId AND (c.fechaFin IS NULL OR c.fechaFin >= :fechaActual)")
    boolean tieneContratosVigentes(@Param("empleadoId") Long empleadoId, @Param("fechaActual") LocalDate fechaActual);
}
