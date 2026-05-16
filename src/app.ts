import express, { Express } from 'express';
import { AppServiceAny } from './types';

const app = express() as Express & {
  services: Map<string, AppServiceAny>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registerService: (name: string, service: any) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getService: (name: string) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

app.services = new Map();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
app.registerService = (name: string, service: any): any => {
  if (app.services.has(name)) {
    throw new Error(`Service ${name} already registered`);
  }
  app.services.set(name, service);
  app[name] = service;
  return service;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
app.getService = (name: string): any => {
  if (!app.services.has(name)) {
    throw new Error(`Service ${name} not registered`);
  }
  return app.services.get(name);
};

export default app;