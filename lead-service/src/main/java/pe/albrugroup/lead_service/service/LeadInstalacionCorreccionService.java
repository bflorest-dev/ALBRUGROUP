package pe.albrugroup.lead_service.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.albrugroup.lead_service.configuration.OperationalDateTime;
import pe.albrugroup.lead_service.entity.Evento;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.entity.enums.Accion;
import pe.albrugroup.lead_service.entity.enums.AmbitoProveedor;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.request.LeadInstalacionCorreccionRequest;
import pe.albrugroup.lead_service.entity.response.LeadInstalacionCorreccionResponse;
import pe.albrugroup.lead_service.exception.BadRequestException;
import pe.albrugroup.lead_service.exception.NotFoundException;
import pe.albrugroup.lead_service.repository.EventoRepository;
import pe.albrugroup.lead_service.repository.LeadRepository;

import java.time.LocalDate;
import java.util.Locale;

@Service
@Transactional
@RequiredArgsConstructor
public class LeadInstalacionCorreccionService {

    private static final String TIPIFICACION_INSTALADO = "INSTALADO";

    private final LeadRepository leadRepository;
    private final EventoRepository eventoRepository;
    private final CalendarioFacturacionPostventaService calendarioFacturacionPostventaService;
    private final ProveedorScopeService proveedorScopeService;

    public LeadInstalacionCorreccionResponse corregirInstalacion(
            Long idLead,
            LeadInstalacionCorreccionRequest request
    ) {
        validarRequest(request);

        Lead lead = leadRepository.findById(idLead)
                .orElseThrow(() -> new NotFoundException(Lead.class, idLead));
        validarLeadCorregible(lead);
        validarScopeProveedor(lead);

        Evento eventoInstalado = eventoRepository
                .findTopByIdLeadAndAccionAndEtapaAndTipificacionOrderByCreatedAtDescIdDesc(
                        idLead,
                        Accion.TIPIFICACION,
                        Etapa.VENTA,
                        TIPIFICACION_INSTALADO
                )
                .orElseThrow(() -> new BadRequestException("No se encontro una instalacion registrada para este lead"));

        String secAnterior = lead.getSec();
        String sotAnterior = lead.getSot();
        LocalDate fechaAnterior = eventoInstalado.getFechaInstalacion();

        if (request.isSecPresent()) {
            lead.setSec(validarCodigo(request.getSec(), 9, "SEC"));
        }
        if (request.isSotPresent()) {
            lead.setSot(validarCodigo(request.getSot(), 8, "SOT"));
        }
        if (request.isFechaInstalacionPresent()) {
            LocalDate fechaInstalacion = validarFechaInstalacion(request.getFechaInstalacion());
            eventoInstalado.setFechaInstalacion(fechaInstalacion);
            if (lead.getEtapa() == Etapa.POSTVENTA) {
                calendarioFacturacionPostventaService.sincronizarFechaInstalacionExistente(lead, fechaInstalacion);
                lead.setDiaCorteFacturacion(resolverDiaCorteDesdeFecha(lead, fechaInstalacion));
            }
        }

        lead.setUpdatedAt(OperationalDateTime.now());
        Lead leadGuardado = leadRepository.save(lead);
        Evento eventoGuardado = eventoRepository.save(eventoInstalado);

        return LeadInstalacionCorreccionResponse.builder()
                .idLead(leadGuardado.getId())
                .lead(leadGuardado.getLead())
                .etapa(leadGuardado.getEtapa())
                .secAnterior(secAnterior)
                .secNuevo(leadGuardado.getSec())
                .sotAnterior(sotAnterior)
                .sotNuevo(leadGuardado.getSot())
                .fechaInstalacionAnterior(fechaAnterior)
                .fechaInstalacionNueva(eventoGuardado.getFechaInstalacion())
                .idEventoInstalado(eventoGuardado.getId())
                .build();
    }

    private void validarRequest(LeadInstalacionCorreccionRequest request) {
        if (request == null || !request.tieneCampoPresente()) {
            throw new BadRequestException("Ingresa al menos un dato de instalacion para corregir");
        }
        if (request.isSecPresent()) {
            validarCodigo(request.getSec(), 9, "SEC");
        }
        if (request.isSotPresent()) {
            validarCodigo(request.getSot(), 8, "SOT");
        }
        if (request.isFechaInstalacionPresent()) {
            validarFechaInstalacion(request.getFechaInstalacion());
        }
    }

    private void validarLeadCorregible(Lead lead) {
        if (lead.getEtapa() != Etapa.VENTA && lead.getEtapa() != Etapa.POSTVENTA) {
            throw new BadRequestException("Solo se puede corregir la instalacion cuando el lead esta en VENTA o POSTVENTA");
        }
    }

    private void validarScopeProveedor(Lead lead) {
        AmbitoProveedor ambito = proveedorScopeService.ambitoActual();
        ProveedorScopeService.Scope scope = proveedorScopeService.resolverScope(ambito);
        if (!scope.restringido()) {
            return;
        }
        Long idProveedor = lead.getPlan() == null || lead.getPlan().getProveedor() == null
                ? null
                : lead.getPlan().getProveedor().getId();
        String nombreProveedor = normalizarNombreProveedor(lead.getNombreProveedorSnapshot());
        boolean visiblePorId = idProveedor != null && scope.proveedorIds().contains(idProveedor);
        boolean visiblePorNombre = nombreProveedor != null && scope.proveedorNombres().contains(nombreProveedor);
        if (!visiblePorId && !visiblePorNombre) {
            throw new NotFoundException(Lead.class, lead.getId());
        }
    }

    private String validarCodigo(String value, int length, String label) {
        if (value == null || value.isBlank()) {
            throw new BadRequestException(label + " es obligatorio");
        }
        String normalizado = value.trim();
        if (!normalizado.matches("\\d{" + length + "}")) {
            throw new BadRequestException(label + " debe tener " + length + " digitos");
        }
        return normalizado;
    }

    private LocalDate validarFechaInstalacion(LocalDate fechaInstalacion) {
        if (fechaInstalacion == null) {
            throw new BadRequestException("La fecha de instalacion es obligatoria");
        }
        return fechaInstalacion;
    }

    private Integer resolverDiaCorteDesdeFecha(Lead lead, LocalDate fechaInstalacion) {
        String proveedor = normalizarNombreProveedor(lead.getNombreProveedorSnapshot());
        if ("CLARO".equals(proveedor)) {
            return fechaInstalacion.getDayOfMonth();
        }
        if ("WIN".equals(proveedor)) {
            return 23;
        }
        return lead.getDiaCorteFacturacion();
    }

    private String normalizarNombreProveedor(String nombre) {
        return nombre == null ? null : nombre.trim().toUpperCase(Locale.ROOT);
    }
}
