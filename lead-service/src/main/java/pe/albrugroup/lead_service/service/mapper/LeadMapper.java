package pe.albrugroup.lead_service.service.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;
import pe.albrugroup.lead_service.entity.Campana;
import pe.albrugroup.lead_service.entity.DatosPreventa;
import pe.albrugroup.lead_service.entity.Direccion;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.entity.enums.Base;
import pe.albrugroup.lead_service.entity.request.LeadDatosPreventaRequest;
import pe.albrugroup.lead_service.entity.request.LeadDireccionRequest;

import java.time.Instant;

@Mapper(componentModel = "spring")
public interface LeadMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "etapa", constant = "PREVENTA")
    @Mapping(target = "estado", constant = "NUEVO")
    @Mapping(target = "idAsesorAsignado", ignore = true)
    @Mapping(target = "nombreAsesorAsignado", ignore = true)
    @Mapping(target = "idTipificacion", ignore = true)
    @Mapping(target = "codigoTipificacion", ignore = true)
    @Mapping(target = "idSubtipificacion", ignore = true)
    @Mapping(target = "codigoSubtipificacion", ignore = true)
    @Mapping(target = "datosPreventa", ignore = true)
    @Mapping(target = "direccion", ignore = true)
    @Mapping(target = "plan", ignore = true)
    @Mapping(target = "nombrePlanSnapshot", ignore = true)
    @Mapping(target = "nombreProveedorSnapshot", ignore = true)
    @Mapping(target = "precioPlanSnapshot", ignore = true)
    @Mapping(target = "promocionInterna", ignore = true)
    @Mapping(target = "nombrePromocionInternaSnapshot", ignore = true)
    @Mapping(target = "adicionales", ignore = true)
    @Mapping(target = "precioAdicionalesSnapshot", ignore = true)
    @Mapping(target = "precioFinal", ignore = true)
    @Mapping(target = "diaCorteFacturacion", ignore = true)
    @Mapping(target = "mesesPermanenciaSnapshot", ignore = true)
    @Mapping(target = "estadoPostventa", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Lead toNuevoLead(String prefijo, String lead, Base base, Campana campana, Instant lastEntryAt);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tipoDocumento", source = "tipoDocumento")
    @Mapping(target = "numeroDocumentoTitularServicio", expression = "java(trimToNull(request.getNumeroDocumentoTitularServicio()))")
    @Mapping(target = "ubigeoNacimiento", expression = "java(trimToNull(request.getUbigeoNacimiento()))")
    @Mapping(target = "nombreTitularServicio", expression = "java(trimToNull(request.getNombreTitularServicio()))")
    @Mapping(target = "celularRegistro", expression = "java(trimToNull(request.getCelularRegistro()))")
    @Mapping(target = "celularReferencia", expression = "java(trimToNull(request.getCelularReferencia()))")
    @Mapping(target = "correo", expression = "java(trimToNull(request.getCorreo()))")
    @Mapping(target = "nombreMadre", expression = "java(trimToNull(request.getNombreMadre()))")
    @Mapping(target = "nombrePadre", expression = "java(trimToNull(request.getNombrePadre()))")
    @Mapping(target = "numeroDocumentoTitularCelularRegistro", expression = "java(trimToNull(request.getNumeroDocumentoTitularCelularRegistro()))")
    @Mapping(target = "nombreTitularCelularRegistro", expression = "java(trimToNull(request.getNombreTitularCelularRegistro()))")
    void updateDatosPreventa(LeadDatosPreventaRequest request, @MappingTarget DatosPreventa entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "ubigeoDomicilio", expression = "java(trimToNull(request.getUbigeoDomicilio()))")
    @Mapping(target = "tipoDomicilio", source = "tipoDomicilio")
    @Mapping(target = "tipoVia", source = "tipoVia")
    @Mapping(target = "via", expression = "java(trimToNull(request.getVia()))")
    @Mapping(target = "direccion", expression = "java(trimToNull(request.getDireccion()))")
    @Mapping(target = "referencia", expression = "java(trimToNull(request.getReferencia()))")
    @Mapping(target = "latitud", source = "latitud")
    @Mapping(target = "longitud", source = "longitud")
    @Mapping(target = "urbanizacion", expression = "java(trimToNull(request.getUrbanizacion()))")
    @Mapping(target = "numero", expression = "java(trimToNull(request.getNumero()))")
    @Mapping(target = "manzana", expression = "java(trimToNull(request.getManzana()))")
    @Mapping(target = "lote", expression = "java(trimToNull(request.getLote()))")
    @Mapping(target = "nombreEdificio", expression = "java(trimToNull(request.getNombreEdificio()))")
    @Mapping(target = "nombreCondominio", expression = "java(trimToNull(request.getNombreCondominio()))")
    @Mapping(target = "plano", expression = "java(trimToNull(request.getPlano()))")
    @Mapping(target = "piso", expression = "java(trimToNull(request.getPiso()))")
    @Mapping(target = "interior", expression = "java(trimToNull(request.getInterior()))")
    void updateDireccion(LeadDireccionRequest request, @MappingTarget Direccion entity);

    default String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
