function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function validateTelemetryPayload(data) {
  assert(data && typeof data === 'object', 'Отсутствуют данные телеметрии');
  assert(typeof data.timestamp_ms === 'number', 'timestamp_ms должен быть числом');
  assert(data.temperatures_c && typeof data.temperatures_c === 'object', 'temperatures_c отсутствует или имеет неверный тип');
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
}

function showError(message) {
  const errorElement = document.getElementById('error-message');
  if (errorElement) {
    errorElement.textContent = `Ошибка загрузки данных: ${message}`;
  }
}

function renderTelemetry(data) {
  const tempsBody = document.querySelector('#temps-table tbody');
  tempsBody.innerHTML = '';
  Object.entries(data.temperatures_c).forEach(([name, temp]) => {
    const isHot = temp > data.thresholds_c.max_safe;
    const statusClass = isHot ? 'warning' : (temp > data.thresholds_c.target ? '' : 'ok');
    const statusText = isHot ? 'ПЕРЕГРЕВ' : (temp > data.thresholds_c.target ? 'Повышено' : 'Норма');

    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${name}</td>
      <td>${temp.toFixed(1)} °C</td>
      <td class="${statusClass}">${statusText}</td>
    `;
    tempsBody.appendChild(tr);
  });

  document.getElementById('voltage').textContent = data.power.voltage_v.toFixed(2);
  const powerStatusEl = document.getElementById('power-status');
  powerStatusEl.textContent = data.power.status;
  powerStatusEl.className = data.power.status === 'ok' ? 'ok' : 'warning';

  document.getElementById('fan-pwm').textContent = data.fan.pwm_percent;
  document.getElementById('fan-pin-pwm').textContent = data.fan.pin_fan_pwm;
  document.getElementById('fan-pin-exp').textContent = data.fan.pin_exp;
  document.getElementById('fan-exp-flag').textContent = String(data.fan.exp_flag);

  document.getElementById('crc-value').textContent = data.crc.last_block_crc32;
  const crcStatusEl = document.getElementById('crc-status');
  crcStatusEl.textContent = data.crc.ok ? 'OK' : 'Ошибка';
  crcStatusEl.className = data.crc.ok ? 'ok' : 'warning';

  const eventsList = document.getElementById('events-list');
  eventsList.innerHTML = '';
  if (data.events.length === 0) {
    eventsList.innerHTML = '<li>Нет событий</li>';
  } else {
    data.events.forEach(ev => {
      const li = document.createElement('li');
      li.textContent = `[${new Date(ev.timestamp_ms).toLocaleTimeString()}] ${ev.type}: отклонение ${ev.deviation_percent}%`;
      eventsList.appendChild(li);
    });
  }

  document.getElementById('system-mode').textContent = data.system.mode;
  document.getElementById('uptime').textContent = data.system.uptime_s;
}

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const data = await window.telemetryAPI.getData();
    validateTelemetryPayload(data);
    renderTelemetry(data);
  } catch (err) {
    showError(err.message || String(err));
  }
});
