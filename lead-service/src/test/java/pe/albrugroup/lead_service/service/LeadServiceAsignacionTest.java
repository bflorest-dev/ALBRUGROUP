package pe.albrugroup.lead_service.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.albrugroup.lead_service.configuration.CurrentUser;
import pe.albrugroup.lead_service.entity.Contacto;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.entity.Proveedor;
import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.request.LeadAsignacionRequest;
import pe.albrugroup.lead_service.repository.EventoRepository;
import pe.albrugroup.lead_service.repository.LeadRepository;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LeadServiceAsignacionTest {

    @Mock private LeadRepository leadRepository;
    @Mock private EventoRepository eventoRepository;
    @Mock private EventoService eventoService;
    @Mock private CurrentUser currentUser;
    @Mock private LeadEtapaResumenService leadEtapaResumenService;
    @Mock private LeadRealtimeNotifier leadRealtimeNotifier;
    @Mock private AuthEquipoClient authEquipoClient;

    @InjectMocks private LeadService leadService;

    @Test
    void asignarLeadSoloActualizaLaOportunidadSeleccionada() {
        Contacto contacto = Contacto.builder()
                .id(100L)
                .prefijo("+51")
                .lead("987654321")
                .build();
        Proveedor proveedorClaro = Proveedor.builder().id(1L).nombre("CLARO").build();
        Proveedor proveedorWin = Proveedor.builder().id(2L).nombre("WIN").build();
        Lead leadPrincipal = Lead.builder()
                .id(1L)
                .contacto(contacto)
                .proveedorOrigen(proveedorClaro)
                .idEquipo(10L)
                .etapa(Etapa.PREVENTA)
                .estado(EstadoSeguimiento.NUEVO)
                .build();
        Lead leadMismoProveedor = Lead.builder()
                .id(2L)
                .contacto(contacto)
                .proveedorOrigen(proveedorClaro)
                .idEquipo(20L)
                .etapa(Etapa.PREVENTA)
                .estado(EstadoSeguimiento.ASIGNADO)
                .idAsesorAsignado(77L)
                .nombreAsesorAsignado("Asesora Original")
                .build();
        Lead leadOtroProveedor = Lead.builder()
                .id(3L)
                .contacto(contacto)
                .proveedorOrigen(proveedorWin)
                .idEquipo(30L)
                .etapa(Etapa.PREVENTA)
                .estado(EstadoSeguimiento.ASIGNADO)
                .idAsesorAsignado(99L)
                .nombreAsesorAsignado("Asesor Otro Proveedor")
                .build();
        LeadAsignacionRequest request = new LeadAsignacionRequest();
        request.setIdAsesorAsignado(88L);
        request.setNombreAsesorAsignado("Asesor Nuevo");

        when(leadRepository.findById(1L)).thenReturn(Optional.of(leadPrincipal));
        when(currentUser.tieneVisibilidadGlobalEquipos()).thenReturn(false);
        when(currentUser.equipos()).thenReturn(List.of(10L, 20L, 30L));
        when(authEquipoClient.asesorPerteneceEquipo(10L, 88L)).thenReturn(true);
        when(leadRepository.save(leadPrincipal)).thenReturn(leadPrincipal);

        leadService.asignarLead(1L, request);

        assertThat(leadPrincipal.getIdAsesorAsignado()).isEqualTo(88L);
        assertThat(leadPrincipal.getNombreAsesorAsignado()).isEqualTo("Asesor Nuevo");
        assertThat(leadMismoProveedor.getIdAsesorAsignado()).isEqualTo(77L);
        assertThat(leadMismoProveedor.getNombreAsesorAsignado()).isEqualTo("Asesora Original");
        assertThat(leadOtroProveedor.getIdAsesorAsignado()).isEqualTo(99L);
        assertThat(leadOtroProveedor.getNombreAsesorAsignado()).isEqualTo("Asesor Otro Proveedor");
        verify(leadRepository, never()).findByContactoIdOrderByLastEntryAtDescIdDesc(any());
        verify(leadRepository, never()).save(leadMismoProveedor);
        verify(leadRepository, never()).save(leadOtroProveedor);
    }
}
