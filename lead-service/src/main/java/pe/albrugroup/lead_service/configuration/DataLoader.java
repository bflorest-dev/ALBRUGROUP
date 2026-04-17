package pe.albrugroup.lead_service.configuration;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.entity.Subtipificacion;
import pe.albrugroup.lead_service.entity.Tipificacion;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.request.SubtipificacionRequest;
import pe.albrugroup.lead_service.entity.request.TipificacionRequest;
import pe.albrugroup.lead_service.repository.SubtipificacionRepository;
import pe.albrugroup.lead_service.repository.TipificacionRepository;
import pe.albrugroup.lead_service.service.mapper.TipificacionMapper;

@Component
@Profile("dev")
@Slf4j
@RequiredArgsConstructor
public class DataLoader {

    private final UbigeoDataLoader ubigeoDataLoader;
    private final TipificacionRepository tipificacionRepository;
    private final SubtipificacionRepository subtipificacionRepository;
    private final TipificacionMapper tipificacionMapper;

    @PostConstruct
    @Transactional
    public void loadData() {
        log.info("=================================");
        log.info("Iniciando carga de catalogo inicial");

        ubigeoDataLoader.cargarUbigeoDesdeResources();
        crearTipificacionesYSubtipificaciones();

        log.info("Catalogo cargado");
        log.info("=================================");
    }

    private void crearTipificacionesYSubtipificaciones() {

        Tipificacion sinContacto = saveTipificacion(Etapa.PREVENTA, "SIN_CONTACTO", "No se logra la comunicacion", 1);
        saveSubtipificacion(sinContacto, "NO_CONTESTA", "No responde llamadas o chat", 1);
        saveSubtipificacion(sinContacto, "NUMERO_EQUIVOCADO", "Numero invalido o incorrecto", 2);
        saveSubtipificacion(sinContacto, "FUERA_DE_SERVICIO", "Numero sin servicio de red", 3);
        saveSubtipificacion(sinContacto, "BUZON_DE_VOZ", "Numero desvia llamadas al buzon de voz", 4);

        Tipificacion enSeguimiento = saveTipificacion(Etapa.PREVENTA, "SEGUIMIENTO", "Cliente en seguimiento comercial", 2);
        saveSubtipificacion(enSeguimiento, "SOLO_INFORMACION", "Solicita llamar luego", 1);
        saveSubtipificacion(enSeguimiento, "SEGUIMIENTO", "Seguimiento pendiente de cierre", 2);
        saveSubtipificacion(enSeguimiento, "GESTION_CHAT", "Seguimiento en curso por chat", 3);
        saveSubtipificacion(enSeguimiento, "LLAMADA_INTERRUMPIDA", "Contacto interrumpido durante la llamada", 4);

        Tipificacion agendado = saveTipificacion(Etapa.PREVENTA, "AGENDADO", "Contacto reagendado para una fecha futura", 3);
        saveSubtipificacion(agendado, "FIN_DE_MES", "Solicita retomar el contacto a fin de mes", 1);
        saveSubtipificacion(agendado, "CONSULTARA_CON_FAMILIAR", "Debe validar la decision con un familiar", 2);
        saveSubtipificacion(agendado, "AGENDADO", "Comunicacion reagendada con el cliente", 3);


        Tipificacion rechazado = saveTipificacion(Etapa.PREVENTA, "RECHAZADO", "Operacion descartada en preventa", 4);
        saveSubtipificacion(rechazado, "ZONA_FRAUDE", "Zona observada por validacion de fraude", 1);
        saveSubtipificacion(rechazado, "VC_DESAPROBADA", "Validacion comercial desaprobada", 2);
        saveSubtipificacion(rechazado, "NO_DESEA", "Cliente no desea continuar con la oferta", 3);
        saveSubtipificacion(rechazado, "NO_CALIFICA", "Cliente no cumple las condiciones comerciales", 4);
        saveSubtipificacion(rechazado, "CON_PROGRAMACION", "Cliente ya cuenta con una programacion previa", 5);


        Tipificacion reiterado = saveTipificacion(Etapa.PREVENTA, "REITERADO", "Lead repetido o duplicado", 5);
        saveSubtipificacion(reiterado, "ND_PUBLICIDAD", "Lead duplicado por origen publicitario", 1);
        saveSubtipificacion(reiterado, "DOBLE_CLICK", "Registro duplicado por doble envio del cliente", 2);


        Tipificacion sinFacilidades = saveTipificacion(Etapa.PREVENTA, "SIN_FACILIDADES", "Operacion inviable por restricciones del servicio", 6);
        saveSubtipificacion(sinFacilidades, "SIN_CTO", "No cuenta con condiciones tecnicas para instalar", 1);
        saveSubtipificacion(sinFacilidades, "SIN_COBERTURA", "La direccion no tiene cobertura disponible", 2);
        saveSubtipificacion(sinFacilidades, "SERVICIO_ACTIVO", "La direccion ya tiene un servicio activo", 3);
        saveSubtipificacion(sinFacilidades, "EDIFICIO_SIN_LIBERAR", "El edificio aun no esta liberado para instalacion", 4);

        Tipificacion scorePreventa = saveTipificacion(Etapa.PREVENTA, "SCORE_PREVENTA", "Validacion de score previa a la venta", 7);
        saveSubtipificacion(scorePreventa, "PREVENTA", "Score validado en etapa de preventa", 1);
        saveSubtipificacion(scorePreventa, "PDTE_SCORE", "Validacion de score pendiente", 2);

        Tipificacion preventaCompleta = saveTipificacion(Etapa.PREVENTA, "PREVENTA_COMPLETA", "Gestion de preventa finalizada", 8);
        saveSubtipificacion(preventaCompleta, "VENTA_CERRADA", "Venta cerrada en la gestion actual", 1, Etapa.VENTA);
        saveSubtipificacion(preventaCompleta, "VC_SIGUIENTE_MES", "Venta proyectada para el siguiente mes", 2);

        Tipificacion listaNegra = saveTipificacion(Etapa.PREVENTA, "LISTA_NEGRA", "Lead restringido por lista negra", 9);
        saveSubtipificacion(listaNegra, "BLACKLIST", "Lead bloqueado por politica de blacklist", 1);
    }

