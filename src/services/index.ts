import userService from './user.service';
import groupService from './group.service';
import expenseService from './expense.service';
import roleService from './roles.service';
import userRoleService from './userRole.service';
import expenseShareService from './expenseShare.service';
import groupMemberService from './groupMember.service';

/**
 * Registra todos los servicios de la aplicación en la instancia de Express
 * Cada servicio queda disponible mediante app.getService('nombre')
 * @param app - Instancia de la aplicación Express extendida
 */
function registerServices(app: Express.Application & { registerService: (name: string, service: unknown) => void }): void {
  app.registerService('user', userService(app));
  app.registerService('group', groupService(app));
  app.registerService('expense', expenseService(app));
  app.registerService('role', roleService(app));
  app.registerService('userRole', userRoleService(app));
  app.registerService('expenseShare', expenseShareService(app));
  app.registerService('groupMember', groupMemberService(app));
}

export { registerServices };