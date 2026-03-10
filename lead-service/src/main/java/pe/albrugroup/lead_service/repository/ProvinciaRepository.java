package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.Provincia;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProvinciaRepository extends JpaRepository<Provincia, Long> {

    Optional<Provincia> findByDepartamentoIdAndCodigo(Long departamentoId, String codigo);
    Optional<Provincia> findByCodigo(String codigo);
    List<Provincia> findByDepartamentoIdOrderByNombreAsc(Long departamentoId);
}
