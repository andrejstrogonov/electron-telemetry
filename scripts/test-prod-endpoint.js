const { createServer } = require('./test-server');
const { fetchRemote, validateTelemetry } = require('./validateTelemetryData');

const serverUrl = process.env.TELEMETRY_SERVER_URL || 'http://localhost:8080/status';
const useLocalServer = !process.env.TELEMETRY_SERVER_URL;

async function main() {
  let server;
  if (useLocalServer) {
    server = createServer();
    await new Promise((resolve) => server.listen(8080, resolve));
    console.log('Local test server started at http://localhost:8080/status');
  }

  try {
    const data = await fetchRemote(serverUrl);
    validateTelemetry(data);
    console.log(`PASS: Данные успешно соответствуют ожидаемой структуре (${serverUrl})`);
    process.exit(0);
  } catch (error) {
    console.error(`FAIL: ${error.message}`);
    process.exit(1);
  } finally {
    if (server) {
      server.close();
    }
  }
}

main();
