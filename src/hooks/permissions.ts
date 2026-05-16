import prisma from '../prisma';
import { Forbidden, NotAuthenticated } from '../errors';

/**
 * Interfaz para estructura de permisos
 */
interface PermissionItem {
  actions: string[];
  subject: string[];
}

/**
 * Tipo para el contexto de hook
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HookContext = any;

/**
 * Obtiene los permisos de un usuario basados en sus roles
 * Combina permisos de múltiples roles en un solo objeto
 * @param userId - ID del usuario
 * @returns Objeto con permisos por sujeto { subject: [actions] }
 */
async function getUserPermissions(userId: string): Promise<Record<string, string[]>> {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: { role: true },
  });

  // Combinar permisos de múltiples roles
  const combined = new Map<string, Set<string>>();

  for (const ur of userRoles) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const perms = (ur.role.permissions as any) as PermissionItem[] || [];
    for (const item of perms) {
      const actions = item.actions || [];
      const subjects = item.subject || [];

      for (const subject of subjects) {
        if (!combined.has(subject)) combined.set(subject, new Set());
        const actionSet = combined.get(subject);
        for (const action of actions) {
          actionSet.add(action);
        }
      }
    }
  }

  // Convertir a objeto plano { subject: [actions] }
  const result: Record<string, string[]> = {};
  for (const [subject, actionSet] of combined.entries()) {
    result[subject] = Array.from(actionSet);
  }
  return result;
}

/**
 * Verifica si el usuario tiene permiso para una acción sobre un sujeto
 * @param perms - Objeto de permisos del usuario
 * @param action - Acción a verificar (create, read, update, delete)
 * @param subject - Sujeto sobre el cual se realiza la acción
 * @returns true si tiene permiso
 */
function hasPermission(perms: Record<string, string[]>, action: string, subject: string): boolean {
  // Permiso comodín 'all' con 'manage'
  if (perms.all && perms.all.includes('manage')) return true;

  const subjectPerms = perms[subject];
  if (!subjectPerms) return false;

  return subjectPerms.includes(action) || subjectPerms.includes('manage');
}

/**
 * Hook de verificación de permisos
 * Verifica que el usuario tenga permiso para realizar la acción sobre el sujeto
 * Permite llamadas internas (sin provider) sin verificar permisos
 * @param action - Acción a verificar (create, read, update, delete)
 * @param subject - Sujeto sobre el cual se realiza la acción
 * @returns Función de hook que verifica permisos
 */
function checkPermission(action: string, subject: string) {
  return async (context: HookContext): Promise<HookContext> => {
    // Permitir acceso sin permisos para llamadas internas (sin provider)
    if (context.params?.provider === undefined) {
      return context;
    }

    // Verificar que el usuario esté autenticado
    const userId = context.user?.userId;
    if (!userId) throw new NotAuthenticated('No autenticado');

    // Cache de permisos en el contexto para evitar múltiples consultas
    if (!context._permissions) {
      context._permissions = await getUserPermissions(userId);
    }

    if (!hasPermission(context._permissions as Record<string, string[]>, action, subject)) {
      throw new Forbidden(`Permiso denegado: se requiere ${action} sobre ${subject}`);
    }
    return context;
  };
}

export { checkPermission };