package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.UsuarioProveedor;
import pe.albrugroup.lead_service.entity.enums.AmbitoProveedor;

import java.util.List;

@Repository
public interface UsuarioProveedorRepository extends JpaRepository<UsuarioProveedor, Long> {

    List<UsuarioProveedor> findByIdEmpleadoAndAmbitoAndActivoTrueOrderByProveedorNombreAsc(
            Long idEmpleado, AmbitoProveedor ambito);

    List<UsuarioProveedor> findByAmbitoAndActivoTrue(AmbitoProveedor ambito);

    void deleteByIdEmpleadoAndAmbito(Long idEmpleado, AmbitoProveedor ambito);
}
