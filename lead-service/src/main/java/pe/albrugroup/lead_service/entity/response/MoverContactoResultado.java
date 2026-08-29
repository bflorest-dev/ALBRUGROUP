package pe.albrugroup.lead_service.entity.response;

/** Resultado de reubicar un lead: indica si el contacto de origen quedó huérfano y se eliminó. */
public record MoverContactoResultado(
        Long idLead,
        Long idContactoOrigen,
        Long idContactoDestino,
        boolean huerfanoEliminado
) {
}
