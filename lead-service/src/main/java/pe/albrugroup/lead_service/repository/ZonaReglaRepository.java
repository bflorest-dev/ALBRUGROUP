package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.ZonaRegla;

import java.util.List;

@Repository
public interface ZonaReglaRepository extends JpaRepository<ZonaRegla, Long> {

    List<ZonaRegla> findByZonaId(Long zonaId);
    List<ZonaRegla> findByZonaIdIn(List<Long> zonaIds);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from ZonaRegla z where z.zona.id = :zonaId")
    void deleteAllByZonaId(@Param("zonaId") Long zonaId);
}
