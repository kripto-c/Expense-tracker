import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

const { Pool } = pg;

/**
 * URL de conexión a la base de datos PostgreSQL
 * Definida en la variable de entorno DATABASE_URL
 */
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined in .env');
}

/**
 * Pool de conexiones PostgreSQL
 * Utilizado por el adaptador de Prisma para conectar a la base de datos
 */
const pool = new Pool({ connectionString });

/**
 * Adaptador de Prisma para PostgreSQL
 * Permite usar Prisma con una conexión de pool de pg
 */
const adapter = new PrismaPg(pool);

/**
 * Instancia global del cliente de Prisma
 * Utilizado por todos los servicios para interactuar con la base de datos
 */
const prisma = new PrismaClient({ adapter });

export default prisma;