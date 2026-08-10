package pe.albrugroup.lead_service.service;

import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;
import pe.albrugroup.lead_service.entity.request.PageRequest;
import pe.albrugroup.lead_service.exception.BadRequestException;

import java.util.List;
import java.util.Set;

/*
 * Reglas comunes de ordenamiento para Lead. Los estados del lead usan una
 * jerarquia funcional unica; las tipificaciones no se hardcodean aqui porque
 * su orden vive en la matriz de catalogo por etapa y equipo.
 *
 * Contrato para ordenar por tipificacion: resolver el catalogo por
 * codigo + etapa + idEquipo y ordenar por Tipificacion.orden, luego
 * Subtipificacion.orden. Los nulos van al final y cada bandeja define su
 * desempate estable segun su default operativo.
 */
final class LeadOrderingRules {

    private static final List<EstadoSeguimiento> ESTADO_SEGUIMIENTO_JERARQUIA = List.of(
            EstadoSeguimiento.NUEVO,
            EstadoSeguimiento.EN_GESTION,
            EstadoSeguimiento.ASIGNADO,
            EstadoSeguimiento.GESTIONADO
    );

    private LeadOrderingRules() {
    }

    static boolean isDesc(PageRequest pageRequest) {
        return "desc".equalsIgnoreCase(pageRequest.getDirection());
    }

    static void validarDirection(String direction) {
        if (!"asc".equalsIgnoreCase(direction) && !"desc".equalsIgnoreCase(direction)) {
            throw new BadRequestException("direction debe ser asc o desc");
        }
    }

    static void validarPageRequest(PageRequest pageRequest, Set<String> aliasesPermitidos) {
        validarDirection(pageRequest.getDirection());
        if (!aliasesPermitidos.contains(pageRequest.getSortBy())) {
            throw new BadRequestException("Campo de ordenamiento no permitido: " + pageRequest.getSortBy());
        }
    }

    static EstadoSeguimientoOrden estadoSeguimientoOrden() {
        return new EstadoSeguimientoOrden(
                ESTADO_SEGUIMIENTO_JERARQUIA.get(0),
                ESTADO_SEGUIMIENTO_JERARQUIA.get(1),
                ESTADO_SEGUIMIENTO_JERARQUIA.get(2),
                ESTADO_SEGUIMIENTO_JERARQUIA.get(3)
        );
    }

    record EstadoSeguimientoOrden(
            EstadoSeguimiento nuevo,
            EstadoSeguimiento enGestion,
            EstadoSeguimiento asignado,
            EstadoSeguimiento gestionado
    ) {
    }
}
