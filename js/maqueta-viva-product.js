(function () {
    'use strict';

    var CONFIG_URL = './data/maqueta-viva/torrevieja.config.json';
    var MAX_ROUTE_ITEMS = 5;
    var SECTOR_RECOMMENDATIONS = {
        turismo: ['puerto-marina', 'paseo-maritimo', 'salinas', 'torre-del-moro', 'frente-costero'],
        inmobiliaria: ['centro-urbano', 'zona-comercial', 'frente-costero'],
        eventos: ['puerto-marina', 'parque-naciones', 'frente-costero'],
        retail: ['zona-comercial', 'centro-urbano'],
        hotel: ['frente-costero', 'paseo-maritimo', 'puerto-marina'],
        patrimonio: ['torre-del-moro', 'salinas', 'parque-naciones', 'centro-urbano'],
        'smart-city': ['centro-urbano', 'zona-comercial', 'parque-naciones']
    };
    var PANEL_EVENT_SELECTORS = [
        '#maqueta-brand-panel',
        '#maqueta-command-panel',
        '#maqueta-bottom-panel',
        '#maqueta-ecosystem-panel',
        '#maqueta-layers-panel',
        '#maqueta-data-warning',
        '#share-panel',
        '.share-card',
        '.maqueta-scroll-list',
        '.maqueta-poi-list',
        '#route-list',
        '#share-route-list',
        '#maqueta-status-panel',
        '#maqueta-calibration-panel',
        '.maqueta-calibration-tests',
        '.maqueta-calibration-actions',
        '#maqueta-toolbox',
        '#maqueta-guided-hint'
    ];
    var state = {
        config: null,
        route: [],
        sector: 'turismo',
        clean: false,
        orientationLayer: true,
        inputMode: 'mouse',
        lastRouteHintKey: null,
        userLocation: {
            status: 'exploration-reference',
            lng: null,
            lat: null
        },
        interactionDebug: {
            lastClickTarget: null,
            lastZoneButtonClicked: null,
            clickedLng: null,
            clickedLat: null,
            clickedStyle: null,
            generatedUrl: null,
            navigationMethod: null,
            navigationExecuted: false,
            currentLocationHref: null,
            currentSearchParams: null,
            lngInputValue: null,
            latInputValue: null,
            activeZoneFromUrl: null,
            mode: 'preset',
            timestamp: null
        }
    };

    function $(id) {
        return document.getElementById(id);
    }

    function trackMaquetaEvent(eventName, payload) {
        var zone = getActiveZone ? getActiveZone() : null;
        var event = {
            eventName: eventName,
            timestamp: new Date().toISOString(),
            zone: zone && zone.id,
            sector: state.sector,
            routeCount: state.route.length,
            payload: payload || {}
        };
        window.MAQUETA_ANALYTICS_EVENTS = window.MAQUETA_ANALYTICS_EVENTS || [];
        window.MAQUETA_ANALYTICS_EVENTS.push(event);
        try {
            localStorage.setItem('MAQUETA_ANALYTICS_EVENTS', JSON.stringify(window.MAQUETA_ANALYTICS_EVENTS.slice(-120)));
            localStorage.setItem('maqueta_viva_analytics_events', JSON.stringify(window.MAQUETA_ANALYTICS_EVENTS.slice(-120)));
        } catch (err) {}
        console.info('[Maqueta Viva Analytics]', eventName, event);
        updateAnalyticsPanel();
    }

    window.trackMaquetaEvent = trackMaquetaEvent;

    function getParams() {
        return new URLSearchParams(window.location.search);
    }

    function getInitialParam(key) {
        return window.MAQUETA_VIVA_INITIAL_PARAMS ? window.MAQUETA_VIVA_INITIAL_PARAMS[key] : null;
    }

    function getParam(key) {
        return getParams().get(key) || getInitialParam(key);
    }

    function findSector(id) {
        if (!state.config || !state.config.sectors) return null;
        return state.config.sectors.find(function (sector) { return sector.id === id; }) || state.config.sectors[0];
    }

    function findZone(id) {
        if (!state.config || !state.config.zones || !id) return null;
        return state.config.zones.find(function (zone) { return zone.id === id; }) || null;
    }

    function defaultZone() {
        if (!state.config || !state.config.zones || !state.config.zones.length) return null;
        return findZone(state.config.defaultView && state.config.defaultView.zone) || state.config.zones[0];
    }

    function numericClose(a, b) {
        return Math.abs(Number(a) - Number(b)) < 0.000001;
    }

    function zoneMatchesRuntime(zone, params) {
        if (!zone || !params.has('lng') || !params.has('lat')) return true;
        return numericClose(params.get('lng'), zone.lng) && numericClose(params.get('lat'), zone.lat);
    }

    function manualZone(params) {
        return {
            id: 'custom',
            name: 'Coordenadas manuales',
            description: 'Ubicacion calibrada manualmente desde LNG/LAT + GO.',
            lng: params.get('lng'),
            lat: params.get('lat'),
            style: params.get('style') || 'tile',
            sector: 'Calibracion manual',
            type: 'Calibracion manual',
            calibrationStatus: 'manual-review'
        };
    }

    function getActiveZone() {
        var params = getParams();
        var zoneId = params.get('zone') || (state.config && state.config.defaultView && state.config.defaultView.zone) || 'centro';
        if (zoneId === 'custom') return manualZone(params);
        var zone = findZone(zoneId);
        if (zone && zoneMatchesRuntime(zone, params)) return zone;
        if (zone && params.has('lng') && params.has('lat')) return manualZone(params);
        return zone || defaultZone();
    }


    function getPoiById(id) {
        if (!state.config || !state.config.pois) return null;
        return state.config.pois.find(function (poi) { return poi.id === id; }) || null;
    }

    function getRecommendedIds() {
        if (state.config && state.config.recommendations && state.config.recommendations[state.sector]) {
            return state.config.recommendations[state.sector];
        }
        return SECTOR_RECOMMENDATIONS[state.sector] || [];
    }

    function getZoneType(zone) {
        return (zone && (zone.type || zone.sector)) || 'Zona narrativa';
    }

    function isCalibrateMode() {
        return getParam('calibrate') === '1';
    }

    function getCalibrationLabel(status) {
        if (status === 'manual-verified' || status === 'verified') return 'Verificada manualmente';
        if (status === 'manual-review') return 'Revision manual';
        return 'Aproximada';
    }

    function getRuntimeStyle(zone) {
        return getParams().get('style') || (zone && zone.style) || 'tile';
    }

    function getRuntimeZoom(zone) {
        return Number(getParams().get('zoom') || (zone && zone.zoom) || 16);
    }

    function getRuntimeCoords(zone) {
        var params = getParams();
        var lngInput = $('lng');
        var latInput = $('lat');
        return {
            lng: (lngInput && lngInput.value) || params.get('lng') || (zone && zone.lng),
            lat: (latInput && latInput.value) || params.get('lat') || (zone && zone.lat),
            style: getRuntimeStyle(zone),
            zoom: getRuntimeZoom(zone)
        };
    }

    function buildCalibrationPreset(zone, coords) {
        return {
            id: zone.id,
            name: zone.name,
            description: zone.description,
            lng: Number(coords.lng),
            lat: Number(coords.lat),
            style: coords.style || zone.style || 'tile',
            sector: zone.sector,
            type: zone.type,
            calibrationStatus: 'manual-review'
        };
    }

    function calibrationTestUrl(zone, coords) {
        var params = new URLSearchParams(window.location.search);
        params.set('zone', zone.id);
        params.set('lng', coords.lng);
        params.set('lat', coords.lat);
        params.set('style', coords.style || zone.style || 'tile');
        params.set('sector', state.sector || params.get('sector') || 'turismo');
        params.set('calibrate', '1');
        params.set('refresh', String(Date.now()));
        return new URL('./maqueta-viva-torrevieja.html?' + params.toString(), window.location.href).toString();
    }

    function selectedCalibrationZone() {
        var select = $('calibration-zone-select');
        return (select && select.value && findZone(select.value)) || getActiveZone() || (state.config && state.config.zones && state.config.zones[0]);
    }

    function updateCalibrationPanel() {
        if (!isCalibrateMode() || !state.config) return;
        var zone = selectedCalibrationZone();
        if (!zone) return;
        var coords = getRuntimeCoords(zone);
        var status = getCalibrationLabel(zone.calibrationStatus);
        var preset = buildCalibrationPreset(zone, coords);
        var active = $('calib-active-zone');
        var lng = $('calib-current-lng');
        var lat = $('calib-current-lat');
        var style = $('calib-current-style');
        var statusEl = $('calib-current-status');
        var output = $('calibration-output');
        if (active) active.textContent = zone.name + ' (' + zone.id + ')';
        if (lng) lng.textContent = coords.lng;
        if (lat) lat.textContent = coords.lat;
        if (style) style.textContent = coords.style;
        if (statusEl) statusEl.textContent = status;
        if (output) output.value = JSON.stringify(preset, null, 2);
        syncToolboxPanels();
    }

    function renderCalibrationPanel(config) {
        if (!isCalibrateMode()) return;
        document.body.classList.add('maqueta-calibrate-mode');
        if (!document.body.classList.contains('maqueta-calibration-open')) {
            document.body.classList.add('maqueta-calibration-collapsed');
        }
        var toggle = $('calibration-toggle');
        if (toggle && !toggle.dataset.bound) {
            toggle.dataset.bound = '1';
            toggle.addEventListener('click', function () {
                var willOpen = document.body.classList.contains('maqueta-calibration-collapsed');
                document.body.classList.toggle('maqueta-calibration-collapsed', !willOpen);
                document.body.classList.toggle('maqueta-calibration-open', willOpen);
                toggle.textContent = willOpen ? 'Cerrar' : 'Abrir';
                toggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
            });
        }
        var select = $('calibration-zone-select');
        if (select && !select.options.length) {
            config.zones.forEach(function (zone) {
                var option = document.createElement('option');
                option.value = zone.id;
                option.textContent = zone.name;
                select.appendChild(option);
            });
            var activeZone = getActiveZone();
            select.value = activeZone && activeZone.id !== 'custom' ? activeZone.id : config.zones[0].id;
            select.addEventListener('change', updateCalibrationPanel);
        }
        var tests = $('calibration-zone-buttons');
        if (tests && !tests.children.length) {
            config.zones.forEach(function (zone) {
                var button = document.createElement('button');
                button.type = 'button';
                button.textContent = 'Probar ' + zone.name;
                button.addEventListener('click', function () {
                    applyZonePreset(zone.id, 'calibration-direct-test', null);
                });
                tests.appendChild(button);
            });
        }
        var copyCoords = $('copy-current-coords');
        if (copyCoords && !copyCoords.dataset.bound) {
            copyCoords.dataset.bound = '1';
            copyCoords.addEventListener('click', function () {
                var zone = selectedCalibrationZone();
                var coords = getRuntimeCoords(zone);
                safeCopy(JSON.stringify(coords, null, 2), 'Coordenadas actuales copiadas.');
            });
        }
        var copyPreset = $('copy-preset-json');
        if (copyPreset && !copyPreset.dataset.bound) {
            copyPreset.dataset.bound = '1';
            copyPreset.addEventListener('click', function () {
                var zone = selectedCalibrationZone();
                var preset = buildCalibrationPreset(zone, getRuntimeCoords(zone));
                safeCopy(JSON.stringify(preset, null, 2), 'Preset JSON copiado.');
            });
        }
        var copyUrl = $('copy-test-url');
        if (copyUrl && !copyUrl.dataset.bound) {
            copyUrl.dataset.bound = '1';
            copyUrl.addEventListener('click', function () {
                var zone = selectedCalibrationZone();
                safeCopy(calibrationTestUrl(zone, getRuntimeCoords(zone)), 'URL de prueba copiada.');
            });
        }
        updateCalibrationPanel();
        window.clearInterval(renderCalibrationPanel._timer);
        renderCalibrationPanel._timer = window.setInterval(updateCalibrationPanel, 900);
    }

    function getCurrentUrlState() {
        var params = getParams();
        return {
            zone: params.get('zone') || (state.config && state.config.defaultView && state.config.defaultView.zone) || 'centro',
            lng: params.get('lng'),
            lat: params.get('lat'),
            style: params.get('style')
        };
    }

    function cleanIrrelevantConfig(params) {
        var raw = params.get('config');
        if (!raw) return;
        try {
            var parsed = JSON.parse(decodeURIComponent(raw));
            if (!parsed || !Object.keys(parsed).length) params.delete('config');
        } catch (err) {
            params.delete('config');
        }
    }

    function ensureInteractionDebugPanel() {
        if (getParam('debug') !== '1') return null;
        var panel = $('maqueta-interaction-debug');
        if (panel) return panel;
        panel = document.createElement('section');
        panel.id = 'maqueta-interaction-debug';
        panel.setAttribute('aria-label', 'Maqueta Viva Interaction Debug');
        panel.innerHTML = '<strong>Maqueta Viva Click Debug</strong><pre id="maqueta-interaction-debug-output"></pre>';
        document.body.appendChild(panel);
        bindDebugChip(panel);
        return panel;
    }

    function updateInteractionDebugPanel() {
        var panel = ensureInteractionDebugPanel();
        if (!panel) return;
        bindDebugChip(panel);
        var output = $('maqueta-interaction-debug-output');
        if (output) output.textContent = JSON.stringify(state.interactionDebug, null, 2);
    }

    function recordInteractionDebug(payload) {
        state.interactionDebug = Object.assign({}, state.interactionDebug, payload || {}, {
            currentLocationHref: window.location.href,
            currentSearchParams: window.location.search,
            lngInputValue: $('lng') ? $('lng').value : null,
            latInputValue: $('lat') ? $('lat').value : null,
            activeZoneFromUrl: getParams().get('zone'),
            timestamp: new Date().toISOString()
        });
        updateInteractionDebugPanel();
    }

    function updateAnalyticsPanel() {
        if (getParam('analytics') !== '1') return;
        var panel = $('maqueta-analytics-debug');
        if (!panel) {
            panel = document.createElement('section');
            panel.id = 'maqueta-analytics-debug';
            panel.innerHTML = '<strong>Maqueta Analytics</strong><pre id="maqueta-analytics-output"></pre>';
            document.body.appendChild(panel);
            bindDebugChip(panel);
        }
        bindDebugChip(panel);
        var output = $('maqueta-analytics-output');
        if (output) output.textContent = JSON.stringify((window.MAQUETA_ANALYTICS_EVENTS || []).slice(-25), null, 2);
        syncToolboxPanels();
    }

    function bindDebugChip(panel) {
        if (!panel || panel.dataset.debugChipBound === '1') return;
        panel.dataset.debugChipBound = '1';
        panel.title = 'Click para abrir/cerrar diagnostico tecnico';
        panel.addEventListener('click', function () {
            panel.classList.toggle('is-expanded');
        });
    }

    function bindDebugChipDelegation() {
        document.addEventListener('click', function (ev) {
            var panel = ev.target && ev.target.closest ? ev.target.closest('#maqueta-engine-debug, #maqueta-interaction-debug, #maqueta-analytics-debug') : null;
            if (!panel || panel.dataset.debugChipBound === '1') return;
            bindDebugChip(panel);
            panel.classList.toggle('is-expanded');
        }, true);
    }

    function updateToolboxBadges() {
        var badges = $('maqueta-toolbox-badges');
        if (!badges) return;
        var active = [];
        if (getParam('calibrate') === '1') active.push('Calibracion');
        if (getParam('debug') === '1') active.push('Debug');
        if (getParam('analytics') === '1') active.push('Analytics');
        badges.textContent = active.length ? active.join(' · ') + ' activo' : '';
    }

    function syncToolboxPanels() {
        var calibrationSlot = $('maqueta-toolbox-calibration');
        var debugSlot = $('maqueta-toolbox-debug');
        var analyticsSlot = $('maqueta-toolbox-analytics');
        var calibrationPanel = $('maqueta-calibration-panel');
        var engineDebug = $('maqueta-engine-debug');
        var clickDebug = $('maqueta-interaction-debug');
        var analyticsDebug = $('maqueta-analytics-debug');
        if (calibrationSlot && calibrationPanel && calibrationPanel.parentNode !== calibrationSlot) {
            calibrationSlot.appendChild(calibrationPanel);
        }
        if (debugSlot && engineDebug && engineDebug.parentNode !== debugSlot) {
            debugSlot.appendChild(engineDebug);
        }
        if (debugSlot && clickDebug && clickDebug.parentNode !== debugSlot) {
            debugSlot.appendChild(clickDebug);
        }
        if (analyticsSlot && analyticsDebug && analyticsDebug.parentNode !== analyticsSlot) {
            analyticsSlot.appendChild(analyticsDebug);
        }
        updateToolboxBadges();
    }

    function setInputMode(mode) {
        var allowed = ['mouse', 'touch', 'keyboard', 'gesture-ready'];
        state.inputMode = allowed.indexOf(mode) !== -1 ? mode : 'mouse';
        document.body.setAttribute('data-input-mode', state.inputMode);
        trackMaquetaEvent('input_mode_changed', { inputMode: state.inputMode });
    }

    function handleNavigationIntent(intent, payload) {
        trackMaquetaEvent('navigation_intent_received', {
            inputMode: state.inputMode,
            intent: intent,
            payload: payload || {},
            status: 'gesture-ready-placeholder'
        });
        if (intent === 'select-zone' && payload && payload.zone) {
            applyZonePreset(payload.zone, 'navigation-intent', null);
        }
    }

    window.MaquetaVivaInputController = {
        setInputMode: setInputMode,
        handleNavigationIntent: handleNavigationIntent
    };

    function markerIcon(type, category) {
        if (type === 'you') return '●';
        if (type === 'zone') return '◆';
        if (type === 'route') return '⚑';
        var value = String(category || '').toLowerCase();
        if (value.indexOf('patrimonio') !== -1 || value.indexOf('iglesia') !== -1) return '⌂';
        if (value.indexOf('naturaleza') !== -1 || value.indexOf('verde') !== -1 || value.indexOf('salinas') !== -1) return '✦';
        if (value.indexOf('mar') !== -1 || value.indexOf('costa') !== -1) return '≈';
        if (value.indexOf('retail') !== -1 || value.indexOf('comercio') !== -1) return '▣';
        return '•';
    }

    function accessTypeForPoi(poi) {
        return (poi && poi.accessType) || 'public';
    }

    function markerPosition(item, fallback) {
        var pos = item && item.screenPosition;
        return {
            x: Math.min(92, Math.max(8, Number(pos && pos.x) || fallback.x)),
            y: Math.min(78, Math.max(18, Number(pos && pos.y) || fallback.y))
        };
    }

    function precisionLabel(status, positionMode) {
        if (positionMode === 'user-geolocation') return 'GPS';
        if (positionMode === 'manual-reference') return 'Manual';
        if (status === 'manual-verified') return 'Exacto';
        if (status === 'manual-review') return 'rev.';
        if (status === 'approximate') return 'aprox.';
        if (status === 'public-source') return 'fuente';
        return positionMode === 'screen-narrative' ? 'narr.' : 'rev.';
    }

    function getMarkerTruth(item, type) {
        if (type === 'reference') {
            if (state.userLocation.status === 'allowed') {
                return {
                    label: 'Tu estas aqui',
                    geoStatus: 'manual-review',
                    coordinateSource: 'user',
                    positionMode: 'user-geolocation',
                    precisionLabel: 'GPS',
                    isRealUserLocation: true
                };
            }
            if (state.userLocation.status === 'manual') {
                return {
                    label: 'Punto seleccionado',
                    geoStatus: 'manual-review',
                    coordinateSource: 'user',
                    positionMode: 'manual-reference',
                    precisionLabel: 'Manual',
                    isRealUserLocation: false
                };
            }
            return {
                label: 'Referencia de exploracion',
                geoStatus: 'approximate',
                coordinateSource: 'fallback',
                positionMode: 'screen-narrative',
                precisionLabel: 'narr.',
                isRealUserLocation: false
            };
        }
        var geoStatus = (item && (item.geoStatus || item.calibrationStatus || item.sourceStatus)) || 'unknown';
        var coordinateSource = (item && item.coordinateSource) || (item && item.lng != null && item.lat != null ? 'manual' : 'fallback');
        var screenStatus = (item && item.screenPositionStatus) || (item && item.screenPosition ? 'narrative' : 'unknown');
        var positionMode = screenStatus === 'geo-projected' ? 'geo-projected' : 'screen-narrative';
        return {
            label: item && (item.title || item.name),
            geoStatus: geoStatus,
            coordinateSource: coordinateSource,
            positionMode: positionMode,
            precisionLabel: precisionLabel(geoStatus, positionMode),
            isRealUserLocation: false
        };
    }

    function toggleOrientationLayer(open) {
        state.orientationLayer = typeof open === 'boolean' ? open : !state.orientationLayer;
        document.body.classList.toggle('maqueta-orientation-off', !state.orientationLayer);
        var button = $('maqueta-orientation-toggle');
        if (button) button.textContent = state.orientationLayer ? 'Orientacion activa' : 'Orientacion oculta';
        trackMaquetaEvent('orientation_layer_toggled', { enabled: state.orientationLayer });
        renderOrientationLayer();
    }

    function setLegendOpen(open) {
        var legend = $('maqueta-orientation-legend');
        var button = $('maqueta-orientation-legend-toggle');
        var isOpen = typeof open === 'boolean' ? open : !(legend && legend.hidden);
        if (legend) legend.hidden = !isOpen;
        if (button) button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    }

    function renderOrientationLayer() {
        var list = $('maqueta-marker-list');
        var lines = $('maqueta-route-lines');
        if (!list || !state.config) return;
        var zone = getActiveZone();
        var pois = (state.config.pois || []).filter(function (poi) {
            return poi.zone === (zone && zone.id) || state.route.indexOf(poi.id) !== -1;
        });
        list.innerHTML = '';
        function trackRouteHintOnce(payload) {
            var key = [payload.mode || 'route', payload.poi || '', zone && zone.id, state.route.join(',')].join(':');
            if (state.lastRouteHintKey === key) return;
            state.lastRouteHintKey = key;
            trackMaquetaEvent('next_route_hint_shown', payload);
        }
        function addMarker(kind, item, label, pos, index, truth) {
            truth = truth || getMarkerTruth(item, kind === 'reference' ? 'reference' : kind);
            var marker = document.createElement('button');
            marker.type = 'button';
            marker.className = 'maqueta-map-marker marker-' + kind + ' access-' + (item && accessTypeForPoi(item)) + ' precision-' + truth.geoStatus + ' position-' + truth.positionMode;
            marker.style.left = pos.x + '%';
            marker.style.top = pos.y + '%';
            marker.dataset.kind = kind;
            marker.dataset.positionMode = truth.positionMode;
            marker.dataset.geoStatus = truth.geoStatus;
            marker.dataset.coordinateSource = truth.coordinateSource;
            marker.title = label + ' · ' + truth.precisionLabel + ' · ' + truth.positionMode;
            marker.innerHTML = '<span>' + (index || markerIcon(kind, item && item.category)) + '</span><strong>' + label + '</strong><em>' + truth.precisionLabel + '</em>';
            marker.addEventListener('click', function () {
                if (kind === 'reference') {
                    trackMaquetaEvent(truth.isRealUserLocation ? 'user_location_marker_clicked' : 'exploration_reference_used', { zone: zone && zone.id, positionMode: truth.positionMode });
                    showToast(truth.isRealUserLocation ? 'Ubicacion de sesion activa.' : 'Referencia narrativa: no es GPS real.');
                } else if (kind === 'zone') {
                    trackMaquetaEvent('zone_marker_clicked', { zone: zone && zone.id, geoStatus: truth.geoStatus });
                    showToast('Zona activa: ' + ((zone && zone.name) || 'Torrevieja') + '. Precision: ' + truth.precisionLabel + '.');
                } else if (kind === 'route') {
                    trackMaquetaEvent('route_marker_clicked', { poi: item && item.id, zone: item && item.zone, geoStatus: truth.geoStatus });
                    openPoiDetail(item);
                } else {
                    trackMaquetaEvent('poi_marker_clicked', { poi: item && item.id, zone: item && item.zone, geoStatus: truth.geoStatus });
                    openPoiDetail(item);
                }
            });
            list.appendChild(marker);
        }
        var referenceTruth = getMarkerTruth(null, 'reference');
        addMarker('reference', null, referenceTruth.label, { x: 48, y: 58 }, null, referenceTruth);
        if (zone) addMarker('zone', zone, zone.name, markerPosition(zone, { x: 52, y: 44 }), null, getMarkerTruth(zone, 'zone'));
        pois.slice(0, 6).forEach(function (poi, idx) {
            var routeIndex = state.route.indexOf(poi.id);
            addMarker(routeIndex !== -1 ? 'route' : 'poi', poi, poi.title, markerPosition(poi, { x: 38 + (idx * 8), y: 36 + ((idx % 3) * 7) }), routeIndex !== -1 ? String(routeIndex + 1) : null, getMarkerTruth(poi, 'poi'));
        });
        if (lines) {
            lines.setAttribute('viewBox', '0 0 100 100');
            lines.setAttribute('preserveAspectRatio', 'none');
            var routePois = state.route.map(getPoiById).filter(Boolean);
            if (routePois.length > 1) {
                var points = routePois.map(function (poi) {
                    var pos = markerPosition(poi, { x: 50, y: 50 });
                    return pos.x + ',' + pos.y;
                }).join(' ');
                lines.innerHTML = '<polyline points="' + points + '" vector-effect="non-scaling-stroke"></polyline>';
            } else if (routePois.length === 1) {
                var routePos = markerPosition(routePois[0], { x: 50, y: 50 });
                lines.innerHTML = '<line x1="48" y1="58" x2="' + routePos.x + '" y2="' + routePos.y + '" vector-effect="non-scaling-stroke"></line>';
                trackRouteHintOnce({ poi: routePois[0].id });
            } else if (pois.length) {
                var recommended = pois[0];
                var recommendedPos = markerPosition(recommended, { x: 50, y: 50 });
                lines.innerHTML = '<line x1="48" y1="58" x2="' + recommendedPos.x + '" y2="' + recommendedPos.y + '" vector-effect="non-scaling-stroke"></line>';
                trackRouteHintOnce({ poi: recommended.id, mode: 'recommended' });
            } else {
                lines.innerHTML = '';
            }
        }
        document.body.classList.toggle('maqueta-orientation-off', !state.orientationLayer);
    }

    function findByZone(collection, zoneId) {
        if (!state.config || !state.config[collection]) return null;
        return state.config[collection].find(function (item) { return item.zone === zoneId; }) || null;
    }

    function filterByZone(collection, zoneId) {
        if (!state.config || !state.config[collection]) return [];
        return state.config[collection].filter(function (item) { return item.zone === zoneId; });
    }

    function avatarReact(eventName, payload) {
        var zone = getActiveZone();
        var mood = $('avatar-mood');
        var copy = $('avatar-copy');
        var messages = {
            zone_changed: 'He cambiado el foco a ' + (zone ? zone.name : 'esta zona') + '. Mira como cambia el territorio.',
            poi_added: 'Buen punto. Esta Ruta Viva empieza a tener relato.',
            route_created: 'Tu ruta ya tiene forma. Ahora se puede convertir en recuerdo o propuesta de marca.',
            sound_enabled: 'Mapa sonoro activado: todavia es una capa preparada para integrar audio real.',
            podcast_opened: 'Te muestro la historia preparada para locucion.',
            immersive_video_opened: 'Esta zona queda preparada para video 360, drone, directo o camara.',
            sponsor_opened: 'Este espacio patrocinado esta listo para conectarse con CRM, WhatsApp o reservas.'
        };
        if (mood) mood.textContent = eventName.replace(/_/g, ' ');
        if (copy) copy.textContent = messages[eventName] || 'Estoy siguiendo la experiencia contigo.';
        trackMaquetaEvent('avatar_reaction', { eventName: eventName, payload: payload || {} });
    }

    function downloadTextFile(filename, data) {
        var blob = new Blob([typeof data === 'string' ? data : JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
        saveAs(blob, filename);
    }

    function currentZoneBundle() {
        var zone = getActiveZone();
        var zoneId = zone && zone.id;
        return {
            zone: zone,
            pois: state.config.pois.filter(function (poi) { return poi.zone === zoneId; }),
            soundscape: findByZone('soundscapes', zoneId),
            immersiveMedia: filterByZone('immersiveMedia', zoneId),
            podcastStories: filterByZone('podcastStories', zoneId),
            sponsoredPlaces: filterByZone('sponsoredPlaces', zoneId),
            sector: findSector(state.sector),
            claim: state.config.claim,
            brand: state.config.brand
        };
    }

    function buildZoneUrl(zone) {
        var finalUrl = new URL('./maqueta-viva-torrevieja.html', window.location.href);
        var current = new URLSearchParams(window.location.search);
        ['route', 'debug', 'calibrate', 'analytics', 'view'].forEach(function (key) {
            if (current.has(key)) finalUrl.searchParams.set(key, current.get(key));
            else if (getInitialParam(key)) finalUrl.searchParams.set(key, getInitialParam(key));
        });
        finalUrl.searchParams.set('zone', zone.id);
        finalUrl.searchParams.set('lng', zone.lng);
        finalUrl.searchParams.set('lat', zone.lat);
        var currentStyle = current.get('style');
        var preferredStyle = (currentStyle === 'planet' || currentStyle === 'tile')
            ? currentStyle
            : ((current.has('debug') || current.has('calibrate')) ? (zone.precisionStyle || 'tile') : (zone.style || zone.precisionStyle || 'tile'));
        finalUrl.searchParams.set('style', preferredStyle);
        finalUrl.searchParams.set('zoom', zone.zoom || 16);
        finalUrl.searchParams.set('sector', state.sector || current.get('sector') || 'turismo');
        finalUrl.searchParams.set('refresh', String(Date.now()));
        cleanIrrelevantConfig(finalUrl.searchParams);
        return finalUrl;
    }

    function switchViewStyle(style) {
        var allowed = style === 'planet' ? 'planet' : 'tile';
        var params = getParams();
        params.set('style', allowed);
        params.set('refresh', String(Date.now()));
        trackMaquetaEvent('view_style_changed', {
            style: allowed,
            viewMode: allowed === 'planet' ? 'presentation' : 'precision'
        });
        window.location.href = './maqueta-viva-torrevieja.html?' + params.toString();
    }

    function requestUserLocation() {
        trackMaquetaEvent('geolocation_requested', {});
        if (!navigator.geolocation) {
            state.userLocation.status = 'denied';
            trackMaquetaEvent('geolocation_denied', { reason: 'unsupported' });
            showToast('Geolocalizacion no disponible. Se mantiene referencia de exploracion.');
            renderOrientationLayer();
            return;
        }
        showToast('Solicitando permiso de ubicacion para esta sesion.');
        navigator.geolocation.getCurrentPosition(function (position) {
            state.userLocation.status = 'allowed';
            state.userLocation.lng = position.coords.longitude;
            state.userLocation.lat = position.coords.latitude;
            trackMaquetaEvent('geolocation_allowed', {
                accuracy: position.coords.accuracy
            });
            showToast('Ubicacion de sesion activada. No se guarda en localStorage.');
            renderOrientationLayer();
        }, function (err) {
            state.userLocation.status = 'denied';
            trackMaquetaEvent('geolocation_denied', { code: err && err.code });
            showToast('Permiso denegado. Seguimos con referencia de exploracion.');
            renderOrientationLayer();
        }, {
            enableHighAccuracy: false,
            timeout: 7000,
            maximumAge: 60000
        });
    }

    function applyZonePreset(zoneId, source, ev) {
        if (ev && ev.preventDefault) ev.preventDefault();
        if (ev && ev.stopPropagation) ev.stopPropagation();
        var zone = findZone(zoneId);
        if (!zone) {
            recordInteractionDebug({
                lastClickTarget: source || 'unknown',
                lastZoneButtonClicked: zoneId || null,
                navigationMethod: 'blocked-zone-not-found',
                navigationExecuted: false,
                mode: 'error'
            });
            showToast('Zona no encontrada en configuracion.');
            return;
        }
        var finalUrl = buildZoneUrl(zone);
        console.info('[Maqueta Viva Click]', {
            source: source || 'zone-list',
            zone: zone.id,
            lng: zone.lng,
            lat: zone.lat,
            style: zone.style || 'tile',
            generatedUrl: finalUrl.toString()
        });
        recordInteractionDebug({
            lastClickTarget: source || 'zone-list',
            lastZoneButtonClicked: zone.id,
            clickedLng: String(zone.lng),
            clickedLat: String(zone.lat),
            clickedStyle: zone.style || 'tile',
            generatedUrl: finalUrl.toString(),
            navigationMethod: 'window.location.assign',
            navigationExecuted: true,
            mode: 'preset'
        });
        showZoneLoading(zone);
        trackMaquetaEvent('zone_selected', { zone: zone.id, source: source || 'zone-list' });
        avatarReact('zone_changed', { zone: zone.id, source: source || 'zone-list' });
        window.location.href = finalUrl.toString();
    }

    function makeExperienceUrl(zone, sector, clean, route) {
        var finalUrl = buildZoneUrl(Object.assign({}, zone, { style: zone.style || 'tile' }));
        if (sector) finalUrl.searchParams.set('sector', sector);
        if (route && route.length) {
            finalUrl.searchParams.set('route', route.join(','));
        } else {
            finalUrl.searchParams.delete('route');
        }
        if (clean) {
            finalUrl.searchParams.set('view', 'clean');
        } else {
            finalUrl.searchParams.delete('view');
        }
        cleanIrrelevantConfig(finalUrl.searchParams);
        return './maqueta-viva-torrevieja.html?' + finalUrl.searchParams.toString();
    }

    function makeAbsoluteExperienceUrl() {
        var zone = getActiveZone();
        if (!zone) return window.location.href;
        var relative = makeExperienceUrl(zone, state.sector, state.clean, state.route);
        return new URL(relative, window.location.href).toString();
    }

    function safeCopy(text, okMessage) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text)
                .then(function () { showToast(okMessage); })
                .catch(function () { fallbackCopy(text, okMessage); });
        } else {
            fallbackCopy(text, okMessage);
        }
    }

    function fallbackCopy(text, okMessage) {
        var area = document.createElement('textarea');
        area.value = text;
        area.setAttribute('readonly', 'readonly');
        area.style.position = 'fixed';
        area.style.left = '-9999px';
        document.body.appendChild(area);
        area.select();
        try {
            document.execCommand('copy');
            showToast(okMessage);
        } catch (err) {
            showToast('No se pudo copiar automaticamente. Copia el texto manualmente.');
        }
        document.body.removeChild(area);
    }

    function showToast(message) {
        var toast = $('maqueta-toast');
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add('visible');
        window.clearTimeout(showToast._timer);
        showToast._timer = window.setTimeout(function () {
            toast.classList.remove('visible');
        }, 2800);
    }

    function hideLoading() {
        document.body.classList.add('maqueta-loaded');
        trackMaquetaEvent('maqueta_loaded', {
            sector: state.sector,
            href: window.location.href
        });
    }

    function syncLocationInputs(zone) {
        var params = getParams();
        var lng = $('lng');
        var lat = $('lat');
        var finalLng = params.get('lng') || (zone && zone.lng);
        var finalLat = params.get('lat') || (zone && zone.lat);
        if (lng && finalLng !== undefined && finalLng !== null) lng.value = finalLng;
        if (lat && finalLat !== undefined && finalLat !== null) lat.value = finalLat;
    }

    function updateStatus() {
        var zone = getActiveZone();
        var sector = findSector(state.sector);
        var params = getParams();
        var zoneLabel = $('status-zone');
        var typeLabel = $('status-type');
        var sectorLabel = $('status-sector');
        var coordsLabel = $('status-coords');
        var viewLabel = $('status-view');
        var zoomLabel = $('status-zoom');
        var calibrationLabel = $('status-calibration');
        var routeLabel = $('status-route');
        var contextZoneName = $('context-zone-name');
        var contextZoneCalibration = $('context-zone-calibration');
        var contextZoneViewMode = $('context-zone-view-mode');
        var tileButton = $('view-mode-tile');
        var planetButton = $('view-mode-planet');
        var routeCounterSide = $('route-counter-side');
        var zoneSwitcherLabel = $('maqueta-zone-switcher-label');
        var markerTitle = $('zone-proof-title');
        var markerCopy = $('zone-proof-copy');
        var lng = params.get('lng') || (zone && zone.lng) || '-';
        var lat = params.get('lat') || (zone && zone.lat) || '-';
        var style = params.get('style') || (zone && zone.style) || 'tile';
        var zoom = params.get('zoom') || (zone && zone.zoom) || 16;
        var calibrationStatus = getCalibrationLabel(zone && zone.calibrationStatus);
        if (zoneLabel) zoneLabel.textContent = zone ? zone.name : 'Sin zona';
        if (typeLabel) typeLabel.textContent = getZoneType(zone);
        if (sectorLabel) sectorLabel.textContent = sector ? sector.label : state.sector;
        if (coordsLabel) coordsLabel.textContent = lng + ' / ' + lat;
        if (viewLabel) viewLabel.textContent = style;
        if (zoomLabel) zoomLabel.textContent = zoom;
        if (calibrationLabel) calibrationLabel.textContent = calibrationStatus;
        if (routeLabel) routeLabel.textContent = state.route.length + '/' + MAX_ROUTE_ITEMS;
        if (contextZoneName) contextZoneName.textContent = zone ? zone.name : 'Sin zona';
        if (contextZoneCalibration) contextZoneCalibration.textContent = calibrationStatus + (calibrationStatus === 'Aproximada' ? ' v0.2' : '');
        if (contextZoneViewMode) contextZoneViewMode.textContent = style === 'planet' ? 'Vista planet: presentacion visual' : 'Vista plana: precision territorial';
        if (tileButton) tileButton.classList.toggle('active', style === 'tile');
        if (planetButton) planetButton.classList.toggle('active', style === 'planet');
        if (routeCounterSide) routeCounterSide.textContent = state.route.length + '/' + MAX_ROUTE_ITEMS + ' lugares';
        if (zoneSwitcherLabel) zoneSwitcherLabel.textContent = zone ? zone.name : 'Selecciona zona';
        if (markerTitle) markerTitle.textContent = 'Zona activa: ' + (zone ? zone.name : 'Sin zona');
        if (markerCopy) markerCopy.textContent = 'Marcador narrativo de zona - ' + getZoneType(zone) + ' - ' + calibrationStatus + ' - ' + lng + ' / ' + lat + ' - ' + (style === 'planet' ? 'vista presentacion' : 'vista precision');
        syncLocationInputs(zone);
        renderPremiumLayer();
        renderOrientationLayer();
    }

    function setTechnicalControls(open) {
        document.body.classList.toggle('show-technical-controls', open);
        var btn = $('toggle-technical-controls');
        if (btn) {
            btn.textContent = open ? 'Ocultar controles tecnicos' : 'Controles tecnicos';
            btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        }
        if (open) showToast('Modo tecnico activo: dat.GUI y downloadOBJ visibles.');
        trackMaquetaEvent('technical_controls_opened', { open: open });
    }

    function setCleanMode(clean) {
        state.clean = clean;
        document.body.classList.toggle('maqueta-clean-view', clean);
        var btn = $('toggle-clean-mode');
        if (btn) {
            btn.textContent = clean ? 'Salir de presentacion' : 'Modo presentacion';
        }
        if (clean) {
            toggleDock(false);
            toggleToolbox(false);
            setTechnicalControls(false);
        }
        updateStatus();
    }

    function showZoneLoading(zone) {
        var title = $('maqueta-loading-title');
        var copy = $('maqueta-loading-copy');
        if (title) title.textContent = 'Levantando ' + zone.name + '...';
        if (copy) copy.textContent = 'Generando maqueta desde coordenadas aproximadas del territorio.';
        document.body.classList.remove('maqueta-loaded');
        showToast('Levantando ' + zone.name + '...');
    }

    function navigateToZone(zone, source, ev) {
        applyZonePreset(zone && zone.id, source || 'legacy-navigate', ev);
    }

    function navigateZoneNow(zoneId, source, ev) {
        if (ev && ev.preventDefault) ev.preventDefault();
        if (ev && ev.stopPropagation) ev.stopPropagation();
        var zone = findZone(zoneId);
        if (!zone) return;
        window.location.href = buildZoneUrl(zone).toString();
    }

    function renderZoneJumpBar(config) {
        var bar = $('maqueta-zone-jump-bar');
        if (!bar) {
            bar = document.createElement('header');
            bar.id = 'maqueta-zone-jump-bar';
            bar.setAttribute('aria-label', 'Barra superior Maqueta Viva');
            document.body.appendChild(bar);
        }
        bar.innerHTML = '';
        var activeZone = getActiveZone();
        var brand = document.createElement('div');
        brand.className = 'maqueta-topbar-brand';
        brand.innerHTML = '<span class="maqueta-logo-mark" aria-hidden="true"></span><strong>Maqueta Viva 3D</strong><em>Torrevieja</em>';
        var switcher = document.createElement('div');
        switcher.className = 'maqueta-zone-switcher-wrap';
        switcher.innerHTML = '<button type="button" id="maqueta-zone-switcher" class="maqueta-zone-switcher" aria-expanded="false"><span aria-hidden="true">⌖</span><strong id="maqueta-zone-switcher-label">'
            + (activeZone ? activeZone.name : 'Selecciona zona')
            + '</strong><span aria-hidden="true">⌄</span></button><div id="maqueta-zone-dropdown" class="maqueta-zone-dropdown" hidden></div>';
        var dropdown = switcher.querySelector('#maqueta-zone-dropdown');
        config.zones.forEach(function (zone) {
            var item = document.createElement('button');
            item.type = 'button';
            item.dataset.zoneId = zone.id;
            item.className = activeZone && activeZone.id === zone.id ? 'active' : '';
            item.innerHTML = '<strong>' + zone.name + '</strong><span>' + getZoneType(zone) + '</span>';
            item.addEventListener('pointerdown', function (ev) {
                navigateZoneNow(zone.id, 'zone-dropdown-pointerdown', ev);
            });
            item.addEventListener('click', function (ev) {
                applyZonePreset(zone.id, 'zone-dropdown', ev);
            });
            dropdown.appendChild(item);
        });
        var actions = document.createElement('div');
        actions.className = 'maqueta-topbar-actions';
        actions.innerHTML = '<button type="button" data-maqueta-cta="help">?</button><button type="button" id="maqueta-topbar-tools">⚙</button><button type="button" data-maqueta-cta="visual-mode">◐</button>';
        bar.appendChild(brand);
        bar.appendChild(switcher);
        bar.appendChild(actions);
    }

    function bindZoneDelegation() {
        if (document.body.dataset.maquetaZoneDelegation === '1') return;
        document.body.dataset.maquetaZoneDelegation = '1';
        document.addEventListener('click', function (ev) {
            var target = ev.target && ev.target.closest ? ev.target.closest('.maqueta-zone-card[data-zone-id]') : null;
            if (!target) return;
            applyZonePreset(target.dataset.zoneId, 'zone-card-delegated', ev);
        }, true);
    }

    function renderZones(config) {
        var wrap = $('zones-list');
        if (!wrap) return;
        wrap.innerHTML = '';
        var activeZone = getActiveZone();
        config.zones.forEach(function (zone) {
            var button = document.createElement('a');
            button.className = 'maqueta-zone-card';
            button.dataset.zoneId = zone.id;
            button.dataset.zoneLng = zone.lng;
            button.dataset.zoneLat = zone.lat;
            button.dataset.zoneStyle = zone.style || 'tile';
            button.dataset.zoneUrl = buildZoneUrl(zone).toString();
            button.href = button.dataset.zoneUrl;
            button.setAttribute('role', 'button');
            if (activeZone && zone.id === activeZone.id) button.classList.add('active');
            button.setAttribute('aria-pressed', activeZone && zone.id === activeZone.id ? 'true' : 'false');
            button.innerHTML = '<strong>' + zone.name + '</strong>'
                + '<span>' + zone.description + '</span>'
                + '<small>' + getZoneType(zone) + ' - ' + zone.style + ' - ' + zone.lng + ' / ' + zone.lat + ' - ' + getCalibrationLabel(zone.calibrationStatus) + '</small>';
            button.addEventListener('click', function (ev) {
                applyZonePreset(zone.id, 'zone-list', ev);
            });
            button.addEventListener('pointerdown', function (ev) {
                navigateZoneNow(zone.id, 'zone-card-pointerdown', ev);
            });
            button.onclick = function (ev) {
                applyZonePreset(zone.id, 'zone-card-onclick', ev);
                return false;
            };
            wrap.appendChild(button);
        });
        updateStatus();
    }

    function renderPois(config) {
        var wrap = $('poi-list');
        if (!wrap) return;
        var recommendedIds = getRecommendedIds();
        var sector = findSector(state.sector);
        var sectorLabel = sector ? sector.label : state.sector;
        var activeZone = getActiveZone();
        var activeZoneId = activeZone && activeZone.id;
        var pois = config.pois.slice().sort(function (a, b) {
            var aIndex = recommendedIds.indexOf(a.id);
            var bIndex = recommendedIds.indexOf(b.id);
            if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
            if (aIndex !== -1) return -1;
            if (bIndex !== -1) return 1;
            return a.title.localeCompare(b.title);
        });
        wrap.innerHTML = '';
        pois.forEach(function (poi) {
            var isRecommended = recommendedIds.indexOf(poi.id) !== -1;
            var isInActiveZone = poi.zone === activeZoneId;
            var card = document.createElement('article');
            card.className = 'maqueta-poi-card' + (isRecommended ? ' recommended' : '') + (isInActiveZone ? ' active-zone' : '');
            card.innerHTML = '<div class="maqueta-poi-copy"><div><strong>' + poi.title + '</strong><em>' + poi.category + '</em></div>'
                + (isRecommended ? '<span class="maqueta-recommendation-badge">Recomendado para ' + sectorLabel + '</span>' : '')
                + (isInActiveZone ? '<span class="maqueta-zone-badge">En esta zona</span>' : '')
                + '<p>' + poi.description + '</p>'
                + '<small>' + poi.visitorValue + '</small></div>'
                + '<button type="button" class="maqueta-poi-thumb" data-detail="' + poi.id + '" aria-label="Ver detalle de ' + poi.title + '">'
                + '<img src="' + (poi.thumbnail || './asset/maqueta-viva/placeholders/centro-urbano.svg') + '" alt="' + (poi.imageAlt || poi.title) + '">'
                + '<span>' + (poi.visualStatus === 'placeholder-local' ? 'Demo visual' : 'Visual') + '</span></button>'
                + '<div class="maqueta-card-actions">'
                + '<button type="button" data-add="' + poi.id + '">Anadir</button>'
                + '<button type="button" data-zone="' + poi.zone + '">Ver zona</button>'
                + '</div>';
            card.addEventListener('mouseenter', function () {
                trackMaquetaEvent('poi_card_viewed', { poi: poi.id, zone: poi.zone });
            }, { once: true });
            card.querySelector('[data-detail]').addEventListener('click', function () {
                openPoiDetail(poi);
            });
            card.querySelector('[data-add]').addEventListener('click', function () {
                addPoiToRoute(poi.id);
            });
            card.querySelector('[data-zone]').addEventListener('click', function (ev) {
                if (ev && ev.preventDefault) ev.preventDefault();
                if (ev && ev.stopPropagation) ev.stopPropagation();
                trackMaquetaEvent('poi_opened', { poi: poi.id, zone: poi.zone });
                applyZonePreset(poi.zone, 'poi-card', null);
            });
            card.querySelector('[data-zone]').addEventListener('pointerdown', function (ev) {
                navigateZoneNow(poi.zone, 'poi-card-pointerdown', ev);
            });
            wrap.appendChild(card);
        });
        renderOrientationLayer();
    }

    function openPoiDetail(poi) {
        if (!poi) return;
        var zone = findZone(poi.zone);
        var title = poi.title;
        var copy = poi.description + ' ' + (poi.visitorValue || '') + ' Zona: ' + ((zone && zone.name) || poi.zone) + '. Acceso: ' + accessTypeForPoi(poi) + '.';
        openPremiumModal(title, copy, 'poi_detail_opened', { poi: poi.id, zone: poi.zone });
    }

    function addPoiToRoute(id) {
        if (state.route.indexOf(id) !== -1) {
            showToast('Ese punto ya esta en tu Ruta Viva.');
            return;
        }
        if (state.route.length >= MAX_ROUTE_ITEMS) {
            showToast('Ruta Viva completa: maximo recomendado 5 lugares.');
            return;
        }
        state.route.push(id);
        trackMaquetaEvent('poi_added_to_route', { poi: id, total: state.route.length });
        trackMaquetaEvent('route_marker_added', { poi: id, order: state.route.length });
        avatarReact('poi_added', { poi: id, total: state.route.length });
        renderRoute();
        showToast('Punto anadido a Ruta Viva.');
    }

    function clearRoute() {
        state.route = [];
        renderRoute();
        showToast('Ruta Viva limpiada.');
    }

    function routeText() {
        var names = state.route.map(function (id) {
            var poi = getPoiById(id);
            return poi ? poi.title : id;
        });
        return 'Mi Ruta Viva de Torrevieja: he levantado la ciudad en 3D y creado una ruta con '
            + state.route.length + ' lugares'
            + (names.length ? ' (' + names.join(', ') + ')' : '')
            + '. Descubrela en Maqueta Viva 3D: ' + makeAbsoluteExperienceUrl();
    }

    function renderRoute() {
        var counter = $('route-counter');
        var counterSide = $('route-counter-side');
        var list = $('route-list');
        var empty = $('route-empty');
        var modalList = $('share-route-list');
        var ready = $('route-ready-message');
        if (counter) counter.textContent = state.route.length + '/' + MAX_ROUTE_ITEMS;
        if (counterSide) counterSide.textContent = state.route.length + '/' + MAX_ROUTE_ITEMS + ' lugares';
        if (list) list.innerHTML = '';
        if (modalList) modalList.innerHTML = '';
        if (empty) empty.style.display = state.route.length ? 'none' : 'block';
        state.route.forEach(function (id, idx) {
            var poi = getPoiById(id);
            if (!poi) return;
            var item = document.createElement('li');
            item.innerHTML = '<span>' + (idx + 1) + '</span><strong>' + poi.title + '</strong><small>' + poi.category + '</small>';
            if (list) list.appendChild(item);
            if (modalList) modalList.appendChild(item.cloneNode(true));
        });
        if (ready) {
            ready.textContent = state.route.length
                ? 'Tu Ruta Viva de Torrevieja esta lista.'
                : 'Anade lugares para crear una salida compartible.';
        }
        renderOrientationLayer();
        trackMaquetaEvent('route_visual_updated', { total: state.route.length });
        updateStatus();
    }

    function openSharePanel() {
        if (!state.route.length) {
            showToast('Anade al menos un lugar a tu Ruta Viva.');
            trackMaquetaEvent('route_empty_blocked', {});
            return;
        }
        renderRoute();
        var panel = $('share-panel');
        if (panel) panel.classList.add('visible');
        trackMaquetaEvent('route_created', { total: state.route.length });
        avatarReact('route_created', { total: state.route.length });
    }

    function closeSharePanel() {
        var panel = $('share-panel');
        if (panel) panel.classList.remove('visible');
    }

    function renderSectors(config) {
        var select = $('sector-select');
        if (!select) return;
        select.innerHTML = '';
        config.sectors.forEach(function (sector) {
            var opt = document.createElement('option');
            opt.value = sector.id;
            opt.textContent = sector.label;
            select.appendChild(opt);
        });
        select.value = state.sector;
        select.addEventListener('change', function () {
            state.sector = select.value;
            updateSector(config);
            renderPois(config);
            updateStatus();
            updateCalibrationPanel();
            trackMaquetaEvent('sector_changed', { sector: state.sector });
        });
        updateSector(config);
    }

    function updateSector(config) {
        var sector = findSector(state.sector) || config.sectors[0];
        var microcopy = $('sector-microcopy');
        var cta = $('sector-cta');
        var benefits = $('sector-benefits');
        if (microcopy) microcopy.textContent = sector.microcopy;
        if (cta) cta.textContent = sector.cta;
        if (benefits) {
            benefits.innerHTML = '';
            sector.benefits.forEach(function (benefit) {
                var li = document.createElement('li');
                li.textContent = benefit;
                benefits.appendChild(li);
            });
        }
        updateStatus();
    }

    function renderLayers() {
        var layers = [
            ['Edificios', 'real del motor'],
            ['Calles', 'real del motor'],
            ['Agua', 'real del motor'],
            ['Relieve urbano', 'real del motor'],
            ['Zonas', 'capa de producto'],
            ['POIs', 'capa de producto'],
            ['Ruta Viva', 'capa de producto'],
            ['Exportacion 3D', 'control tecnico']
        ];
        var wrap = $('layers-list');
        if (!wrap) return;
        wrap.innerHTML = '';
        layers.forEach(function (layer) {
            var li = document.createElement('li');
            li.innerHTML = '<strong>' + layer[0] + '</strong><span>' + layer[1] + '</span>';
            wrap.appendChild(li);
        });
    }

    function setActiveDockTab(tabId) {
        var selected = tabId || 'pois';
        Array.prototype.forEach.call(document.querySelectorAll('[data-dock-tab]'), function (button) {
            var active = button.getAttribute('data-dock-tab') === selected;
            button.classList.toggle('active', active);
            button.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        Array.prototype.forEach.call(document.querySelectorAll('[data-dock-panel]'), function (panel) {
            var activePanel = panel.getAttribute('data-dock-panel') === selected;
            panel.hidden = !activePanel;
            panel.classList.toggle('is-active', activePanel);
        });
        trackMaquetaEvent('ui_tab_opened', { tabId: selected });
    }

    function renderActiveDockContent(tabId) {
        setActiveDockTab(tabId);
        renderPremiumLayer();
        renderOrientationLayer();
    }

    function toggleDock(open) {
        var dock = $('maqueta-bottom-panel');
        var button = $('maqueta-dock-toggle');
        var isOpen = typeof open === 'boolean' ? open : !!(dock && dock.classList.contains('is-minimized'));
        if (dock) dock.classList.toggle('is-minimized', !isOpen);
        if (button) {
            button.textContent = isOpen ? 'Minimizar' : 'Abrir';
            button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        }
        trackMaquetaEvent('dock_toggled', { open: isOpen });
    }

    function toggleAccordion(block, forceOpen) {
        if (!block) return;
        var button = block.querySelector('.maqueta-block-toggle');
        var open = typeof forceOpen === 'boolean' ? forceOpen : block.classList.contains('is-collapsed');
        block.classList.toggle('is-collapsed', !open);
        if (button) {
            button.textContent = open ? 'Cerrar' : 'Abrir';
            button.setAttribute('aria-expanded', open ? 'true' : 'false');
        }
        trackMaquetaEvent('accordion_toggled', { open: open, title: block.querySelector('h2') ? block.querySelector('h2').textContent : null });
    }

    function toggleToolbox(open) {
        var toolbox = $('maqueta-toolbox');
        var button = $('maqueta-toolbox-toggle');
        var isOpen = typeof open === 'boolean' ? open : !(toolbox && toolbox.classList.contains('is-open'));
        if (toolbox) toolbox.classList.toggle('is-open', isOpen);
        document.body.classList.toggle('maqueta-toolbox-open', isOpen);
        if (button) button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        syncToolboxPanels();
        trackMaquetaEvent('toolbox_opened', { open: isOpen });
    }

    function toggleZoneDropdown(open) {
        var dropdown = $('maqueta-zone-dropdown');
        var button = $('maqueta-zone-switcher');
        var isOpen = typeof open === 'boolean' ? open : !!(dropdown && dropdown.hidden);
        if (dropdown) dropdown.hidden = !isOpen;
        if (button) button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        trackMaquetaEvent('zone_dropdown_opened', { open: isOpen });
    }

    function closeGuidedHint() {
        var hint = $('maqueta-guided-hint');
        if (hint) hint.hidden = true;
        trackMaquetaEvent('guided_hint_closed', {});
    }

    function installPanelAccordions() {
        [
            { selector: '#maqueta-command-panel .maqueta-panel-block', openUntil: 2 }
        ].forEach(function (group) {
            Array.prototype.slice.call(document.querySelectorAll(group.selector)).forEach(function (block, index) {
                var head = block.querySelector('.maqueta-block-head');
                if (!head || block.dataset.accordionBound === '1') return;
                block.dataset.accordionBound = '1';
                var button = document.createElement('button');
                button.type = 'button';
                button.className = 'maqueta-block-toggle';
                button.textContent = 'Abrir';
                button.setAttribute('aria-expanded', 'false');
                head.appendChild(button);
                var shouldCollapse = index >= group.openUntil;
                block.classList.toggle('is-collapsed', shouldCollapse);
                button.textContent = shouldCollapse ? 'Abrir' : 'Cerrar';
                button.setAttribute('aria-expanded', shouldCollapse ? 'false' : 'true');
                button.addEventListener('click', function (ev) {
                    ev.preventDefault();
                    ev.stopPropagation();
                    toggleAccordion(block);
                });
            });
        });
    }

    function publicDataApi() {
        return window.MaquetaVivaPublicData || null;
    }

    function updatePublicSignals() {
        var zone = getActiveZone();
        var api = publicDataApi();
        var time = $('public-signals-time');
        var weather = $('public-signals-weather');
        var beach = $('public-signals-beach');
        trackMaquetaEvent('public_signals_opened', { zone: zone && zone.id });
        function chip(label, value, status) {
            return '<span class="maqueta-signal-chip ' + status + '"><strong>' + label + '</strong><em>' + value + '</em></span>';
        }
        if (!api) {
            if (time) time.innerHTML = chip('Hora local', new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }), 'available');
            if (weather) weather.innerHTML = chip('Clima', 'pendiente AEMET', 'pending');
            if (beach) beach.innerHTML = chip('Playa', 'fuente oficial pendiente', 'pending');
            return;
        }
        api.getWeatherContext(zone).then(function (context) {
            if (time) time.innerHTML = chip('Hora local', context.localTime, 'available');
            if (weather) weather.innerHTML = chip('Clima', 'pendiente AEMET', 'pending');
            if (beach) beach.innerHTML = chip('Playa', 'fuente oficial pendiente', 'pending');
            trackMaquetaEvent('weather_loaded', { zone: zone && zone.id, status: context.metadata && context.metadata.status });
            if (api.getBeachStatus) {
                api.getBeachStatus(zone).then(function (beachStatus) {
                    if (beach && beachStatus && beachStatus.message) beach.innerHTML = chip('Playa', 'fuente oficial pendiente', 'pending');
                }).catch(function () {});
            }
        }).catch(function (err) {
            if (weather) weather.innerHTML = chip('Clima', 'fallback local', 'pending');
            if (beach) beach.innerHTML = chip('Playa', 'fuente oficial pendiente', 'pending');
            trackMaquetaEvent('weather_failed', { zone: zone && zone.id, error: err.message });
        });
    }

    function renderPublicSources() {
        var api = publicDataApi();
        if (!api) {
            openPremiumModal('Fuentes publicas', 'Conector de datos publicos no disponible. Fallback local activo.', 'public_sources_opened', {});
            return;
        }
        api.getAttribution().then(function (data) {
            var names = (data.registry.sources || []).map(function (source) {
                return source.name + ' [' + source.status + ']';
            }).join(' · ');
            openPremiumModal('Fuentes publicas y atribuciones', data.text + ' Fuentes: ' + names, 'public_sources_opened', { total: (data.registry.sources || []).length });
        });
    }

    function renderPublicPois() {
        var zone = getActiveZone();
        var list = $('public-pois-list');
        var api = publicDataApi();
        if (!list) return;
        list.innerHTML = '<p>Buscando con fallback local...</p>';
        if (!api) {
            list.innerHTML = '<p>Conector no disponible. Fallback local activo.</p>';
            return;
        }
        api.getPublicPois(zone).then(function (result) {
            list.innerHTML = '';
            var pois = result.pois || [];
            if (!pois.length) {
                list.innerHTML = '<p>No hay POIs publicos disponibles. Fallback local activo.</p>';
                return;
            }
            pois.slice(0, 6).forEach(function (poi) {
                var item = document.createElement('article');
                item.className = 'maqueta-public-poi-card';
                item.innerHTML = '<strong>' + poi.title + '</strong><span>' + poi.category + '</span><p>' + poi.description + '</p><button type="button">Anadir como sugerencia</button>';
                item.querySelector('button').addEventListener('click', function () {
                    trackMaquetaEvent('public_poi_suggestion_clicked', { poi: poi.id, zone: zone && zone.id, sourceStatus: poi.sourceStatus });
                    showToast('Sugerencia publica guardada como frontend demo. Requiere revision editorial.');
                });
                list.appendChild(item);
            });
        }).catch(function (err) {
            list.innerHTML = '<p>POIs publicos no disponibles. Fallback local activo.</p>';
            trackMaquetaEvent('public_pois_failed', { zone: zone && zone.id, error: err.message });
        });
    }

    function renderImmersiveLinks(zone) {
        var list = $('immersive-links-list');
        var api = publicDataApi();
        if (!list) return;
        list.innerHTML = '';
        if (!api) return;
        api.getImmersiveLinks(zone).then(function (result) {
            var links = result.links || [];
            if (!links.length) {
                list.innerHTML = '<p>Experiencias inmersivas preparadas para integracion.</p>';
                return;
            }
            links.slice(0, 4).forEach(function (link) {
                var button = document.createElement('button');
                button.type = 'button';
                button.className = 'maqueta-immersive-link';
                button.textContent = link.title + ' · ' + link.type;
                button.addEventListener('click', function () {
                    var eventName = link.type === 'gaussian-splat' ? 'gaussian_splat_requested' : link.type === 'drone-video' ? 'drone_view_requested' : link.type === 'virtual-museum' ? 'virtual_museum_requested' : 'immersive_link_opened';
                    trackMaquetaEvent(eventName, { id: link.id, type: link.type, status: link.status });
                    if (link.url) {
                        window.open(link.url, '_blank', 'noopener');
                    } else {
                        showToast('Experiencia inmersiva preparada para integracion. URL pendiente.');
                    }
                });
                list.appendChild(button);
            });
        });
    }

    function renderPremiumLayer() {
        var zone = getActiveZone();
        if (!zone) return;
        var sound = findByZone('soundscapes', zone.id);
        var media = findByZone('immersiveMedia', zone.id);
        var story = findByZone('podcastStories', zone.id);
        var sponsors = filterByZone('sponsoredPlaces', zone.id);
        var soundCopy = $('soundscape-copy');
        var mediaCopy = $('immersive-media-copy');
        var podcastCopy = $('podcast-copy');
        var sponsoredList = $('sponsored-list');
        var sourcesStatus = $('maqueta-public-sources-status');
        if (soundCopy) soundCopy.textContent = sound ? 'Paisaje sonoro: ' + sound.label + '. ' + sound.fallbackText : 'Audio preparado para integracion en esta zona.';
        if (mediaCopy) mediaCopy.textContent = media ? media.description + ' Estado: ' + media.status + '.' : 'Preparado para video 360, drone, streaming o camara en directo.';
        if (podcastCopy) podcastCopy.textContent = story ? story.title + ' ' + story.duration + '. Podcast preparado para locucion.' : 'Podcast preparado para locucion.';
        if (sourcesStatus) sourcesStatus.textContent = 'Fuentes publicas api-ready. Fallback local activo.';
        updatePublicSignals();
        renderImmersiveLinks(zone);
        if (sponsoredList) {
            sponsoredList.innerHTML = '';
            sponsors.forEach(function (sponsor) {
                var card = document.createElement('article');
                card.className = 'maqueta-sponsored-card';
                card.innerHTML = '<strong>' + sponsor.name + '</strong><span>' + sponsor.category + '</span><p>' + sponsor.description + '</p><button type="button">' + sponsor.ctaLabel + '</button>';
                card.addEventListener('click', function () {
                    trackMaquetaEvent('sponsor_opened', { sponsor: sponsor.id, zone: sponsor.zone });
                }, { once: true });
                card.querySelector('button').addEventListener('click', function () {
                    trackMaquetaEvent('sponsor_cta_clicked', { sponsor: sponsor.id, status: sponsor.sponsorStatus });
                    avatarReact('sponsor_opened', { sponsor: sponsor.id });
                    showToast('Espacio patrocinado demo: listo para conectar con WhatsApp, reservas o CRM.');
                });
                sponsoredList.appendChild(card);
            });
        }
    }

    function openPremiumModal(title, copy, eventName, payload) {
        var modal = $('maqueta-premium-modal');
        function closeModal() {
            if (modal) modal.classList.remove('visible');
        }
        if (!modal) {
            modal = document.createElement('section');
            modal.id = 'maqueta-premium-modal';
            modal.innerHTML = '<div><button type="button" id="premium-modal-close">x</button><p class="maqueta-eyebrow">Capa premium frontend</p><h2 id="premium-modal-title"></h2><p id="premium-modal-copy"></p></div>';
            document.body.appendChild(modal);
            $('premium-modal-close').addEventListener('click', closeModal);
            modal.addEventListener('click', function (ev) {
                if (ev.target === modal) closeModal();
            });
            document.addEventListener('keydown', function (ev) {
                if (ev.key === 'Escape') closeModal();
            });
        }
        $('premium-modal-title').textContent = title;
        $('premium-modal-copy').textContent = copy;
        modal.classList.add('visible');
        trackMaquetaEvent(eventName, payload || {});
    }

    function loadRouteFromUrl(config) {
        var params = getParams();
        var raw = params.get('route');
        if (!raw) return;
        var seen = {};
        state.route = raw.split(',').map(function (id) { return id.trim(); }).filter(function (id) {
            if (!id || seen[id] || !config.pois.some(function (poi) { return poi.id === id; })) return false;
            seen[id] = true;
            return true;
        }).slice(0, MAX_ROUTE_ITEMS);
    }

    function capturePanelEvents() {
        var events = ['wheel', 'touchmove', 'pointerdown'];
        PANEL_EVENT_SELECTORS.forEach(function (selector) {
            Array.prototype.forEach.call(document.querySelectorAll(selector), function (el) {
                events.forEach(function (eventName) {
                    el.addEventListener(eventName, function (ev) {
                        ev.stopPropagation();
                    }, { passive: true });
                });
            });
        });
    }

    function initEvents(config) {
        capturePanelEvents();
        window.addEventListener('maqueta:manual-location', function (event) {
            var detail = event.detail || {};
            recordInteractionDebug({
                lastClickTarget: 'manual-go',
                lastZoneButtonClicked: 'custom',
                clickedLng: detail.lng !== undefined ? String(detail.lng) : null,
                clickedLat: detail.lat !== undefined ? String(detail.lat) : null,
                clickedStyle: detail.style || getParams().get('style') || 'tile',
                generatedUrl: detail.href || window.location.href,
                navigationMethod: 'history.pushState/manual-go',
                navigationExecuted: true,
                mode: 'manual/custom'
            });
            trackMaquetaEvent('manual_coordinates_applied', detail);
            updateStatus();
            updateCalibrationPanel();
        });
        var tech = $('toggle-technical-controls');
        if (tech) {
            tech.addEventListener('click', function () {
                setTechnicalControls(!document.body.classList.contains('show-technical-controls'));
            });
        }
        var clean = $('toggle-clean-mode');
        if (clean) {
            clean.addEventListener('click', function () {
                setCleanMode(!state.clean);
            });
        }
        var exportBtn = $('premium-export-obj');
        if (exportBtn) {
            exportBtn.addEventListener('click', function () {
                setTechnicalControls(true);
                toggleToolbox(true);
                showToast('Modo tecnico activo: usa downloadOBJ en dat.GUI.');
                trackMaquetaEvent('cta_clicked', { id: 'premium-export-obj' });
            });
        }
        var topbarTools = $('maqueta-topbar-tools');
        if (topbarTools) topbarTools.addEventListener('click', function () { toggleToolbox(); });
        var toolbox = $('maqueta-toolbox-toggle');
        if (toolbox) toolbox.addEventListener('click', function () { toggleToolbox(); });
        var orientationToggle = $('maqueta-orientation-toggle');
        if (orientationToggle) orientationToggle.addEventListener('click', function () { toggleOrientationLayer(); });
        var legendToggle = $('maqueta-orientation-legend-toggle');
        if (legendToggle) legendToggle.addEventListener('click', function () { setLegendOpen(); });
        var gestureReady = $('maqueta-gesture-ready');
        if (gestureReady) gestureReady.addEventListener('click', function () {
            setInputMode('gesture-ready');
            showToast('Control gestual preparado como arquitectura futura. No se activa camara todavia.');
        });
        var publicSources = $('maqueta-public-sources-open');
        if (publicSources) publicSources.addEventListener('click', renderPublicSources);
        var publicSignals = $('public-signals-refresh');
        if (publicSignals) publicSignals.addEventListener('click', updatePublicSignals);
        var publicPois = $('public-pois-load');
        if (publicPois) publicPois.addEventListener('click', renderPublicPois);
        var viewTile = $('view-mode-tile');
        if (viewTile) viewTile.addEventListener('click', function () { switchViewStyle('tile'); });
        var viewPlanet = $('view-mode-planet');
        if (viewPlanet) viewPlanet.addEventListener('click', function () { switchViewStyle('planet'); });
        var userLocation = $('use-my-location');
        if (userLocation) userLocation.addEventListener('click', requestUserLocation);
        var zoneSwitcher = $('maqueta-zone-switcher');
        if (zoneSwitcher) zoneSwitcher.addEventListener('click', function (ev) {
            ev.preventDefault();
            ev.stopPropagation();
            toggleZoneDropdown();
        });
        var showZones = $('show-zones-drawer');
        if (showZones) showZones.addEventListener('click', function () {
            var firstBlock = document.querySelector('#maqueta-command-panel .maqueta-panel-block');
            toggleAccordion(firstBlock, true);
            var panel = $('maqueta-command-panel');
            if (panel) panel.classList.toggle('show-zones-list');
            toggleZoneDropdown(true);
        });
        document.addEventListener('click', function (ev) {
            var inSwitcher = ev.target && ev.target.closest ? ev.target.closest('#maqueta-zone-jump-bar') : null;
            if (!inSwitcher) toggleZoneDropdown(false);
        });
        var hintClose = $('maqueta-guided-hint-close');
        if (hintClose) hintClose.addEventListener('click', closeGuidedHint);
        Array.prototype.forEach.call(document.querySelectorAll('[data-dock-tab]'), function (button) {
            button.addEventListener('click', function () {
                var tab = button.getAttribute('data-dock-tab');
                toggleDock(true);
                renderActiveDockContent(tab);
            });
        });
        var dockToggle = $('maqueta-dock-toggle');
        if (dockToggle) dockToggle.addEventListener('click', function () { toggleDock(); });
        var heroCreate = $('hero-create-route');
        if (heroCreate) heroCreate.addEventListener('click', openSharePanel);
        var createSide = $('create-route-side');
        if (createSide) createSide.addEventListener('click', openSharePanel);
        var zoomMinus = $('zoom-minus');
        var zoomPlus = $('zoom-plus');
        var zoomReset = $('zoom-reset');
        function updateZoom(delta, reset) {
            var zone = getActiveZone();
            var current = Number(getParams().get('zoom') || (zone && zone.zoom) || 16);
            var next = reset ? Number((zone && zone.zoom) || 16) : Math.min(17, Math.max(15, current + delta));
            var params = getParams();
            params.set('zoom', String(next));
            params.set('refresh', String(Date.now()));
            trackMaquetaEvent('zoom_changed', { zoom: next, reset: !!reset });
            window.location.href = './maqueta-viva-torrevieja.html?' + params.toString();
        }
        if (zoomMinus) zoomMinus.addEventListener('click', function () { updateZoom(-1, false); });
        if (zoomPlus) zoomPlus.addEventListener('click', function () { updateZoom(1, false); });
        if (zoomReset) zoomReset.addEventListener('click', function () { updateZoom(0, true); });
        var soundBtn = $('soundscape-enable');
        if (soundBtn) {
            soundBtn.addEventListener('click', function () {
                var zone = getActiveZone();
                var sound = zone && findByZone('soundscapes', zone.id);
                var active = soundBtn.dataset.active !== '1';
                soundBtn.dataset.active = active ? '1' : '0';
                soundBtn.textContent = active ? 'Mapa sonoro activo' : 'Activar mapa sonoro';
                trackMaquetaEvent(active ? 'sound_enabled' : 'sound_disabled', { zone: zone && zone.id });
                if (active) {
                    if (sound && sound.audioUrl) trackMaquetaEvent('audio_played', { zone: zone && zone.id, audioUrl: sound.audioUrl });
                    trackMaquetaEvent('soundscape_selected', { zone: zone && zone.id });
                    avatarReact('sound_enabled', { zone: zone && zone.id });
                    showToast(sound ? sound.fallbackText : 'Audio preparado para integracion.');
                } else {
                    trackMaquetaEvent('audio_paused', { zone: zone && zone.id });
                    showToast('Mapa sonoro desactivado.');
                }
            });
        }
        var mediaBtn = $('immersive-media-open');
        if (mediaBtn) {
            mediaBtn.addEventListener('click', function () {
                var zone = getActiveZone();
                var media = zone && findByZone('immersiveMedia', zone.id);
                var copy = media && media.url ? media.description : 'Preparado para video 360, drone, streaming o camara en directo.';
                if (media && media.url) trackMaquetaEvent(media.url.indexOf('http') === 0 ? 'external_immersive_opened' : 'video_played', { zone: zone && zone.id, url: media.url });
                openPremiumModal(media ? media.title : 'Video / Directo', copy, media && media.type === 'live-stream' ? 'livestream_requested' : 'immersive_video_opened', { zone: zone && zone.id });
                avatarReact('immersive_video_opened', { zone: zone && zone.id });
            });
        }
        var podcastBtn = $('podcast-open');
        if (podcastBtn) {
            podcastBtn.addEventListener('click', function () {
                var zone = getActiveZone();
                var story = zone && findByZone('podcastStories', zone.id);
                if (story && story.audioUrl) trackMaquetaEvent('podcast_played', { zone: zone && zone.id, audioUrl: story.audioUrl });
                openPremiumModal(story ? story.title : 'Escuchar historia', story ? story.transcript + ' Podcast preparado para locucion.' : 'Podcast preparado para locucion.', 'podcast_opened', { zone: zone && zone.id });
                trackMaquetaEvent('story_transcript_opened', { zone: zone && zone.id });
                avatarReact('podcast_opened', { zone: zone && zone.id });
            });
        }
        var downloadZone = $('download-zone-story');
        if (downloadZone) downloadZone.addEventListener('click', function () {
            downloadTextFile('maqueta-viva-ficha-zona.json', currentZoneBundle());
            trackMaquetaEvent('download_zone_story', { zone: getActiveZone() && getActiveZone().id });
        });
        var downloadRoute = $('download-route-dossier');
        if (downloadRoute) downloadRoute.addEventListener('click', function () {
            downloadTextFile('maqueta-viva-ruta-viva.json', { city: state.config.city, sector: state.sector, route: state.route.map(getPoiById), claim: state.config.claim, story: routeText(), nextSteps: ['Validar POIs', 'Conectar QR', 'Publicar landing final'] });
            trackMaquetaEvent('download_route_dossier', { total: state.route.length });
        });
        var downloadBrand = $('download-brand-story');
        if (downloadBrand) downloadBrand.addEventListener('click', function () {
            downloadTextFile('maqueta-viva-briefing-marca.json', { brandName: 'Demo brand', claim: state.config.claim, palette: state.config.brand, narrativeTone: 'territorial premium', activeZones: state.config.zones.map(function (z) { return z.id; }), sponsorshipOpportunities: state.config.sponsoredPlaces, immersiveMedia: state.config.immersiveMedia });
            trackMaquetaEvent('download_brand_story', {});
        });
        var clear = $('clear-route');
        if (clear) clear.addEventListener('click', clearRoute);
        var create = $('create-route');
        if (create) create.addEventListener('click', openSharePanel);
        var close = $('share-close');
        if (close) close.addEventListener('click', closeSharePanel);
        var copySummary = $('copy-summary');
        if (copySummary) {
            copySummary.addEventListener('click', function () {
                safeCopy(routeText(), 'Resumen copiado.');
                trackMaquetaEvent('share_copy_clicked', { type: 'summary', total: state.route.length });
            });
        }
        var copyLink = $('copy-link');
        if (copyLink) {
            copyLink.addEventListener('click', function () {
                safeCopy(makeAbsoluteExperienceUrl(), 'Enlace copiado con Ruta Viva.');
                trackMaquetaEvent('share_copy_clicked', { type: 'link', total: state.route.length });
            });
        }
        Array.prototype.forEach.call(document.querySelectorAll('[data-maqueta-cta]'), function (el) {
            el.addEventListener('click', function () {
                trackMaquetaEvent('cta_clicked', { id: el.getAttribute('data-maqueta-cta') });
                showToast('CTA de prototipo: listo para conectar con CRM, QR o landing.');
            });
        });
        Array.prototype.forEach.call(document.querySelectorAll('[data-ecosystem]'), function (el) {
            el.addEventListener('click', function () {
                trackMaquetaEvent('ecosystem_link_clicked', { id: el.getAttribute('data-ecosystem') });
            });
        });
        Array.prototype.forEach.call(document.querySelectorAll('[data-warning-action]'), function (el) {
            el.addEventListener('click', function () {
                var action = el.getAttribute('data-warning-action');
                if (action === 'center' && config.zones[0]) {
                    applyZonePreset(config.zones[0].id, 'warning', null);
                } else if (action === 'original') {
                    window.location.href = './index.html';
                } else if (action === 'hide') {
                    document.documentElement.classList.remove('maqueta-runtime-warning');
                }
            });
        });
    }

    function ensureZoneUrlFromConfig(config) {
        var params = getParams();
        var zoneId = params.get('zone') || (config.defaultView && config.defaultView.zone) || 'centro';
        if (zoneId === 'custom') return false;
        var zone = findZone(zoneId) || config.zones[0];
        var needsOfficialPreset = !params.has('lng') || !params.has('lat') || !params.has('style');
        if (!zone || !needsOfficialPreset) return false;
        params.set('zone', zone.id);
        params.set('lng', zone.lng);
        params.set('lat', zone.lat);
        params.set('style', params.get('style') || ((params.has('debug') || params.has('calibrate')) ? (zone.precisionStyle || 'tile') : (zone.style || zone.precisionStyle || 'tile')));
        if (!params.has('sector')) params.set('sector', config.defaultView.sector || 'turismo');
        params.set('refresh', String(Date.now()));
        window.location.replace('./maqueta-viva-torrevieja.html?' + params.toString());
        return true;
    }

    function applyInitialUrlState(config) {
        var params = getParams();
        state.sector = params.get('sector') || config.defaultView.sector || 'turismo';
        if (!findSector(state.sector)) state.sector = config.defaultView.sector || 'turismo';
        loadRouteFromUrl(config);
        setCleanMode(params.get('view') === 'clean');
        recordInteractionDebug({ mode: params.get('zone') === 'custom' ? 'manual/custom' : 'preset' });
    }

    function init(config) {
        state.config = config;
        if (ensureZoneUrlFromConfig(config)) return;
        applyInitialUrlState(config);
        renderZones(config);
        renderSectors(config);
        renderPois(config);
        renderLayers(config);
        renderRoute();
        renderCalibrationPanel(config);
        renderZoneJumpBar(config);
        bindZoneDelegation();
        bindDebugChipDelegation();
        installPanelAccordions();
        initEvents(config);
        setActiveDockTab('pois');
        syncToolboxPanels();
        window.setInterval(syncToolboxPanels, 1200);
        setInputMode('mouse');
        updateStatus();
        updateAnalyticsPanel();
        trackMaquetaEvent('maqueta_loaded', { version: 'v0.3.1-visual-poi-media-gesture-ready' });
        window.setTimeout(hideLoading, 3200);
        window.setTimeout(function () {
            if (!document.body.classList.contains('show-technical-controls')) {
                setTechnicalControls(false);
            }
        }, 600);
    }

    document.addEventListener('DOMContentLoaded', function () {
        fetch(CONFIG_URL)
            .then(function (res) { return res.json(); })
            .then(init)
            .catch(function (err) {
                console.error('[Maqueta Viva] config error', err);
                document.documentElement.classList.add('maqueta-runtime-warning');
                window.setTimeout(hideLoading, 2600);
            });
    });
})();
