package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.GrupoGasto;

import java.util.List;

@Repository
public interface GrupoGastoRepository extends JpaRepository<GrupoGasto, Long> {

    List<GrupoGasto> findAllByOrderByOrdenAscNombreAsc();

    boolean existsByNombreIgnoreCase(String nombre);

    boolean existsByNombreIgnoreCaseAndIdNot(String nombre, Long id);
}
