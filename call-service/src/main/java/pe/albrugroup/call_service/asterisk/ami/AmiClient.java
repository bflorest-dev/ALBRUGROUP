package pe.albrugroup.call_service.asterisk.ami;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.asteriskjava.manager.AuthenticationFailedException;
import org.asteriskjava.manager.ManagerConnection;
import org.asteriskjava.manager.ManagerConnectionFactory;
import org.asteriskjava.manager.ManagerEventListener;
import org.asteriskjava.manager.TimeoutException;
import org.asteriskjava.manager.action.ManagerAction;
import org.asteriskjava.manager.action.QueuePauseAction;
import org.asteriskjava.manager.event.ManagerEvent;
import org.asteriskjava.manager.response.ManagerResponse;
import org.springframework.stereotype.Component;
import pe.albrugroup.call_service.asterisk.dispatch.EventDispatcher;
import pe.albrugroup.call_service.config.AsteriskProperties;

import java.io.IOException;

/**
 * Cliente AMI (Asterisk Manager Interface) basado en asterisk-java.
 * Mantiene una conexion persistente y entrega todos los eventos al dispatcher.
 *
 * Responsabilidades primarias:
 * - Escuchar eventos de cola (QueueCallerJoin/Leave, AgentConnect/Complete, etc.).
 * - Enviar acciones que ARI no expone limpiamente (QueuePause, QueueAdd, QueueRemove).
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AmiClient implements ManagerEventListener {

    private final AsteriskProperties props;
    private final EventDispatcher dispatcher;

    private ManagerConnection connection;

    @PostConstruct
    public void connect() {
        try {
            ManagerConnectionFactory factory = new ManagerConnectionFactory(
                    props.getAmi().getHost(),
                    props.getAmi().getPort(),
                    props.getAmi().getUsername(),
                    props.getAmi().getPassword()
            );
            connection = factory.createManagerConnection();
            connection.addEventListener(this);
            connection.login();
            log.info("AMI conectado a {}:{}", props.getAmi().getHost(), props.getAmi().getPort());
        } catch (IOException | AuthenticationFailedException | TimeoutException e) {
            log.error("No se pudo conectar a AMI: {}", e.getMessage());
            // En produccion: scheduler de reintentos. Por simplicidad omitido en Fase 1.
        }
    }

    @PreDestroy
    public void disconnect() {
        if (connection != null) {
            try {
                connection.logoff();
                log.info("AMI desconectado");
            } catch (Exception e) {
                log.warn("Error desconectando AMI: {}", e.getMessage());
            }
        }
    }

    @Override
    public void onManagerEvent(ManagerEvent event) {
        dispatcher.onAmiEvent(event);
    }

    /** Enviar una accion AMI generica. */
    public ManagerResponse send(ManagerAction action) {
        try {
            return connection.sendAction(action);
        } catch (Exception e) {
            log.warn("Error enviando AMI action {}: {}",
                    action.getClass().getSimpleName(), e.getMessage());
            return null;
        }
    }

    /** Pausa o despausa a un agente en una cola (sincronizacion de presencia). */
    public void setQueuePause(String queue, String memberInterface, boolean paused, String reason) {
        QueuePauseAction action = new QueuePauseAction();
        action.setQueue(queue);
        action.setInterface(memberInterface);
        action.setPaused(paused);
        if (reason != null) action.setReason(reason);
        send(action);
    }
}
