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

    private final TipificacionRepository tipificacionRepository;
    private final SubtipificacionRepository subtipificacionRepository;
    private final TipificacionMapper tipificacionMapper;

    @PostConstruct
    @Transactional
    public void loadData() {
        log.info("=================================");
        log.info("Iniciando carga de catalogo inicial");

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
        saveSubtipificacion(enSeguimiento, "SOLICITA_LLAMAR", "Solicita llamar luego", 1);

        Tipificacion agendado = saveTipificacion(Etapa.VENTA, "AGENDADO", "Se agenda una comunicacion", 3);

        Tipificacion rechazado = saveTipificacion(Etapa.VENTA, "AGENDADO", "Se agenda una comunicacion", 4);
        Tipificacion reiterado = saveTipificacion(Etapa.VENTA, "AGENDADO", "Se agenda una comunicacion", 5);
        Tipificacion sinFacilidades = saveTipificacion(Etapa.VENTA, "AGENDADO", "Se agenda una comunicacion", 6);
        Tipificacion scorePreventa = saveTipificacion(Etapa.VENTA, "AGENDADO", "Se agenda una comunicacion", 7);
        Tipificacion preventaCompleta = saveTipificacion(Etapa.VENTA, "AGENDADO", "Se agenda una comunicacion", 8);
        Tipificacion listaNegra = saveTipificacion(Etapa.VENTA, "AGENDADO", "Se agenda una comunicacion", 9);
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

    private Subtipificacion saveSubtipificacion(Tipificacion tipificacion, String codigo, String descripcion, Integer orden) {
        return subtipificacionRepository.findByTipificacionIdAndCodigo(tipificacion.getId(), codigo)
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
