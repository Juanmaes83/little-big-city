(function () {
    'use strict';

    var CONFIG_URL = './data/maqueta-viva/torrevieja.config.json';
    var MAX_ROUTE_ITEMS = 5;
    var SECTOR_RECOMMENDATIONS = {
        turismo: ['puerto-marina', 'paseo-maritimo', 'salinas', 'frente-costero'],
        inmobiliaria: ['centro-urbano', 'zona-comercial', 'frente-costero'],
        eventos: ['puerto-marina', 'parque-naciones', 'frente-costero'],
        retail: ['zona-comercial', 'centro-urbano'],
        hotel: ['frente-costero', 'paseo-maritimo', 'puerto-marina'],
        patrimonio: ['salinas', 'parque-naciones', 'centro-urbano'],
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
        '.maqueta-calibration-actions'
    ];
    var state = {
        config: null,
        route: [],
        sector: 'turismo',
        clean: false
    };

    function $(id) {
        return document.getElementById(id);
    }

    function trackMaquetaEvent(eventName, payload) {
        console.info('[Maqueta Viva Analytics]', eventName, payload || {});
    }

    window.trackMaquetaEvent = trackMaquetaEvent;

    function getParams() {
        return new URLSearchParams(window.location.search);
    }

    function findSector(id) {
        if (!state.config || !state.config.sectors) return null;
        return state.config.sectors.find(function (sector) { return sector.id === id; }) || state.config.sectors[0];
    }

    function findZone(id) {
        if (!state.config || !state.config.zones) return null;
        return state.config.zones.find(function (zone) { return zone.id === id; }) || state.config.zones[0];
    }

    function getActiveZone() {
        var params = getParams();
        var zoneId = params.get('zone') || (state.config && state.config.defaultView && state.config.defaultView.zone) || 'centro';
        return findZone(zoneId);
    }

    function getPoiById(id) {
        if (!state.config || !state.config.pois) return null;
        return state.config.pois.find(function (poi) { return poi.id === id; }) || null;
    }

    function getRecommendedIds() {
        return SECTOR_RECOMMENDATIONS[state.sector] || [];
    }

    function getZoneType(zone) {
        return (zone && (zone.type || zone.sector)) || 'Zona narrativa';
    }

    function isCalibrateMode() {
        return getParams().get('calibrate') === '1';
    }

    function getCalibrationLabel(status) {
        if (status === 'manual-verified' || status === 'verified') return 'Verificada manualmente';
        if (status === 'manual-review') return 'Revision manual';
        return 'Aproximada';
    }

    function getRuntimeStyle(zone) {
        return getParams().get('style') || (zone && zone.style) || 'tile';
    }

    function getRuntimeCoords(zone) {
        var params = getParams();
        var lngInput = $('lng');
        var latInput = $('lat');
        return {
            lng: (lngInput && lngInput.value) || params.get('lng') || (zone && zone.lng),
            lat: (latInput && latInput.value) || params.get('lat') || (zone && zone.lat),
            style: getRuntimeStyle(zone)
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
    }

    function renderCalibrationPanel(config) {
        if (!isCalibrateMode()) return;
        document.body.classList.add('maqueta-calibrate-mode');
        var select = $('calibration-zone-select');
        if (select && !select.options.length) {
            config.zones.forEach(function (zone) {
                var option = document.createElement('option');
                option.value = zone.id;
                option.textContent = zone.name;
                select.appendChild(option);
            });
            var activeZone = getActiveZone();
            select.value = activeZone ? activeZone.id : config.zones[0].id;
            select.addEventListener('change', updateCalibrationPanel);
        }
        var tests = $('calibration-zone-buttons');
        if (tests && !tests.children.length) {
            config.zones.forEach(function (zone) {
                var button = document.createElement('button');
                button.type = 'button';
                button.textContent = 'Probar ' + zone.name;
                button.addEventListener('click', function () {
                    navigateToZone(zone, 'calibration-direct-test');
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

    function makeExperienceUrl(zone, sector, clean, route) {
        var params = new URLSearchParams(window.location.search);
        params.set('lng', zone.lng);
        params.set('lat', zone.lat);
        params.set('style', zone.style || 'tile');
        params.set('zone', zone.id);
        params.set('sector', sector || state.sector || 'turismo');
        if (route && route.length) {
            params.set('route', route.join(','));
        } else {
            params.delete('route');
        }
        if (clean) {
            params.set('view', 'clean');
        } else {
            params.delete('view');
        }
        params.set('refresh', String(Date.now()));
        return './maqueta-viva-torrevieja.html?' + params.toString();
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
        var calibrationLabel = $('status-calibration');
        var routeLabel = $('status-route');
        var markerTitle = $('zone-proof-title');
        var markerCopy = $('zone-proof-copy');
        var lng = params.get('lng') || (zone && zone.lng) || '-';
        var lat = params.get('lat') || (zone && zone.lat) || '-';
        var style = params.get('style') || (zone && zone.style) || 'tile';
        var calibrationStatus = getCalibrationLabel(zone && zone.calibrationStatus);
        if (zoneLabel) zoneLabel.textContent = zone ? zone.name : 'Sin zona';
        if (typeLabel) typeLabel.textContent = getZoneType(zone);
        if (sectorLabel) sectorLabel.textContent = sector ? sector.label : state.sector;
        if (coordsLabel) coordsLabel.textContent = lng + ' / ' + lat;
        if (viewLabel) viewLabel.textContent = style;
        if (calibrationLabel) calibrationLabel.textContent = calibrationStatus;
        if (routeLabel) routeLabel.textContent = state.route.length + '/' + MAX_ROUTE_ITEMS;
        if (markerTitle) markerTitle.textContent = 'Zona activa: ' + (zone ? zone.name : 'Sin zona');
        if (markerCopy) markerCopy.textContent = 'Marcador narrativo de zona - ' + getZoneType(zone) + ' - ' + calibrationStatus + ' - ' + lng + ' / ' + lat;
        syncLocationInputs(zone);
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

    function navigateToZone(zone, source) {
        if (!zone) return;
        var previous = getCurrentUrlState();
        var finalUrl = makeExperienceUrl(zone, state.sector, state.clean, state.route);
        console.info('[Maqueta Viva Zone]', {
            previousZone: previous.zone,
            nextZone: zone.id,
            lng: zone.lng,
            lat: zone.lat,
            style: zone.style || 'tile',
            finalUrl: finalUrl
        });
        showZoneLoading(zone);
        trackMaquetaEvent('zone_selected', { zone: zone.id, source: source || 'zone-list' });
        window.setTimeout(function () {
            window.location.href = finalUrl;
        }, 220);
    }

    function renderZones(config) {
        var wrap = $('zones-list');
        if (!wrap) return;
        wrap.innerHTML = '';
        var activeZone = getActiveZone();
        config.zones.forEach(function (zone) {
            var button = document.createElement('button');
            button.type = 'button';
            button.className = 'maqueta-zone-card';
            if (activeZone && zone.id === activeZone.id) button.classList.add('active');
            button.setAttribute('aria-pressed', activeZone && zone.id === activeZone.id ? 'true' : 'false');
            button.innerHTML = '<strong>' + zone.name + '</strong>'
                + '<span>' + zone.description + '</span>'
                + '<small>' + getZoneType(zone) + ' - ' + zone.style + ' - ' + zone.lng + ' / ' + zone.lat + ' - ' + getCalibrationLabel(zone.calibrationStatus) + '</small>';
            button.addEventListener('click', function () {
                navigateToZone(zone, 'zone-list');
            });
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
            card.innerHTML = '<div><strong>' + poi.title + '</strong><em>' + poi.category + '</em></div>'
                + (isRecommended ? '<span class="maqueta-recommendation-badge">Recomendado para ' + sectorLabel + '</span>' : '')
                + (isInActiveZone ? '<span class="maqueta-zone-badge">En esta zona</span>' : '')
                + '<p>' + poi.description + '</p>'
                + '<small>' + poi.visitorValue + '</small>'
                + '<div class="maqueta-card-actions">'
                + '<button type="button" data-add="' + poi.id + '">Anadir a Ruta Viva</button>'
                + '<button type="button" data-zone="' + poi.zone + '">Ver zona</button>'
                + '</div>';
            card.querySelector('[data-add]').addEventListener('click', function () {
                addPoiToRoute(poi.id);
            });
            card.querySelector('[data-zone]').addEventListener('click', function () {
                var zone = config.zones.find(function (z) { return z.id === poi.zone; });
                trackMaquetaEvent('poi_opened', { poi: poi.id, zone: poi.zone });
                navigateToZone(zone, 'poi-card');
            });
            wrap.appendChild(card);
        });
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
        var list = $('route-list');
        var empty = $('route-empty');
        var modalList = $('share-route-list');
        var ready = $('route-ready-message');
        if (counter) counter.textContent = state.route.length + '/' + MAX_ROUTE_ITEMS;
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
                showToast('Modo tecnico activo: usa downloadOBJ en dat.GUI.');
                trackMaquetaEvent('cta_clicked', { id: 'premium-export-obj' });
            });
        }
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
                    navigateToZone(config.zones[0], 'warning');
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
        var zone = config.zones.find(function (item) { return item.id === zoneId; }) || config.zones[0];
        var needsOfficialPreset = !params.has('lng') || !params.has('lat') || !params.has('style');
        if (!zone || !needsOfficialPreset) return false;
        params.set('zone', zone.id);
        params.set('lng', zone.lng);
        params.set('lat', zone.lat);
        params.set('style', zone.style || 'tile');
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
        initEvents(config);
        updateStatus();
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
