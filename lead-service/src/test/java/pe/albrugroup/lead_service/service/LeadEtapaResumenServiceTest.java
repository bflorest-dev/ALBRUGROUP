package pe.albrugroup.lead_service.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.albrugroup.lead_service.entity.LeadEtapaResumen;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.repository.LeadEtapaResumenRepository;

import java.time.Instant;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LeadEtapaResumenServiceTest {

    @Mock private LeadEtapaResumenRepository repository;
    @InjectMocks private LeadEtapaResumenService service;

    @Test
    void asignarAsesorMeritoNoTocaFechaMerito() {
        Instant fechaExistente = Instant.parse("2026-08-25T15:00:00Z");
        LeadEtapaResumen resumen = LeadEtapaResumen.builder()
                .idLead(10L)
                .etapa(Etapa.VENTA)
                .fechaMerito(fechaExistente)
                .build();
        when(repository.findByIdLeadAndEtapa(10L, Etapa.VENTA)).thenReturn(Optional.of(resumen));

        service.asignarAsesorMerito(10L, Etapa.VENTA, 99L, "Asesor Merito", Instant.parse("2026-08-26T10:00:00Z"));

        assertEquals(99L, resumen.getIdAsesorMerito());
        assertEquals("Asesor Merito", resumen.getNombreAsesorMerito());
        assertSame(fechaExistente, resumen.getFechaMerito());
        verify(repository).save(resumen);
    }

    @Test
    void asignarFechaMeritoNoTocaAsesorMerito() {
        Instant nuevaFecha = Instant.parse("2026-08-26T10:00:00Z");
        LeadEtapaResumen resumen = LeadEtapaResumen.builder()
                .idLead(10L)
                .etapa(Etapa.VENTA)
                .idAsesorMerito(88L)
                .nombreAsesorMerito("Asesor Existente")
                .build();
        when(repository.findByIdLeadAndEtapa(10L, Etapa.VENTA)).thenReturn(Optional.of(resumen));

        service.asignarFechaMerito(10L, Etapa.VENTA, nuevaFecha);

        assertEquals(88L, resumen.getIdAsesorMerito());
        assertEquals("Asesor Existente", resumen.getNombreAsesorMerito());
        assertSame(nuevaFecha, resumen.getFechaMerito());
        verify(repository).save(resumen);
    }

    @Test
    void anuladoresLimpianSoloElCampoCorrespondiente() {
        Instant fechaExistente = Instant.parse("2026-08-25T15:00:00Z");
        LeadEtapaResumen resumen = LeadEtapaResumen.builder()
                .idLead(10L)
                .etapa(Etapa.VENTA)
                .idAsesorMerito(88L)
                .nombreAsesorMerito("Asesor Existente")
                .fechaMerito(fechaExistente)
                .build();
        when(repository.findByIdLeadAndEtapa(10L, Etapa.VENTA)).thenReturn(Optional.of(resumen));

        service.anularAsesorMerito(10L, Etapa.VENTA, Instant.parse("2026-08-26T10:00:00Z"));

        assertNull(resumen.getIdAsesorMerito());
        assertNull(resumen.getNombreAsesorMerito());
        assertSame(fechaExistente, resumen.getFechaMerito());

        service.anularFechaMerito(10L, Etapa.VENTA, Instant.parse("2026-08-26T10:01:00Z"));

        assertNull(resumen.getFechaMerito());
        verify(repository, times(2)).save(resumen);
    }
}
