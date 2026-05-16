import { getCurrentUser } from '../context';
import { checkPermission } from '../hooks/permissions';
import { HookContext, ServiceMethod, PrismaModel, PaginatedResponse, QueryParams } from '../types';

/**
 * Servicio base que proporciona CRUD genérico con soporte de hooks y permisos
 */
class BaseService<T extends PrismaModel = PrismaModel> {
  model: T;
  serviceName: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  app: any;
  excludeMethods: string[];
  beforeHooks: Record<ServiceMethod, ((context: HookContext) => Promise<HookContext>)[]>;
  afterHooks: Record<ServiceMethod, ((context: HookContext) => Promise<HookContext>)[]>;
  errorHooks: Record<ServiceMethod, ((context: HookContext) => Promise<HookContext>)[]>;

  constructor(model: T, serviceName = '', app: unknown, excludeMethods: string[] = []) {
    this.model = model;
    this.serviceName = serviceName;
    this.app = app;
    this.excludeMethods = Array.isArray(excludeMethods) ? excludeMethods : [];

    this.beforeHooks = {
      find: [],
      get: [],
      create: [],
      patch: [],
      update: [],
      remove: [],
    };
    this.afterHooks = {
      find: [],
      get: [],
      create: [],
      patch: [],
      update: [],
      remove: [],
    };
    this.errorHooks = {
      find: [],
      get: [],
      create: [],
      patch: [],
      update: [],
      remove: [],
    };

    this._applyAutoPermissions();
  }

  _applyAutoPermissions(): void {
    const methodToAction: Record<string, string> = {
      create: 'create',
      update: 'update',
      patch: 'update',
      remove: 'delete',
      find: 'read',
      get: 'read',
    };

    for (const method of Object.keys(this.beforeHooks) as ServiceMethod[]) {
      if (this.excludeMethods.includes(method)) continue;
      const action = methodToAction[method];
      if (action) {
        this.before(method, checkPermission(action, this.serviceName) as (context: HookContext) => Promise<HookContext>);
      }
    }
  }

  before(method: ServiceMethod, ...fns: ((context: HookContext) => Promise<HookContext>)[]): void {
    this.beforeHooks[method].push(...fns);
  }

  after(method: ServiceMethod, ...fns: ((context: HookContext) => Promise<HookContext>)[]): void {
    this.afterHooks[method].push(...fns);
  }

  error(method: ServiceMethod, ...fns: ((context: HookContext) => Promise<HookContext>)[]): void {
    this.errorHooks[method].push(...fns);
  }

  async _runHooks(hooks: ((context: HookContext) => Promise<HookContext>)[], context: HookContext): Promise<HookContext> {
    for (const hook of hooks) {
      context = await hook(context);
      if (!context) throw new Error('Hook must return context');
    }
    return context;
  }

