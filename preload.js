const { contextBridge } = require('electron');
const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const { URL } = require('url');

const TELEMETRY_MODE = process.env.TELEMETRY_MODE === 'prod' ? 'prod' : 'test';
const TELEMETRY_SERVER_URL = process.env.TELEMETRY_SERVER_URL || 'http://localhost:8080/status';
const TEST_DATA_FILE = path.join(__dirname, 'data', 'test-telemetry.json');

function loadTestData() {
  const raw = fs.readFileSync(TEST_DATA_FILE, 'utf8');
  return JSON.parse(raw);
}

function fetchRemoteTelemetry() {
  const url = new URL(TELEMETRY_SERVER_URL);
  const lib = url.protocol === 'https:' ? https : http;
  return new Promise((resolve, reject) => {
    const req = lib.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
        try {
          resolve(JSON.parse(body));
        } catch (err) {
          reject(new Error(`Invalid JSON from ${TELEMETRY_SERVER_URL}: ${err.message}`));
        }
      });
    });
    req.on('error', reject);
  });
}

contextBridge.exposeInMainWorld('telemetryAPI', {
  getData: async () => {
    if (TELEMETRY_MODE === 'test') {
      return loadTestData();
    }
    return fetchRemoteTelemetry();
  },
  getMode: () => TELEMETRY_MODE,
  getTelemetryUrl: () => TELEMETRY_MODE === 'prod' ? TELEMETRY_SERVER_URL : null
});
