(function () {
    'use strict';

    var CONFIG_URL = './data/maqueta-viva/torrevieja.config.json';
    var MAX_ROUTE_ITEMS = 5;
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

    function makeExperienceUrl(zone, sector, clean) {
        var params = new URLSearchParams(window.location.search);
        params.set('lng', zone.lng);
        params.set('lat', zone.lat);
        params.set('style', zone.style || 'tile');
        params.set('zone', zone.id);
        params.set('sector', sector || state.sector || 'turismo');
        if (clean) {
            params.set('view', 'clean');
        } else {
            params.delete('view');
        }
        return './maqueta-viva-torrevieja.html?' + params.toString();
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

    function setTechnicalControls(open) {
        document.body.classList.toggle('show-technical-controls', open);
        var btn = $('toggle-technical-controls');
        if (btn) {
            btn.textContent = open ? 'Ocultar controles tecnicos' : 'Controles tecnicos';
            btn.setAttribute('aria-expanded', open ? 'true' : 'false');
        }
        trackMaquetaEvent('technical_controls_opened', { open: open });
    }

    function setCleanMode(clean) {
        state.clean = clean;
        document.body.classList.toggle('maqueta-clean-view', clean);
        var btn = $('toggle-clean-mode');
        if (btn) {
            btn.textContent = clean ? 'Salir de presentacion' : 'Modo presentacion';
        }
    }

    function renderZones(config) {
        var wrap = $('zones-list');
        if (!wrap) return;
        wrap.innerHTML = '';
        var params = getParams();
        var activeZone = params.get('zone') || config.defaultView.zone;
        config.zones.forEach(function (zone) {
            var button = document.createElement('button');
            button.type = 'button';
            button.className = 'maqueta-zone-card';
            if (zone.id === activeZone) button.classList.add('active');
            button.innerHTML = '<strong>' + zone.name + '</strong>'
                + '<span>' + zone.description + '</span>'
                + '<small>' + zone.sector + ' · ' + zone.style + '</small>';
            button.addEventListener('click', function () {
                trackMaquetaEvent('zone_selected', { zone: zone.id });
                window.location.href = makeExperienceUrl(zone, state.sector, state.clean);
            });
            wrap.appendChild(button);
        });
    }

    function getPoiById(id) {
        return state.config.pois.find(function (poi) { return poi.id === id; });
    }

    function renderPois(config) {
        var wrap = $('poi-list');
        if (!wrap) return;
        wrap.innerHTML = '';
        config.pois.forEach(function (poi) {
            var card = document.createElement('article');
            card.className = 'maqueta-poi-card';
            card.innerHTML = '<div><strong>' + poi.title + '</strong><em>' + poi.category + '</em></div>'
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
                if (zone) window.location.href = makeExperienceUrl(zone, state.sector, state.clean);
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
            + '. Descubrela en Maqueta Viva 3D.';
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
            if (modalList) {
                var modalItem = item.cloneNode(true);
                modalList.appendChild(modalItem);
            }
        });
        if (ready) {
            ready.textContent = state.route.length
                ? 'Tu Ruta Viva de Torrevieja esta lista.'
                : 'Anade lugares para crear una salida compartible.';
        }
    }

    function openSharePanel() {
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
            trackMaquetaEvent('sector_changed', { sector: state.sector });
        });
        updateSector(config);
    }

    function updateSector(config) {
        var sector = config.sectors.find(function (s) { return s.id === state.sector; }) || config.sectors[0];
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

    function initEvents(config) {
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
                showToast('Abre Controles tecnicos y usa downloadOBJ.');
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
                safeCopy(window.location.href, 'Enlace copiado.');
                trackMaquetaEvent('share_copy_clicked', { type: 'link' });
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
                    window.location.href = makeExperienceUrl(config.zones[0], state.sector, state.clean);
                } else if (action === 'original') {
                    window.location.href = './index.html';
                } else if (action === 'hide') {
                    document.documentElement.classList.remove('maqueta-runtime-warning');
                }
            });
        });
    }

    function applyInitialUrlState(config) {
        var params = getParams();
        state.sector = params.get('sector') || config.defaultView.sector || 'turismo';
        setCleanMode(params.get('view') === 'clean');
    }

    function init(config) {
        state.config = config;
        applyInitialUrlState(config);
        renderZones(config);
        renderPois(config);
        renderSectors(config);
        renderLayers(config);
        renderRoute();
        initEvents(config);
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
