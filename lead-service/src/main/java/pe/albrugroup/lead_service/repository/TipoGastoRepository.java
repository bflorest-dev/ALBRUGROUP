package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.TipoGasto;

import java.util.List;

@Repository
public interface TipoGastoRepository extends JpaRepository<TipoGasto, Long> {

    List<TipoGasto> findByActivoTrueOrderByGrupoGastoOrdenAscNombreAsc();

    List<TipoGasto> findAllByOrderByGrupoGastoOrdenAscNombreAsc();

    boolean existsByNombreIgnoreCase(String nombre);

    boolean existsByNombreIgnoreCaseAndIdNot(String nombre, Long id);

    boolean existsByGrupoGastoId(Long idGrupoGasto);
}
