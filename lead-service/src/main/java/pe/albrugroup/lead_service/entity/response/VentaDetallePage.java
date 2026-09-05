package pe.albrugroup.lead_service.entity.response;

import java.util.List;

/**
 * Página del detalle unificado del dashboard de VENTA. Además de la lista paginada trae, cuando se pide
 * {@code groupBy}, el resumen de grupos (valor + conteo) para dibujar las cabeceras (agrupación server-side,
 * lista plana). {@code grupos} va vacío si no se agrupó.
 */
public record VentaDetallePage(
        int page,
        int size,
        int totalPages,
        long totalElements,
        List<VentaDetalleResponse> content,
        List<GrupoResumen> grupos
) {
    public record GrupoResumen(String valor, long cantidad) {}
}
