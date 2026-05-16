import bcrypt from 'bcrypt';
import { NotFound } from '../errors';

/**
 * Tipo para el contexto de hook
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type HookContext = any;

/**
 * Hook que genera un nombre de usuario basado en el email
 * Extrae la parte antes del @ y elimina caracteres especiales
 * @param context - Contexto del hook
 * @returns Contexto modificado con el nombre generado
 */
const generateUserName = async (context: HookContext): Promise<HookContext> => {
  const email = context.data?.email;
  if (!email) return context;

  // Extraer parte antes del @ y limpiar caracteres no alfanuméricos
  const base = email.split('@')[0].replace(/[^a-z0-9]/gi, '').toLowerCase();
  context.data.name = base;
  return context;
};

/**
 * Hook que hashea la contraseña del usuario
 * Usa bcrypt con salt de 10 rondas
 * @param context - Contexto del hook
 * @returns Contexto con la contraseña hasheada
 */
const hashPassword = async (context: HookContext): Promise<HookContext> => {
  if (context.data?.password) {
    const salt = await bcrypt.genSalt(10);
    context.data.password = await bcrypt.hash(context.data.password, salt);
  }
  return context;
};

/**
 * Hook que asigna un rol por defecto a un usuario recién creado
 * Busca el rol en la base de datos y crea la relación UserRole
 * @param context - Contexto del hook
 * @param role - Nombre del rol por defecto (default: 'user')
 * @returns Contexto con el rol asignado
 */
const assignDefaultRole = async (context: HookContext, role = 'user'): Promise<HookContext> => {
  // Obtener el servicio de roles y el de userRole desde el contexto
  const roleService = context.app.getService('role');
  const userRoleService = context.app.getService('userRole');

  // Buscar el rol por defecto
  const defaultRole = await roleService.find({ query: { name: role, $select: ['id'] } });
  if (defaultRole.data.length === 0) {
    throw new NotFound(`Rol por defecto "${role}" no encontrado`);
  }
  const roleId = defaultRole.data[0].id;

  // Crear la relación usuario-rol
  await userRoleService.create({
    userId: context.result.id,
    roleId: roleId,
  });

  // Agregar rol al resultado
  context.result.roles = [role];
  return context;
};

export { generateUserName, hashPassword, assignDefaultRole };