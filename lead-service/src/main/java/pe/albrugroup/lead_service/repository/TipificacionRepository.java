package pe.albrugroup.lead_service.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pe.albrugroup.lead_service.entity.Tipificacion;
import pe.albrugroup.lead_service.entity.enums.Etapa;

import java.util.List;
import java.util.Optional;

@Repository
public interface TipificacionRepository extends JpaRepository<Tipificacion, Long> {

    // Cross-proveedor, SOLO para la paleta de colores de las vistas de supervisor (bandeja diaria/ranking):
    // NO usar para resolver tipificaciones de un lead (eso es siempre por (etapa, idEquipo)).
    List<Tipificacion> findByMatrizEtapaAndActivoTrueOrderByOrdenAsc(Etapa etapa);

    // Consultas por (etapa, proveedor): cada proveedor tiene su matriz por etapa.
    List<Tipificacion> findByMatrizEtapaAndMatrizProveedorIdAndActivoTrueOrderByOrdenAsc(Etapa etapa, Long idProveedor);
    List<Tipificacion> findByMatrizEtapaAndMatrizProveedorIdOrderByOrdenAsc(Etapa etapa, Long idProveedor);
    Optional<Tipificacion> findByMatrizEtapaAndMatrizProveedorIdAndCodigo(Etapa etapa, Long idProveedor, String codigo);
    Optional<Tipificacion> findByMatrizEtapaAndMatrizProveedorIdAndCodigoAndActivoTrue(Etapa etapa, Long idProveedor, String codigo);
    boolean existsByMatrizEtapaAndMatrizProveedorIdAndActivoTrue(Etapa etapa, Long idProveedor);
}
