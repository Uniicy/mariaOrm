import mariadb from 'mariadb';

export interface DBConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

const createPool = (config: DBConfig) => {
  return mariadb.createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    connectionLimit: 5,
  });
};

const pools: { [key: string]: mariadb.Pool } = {};

export const addSchema = (name: string, config: DBConfig) => {
  pools[name] = createPool(config);
};

export const getConnection = async (schema: string) => {
  const pool = pools[schema];
  if (!pool) {
    throw new Error(`No pool found for schema: ${schema}`);
  }
  return await pool.getConnection();
};

/**
 * Fetches column names for a given table.
 * @param schema - The schema name.
 * @param tableName - The table name.
 * @returns A promise that resolves to an array of column names.
 */
export const getColumnNames = async (
  schema: string,
  tableName: string
): Promise<string[]> => {
  const conn = await getConnection(schema);
  const query = `SHOW COLUMNS FROM ${schema}.${tableName}`;
  const rows = await conn.query(query);
  conn.end();
  return rows.map((row: any) => row.Field);
};