    private Tipificacion saveTipificacion(Etapa etapa, String codigo, String descripcion, Integer orden) {
        return tipificacionRepository.findByEtapaAndCodigo(etapa, codigo)
                .orElseGet(() -> {
                    TipificacionRequest request = TipificacionRequest.builder()
                            .etapa(etapa)
                            .codigo(codigo)
                            .descripcion(descripcion)
                            .orden(orden)
                            .build();
                    Tipificacion entity = tipificacionMapper.toEntity(request);
                    entity.setActivo(Boolean.TRUE);
                    return tipificacionRepository.save(entity);
                });
    }

    private void saveSubtipificacion(Tipificacion tipificacion, String codigo, String descripcion, Integer orden) {
        saveSubtipificacion(tipificacion, codigo, descripcion, orden, null);
    }

    private void saveSubtipificacion(Tipificacion tipificacion, String codigo, String descripcion, Integer orden, Etapa etapaCambio) {
        subtipificacionRepository.findByTipificacionIdAndCodigo(tipificacion.getId(), codigo)
                .orElseGet(() -> {
                    SubtipificacionRequest request = SubtipificacionRequest.builder()
                            .tipificacionId(tipificacion.getId())
                            .codigo(codigo)
                            .descripcion(descripcion)
                            .orden(orden)
                            .etapaCambio(etapaCambio)
                            .build();
                    Subtipificacion entity = tipificacionMapper.toEntity(request);
                    entity.setTipificacion(tipificacion);
                    entity.setActivo(Boolean.TRUE);
                    return subtipificacionRepository.save(entity);
                });
    }
}
