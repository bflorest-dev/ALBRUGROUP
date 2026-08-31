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
import static org.mockito.Mockito.never;
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

    @Test
    void anularAsesorMeritoEtapasAnterioresDesdeVentaSoloLimpiaPreventa() {
        LeadEtapaResumen preventa = LeadEtapaResumen.builder()
                .idLead(10L)
                .etapa(Etapa.PREVENTA)
                .idAsesorMerito(27L)
                .nombreAsesorMerito("Asesor Preventa")
                .build();
        when(repository.findByIdLeadAndEtapa(10L, Etapa.PREVENTA)).thenReturn(Optional.of(preventa));

        service.anularAsesorMeritoEtapasAnteriores(10L, Etapa.VENTA);

        assertNull(preventa.getIdAsesorMerito());
        assertNull(preventa.getNombreAsesorMerito());
        verify(repository).save(preventa);
        verify(repository, never()).findByIdLeadAndEtapa(10L, Etapa.VENTA);
    }

    @Test
    void registrarRetornoVentaPreventaActualizaUltimaSinTocarMayorRango() {
        Instant fechaMayor = Instant.parse("2026-08-25T15:00:00Z");
        Instant fechaRetorno = Instant.parse("2026-08-26T10:00:00Z");
        LeadEtapaResumen resumen = LeadEtapaResumen.builder()
                .idLead(10L)
                .etapa(Etapa.PREVENTA)
                .mayorRangoCodigoTipificacion("INTERESADO")
                .mayorRangoCodigoSubtipificacion("CLIENTE CALIENTE")
                .mayorRangoOrden(5)
                .mayorRangoAt(fechaMayor)
                .fechaMerito(fechaMayor)
                .totalTipificaciones(2)
                .build();
        when(repository.findByIdLeadAndEtapa(10L, Etapa.PREVENTA)).thenReturn(Optional.of(resumen));

        service.registrarRetornoVentaPreventa(
                10L,
                Etapa.PREVENTA,
                "NO DESEA",
                "PREVENTA DESAPROBADA",
                9,
                88L,
                "Asesor Venta",
                fechaRetorno);

        assertEquals("NO DESEA", resumen.getUltimaCodigoTipificacion());
        assertEquals("PREVENTA DESAPROBADA", resumen.getUltimaCodigoSubtipificacion());
        assertEquals(9, resumen.getUltimaTipificacionOrden());
        assertSame(fechaRetorno, resumen.getUltimaTipificacionAt());
        assertEquals("INTERESADO", resumen.getMayorRangoCodigoTipificacion());
        assertEquals("CLIENTE CALIENTE", resumen.getMayorRangoCodigoSubtipificacion());
        assertEquals(5, resumen.getMayorRangoOrden());
        assertSame(fechaMayor, resumen.getMayorRangoAt());
        assertNull(resumen.getFechaMerito());
        assertEquals(3, resumen.getTotalTipificaciones());
        verify(repository).save(resumen);
    }

    @Test
    void anularFechaMeritoEtapasAnterioresDesdePostventaLimpiaPreventaYVenta() {
        Instant fechaPreventa = Instant.parse("2026-08-25T15:00:00Z");
        Instant fechaVenta = Instant.parse("2026-08-26T15:00:00Z");
        LeadEtapaResumen preventa = LeadEtapaResumen.builder()
                .idLead(10L)
                .etapa(Etapa.PREVENTA)
                .fechaMerito(fechaPreventa)
                .build();
        LeadEtapaResumen venta = LeadEtapaResumen.builder()
                .idLead(10L)
                .etapa(Etapa.VENTA)
                .fechaMerito(fechaVenta)
                .build();
        when(repository.findByIdLeadAndEtapa(10L, Etapa.PREVENTA)).thenReturn(Optional.of(preventa));
        when(repository.findByIdLeadAndEtapa(10L, Etapa.VENTA)).thenReturn(Optional.of(venta));

        service.anularFechaMeritoEtapasAnteriores(10L, Etapa.POSTVENTA);

        assertNull(preventa.getFechaMerito());
        assertNull(venta.getFechaMerito());
        verify(repository).save(preventa);
        verify(repository).save(venta);
        verify(repository, never()).findByIdLeadAndEtapa(10L, Etapa.POSTVENTA);
    }
}
