package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.Origen;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrigenRepository extends JpaRepository<Origen, Long> {

    Optional<Origen> findByCodigo(String codigo);

    List<Origen> findByActivoTrueOrderByOrdenAsc();

    List<Origen> findByActivoTrueAndEsCampanaOrderByOrdenAsc(boolean esCampana);
}
