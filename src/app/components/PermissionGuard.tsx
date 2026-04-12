import { ReactNode } from 'react';

// 🔐 SISTEMA DE VALIDACIÓN DE PERMISOS POR ROL

// Definición de roles permitidos
export type UserRole = 'owner' | 'admin' | 'programador' | 'modelo' | 'moderador' | 'contador' | 'recepcionista' | 'supervisor';

// Definición de acciones críticas del sistema
export type Permission = 
  | 'gestion_usuarios'
  | 'gestion_modelos'
  | 'gestion_clientes'
  | 'gestion_finanzas'
  | 'gestion_liquidaciones'
  | 'gestion_adelantos'
  | 'gestion_multas'
  | 'gestion_servicios_publicos'
  | 'gestion_gastos_operativos'
  | 'gestion_boutique'
  | 'gestion_testimonios'
  | 'gestion_videos'
  | 'gestion_streaming'
  | 'gestion_chat_moderator'
  | 'ver_analytics'
  | 'exportar_reportes'
  | 'crear_agendamientos'
  | 'ver_agendamientos'
  | 'editar_agendamientos'
  | 'cancelar_agendamientos'
  | 'ver_clientes'
  | 'bloquear_clientes'
  | 'ver_servicios_propios'
  | 'ver_servicios_todos';

// 🎯 MATRIZ DE PERMISOS: Define qué roles tienen acceso a qué acciones
const PERMISSION_MATRIX: Record<Permission, UserRole[]> = {
  // Gestión de usuarios - Solo Owner
  gestion_usuarios: ['owner'],
  
  // Gestión de modelos - Owner y Admin
  gestion_modelos: ['owner', 'admin'],
  
  // Gestión de clientes - Owner, Admin y Programador
  gestion_clientes: ['owner', 'admin', 'programador'],
  
  // Finanzas globales - Solo Owner
  gestion_finanzas: ['owner'],
  
  // Liquidaciones - Owner y Admin
  gestion_liquidaciones: ['owner', 'admin'],
  
  // Adelantos - Owner y Admin
  gestion_adelantos: ['owner', 'admin'],
  
  // Multas - Owner, Admin y Programador
  gestion_multas: ['owner', 'admin', 'programador'],
  
  // Servicios públicos - Owner y Admin
  gestion_servicios_publicos: ['owner', 'admin'],
  
  // Gastos operativos - Owner y Admin
  gestion_gastos_operativos: ['owner', 'admin'],
  
  // Boutique - Owner, Admin y Programador
  gestion_boutique: ['owner', 'admin', 'programador'],
  
  // Testimonios - Owner, Admin y Programador
  gestion_testimonios: ['owner', 'admin', 'programador'],
  
  // Videos - Owner, Admin y Programador
  gestion_videos: ['owner', 'admin', 'programador'],
  
  // Streaming - Owner, Admin y Programador
  gestion_streaming: ['owner', 'admin', 'programador'],
  
  // Chat Moderator - Solo Programador
  gestion_chat_moderator: ['programador'],
  
  // Analytics - Todos pueden ver sus propios datos
  ver_analytics: ['owner', 'admin', 'programador', 'modelo'],
  
  // Exportar reportes - Owner, Admin y Programador
  exportar_reportes: ['owner', 'admin', 'programador'],
  
  // Agendamientos - Crear
  crear_agendamientos: ['owner', 'admin', 'programador'],
  
  // Agendamientos - Ver (todos pueden ver, modelos solo los suyos)
  ver_agendamientos: ['owner', 'admin', 'programador', 'modelo'],
  
  // Agendamientos - Editar
  editar_agendamientos: ['owner', 'admin', 'programador'],
  
  // Agendamientos - Cancelar
  cancelar_agendamientos: ['owner', 'admin', 'programador'],
  
  // Clientes - Ver información
  ver_clientes: ['owner', 'admin', 'programador', 'modelo'],
  
  // Clientes - Bloquear
  bloquear_clientes: ['owner', 'admin'],
  
  // Servicios - Ver solo los propios (Modelo)
  ver_servicios_propios: ['modelo'],
  
  // Servicios - Ver todos
  ver_servicios_todos: ['owner', 'admin', 'programador'],
};

