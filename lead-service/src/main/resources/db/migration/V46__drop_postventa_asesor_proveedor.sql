-- Se retira la tabla legacy de scope de postventa. Sus asignaciones vivas ya fueron migradas a
-- usuario_proveedor (ambito = 'POSTVENTA') en V45, y desde entonces la escritura va a usuario_proveedor
-- (PostventaAsesorProveedorService delega en UsuarioProveedorService). Nada referencia esta tabla.
DROP TABLE IF EXISTS postventa_asesor_proveedor;
