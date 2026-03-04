package pe.albrugroup.lead_service.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import pe.albrugroup.lead_service.entity.request.CampanaRequest;
import pe.albrugroup.lead_service.entity.response.CampanaResponse;
import pe.albrugroup.lead_service.service.CampanaService;

@RestController @Validated
@RequiredArgsConstructor
@RequestMapping("/campañas")
public class CampanaController {

    private final CampanaService campanaService;

    @PostMapping @PreAuthorize("hasAuthority('CREATE_CAMPAÑA')")
    public ResponseEntity<CampanaResponse> registrarCampana(@RequestBody CampanaRequest request)
    {
        var campana = campanaService.registrarCampana(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(campana);
    }

    @PutMapping("/{idCampana}") @PreAuthorize("hasAuthority('UPDATE_CAMPAÑA')")
    public ResponseEntity<CampanaResponse> actualizarCampana(@PathVariable Long idCampana,
                                                             @RequestBody CampanaRequest request)
    {
        var  campana = campanaService.actualizarCampana(idCampana, request);
        return ResponseEntity.status(HttpStatus.OK).body(campana);
    }
}
