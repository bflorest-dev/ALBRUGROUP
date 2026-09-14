-- Hace el unique (prefijo, lead) DEFERRABLE para permitir el swap atómico de teléfonos
-- entre dos contactos dentro de una sola transacción sin pasar por centinelas ni placeholders.
-- Con DEFERRABLE INITIALLY DEFERRED la restricción se valida al COMMIT, no fila a fila.
ALTER TABLE contacto DROP CONSTRAINT uq_contacto_prefijo_lead;
ALTER TABLE contacto
    ADD CONSTRAINT uq_contacto_prefijo_lead UNIQUE (prefijo, lead) DEFERRABLE INITIALLY DEFERRED;
