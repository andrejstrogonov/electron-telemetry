const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { URL } = require('url');

const arg = process.argv.find((item) => item.startsWith('--source='));
const source = arg ? arg.split('=')[1] : 'data/test-telemetry.json';

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) fail(message);
}

function readLocalFile(filePath) {
  const resolved = path.resolve(filePath);
  if (!fs.existsSync(resolved)) {
    fail(`Файл не найден: ${resolved}`);
  }
  try {
    return JSON.parse(fs.readFileSync(resolved, 'utf8'));
  } catch (err) {
    fail(`Не удалось прочитать JSON: ${err.message}`);
  }
}

function fetchRemote(urlString) {
  const urlObj = new URL(urlString);
  const lib = urlObj.protocol === 'https:' ? https : http;

  return new Promise((resolve, reject) => {
    lib.get(urlObj, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        try {
          resolve(JSON.parse(body));
        } catch (err) {
          reject(new Error(`Invalid JSON: ${err.message}`));
        }
      });
    }).on('error', reject);
  });
}

function validateTelemetry(data) {
  assert(data && typeof data === 'object', 'Телеметрия должна быть объектом');
  assert(typeof data.timestamp_ms === 'number', 'timestamp_ms должен быть числом');
  assert(data.temperatures_c && typeof data.temperatures_c === 'object', 'temperatures_c отсутствует или неверный тип');
  assert(data.power && typeof data.power === 'object', 'power отсутствует');
  assert(data.fan && typeof data.fan === 'object', 'fan отсутствует');
  assert(data.crc && typeof data.crc === 'object', 'crc отсутствует');
  assert(Array.isArray(data.events), 'events должен быть массивом');
  assert(data.thresholds_c && typeof data.thresholds_c === 'object', 'thresholds_c отсутствует');
  assert(data.system && typeof data.system === 'object', 'system отсутствует');

  assert(typeof data.power.voltage_v === 'number', 'power.voltage_v должен быть числом');
  assert(typeof data.power.status === 'string', 'power.status должен быть строкой');
  assert(typeof data.fan.pwm_percent === 'number', 'fan.pwm_percent должен быть числом');
  assert(typeof data.fan.pin_fan_pwm === 'string', 'fan.pin_fan_pwm должен быть строкой');
  assert(typeof data.fan.pin_exp === 'string', 'fan.pin_exp должен быть строкой');
  assert(typeof data.fan.exp_flag === 'boolean', 'fan.exp_flag должен быть boolean');
  assert(typeof data.crc.last_block_crc32 === 'string', 'crc.last_block_crc32 должен быть строкой');
  assert(typeof data.crc.ok === 'boolean', 'crc.ok должен быть boolean');
  assert(typeof data.thresholds_c.target === 'number', 'thresholds_c.target должен быть числом');
  assert(typeof data.thresholds_c.max_safe === 'number', 'thresholds_c.max_safe должен быть числом');
  assert(typeof data.system.mode === 'string', 'system.mode должен быть строкой');
  assert(typeof data.system.uptime_s === 'number', 'system.uptime_s должен быть числом');

  data.events.forEach((event, index) => {
    assert(event && typeof event === 'object', `events[${index}] должен быть объектом`);
    assert(typeof event.type === 'string', `events[${index}].type должен быть строкой`);
    assert(typeof event.timestamp_ms === 'number', `events[${index}].timestamp_ms должен быть числом`);
    assert(typeof event.value === 'number', `events[${index}].value должен быть числом`);
    assert(typeof event.deviation_percent === 'number', `events[${index}].deviation_percent должен быть числом`);
  });
}

async function main() {
  try {
    const value = /^https?:\/\//i.test(source)
      ? await fetchRemote(source)
      : readLocalFile(source);
    validateTelemetry(value);
    console.log(`PASS: Данные успешно соответствуют ожидаемой структуре (${source})`);
    process.exit(0);
  } catch (err) {
    console.error(`FAIL: ${err.message}`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  readLocalFile,
  fetchRemote,
  validateTelemetry
};
