package pe.albrugroup.lead_service.entity.request;

import com.fasterxml.jackson.annotation.JsonSetter;
import lombok.Getter;

import java.time.LocalDate;

@Getter
public class LeadInstalacionCorreccionRequest {

    private String sec;
    private String sot;
    private LocalDate fechaInstalacion;
    private boolean secPresent;
    private boolean sotPresent;
    private boolean fechaInstalacionPresent;

    @JsonSetter("sec")
    public void setSec(String sec) {
        this.secPresent = true;
        this.sec = sec;
    }

    @JsonSetter("sot")
    public void setSot(String sot) {
        this.sotPresent = true;
        this.sot = sot;
    }

    @JsonSetter("fechaInstalacion")
    public void setFechaInstalacion(LocalDate fechaInstalacion) {
        this.fechaInstalacionPresent = true;
        this.fechaInstalacion = fechaInstalacion;
    }

    public boolean tieneCampoPresente() {
        return secPresent || sotPresent || fechaInstalacionPresent;
    }
}
