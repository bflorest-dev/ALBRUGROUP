package pe.albrugroup.rrhh_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.albrugroup.rrhh_service.entity.Empleado;
import pe.albrugroup.rrhh_service.entity.enums.Documento;
import pe.albrugroup.rrhh_service.entity.enums.EstadoOperativo;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmpleadoRepository extends JpaRepository<Empleado, Long> {

    // Búsqueda por número de documento (único)
    Optional<Empleado> findByNumeroDocumento(String numeroDocumento);

    // Búsqueda por tipo y número de documento
    Optional<Empleado> findByTipoDocumentoAndNumeroDocumento(Documento tipoDocumento, String numeroDocumento);

    // Empleados por estado operativo
    List<Empleado> findByEstadoOperativo(EstadoOperativo estadoOperativo);

    // Empleados activos (conveniente para consultas frecuentes)
    @Query("SELECT e FROM Empleado e WHERE e.estadoOperativo = 'ACTIVO'")
    List<Empleado> findEmpleadosActivos();

    // Búsqueda por nombres o apellidos (búsqueda parcial)
    @Query("SELECT e FROM Empleado e WHERE LOWER(e.nombres) LIKE LOWER(CONCAT('%', :termino, '%')) OR LOWER(e.apellidos) LIKE LOWER(CONCAT('%', :termino, '%'))")
    List<Empleado> findByNombresOrApellidosContaining(@Param("termino") String termino);

    // Verificar si existe un empleado con ese número de documento
    boolean existsByNumeroDocumento(String numeroDocumento);

    // Buscar empleado por ID que no esté INACTIVO
    Optional<Empleado> findByIdAndEstadoOperativoNot(Long id, EstadoOperativo estadoOperativo);
}
