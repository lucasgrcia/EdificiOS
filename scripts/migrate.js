const { readFileSync, readdirSync, existsSync } = require('node:fs');
const { join } = require('node:path');
const { Client } = require('pg');

function loadEnvFile() {
  const envPath = join(__dirname, '..', '.env');

  if (!existsSync(envPath)) {
    return;
  }

  const content = readFileSync(envPath, 'utf8');

  for (const line of content) {
    const trimmed = line.trim();

    if (trimmed.length === 0 || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

async function migrate() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('DATABASE_URL is required.');
    process.exit(1);
  }

  const migrationsDir = join(
    __dirname,
    '..',
    'src',
    'operations',
    'infrastructure',
    'migrations',
  );
  const files = readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  const client = new Client({ connectionString });
  await client.connect();

  try {
    for (const file of files) {
      const sql = readFileSync(join(migrationsDir, file), 'utf8');
      await client.query(sql);
      console.log(`Applied ${file}`);
    }
  } finally {
    await client.end();
  }
}

migrate().catch((error) => {
  console.error(error);
  process.exit(1);
});
