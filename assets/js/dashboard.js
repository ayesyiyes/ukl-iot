const POLL_INTERVAL_MS = 10000;
const DEVICE_ONLINE_WINDOW_MS = 30000;

// Adjust these starter thresholds to match the food and sensor setup.
const THRESHOLDS = {
    temperature: { warning: 30, danger: 35 },
    humidity: { warning: 75, danger: 85 },
    mq_value: { warning: 400, danger: 700 },
    moisture: { warning: 80, danger: 90 },
};

const sensorDefinitions = [
    { key: 'temperature', valueId: 'temperatureValue', chartId: 'temperatureChart', color: '#ee8c49', label: 'Temperature', unit: '°C', decimals: 1 },
    { key: 'humidity', valueId: 'humidityValue', chartId: 'humidityChart', color: '#338ec2', label: 'Humidity', unit: '%', decimals: 1 },
    { key: 'mq_value', valueId: 'mqValue', chartId: 'mqChart', color: '#8c78c4', label: 'MQ sensor', unit: 'raw', decimals: 0 },
    { key: 'moisture', valueId: 'moistureValue', chartId: 'moistureChart', color: '#299b81', label: 'Moisture', unit: 'as sent', decimals: 0 },
];

let selectedRange = '6h';
let latestReading = null;
let chartInstances = {};

function formatValue(value, decimals = 1) {
    const number = Number(value);
    return Number.isFinite(number) ? number.toLocaleString(undefined, { maximumFractionDigits: decimals }) : '--';
}

function setConnection(elementId, label, state) {
    const element = document.getElementById(elementId);
    element.className = `connection-badge is-${state}`;
    element.querySelector('span:last-child').textContent = label;
}

function setSystemItem(elementId, label, state) {
    const element = document.getElementById(elementId);
    element.innerHTML = `<span class="mini-dot ${state}"></span>${label}`;
}

function sensorSeverity(key, value) {
    const threshold = THRESHOLDS[key];
    if (value >= threshold.danger) return 'danger';
    if (value >= threshold.warning) return 'warning';
    return 'normal';
}

function overallSeverity(reading) {
    const severities = sensorDefinitions.map(({ key }) => sensorSeverity(key, Number(reading[key])));
    if (severities.includes('danger')) return 'danger';
    if (severities.includes('warning')) return 'warning';
    return 'safe';
}

function updateCondition(reading) {
    const panel = document.getElementById('conditionPanel');
    const label = document.getElementById('conditionLabel');
    const message = document.getElementById('conditionMessage');
    if (!reading) {
        panel.className = 'condition-panel status-empty';
        label.textContent = 'NO DATA';
        message.textContent = 'Waiting for the first sensor reading.';
        document.getElementById('readingSummary').textContent = 'No readings received';
        return;
    }

    const severity = overallSeverity(reading);
    const copy = {
        safe: ['SAFE', 'Food condition is currently within the safe range.'],
        warning: ['WARNING', 'One or more sensor readings need attention.'],
        danger: ['DANGER', 'Critical sensor values detected. Check the food condition.'],
    }[severity];
    panel.className = `condition-panel status-${severity}`;
    label.textContent = copy[0];
    message.textContent = copy[1];
    document.getElementById('readingSummary').textContent = `${sensorDefinitions.length} sensors reporting`;
}

function renderReading(reading) {
    latestReading = reading;
    for (const sensor of sensorDefinitions) {
        const value = Number(reading[sensor.key]);
        document.getElementById(sensor.valueId).textContent = formatValue(value, sensor.decimals);
        const card = document.querySelector(`[data-sensor="${sensor.key}"]`);
        const badge = card.querySelector('.sensor-status');
        const severity = sensorSeverity(sensor.key, value);
        const statusCopy = severity === 'normal' ? 'Normal' : severity[0].toUpperCase() + severity.slice(1);
        badge.textContent = statusCopy;
        badge.className = `sensor-status status-${severity}`;
    }

    const timestamp = new Date(reading.created_at);
    document.getElementById('lastUpdate').textContent = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    document.getElementById('systemLastUpdate').textContent = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    document.getElementById('readingAge').textContent = `Received ${timestamp.toLocaleDateString([], { day: 'numeric', month: 'short' })}`;
    updateCondition(reading);
    renderAlerts(reading);
    updateDeviceStatus();
}

function renderAlerts(reading) {
    const alerts = sensorDefinitions
        .map(({ key, label }) => ({ key, label, severity: sensorSeverity(key, Number(reading[key])) }))
        .filter(({ severity }) => severity !== 'normal');
    const list = document.getElementById('alertsList');
    document.getElementById('alertCount').textContent = String(alerts.length);
    if (alerts.length === 0) {
        list.innerHTML = '<p class="empty-message">No active alerts.</p>';
        return;
    }

    list.innerHTML = alerts.map(({ key, label, severity }) => {
        const value = formatValue(reading[key], key === 'temperature' || key === 'humidity' ? 1 : 0);
        const unit = sensorDefinitions.find((sensor) => sensor.key === key).unit;
        const level = severity.toUpperCase();
        return `<div class="alert-row"><span class="alert-level alert-${severity}">${level}</span><div><strong>${label} above normal range</strong><p>Current value: ${value} ${unit}</p></div></div>`;
    }).join('');
}

