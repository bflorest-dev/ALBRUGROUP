package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.Tipificacion;
import pe.albrugroup.lead_service.entity.enums.Etapa;

import java.util.List;
import java.util.Optional;

@Repository
public interface TipificacionRepository extends JpaRepository<Tipificacion, Long> {

    List<Tipificacion> findByEtapaAndActivoTrueOrderByOrdenAsc(Etapa etapa);
    List<Tipificacion> findByEtapaOrderByOrdenAsc(Etapa etapa);
    Optional<Tipificacion> findByEtapaAndCodigo(Etapa etapa, String codigo);
    Optional<Tipificacion> findByEtapaAndCodigoAndActivoTrue(Etapa etapa, String codigo);
}
