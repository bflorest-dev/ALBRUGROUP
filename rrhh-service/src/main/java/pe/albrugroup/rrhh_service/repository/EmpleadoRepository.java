package pe.albrugroup.rrhh_service.repository;


import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.albrugroup.rrhh_service.entity.Empleado;
import pe.albrugroup.rrhh_service.entity.enums.Banco;
import pe.albrugroup.rrhh_service.entity.enums.Distrito;
import pe.albrugroup.rrhh_service.entity.enums.EstadoOperativo;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmpleadoRepository extends JpaRepository<Empleado, Long> {

    @Query("""
            SELECT e FROM Empleado e
            WHERE (:estadoOperativo IS NULL OR e.estadoOperativo = :estadoOperativo)
              AND (:distrito IS NULL OR e.distrito = :distrito)
              AND (:banco IS NULL OR e.banco = :banco)
              AND (:dni IS NULL OR e.numeroDocumento = :dni)
              AND (:celular IS NULL OR e.celularPersonal = :celular)
              AND (:q IS NULL OR :q = '' OR
                    LOWER(e.nombres) LIKE LOWER(CONCAT('%', :q, '%')) OR
                    LOWER(e.apellidos) LIKE LOWER(CONCAT('%', :q, '%'))
                  )
    """)
    Page<Empleado> getEmpleados(@Param("q") String q, @Param("dni") String dni, @Param("celular") String celular,
                                @Param("distrito") Distrito distrito, @Param("banco") Banco banco,
                                @Param("estadoOperativo") EstadoOperativo estadoOperativo, Pageable pageable);
    Optional<Empleado> findByNumeroDocumento(String numeroDocumento);

    @Query("SELECT DISTINCT e FROM Empleado e WHERE " +
            "LOWER(e.nombres) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(e.apellidos) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(e.numeroDocumento) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(e.celularPersonal) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(e.correoPersonal) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(e.celularCorporativo) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(e.correoCorporativo) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(e.direccion) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(CAST(e.distrito AS string)) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(CAST(e.banco AS string)) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(e.cuentaBancaria) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(e.cuentaInterbancaria) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
            "LOWER(CAST(e.estadoOperativo AS string)) LIKE LOWER(CONCAT('%', :searchTerm, '%'))")
    Page<Empleado> busquedaUniversal(@Param("searchTerm") String searchTerm, Pageable pageable);
    @Query("SELECT e FROM Empleado e WHERE e.estadoOperativo = 'ACTIVO'")
    List<Empleado> findEmpleadosActivos();
    @Query("SELECT e FROM Empleado e WHERE LOWER(e.nombres) LIKE LOWER(CONCAT('%', :termino, '%')) " +
            "OR LOWER(e.apellidos) LIKE LOWER(CONCAT('%', :termino, '%'))")
    List<Empleado> findByNombresOrApellidosContaining(@Param("termino") String termino);

}