async function fetchJson(url) {
    const response = await fetch(url, { cache: 'no-store' });
    const body = await response.json();
    if (!response.ok || !body.success) {
        const error = new Error(body.message || 'Request failed');
        error.body = body;
        throw error;
    }
    return body;
}

async function refreshLatest() {
    try {
        const result = await fetchJson('api/latest.php');
        setSystemItem('systemApi', 'Connected', 'is-good');
        setSystemItem('systemDatabase', 'Connected', 'is-good');
        if (result.data) {
            renderReading(result.data);
        } else {
            latestReading = null;
            updateCondition(null);
            document.getElementById('lastUpdate').textContent = 'Waiting for data';
            document.getElementById('systemLastUpdate').textContent = 'Waiting';
            document.getElementById('readingAge').textContent = 'No data yet';
            setConnection('deviceBadge', 'Device Offline', 'offline');
            setSystemItem('systemDevice', 'Offline', 'is-bad');
            renderAlerts({ temperature: 0, humidity: 0, mq_value: 0, moisture: 0 });
            document.querySelectorAll('.sensor-status').forEach((badge) => {
                badge.textContent = 'Waiting';
                badge.className = 'sensor-status status-neutral';
            });
        }
    } catch (error) {
        const serverResponded = error.body?.api_status === 'connected';
        setSystemItem('systemApi', serverResponded ? 'Connected' : 'Unavailable', serverResponded ? 'is-good' : 'is-bad');
        setSystemItem('systemDatabase', error.body?.database_status === 'error' ? 'Unavailable' : 'Checking', error.body?.database_status === 'error' ? 'is-bad' : '');
        if (!latestReading) {
            setConnection('deviceBadge', 'Device Offline', 'offline');
            updateCondition(null);
        }
    }
}

function updateDeviceStatus() {
    if (!latestReading) return;
    const age = Date.now() - new Date(latestReading.created_at).getTime();
    const online = Number.isFinite(age) && age <= DEVICE_ONLINE_WINDOW_MS;
    setConnection('deviceBadge', online ? 'Device Online' : 'Device Offline', online ? 'online' : 'offline');
    setSystemItem('systemDevice', online ? 'Online' : 'Offline', online ? 'is-good' : 'is-bad');
}

function makeChart(sensor, rows) {
    const canvas = document.getElementById(sensor.chartId);
    const wrap = canvas.closest('.chart-wrap');
    const hasData = rows.length > 0;
    wrap.classList.toggle('has-data', hasData);
    if (!window.Chart) return;

    const labels = rows.map((row) => new Date(row.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    const values = rows.map((row) => Number(row[sensor.key]));
    if (chartInstances[sensor.key]) {
        chartInstances[sensor.key].data.labels = labels;
        chartInstances[sensor.key].data.datasets[0].data = values;
        chartInstances[sensor.key].update('none');
        return;
    }

    chartInstances[sensor.key] = new Chart(canvas, {
        type: 'line',
        data: { labels, datasets: [{ data: values, borderColor: sensor.color, backgroundColor: `${sensor.color}18`, fill: true, tension: 0.34, borderWidth: 2, pointRadius: 0, pointHoverRadius: 4 }] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { intersect: false, mode: 'index' },
            plugins: { legend: { display: false }, tooltip: { displayColors: false, padding: 10, callbacks: { label: (context) => `${formatValue(context.raw, sensor.decimals)} ${sensor.unit}` } } },
            scales: {
                x: { grid: { display: false }, ticks: { maxTicksLimit: 5, color: '#8c9992', font: { family: 'DM Sans', size: 10 } }, border: { display: false } },
                y: { grid: { color: '#edf1ee' }, ticks: { maxTicksLimit: 4, color: '#8c9992', font: { family: 'DM Sans', size: 10 } }, border: { display: false } },
            },
        },
    });
}

async function refreshHistory() {
    try {
        const result = await fetchJson(`api/history.php?range=${encodeURIComponent(selectedRange)}`);
        for (const sensor of sensorDefinitions) makeChart(sensor, result.data);
    } catch (error) {
        for (const sensor of sensorDefinitions) {
            document.getElementById(sensor.chartId).closest('.chart-wrap').classList.remove('has-data');
        }
    }
}

document.querySelectorAll('[data-range]').forEach((button) => {
    button.addEventListener('click', () => {
        selectedRange = button.dataset.range;
        document.querySelectorAll('[data-range]').forEach((item) => {
            const selected = item === button;
            item.classList.toggle('is-selected', selected);
            item.setAttribute('aria-pressed', String(selected));
        });
        refreshHistory();
    });
});

refreshLatest();
refreshHistory();
setInterval(() => {
    refreshLatest();
    refreshHistory();
    updateDeviceStatus();
}, POLL_INTERVAL_MS);
setInterval(updateDeviceStatus, 5000);