import BaseService from './base.service';
import prisma from '../prisma';
import { hashPassword, generateUserName, assignDefaultRole } from '../hooks/user.hook';

/**
 * Interfaz que representa un rol de usuario
 */
interface UserRoleInfo {
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  permissions: any;
}

/**
 * Servicio de usuarios
 * Maneja operaciones CRUD para usuarios y autenticación
 * Excluye el método 'create' de permisos automáticos ya que el registro es público
 */
class UserService extends BaseService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(app: any) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    super(prisma.user as any, 'user', app, ['create']);

    // Hook before create: genera nombre de usuario y hashea password
    this.before('create', generateUserName, hashPassword);

    // Hook after create: asigna rol por defecto al usuario
    this.after('create', assignDefaultRole);
  }

  /**
   * Busca un usuario por su email
   * @param email - Email del usuario a buscar
   * @returns El usuario encontrado o null
   */
  async findByEmail(email: string) {
    return await this.model.findUnique({ where: { email } });
  }

  /**
   * Obtiene los roles de un usuario específico
   * @param userId - ID del usuario
   * @returns Array de objetos con nombre y permisos del rol
   */
  async getRoles(userId: string): Promise<UserRoleInfo[]> {
    const userRoles = await prisma.userRole.findMany({
      where: { userId },
      include: { role: true },
    });
    return userRoles.map((ur) => {
      return {
        name: ur.role.name,
        permissions: ur.role.permissions,
      };
    });
  }
}

/**
 * Factory function que crea una instancia del servicio de usuarios
 * @param app - Instancia de la aplicación
 * @returns Nueva instancia de UserService
 */
export default (app: unknown) => new UserService(app);