package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.Distrito;

import java.util.List;
import java.util.Optional;

@Repository
public interface DistritoRepository extends JpaRepository<Distrito, Long> {

    Optional<Distrito> findByCodigo(String codigo);
    List<Distrito> findByProvinciaIdOrderByNombreAsc(Long provinciaId);
}
