const { readFileSync, readdirSync, existsSync } = require('node:fs');
const { join } = require('node:path');
const { Client } = require('pg');

function loadEnvFile() {
  const envPath = join(__dirname, '..', '.env');

  if (!existsSync(envPath)) {
    return;
  }

  const content = readFileSync(envPath, 'utf8');

  for (const line of content.split(/\r?\n/)) {
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

  const migrationDirectories = [
    join(__dirname, '..', 'src', 'operations', 'infrastructure', 'migrations'),
    join(
      __dirname,
      '..',
      'src',
      'authentication',
      'infrastructure',
      'persistence',
      'migrations',
    ),
  ];

  const files = migrationDirectories
    .flatMap((migrationsDir) =>
      readdirSync(migrationsDir)
        .filter((file) => file.endsWith('.sql'))
        .map((file) => ({
          file,
          path: join(migrationsDir, file),
        })),
    )
    .sort((left, right) => left.path.localeCompare(right.path));

  const client = new Client({ connectionString });
  await client.connect();

  try {
    for (const migration of files) {
      const sql = readFileSync(migration.path, 'utf8');
      await client.query(sql);
      console.log(`Applied ${migration.file}`);
    }
  } finally {
    await client.end();
  }
}

migrate().catch((error) => {
  console.error(error);
  process.exit(1);
});
