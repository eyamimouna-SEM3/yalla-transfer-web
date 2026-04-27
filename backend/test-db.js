const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  password: 'password',
  host: 'localhost',
  port: 5432,
  database: 'yalla_transfer',
});

client.connect()
  .then(() => {
    console.log('✅ Connection to PostgreSQL successful!');
    console.log('Database: yalla_transfer');
    console.log('User: postgres');
    return client.query('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = "public"');
  })
  .then((result) => {
    console.log(`✅ Found ${result.rows[0].count} tables in the database`);
    return client.end();
  })
  .catch((error) => {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  });
