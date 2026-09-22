package pe.albrugroup.auth_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.albrugroup.auth_service.entity.Usuario;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByUsername(String username);
    boolean existsByUsername(String username);
    Optional<Usuario> findByEmail(String email);
    boolean existsByEmail(String email);
    Optional<Usuario> findByEmpleadoId(Long empleadoId);
    Optional<Usuario> findByUsernameAndEmailAndDni(String username, String email, String dni);
    List<Usuario> findDistinctByRolesNombreAndActivoTrue(String rolNombre);
    List<Usuario> findDistinctByEquiposIdAndActivoTrue(Long equipoId);
    List<Usuario> findDistinctByEquiposIdAndActivoTrueOrderByNombreCompletoAsc(Long equipoId);
    List<Usuario> findByEquiposId(Long equipoId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select distinct u from Usuario u join u.roles r where r.nombre = :rol and u.activo = true")
    List<Usuario> findActiveByRoleForUpdate(@Param("rol") String rol);

    @Query(value = """
            select distinct u from Usuario u
            left join u.roles r
            where (:buscar = ''
                   or lower(u.nombreCompleto) like lower(concat('%', :buscar, '%'))
                   or lower(u.username) like lower(concat('%', :buscar, '%'))
                   or lower(u.email) like lower(concat('%', :buscar, '%'))
                   or lower(u.dni) like lower(concat('%', :buscar, '%'))
                   or (:empleadoId is not null and u.empleadoId = :empleadoId))
              and (:activo is null or u.activo = :activo)
              and (:rol is null or r.nombre = :rol)
              and (:sinRol is null
                   or (:sinRol = true and u.rolPrincipal is null)
                   or (:sinRol = false and u.rolPrincipal is not null))
            """,
            countQuery = """
            select count(distinct u.id) from Usuario u
            left join u.roles r
            where (:buscar = ''
                   or lower(u.nombreCompleto) like lower(concat('%', :buscar, '%'))
                   or lower(u.username) like lower(concat('%', :buscar, '%'))
                   or lower(u.email) like lower(concat('%', :buscar, '%'))
                   or lower(u.dni) like lower(concat('%', :buscar, '%'))
                   or (:empleadoId is not null and u.empleadoId = :empleadoId))
              and (:activo is null or u.activo = :activo)
              and (:rol is null or r.nombre = :rol)
              and (:sinRol is null
                   or (:sinRol = true and u.rolPrincipal is null)
                   or (:sinRol = false and u.rolPrincipal is not null))
            """)
    Page<Usuario> buscarAccesos(
            @Param("buscar") String buscar,
            @Param("empleadoId") Long empleadoId,
            @Param("activo") Boolean activo,
            @Param("rol") String rol,
            @Param("sinRol") Boolean sinRol,
            Pageable pageable
    );
}
