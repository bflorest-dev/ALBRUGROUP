package pe.albrugroup.lead_service.service;

import org.junit.jupiter.api.Test;
import pe.albrugroup.lead_service.entity.CalendarioFacturacionPostventa;
import pe.albrugroup.lead_service.entity.Lead;
import pe.albrugroup.lead_service.entity.response.LeadPostventaBandejaResponse;

import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

class PostventaBandejaServiceTest {

    @Test
    void bandejaExponeCustomerIdDelLead() throws Exception {
        Lead lead = Lead.builder()
                .id(1L)
                .customerId("12345678")
                .adicionales(Set.of())
                .build();
        CalendarioFacturacionPostventa calendario = CalendarioFacturacionPostventa.builder()
                .lead(lead)
                .build();
        PostventaBandejaService service = new PostventaBandejaService(
                null, null, null, null, null, null, null, null
        );

        Method mapper = Arrays.stream(PostventaBandejaService.class.getDeclaredMethods())
                .filter(method -> method.getName().equals("toResponse"))
                .findFirst()
                .orElseThrow();
        mapper.setAccessible(true);

        LeadPostventaBandejaResponse response = (LeadPostventaBandejaResponse) mapper.invoke(
                service, calendario, null, null, null, null
        );

        assertThat(response.getCustomerId()).isEqualTo("12345678");
    }
}
