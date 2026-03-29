package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.Proveedor;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProveedorRepository extends JpaRepository<Proveedor, Long> {

    Optional<Proveedor> findByIdAndActivoTrue(Long id);

    @Query("""
            select p
            from Proveedor p
            where :activo is null or p.activo = :activo
            order by p.nombre asc
            """)
    List<Proveedor> listarPorActivo(Boolean activo);
}
