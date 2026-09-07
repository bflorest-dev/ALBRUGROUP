package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.EntregaCredencialDispositivo;

import java.util.List;
import java.util.Collection;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

@Repository
public interface EntregaCredencialDispositivoRepository extends JpaRepository<EntregaCredencialDispositivo, Long> {

    List<EntregaCredencialDispositivo> findByEntregaCredencialId(Long idEntregaCredencial);

    long countByEntregaCredencialIdIn(Collection<Long> idEntregas);

    @Modifying
    @Query("DELETE FROM EntregaCredencialDispositivo d WHERE d.entregaCredencial.id IN :idEntregas")
    void deleteByEntregaCredencialIdIn(@Param("idEntregas") Collection<Long> idEntregas);
}
