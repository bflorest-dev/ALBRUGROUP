package pe.albrugroup.lead_service.service;

enum ModoListadoVentaPlataforma {
    HISTORICO(false),
    OPERATIVO(true);

    private final boolean excluirTipificacionesSeparadas;

    ModoListadoVentaPlataforma(boolean excluirTipificacionesSeparadas) {
        this.excluirTipificacionesSeparadas = excluirTipificacionesSeparadas;
    }

    boolean excluirTipificacionesSeparadas() {
        return excluirTipificacionesSeparadas;
    }
}
