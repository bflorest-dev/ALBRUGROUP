package pe.albrugroup.lead_service.configuration;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

        Tipificacion sinContacto = saveTipificacion(Etapa.VENTA, "SIN_CONTACTO", "No se logra la comunicacion", 1);
        saveSubtipificacion(sinContacto, "NO_CONTESTA", "No responde llamadas o chat", 1);
        saveSubtipificacion(sinContacto, "NUMERO_EQUIVOCADO", "Numero invalido o incorrecto", 2);
        saveSubtipificacion(sinContacto, "FUERA_DE_SERVICIO", "Numero sin servicio de red", 3);
        saveSubtipificacion(sinContacto, "BUZON_DE_VOZ", "Numero desvia llamadas al buzon de voz", 4);

        Tipificacion enSeguimiento = saveTipificacion(Etapa.VENTA, "SEGUIMIENTO", "En seguimiento", 2);
        saveSubtipificacion(enSeguimiento, "SOLO_INFORMACION", "Solicita llamar luego", 1);
        saveSubtipificacion(enSeguimiento, "SEGUIMIENTO", "Por Detallar", 2);
        saveSubtipificacion(enSeguimiento, "GESTION_CHAT", "Por Detallar", 3);
        saveSubtipificacion(enSeguimiento, "LLAMADA_INTERRUMPIDA", "Por Detallar", 4);

        Tipificacion agendado = saveTipificacion(Etapa.VENTA, "AGENDADO", "Se agenda una comunicacion", 3);
        saveSubtipificacion(agendado, "FIN_DE_MES", "Por Detallar", 1);
        saveSubtipificacion(agendado, "CONSULTARA_CON_FAMILIAR", "Por Detallar", 2);
        saveSubtipificacion(agendado, "AGENDADO", "Por Detallar", 3);


        Tipificacion rechazado = saveTipificacion(Etapa.VENTA, "RECHAZADO", "Se agenda una comunicacion", 4);
        saveSubtipificacion(rechazado, "ZONA_FRAUDE", "Por Detallar", 1);
        saveSubtipificacion(rechazado, "VC_DESAPROBADA", "Por Detallar", 2);
        saveSubtipificacion(rechazado, "NO_DESEA", "Por Detallar", 3);
        saveSubtipificacion(rechazado, "NO_CALIFICA", "Por Detallar", 4);
        saveSubtipificacion(rechazado, "CON_PROGRAMACION", "Por Detallar", 5);


        Tipificacion reiterado = saveTipificacion(Etapa.VENTA, "REITERADO", "Se agenda una comunicacion", 5);
        saveSubtipificacion(reiterado, "ND_PUBLICIDAD", "Por Detallar", 1);
        saveSubtipificacion(reiterado, "DOBLE_CLICK", "Por Detallar", 2);


        Tipificacion sinFacilidades = saveTipificacion(Etapa.VENTA, "SIN_FACILIDADES", "Se agenda una comunicacion", 6);
        saveSubtipificacion(sinFacilidades, "SIN_CTO", "Por Detallar", 1);
        saveSubtipificacion(sinFacilidades, "SIN_COBERTURA", "Por Detallar", 2);
        saveSubtipificacion(sinFacilidades, "SERVICIO_ACTIVO", "Por Detallar", 3);
        saveSubtipificacion(sinFacilidades, "EDIFICIO_SIN_LIBERAR", "Por Detallar", 4);

        Tipificacion scorePreventa = saveTipificacion(Etapa.VENTA, "SCORE_PREVENTA", "Se agenda una comunicacion", 7);
        saveSubtipificacion(scorePreventa, "PREVENTA", "Por Detallar", 1);
        saveSubtipificacion(scorePreventa, "PDTE_SCORE", "Por Detallar", 2);

        Tipificacion preventaCompleta = saveTipificacion(Etapa.VENTA, "PREVENTA_COMPLETA", "Se agenda una comunicacion", 8);
        saveSubtipificacion(preventaCompleta, "VENTA_CERRADA", "Por Detallar", 1);
        saveSubtipificacion(preventaCompleta, "VC_SIGUIENTE_MES", "Por Detallar", 2);

        Tipificacion listaNegra = saveTipificacion(Etapa.VENTA, "LISTA_NEGRA", "Se agenda una comunicacion", 9);
        saveSubtipificacion(listaNegra, "BLACKLIST", "Por Detallar", 1);
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
        subtipificacionRepository.findByTipificacionIdAndCodigo(tipificacion.getId(), codigo)
                .orElseGet(() -> {
                    SubtipificacionRequest request = SubtipificacionRequest.builder()
                            .tipificacionId(tipificacion.getId())
                            .codigo(codigo)
                            .descripcion(descripcion)
                            .orden(orden)
                            .build();
                    Subtipificacion entity = tipificacionMapper.toEntity(request);
                    entity.setTipificacion(tipificacion);
                    entity.setActivo(Boolean.TRUE);
                    return subtipificacionRepository.save(entity);
                });
    }
}
