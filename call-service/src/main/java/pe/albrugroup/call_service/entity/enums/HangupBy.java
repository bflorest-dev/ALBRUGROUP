package pe.albrugroup.call_service.entity.enums;

/**
 * Quien inicio el hangup de la llamada.
 *
 * Asterisk reporta dos eventos HangupEvent por llamada (uno por cada canal puenteado).
 * El primero que llega corresponde al lado que origino el BYE: ese es "quien colgo".
 * El segundo es la propagacion al otro canal.
 *
 * EventDispatcher solo escribe este campo en el primer Hangup (los siguientes no lo
 * sobreescriben), determinando quien colgo a partir del nombre del canal y del cause:
 *
 *  - AGENT   : el canal pertenece a la extension del asesor (PJSIP/1001-xxxx). Implica
 *              que el asesor colgo desde su softphone. En el operativo esto NO deberia
 *              pasar (regla de negocio: solo supervisor cuelga); cuando aparece es
 *              candidato a auditoria.
 *  - CLIENT  : el canal pertenece al lado cliente (cualquier canal que no sea del asesor
 *              asignado). Comportamiento esperado: el cliente termina la llamada.
 *  - SYSTEM  : el hangup no fue iniciado por una persona sino por timeout, perdida de
 *              red, "no answer", canal no disponible, etc. Se detecta por hangup cause
 *              (18, 19, 21, 31, 41, 44, 102...). Importante separarlo de "colgo el
 *              cliente" para no manchar metricas.
 *  - UNKNOWN : fallback defensivo si no podemos clasificar (ej. no llego AgentConnect
 *              y no sabemos cual era la extension del asesor).
 */
public enum HangupBy {
    AGENT,
    CLIENT,
    SYSTEM,
    UNKNOWN
}
