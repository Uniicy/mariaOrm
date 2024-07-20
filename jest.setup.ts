import { addSchema, DBConfig } from './src/db';
import mariadb from 'mariadb';

const waitForDb = async (config: DBConfig) => {
  let connection;
  while (!connection) {
    try {
      connection = await mariadb.createConnection(config);
      connection.end();
    } catch (err) {
      console.log(`Waiting for database ${config.database} to be ready...`);
      await new Promise((res) => setTimeout(res, 2000));
    }
  }
};

beforeAll(async () => {
  const mainDbConfig: DBConfig = {
    host: 'localhost',
    port: 3306,
    user: 'root', // Use root user
    password: 'rootpassword', // Replace with the actual root password
    database: 'test_main',
  };

  await Promise.all([waitForDb(mainDbConfig)]);

  addSchema('test_main', mainDbConfig);
  addSchema('test_secondary', mainDbConfig);
});
