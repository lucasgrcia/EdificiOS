const { Client } = require('pg');

const connectionString =
  process.env.DATABASE_URL ??
  'postgresql://edificios:edificios@localhost:5432/edificios';
const maxAttempts = 30;
const delayMs = 1000;

async function waitForPostgres() {
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const client = new Client({ connectionString });

    try {
      await client.connect();
      await client.query('SELECT 1');
      await client.end();
      console.log('PostgreSQL is ready.');
      return;
    } catch (error) {
      await client.end().catch(() => undefined);

      if (attempt === maxAttempts) {
        throw error;
      }

      console.log(`Waiting for PostgreSQL (${attempt}/${maxAttempts})...`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
}

waitForPostgres().catch((error) => {
  console.error('PostgreSQL did not become ready in time.');
  console.error(error);
  process.exit(1);
});
