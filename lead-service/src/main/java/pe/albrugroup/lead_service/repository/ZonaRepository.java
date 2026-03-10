package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.Zona;

import java.util.List;

@Repository
public interface ZonaRepository extends JpaRepository<Zona, Long> {

    @Query("SELECT z FROM Zona z WHERE (:activo IS NULL OR z.activo = :activo) ORDER BY z.nombre ASC")
    List<Zona> listarPorActivo(@Param("activo") Boolean activo);
}
