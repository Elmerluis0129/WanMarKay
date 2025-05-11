export interface LogEntry {
  id?: string; // generado por la DB
  userId: string;
  action: string; // descripción de la acción (e.g. 'create_invoice', 'edit_user')
  entity: string; // entidad afectada (e.g. 'invoice', 'user', 'payment')
  entityId?: string; // id del registro afectado
  changes?: Record<string, any>; // detalles o diff de la operación
  sessionId?: string; // opcional para agrupar logs de sesión
  createdAt?: string; // timestamp ISO
} 