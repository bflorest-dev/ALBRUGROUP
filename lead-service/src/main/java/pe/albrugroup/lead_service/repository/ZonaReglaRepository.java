package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.ZonaRegla;

import java.util.List;

@Repository
public interface ZonaReglaRepository extends JpaRepository<ZonaRegla, Long> {

    List<ZonaRegla> findByZonaId(Long zonaId);
    List<ZonaRegla> findByZonaIdIn(List<Long> zonaIds);
    void deleteByZonaId(Long zonaId);
}
