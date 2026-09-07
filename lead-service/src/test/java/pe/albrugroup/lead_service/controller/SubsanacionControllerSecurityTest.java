package pe.albrugroup.lead_service.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import pe.albrugroup.lead_service.security.JWTUtil;
import pe.albrugroup.lead_service.service.SubsanacionService;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ActiveProfiles("test")
@AutoConfigureMockMvc
@SpringBootTest(properties = {
        "spring.cache.type=simple",
        "spring.flyway.enabled=false"
})
class SubsanacionControllerSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private JWTUtil jwtUtil;

    @MockitoBean
    private SubsanacionService subsanacionService;

    @Test
    @WithMockUser(authorities = "CONSULTAR_LEAD")
    void usuarioAutenticadoSinPermisoRecibeForbidden() throws Exception {
        mockMvc.perform(get("/subsanaciones/leads").param("buscar", "999"))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(authorities = "SUBSANAR_LEAD_ADMIN")
    void usuarioConPermisoPuedeConsultar() throws Exception {
        mockMvc.perform(get("/subsanaciones/leads").param("buscar", "999"))
                .andExpect(status().isOk());
    }
}