/**
 * 🔒 Hook para verificar si un usuario tiene un permiso específico
 */
export function usePermission(userRole: UserRole | null | undefined, permission: Permission): boolean {
  if (!userRole) return false;
  
  const allowedRoles = PERMISSION_MATRIX[permission];
  return allowedRoles.includes(userRole);
}

/**
 * 🔒 Función auxiliar para verificar permisos (sin hook)
 */
export function hasPermission(userRole: UserRole | null | undefined, permission: Permission): boolean {
  if (!userRole) return false;
  
  const allowedRoles = PERMISSION_MATRIX[permission];
  return allowedRoles.includes(userRole);
}

/**
 * 🔒 Función para verificar múltiples permisos (requiere todos)
 */
export function hasAllPermissions(userRole: UserRole | null | undefined, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

/**
 * 🔒 Función para verificar múltiples permisos (requiere al menos uno)
 */
export function hasAnyPermission(userRole: UserRole | null | undefined, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

/**
 * 🛡️ Componente PermissionGuard - Envuelve componentes y los muestra solo si el usuario tiene permiso
 */
interface PermissionGuardProps {
  userRole: UserRole | null | undefined;
  permission: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}

export function PermissionGuard({ userRole, permission, children, fallback = null }: PermissionGuardProps) {
  const hasAccess = hasPermission(userRole, permission);
  
  if (!hasAccess) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

/**
 * 🛡️ Componente MultiPermissionGuard - Requiere TODOS los permisos
 */
interface MultiPermissionGuardProps {
  userRole: UserRole | null | undefined;
  permissions: Permission[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function MultiPermissionGuard({ userRole, permissions, children, fallback = null }: MultiPermissionGuardProps) {
  const hasAccess = hasAllPermissions(userRole, permissions);
  
  if (!hasAccess) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

/**
 * 🛡️ Componente AnyPermissionGuard - Requiere AL MENOS UNO de los permisos
 */
export function AnyPermissionGuard({ userRole, permissions, children, fallback = null }: MultiPermissionGuardProps) {
  const hasAccess = hasAnyPermission(userRole, permissions);
  
  if (!hasAccess) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}

/**
 * 🚨 Componente de Acceso Denegado personalizado para Black Diamond
 */
export function AccessDenied() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-4 max-w-md p-8">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold" style={{ fontFamily: 'Playfair Display, serif', color: '#c9a961' }}>
          Acceso Restringido
        </h2>
        <p className="text-gray-400">
          No tienes permisos para acceder a esta sección.
        </p>
        <p className="text-sm text-gray-500">
          Si crees que esto es un error, contacta al administrador del sistema.
        </p>
      </div>
    </div>
  );
}

/**
 * 📋 GUÍA DE USO:
 * 
 * 1. Uso básico con componente:
 * ```tsx
 * <PermissionGuard userRole={userRole} permission="gestion_usuarios">
 *   <GestionUsuariosPanel />
 * </PermissionGuard>
 * ```
 * 
 * 2. Con fallback personalizado:
 * ```tsx
 * <PermissionGuard 
 *   userRole={userRole} 
 *   permission="gestion_finanzas"
 *   fallback={<AccessDenied />}
 * >
 *   <FinanzasPanel />
 * </PermissionGuard>
 * ```
 * 
 * 3. Uso con hook en lógica:
 * ```tsx
 * const canManageUsers = usePermission(userRole, 'gestion_usuarios');
 * if (canManageUsers) {
 *   // Hacer algo
 * }
 * ```
 * 
 * 4. Verificar múltiples permisos:
 * ```tsx
 * <MultiPermissionGuard 
 *   userRole={userRole} 
 *   permissions={['gestion_modelos', 'gestion_finanzas']}
 * >
 *   <ComponenteRestringido />
 * </MultiPermissionGuard>
 * ```
 */
