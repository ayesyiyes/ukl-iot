<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#f4f8f5">
    <title>FoodGuard | Food Spoilage Detection System</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="assets/css/style.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.7/dist/chart.umd.min.js" defer></script>
    <script src="assets/js/dashboard.js" defer></script>
</head>
<body>
    <div class="page-shell">
        <header class="topbar">
            <a class="brand" href="./" aria-label="FoodGuard dashboard">
                <span class="brand-mark" aria-hidden="true">
                    <svg viewBox="0 0 32 32" fill="none"><path d="M16 27c-6.1 0-10.5-4.1-10.5-10.2C5.5 10.5 10 5.4 18.8 5c.5 8.2-1.6 12-6.5 12.9 2.3.2 4.5-.5 6.5-2.4 1.1-1 2-2.3 2.8-3.9C24.5 22 21.4 27 16 27Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M10 24c1.1-3.1 3.4-5.7 6.8-7.8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
                </span>
                <span class="brand-copy"><strong>FoodGuard</strong><small>Food Spoilage Detection System</small></span>
            </a>
            <div class="topbar-meta">
                <span id="deviceBadge" class="connection-badge is-offline"><span class="status-dot"></span><span>Device Offline</span></span>
                <span class="topbar-divider" aria-hidden="true"></span>
                <div class="last-update"><span>Last update</span><strong id="lastUpdate">Waiting for data</strong></div>
            </div>
        </header>

        <main>
            <section class="overview-heading">
                <div><p class="eyebrow">LIVE MONITORING</p><h1>Food condition</h1></div>
                <span class="refresh-note"><span class="pulse-dot"></span>Auto refresh · 10 sec</span>
            </section>

            <section id="conditionPanel" class="condition-panel status-empty" aria-live="polite">
                <div class="condition-main">
                    <div class="condition-icon" aria-hidden="true">
                        <svg viewBox="0 0 32 32" fill="none"><path d="M16 4.5 27 10v7.2c0 6.4-4.7 9.6-11 11.3C9.7 26.8 5 23.6 5 17.2V10l11-5.5Z" stroke="currentColor" stroke-width="1.8"/><path d="m11.5 16.2 3 3 6-6.2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    </div>
                    <div><p class="eyebrow">OVERALL CONDITION</p><h2 id="conditionLabel">NO DATA</h2><p id="conditionMessage">Waiting for the first sensor reading.</p></div>
                </div>
                <div class="condition-side"><span class="condition-side-label">Monitoring</span><strong>Food spoilage</strong><span id="readingSummary">No readings received</span></div>
            </section>

            <section class="sensor-section" aria-labelledby="sensorHeading">
                <div class="section-heading"><div><p class="eyebrow">SENSOR SNAPSHOT</p><h2 id="sensorHeading">Latest readings</h2></div><span id="readingAge" class="muted-label">No data yet</span></div>
                <div class="sensor-grid">
                    <article class="sensor-card" data-sensor="temperature">
                        <div class="sensor-card-top"><span class="sensor-icon temperature-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M14 14.8V5a3 3 0 0 0-6 0v9.8a5 5 0 1 0 6 0Z" stroke="currentColor" stroke-width="1.7"/><path d="M11 12V6m0 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg></span><span class="sensor-status status-neutral">Waiting</span></div>
                        <p class="sensor-name">Temperature</p><div class="sensor-reading"><strong id="temperatureValue">--</strong><span>°C</span></div><p class="sensor-foot">DHT11 · Air temperature</p>
                    </article>
                    <article class="sensor-card" data-sensor="humidity">
                        <div class="sensor-card-top"><span class="sensor-icon humidity-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M12 3.5S5.5 11 5.5 15.2a6.5 6.5 0 1 0 13 0C18.5 11 12 3.5 12 3.5Z" stroke="currentColor" stroke-width="1.7"/><path d="M9 16.5c.3 1.2 1.2 1.9 2.5 2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg></span><span class="sensor-status status-neutral">Waiting</span></div>
                        <p class="sensor-name">Humidity</p><div class="sensor-reading"><strong id="humidityValue">--</strong><span>%</span></div><p class="sensor-foot">DHT11 · Air humidity</p>
                    </article>
                    <article class="sensor-card" data-sensor="mq_value">
                        <div class="sensor-card-top"><span class="sensor-icon gas-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M12 3.5c1.2 3.6-2.5 4.1-1.6 7.1.5 1.5 1.9 1.7 2.6.5.5-.8.5-1.7.2-2.6 2.7 2 4.3 4.1 4.3 6.6a5.5 5.5 0 0 1-11 0c0-2.5 1.4-4.4 3.5-6.8-.3 2.2.1 3 1.1 3.3C9.2 8.8 14 7.7 12 3.5Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg></span><span class="sensor-status status-neutral">Waiting</span></div>
                        <p class="sensor-name">MQ Sensor</p><div class="sensor-reading"><strong id="mqValue">--</strong><span>raw</span></div><p class="sensor-foot">MQ sensor · Raw value</p>
                    </article>
                    <article class="sensor-card" data-sensor="moisture">
                        <div class="sensor-card-top"><span class="sensor-icon moisture-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M4 18.5h16M6 18.5V9.8l6-4.3 6 4.3v8.7M9 18.5v-5h6v5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 8.8v2.4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg></span><span class="sensor-status status-neutral">Waiting</span></div>
                        <p class="sensor-name">Moisture</p><div class="sensor-reading"><strong id="moistureValue">--</strong><span id="moistureUnit">as sent</span></div><p class="sensor-foot">Soil moisture · ESP unit</p>
                    </article>
                </div>
            </section>

            <section class="history-section" aria-labelledby="historyHeading">
                <div class="section-heading history-heading"><div><p class="eyebrow">SENSOR HISTORY</p><h2 id="historyHeading">Reading trends</h2></div><div class="range-filter" role="group" aria-label="History time range"><button type="button" data-range="1h">1 hour</button><button type="button" data-range="6h" class="is-selected" aria-pressed="true">6 hours</button><button type="button" data-range="24h" aria-pressed="false">24 hours</button></div></div>
                <div class="chart-grid">
                    <article class="chart-panel"><div class="chart-title"><span class="chart-key temperature-key"></span><h3>Temperature</h3><span>°C</span></div><div class="chart-wrap"><canvas id="temperatureChart" aria-label="Temperature history chart"></canvas><p class="chart-empty">No readings in this period</p></div></article>
                    <article class="chart-panel"><div class="chart-title"><span class="chart-key humidity-key"></span><h3>Humidity</h3><span>%</span></div><div class="chart-wrap"><canvas id="humidityChart" aria-label="Humidity history chart"></canvas><p class="chart-empty">No readings in this period</p></div></article>
                    <article class="chart-panel"><div class="chart-title"><span class="chart-key mq-key"></span><h3>MQ Value</h3><span>raw</span></div><div class="chart-wrap"><canvas id="mqChart" aria-label="MQ value history chart"></canvas><p class="chart-empty">No readings in this period</p></div></article>
                    <article class="chart-panel"><div class="chart-title"><span class="chart-key moisture-key"></span><h3>Moisture</h3><span>as sent</span></div><div class="chart-wrap"><canvas id="moistureChart" aria-label="Moisture history chart"></canvas><p class="chart-empty">No readings in this period</p></div></article>
                </div>
            </section>

            <section class="bottom-grid">
                <article class="info-panel alerts-panel"><div class="section-heading compact-heading"><div><p class="eyebrow">RECENT ALERTS</p><h2>Condition events</h2></div><span id="alertCount" class="count-badge">0</span></div><div id="alertsList" class="alerts-list"><p class="empty-message">No active alerts.</p></div></article>
                <article class="info-panel system-panel"><div class="section-heading compact-heading"><div><p class="eyebrow">SYSTEM INFORMATION</p><h2>Connection status</h2></div><span class="system-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><rect x="4" y="5" width="16" height="14" rx="2" stroke="currentColor" stroke-width="1.6"/><path d="M8 9h8m-8 4h5m-5 3h3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg></span></div><dl class="system-list"><div><dt>Device</dt><dd id="systemDevice"><span class="mini-dot"></span>Offline</dd></div><div><dt>Last data received</dt><dd id="systemLastUpdate">Waiting</dd></div><div><dt>PHP API</dt><dd id="systemApi"><span class="mini-dot"></span>Checking</dd></div><div><dt>Supabase database</dt><dd id="systemDatabase"><span class="mini-dot"></span>Checking</dd></div></dl></article>
            </section>
        </main>
        <footer class="page-footer"><span>FoodGuard <span aria-hidden="true">·</span> Food Spoilage Detection System</span><span>Sensor readings are displayed as received from the device.</span></footer>
    </div>
</body>
</html>