package pe.albrugroup.lead_service.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import pe.albrugroup.lead_service.configuration.CurrentUser;
import pe.albrugroup.lead_service.entity.Contacto;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.entity.Origen;
import pe.albrugroup.lead_service.entity.Proveedor;
import pe.albrugroup.lead_service.entity.enums.AmbitoProveedor;
import pe.albrugroup.lead_service.entity.enums.EstadoSeguimiento;
import pe.albrugroup.lead_service.entity.enums.Etapa;
import pe.albrugroup.lead_service.entity.request.LeadIntakeRequest;
import pe.albrugroup.lead_service.repository.CampanaRepository;
import pe.albrugroup.lead_service.repository.ContactoRepository;
import pe.albrugroup.lead_service.repository.EquipoProveedorRepository;
import pe.albrugroup.lead_service.repository.EventoRepository;
import pe.albrugroup.lead_service.repository.LeadRepository;
import pe.albrugroup.lead_service.repository.OrigenRepository;
import pe.albrugroup.lead_service.repository.ProveedorRepository;
import pe.albrugroup.lead_service.service.mapper.LeadMapper;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LeadServiceSupervisorIntakeTest {

    @Mock private LeadRepository leadRepository;
    @Mock private EquipoProveedorRepository equipoProveedorRepository;
    @Mock private ProveedorRepository proveedorRepository;
    @Mock private ContactoRepository contactoRepository;
    @Mock private CampanaRepository campanaRepository;
    @Mock private EventoRepository eventoRepository;
    @Mock private EventoService eventoService;
    @Mock private LeadEtapaResumenService leadEtapaResumenService;
    @Mock private LeadMapper leadMapper;
    @Mock private CurrentUser currentUser;
    @Mock private OrigenRepository origenRepository;
    @Mock private ProveedorScopeService proveedorScopeService;
    @Mock private LeadRealtimeNotifier leadRealtimeNotifier;

    @InjectMocks private LeadService leadService;

    private final Origen origen = Origen.builder()
            .id(1L)
            .codigo("RECONTACTO")
            .nombre("Recontacto")
            .build();

    @Test
    void liberaLaPreventaDelMismoProveedorParaQueElSupervisorLaAsigne() {
        Proveedor claro = Proveedor.builder().id(1L).nombre("CLARO").activo(true).build();
        Contacto contacto = Contacto.builder().id(100L).prefijo("+51").lead("987654321").build();
        Lead existente = Lead.builder()
                .id(10L)
                .prefijo("+51")
                .lead("987654321")
                .proveedorOrigen(claro)
                .idEquipo(2L)
                .idAsesorAsignado(77L)
                .nombreAsesorAsignado("Asesora anterior")
                .idTipificacion(8L)
                .codigoTipificacion("CONTACTADO")
                .idSubtipificacion(9L)
                .codigoSubtipificacion("INTERESADO")
                .esDerivado(true)
                .estado(EstadoSeguimiento.ASIGNADO)
                .etapa(Etapa.PREVENTA)
                .origen(origen)
                .contacto(contacto)
                .build();

        prepararProveedorActivo(claro);
        when(origenRepository.findById(1L)).thenReturn(Optional.of(origen));
        when(contactoRepository.findByPrefijoAndLead("+51", "987654321"))
                .thenReturn(Optional.of(contacto));
        when(leadRepository.findFirstByContactoIdAndProveedorOrigenIdAndEtapaOrderByLastEntryAtDescIdDesc(
                100L, 1L, Etapa.PREVENTA)).thenReturn(Optional.of(existente));
        when(leadRepository.save(existente)).thenReturn(existente);

        leadService.registrarIngresoLeadSupervisor(request());

        assertThat(existente.getId()).isEqualTo(10L);
        assertThat(existente.getIdEquipo()).isNull();
        assertThat(existente.getIdAsesorAsignado()).isNull();
        assertThat(existente.getNombreAsesorAsignado()).isNull();
        assertThat(existente.getIdTipificacion()).isNull();
        assertThat(existente.getIdSubtipificacion()).isNull();
        assertThat(existente.isEsDerivado()).isFalse();
        assertThat(existente.getEstado()).isEqualTo(EstadoSeguimiento.NUEVO);
        assertThat(existente.getProveedorOrigen()).isSameAs(claro);
        verify(leadRepository).save(existente);
    }

    @Test
    void creaUnaOportunidadDelProveedorActivoSinModificarLaDeOtroProveedor() {
        Proveedor claro = Proveedor.builder().id(1L).nombre("CLARO").activo(true).build();
        Proveedor win = Proveedor.builder().id(2L).nombre("WIN").activo(true).build();
        Contacto contacto = Contacto.builder().id(100L).prefijo("+51").lead("987654321").build();
        Lead existenteWin = Lead.builder()
                .id(10L)
                .prefijo("+51")
                .lead("987654321")
                .proveedorOrigen(win)
                .idEquipo(4L)
                .estado(EstadoSeguimiento.ASIGNADO)
                .etapa(Etapa.PREVENTA)
                .contacto(contacto)
                .build();
        Lead nuevoClaro = Lead.builder()
                .id(20L)
                .etapa(Etapa.PREVENTA)
                .estado(EstadoSeguimiento.NUEVO)
                .build();

        prepararProveedorActivo(claro);
        when(origenRepository.findById(1L)).thenReturn(Optional.of(origen));
        when(contactoRepository.findByPrefijoAndLead("+51", "987654321"))
                .thenReturn(Optional.of(contacto));
        when(leadRepository.findFirstByContactoIdAndProveedorOrigenIdAndEtapaOrderByLastEntryAtDescIdDesc(
                100L, 1L, Etapa.PREVENTA)).thenReturn(Optional.empty());
        when(leadRepository.findByContactoIdAndProveedorOrigenIdOrderByLastEntryAtDescIdDesc(100L, 1L))
                .thenReturn(List.of());
        when(leadMapper.toNuevoLead(eq("+51"), eq("987654321"), eq(null), eq(origen), eq(null), any()))
                .thenReturn(nuevoClaro);
        when(leadRepository.save(nuevoClaro)).thenReturn(nuevoClaro);

        leadService.registrarIngresoLeadSupervisor(request());

        assertThat(nuevoClaro.getProveedorOrigen()).isSameAs(claro);
        assertThat(nuevoClaro.getContacto()).isSameAs(contacto);
        assertThat(nuevoClaro.getIdEquipo()).isNull();
        assertThat(existenteWin.getIdEquipo()).isEqualTo(4L);
        assertThat(existenteWin.getProveedorOrigen()).isSameAs(win);
        verify(leadRepository).save(nuevoClaro);
    }

    private void prepararProveedorActivo(Proveedor proveedor) {
        when(proveedorScopeService.ambitoActual()).thenReturn(AmbitoProveedor.PREVENTA);
        when(proveedorScopeService.resolverScope(AmbitoProveedor.PREVENTA))
                .thenReturn(new ProveedorScopeService.Scope(true, Set.of(proveedor.getId()), Set.of(proveedor.getNombre())));
        when(proveedorRepository.findByIdAndActivoTrue(proveedor.getId())).thenReturn(Optional.of(proveedor));
    }

    private LeadIntakeRequest request() {
        LeadIntakeRequest request = new LeadIntakeRequest();
        request.setPrefijo("+51");
        request.setLead("987654321");
        request.setIdOrigen(1L);
        return request;
    }
}
