package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.EntregaCredencialDispositivo;

import java.util.List;

@Repository
public interface EntregaCredencialDispositivoRepository extends JpaRepository<EntregaCredencialDispositivo, Long> {

    List<EntregaCredencialDispositivo> findByEntregaCredencialId(Long idEntregaCredencial);
}