  async _runErrorHooks(method: ServiceMethod, error: Error, originalContext: { params?: QueryParams }): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let ctx: any = { error, method, originalContext, service: this, app: this.app };
    for (const hook of this.errorHooks[method]) {
      try {
        ctx = await hook(ctx);
      } catch (hookErr) {
        console.error(`Error en hook de error para ${method}:`, hookErr);
      }
    }
    throw ctx.error;
  }

  async find(params: QueryParams = {}): Promise<PaginatedResponse> {
    try {
      const user = getCurrentUser();
      let context: HookContext = { method: 'find', params, service: this, result: null, user, app: this.app };
      context = await this._runHooks(this.beforeHooks.find, context);

      const query = (context.params.query || {}) as Record<string, unknown>;
      const { $limit, $skip, $select } = query;
      let $sort: Record<string, number> | null = null;

      if (query) {
        const sortKeys = Object.keys(query).filter((k) => k.startsWith('$sort[') && k.endsWith(']'));
        if (sortKeys.length) {
          $sort = {};
          for (const key of sortKeys) {
            const field = key.match(/\$sort\[(.*?)\]/)?.[1];
            if (field) $sort[field] = parseInt(query[key] as string, 10);
          }
        } else if (query.$sort && typeof query.$sort === 'object') {
          $sort = query.$sort as Record<string, number>;
        }
      }

      const prismaOptions: Record<string, unknown> = {};

      if (query && typeof query === 'object') {
        const where: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(query)) {
          if (!key.startsWith('$')) {
            where[key] = value;
          }
        }
        if (Object.keys(where).length) prismaOptions.where = where;
      }

      if ($limit !== undefined) prismaOptions.take = parseInt($limit as string, 10);
      if ($skip !== undefined) prismaOptions.skip = parseInt($skip as string, 10);
      if ($sort && typeof $sort === 'object') {
        prismaOptions.orderBy = Object.entries($sort).map(([field, order]) => ({
          [field]: order === 1 ? 'asc' : 'desc',
        }));
      }
      if ($select && Array.isArray($select)) {
        prismaOptions.select = $select.reduce((acc: Record<string, boolean>, field: string) => {
          acc[field] = true;
          return acc;
        }, {});
      }

      const result = await this.model.findMany(prismaOptions);
      const total = await this.model.count({ where: prismaOptions.where as Record<string, unknown> });

      const response: PaginatedResponse = { data: result, total };
      if ($limit !== undefined) response.limit = parseInt($limit as string, 10);
      if ($skip !== undefined) response.skip = parseInt($skip as string, 10);

      context.result = response;
      context = await this._runHooks(this.afterHooks.find, context);
      return context.result as PaginatedResponse;
    } catch (error) {
      await this._runErrorHooks('find', error as Error, { params });
      throw error;
    }
  }

  async get(id: string, params: QueryParams = {}): Promise<unknown> {
    try {
      const user = getCurrentUser();
      let context: HookContext = { method: 'get', id, params, service: this, result: null, user, app: this.app };
      context = await this._runHooks(this.beforeHooks.get, context);

      const record = await this.model.findUnique({ where: { id } });
      if (!record) throw new Error(`Record with id ${id} not found`);

      context.result = record;
      context = await this._runHooks(this.afterHooks.get, context);
      return context.result;
    } catch (error) {
      await this._runErrorHooks('get', error as Error, { params });
      throw error;
    }
  }

  async create(data: Record<string, unknown>, params: QueryParams = {}): Promise<unknown> {
    try {
      const user = getCurrentUser();
      let context: HookContext = { method: 'create', data, params, service: this, result: null, user, app: this.app };
      context = await this._runHooks(this.beforeHooks.create, context);

      const result = await this.model.create({ data: context.data as Record<string, unknown> });
      context.result = result;
      context = await this._runHooks(this.afterHooks.create, context);
      return context.result;
    } catch (error) {
      await this._runErrorHooks('create', error as Error, { params });
      throw error;
    }
  }

  async patch(id: string, data: Record<string, unknown>, params: QueryParams = {}): Promise<unknown> {
    try {
      const user = getCurrentUser();
      let context: HookContext = { method: 'patch', id, data, params, service: this, result: null, user, app: this.app };
      context = await this._runHooks(this.beforeHooks.patch, context);

      const result = await this.model.update({ where: { id }, data: context.data as Record<string, unknown> });
      context.result = result;
      context = await this._runHooks(this.afterHooks.patch, context);
      return context.result;
    } catch (error) {
      await this._runErrorHooks('patch', error as Error, { params });
      throw error;
    }
  }

  async remove(id: string, params: QueryParams = {}): Promise<unknown> {
    try {
      const user = getCurrentUser();
      let context: HookContext = { method: 'remove', id, params, service: this, result: null, user, app: this.app };
      context = await this._runHooks(this.beforeHooks.remove, context);

      const record = await this.model.findUnique({ where: { id } });
      if (!record) throw new Error(`Record with id ${id} not found`);

      const result = await this.model.delete({ where: { id } });
      context.result = result;
      context = await this._runHooks(this.afterHooks.remove, context);
      return context.result;
    } catch (error) {
      await this._runErrorHooks('remove', error as Error, { params });
      throw error;
    }
  }
}

export default BaseService;