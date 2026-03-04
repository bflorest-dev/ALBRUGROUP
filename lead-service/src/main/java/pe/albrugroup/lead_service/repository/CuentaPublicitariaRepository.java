package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.CuentaPublicitaria;

import java.util.Optional;
import java.util.List;

@Repository
public interface CuentaPublicitariaRepository extends JpaRepository<CuentaPublicitaria, Long> {

    Optional<CuentaPublicitaria> findByIdAndActivoTrue(Long id);

    @Query("SELECT c FROM CuentaPublicitaria c WHERE (:activo IS NULL OR c.activo = :activo)")
    List<CuentaPublicitaria> listarPorActivo(Boolean activo);
}
