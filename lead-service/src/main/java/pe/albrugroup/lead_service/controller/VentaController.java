package pe.albrugroup.lead_service.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import pe.albrugroup.lead_service.entity.request.PageRequest;
import pe.albrugroup.lead_service.entity.response.LeadGtrResponse;
import pe.albrugroup.lead_service.entity.response.PageResponse;
import pe.albrugroup.lead_service.service.LeadService;

@RestController @Validated
@RequiredArgsConstructor
@RequestMapping("/venta")
public class VentaController {

    private final LeadService leadService;

    // BackOffice
    // 1. Listar Leads que se encuentren en la etapa de Venta
    @GetMapping @PreAuthorize("hasAuthority('READ_LEADS_VENTA')")
    public ResponseEntity<PageResponse<LeadGtrResponse>> listarBandejaVenta(
            @Valid @ModelAttribute PageRequest pageRequest
    ) {
        var leads = leadService.listarBandejaVenta(pageRequest);
        return ResponseEntity.status(HttpStatus.OK).body(leads);
    }
    // 2. Asignarse el lead, Similar al endpoint de asignar asesor, ahora la diferencia seria que el mismo backoffice se asigna lead si mismo
    // Una vez un backoffice se haga responsable de un lead, otro no deberia poder hacerlo
    // 3. Ver el historial de eventos de un Lead, esto solo se permitira para el asesor asignado, es decir para que solo el backoffice que se haga responsable del lead pueda ver el historial de ventos de ese lead
    // 4. Ver detalle del Lead similar al endpoint: obtenerDetalleAsesor
    // 5. Editar Lead, similar a los endpoints: actualizarDatosPreventa, actualizarDireccion, actualizarOfertaComercial, podrian ser 3 endpoints de igual manera
    // Ademas hay una condicion, el Backoffice, solo puede actualizar la OfertaComercial 1 sola vez.
    // 6. Tipificar Leads, las subtipificaciones ya tienen el campo que indica si ese Lead regresa a la etapa de Preventa o si pasa a la etapa de Postventa
}
