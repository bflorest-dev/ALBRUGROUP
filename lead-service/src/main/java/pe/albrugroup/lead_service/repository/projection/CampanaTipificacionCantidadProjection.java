package pe.albrugroup.lead_service.repository.projection;

public interface CampanaTipificacionCantidadProjection {

    Long getIdCampana();
    String getNombreCampana();
    String getTipificacion();
    String getSubtipificacion();
    long getCantidad();
}
