(function () {
    'use strict';

    var VERSION = '0.1';
    var inputMode = 'manual';
    var allowedSources = ['gesture', 'mouse', 'touch', 'keyboard', 'director', 'debug', 'voice_future'];
    var intentTypes = [
        'NEXT_ZONE',
        'PREVIOUS_ZONE',
        'SELECT_ZONE',
        'FOCUS_RECOMMENDED_POI',
        'OPEN_POI',
        'ADD_RECOMMENDED_POI',
        'OPEN_ROUTE',
        'TOGGLE_VIEW_MODE',
        'SET_VIEW_MODE',
        'OPEN_PUBLIC_DATA',
        'START_PRESENTATION',
        'RESET_VIEW'
    ];

    function emit(name, detail) {
        window.dispatchEvent(new CustomEvent(name, { detail: detail || {} }));
    }

    function warn(message, intent) {
        if (window.console && console.warn) {
            console.warn('[MaquetaVivaInputController]', message, intent || '');
        }
    }

    function clickById(id) {
        var el = document.getElementById(id);
        if (!el || typeof el.click !== 'function') return false;
        el.click();
        return true;
    }

    function getZoneOptions() {
        var select = document.getElementById('maqueta-zone-select');
        if (!select) return [];
        return Array.prototype.slice.call(select.options || []).map(function (option) {
            return option.value;
        }).filter(Boolean);
    }

    function currentZoneId() {
        var params = new URLSearchParams(window.location.search);
        var fromUrl = params.get('zone');
        if (fromUrl) return fromUrl;
        var select = document.getElementById('maqueta-zone-select');
        return select ? select.value : null;
    }

    function selectZone(zoneId) {
        var select = document.getElementById('maqueta-zone-select');
        if (!select || !zoneId) return false;
        var option = Array.prototype.slice.call(select.options || []).find(function (item) {
            return item.value === zoneId;
        });
        if (!option) return false;
        select.value = zoneId;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        return true;
    }

    function shiftZone(offset) {
        var zones = getZoneOptions();
        if (!zones.length) return false;
        var current = currentZoneId();
        var index = Math.max(0, zones.indexOf(current));
        var next = zones[(index + offset + zones.length) % zones.length];
        return selectZone(next);
    }

    function openDock(panel) {
        var button = document.querySelector('[data-dock-tab="' + panel + '"]');
        if (!button || typeof button.click !== 'function') return false;
        button.click();
        return true;
    }

    function applyIntent(intent) {
        var payload = intent.payload || {};
        switch (intent.type) {
            case 'NEXT_ZONE':
                return shiftZone(1);
            case 'PREVIOUS_ZONE':
                return shiftZone(-1);
            case 'SELECT_ZONE':
                return selectZone(payload.zoneId);
            case 'FOCUS_RECOMMENDED_POI':
                return openDock('pois');
            case 'OPEN_POI':
                return openDock('pois');
            case 'ADD_RECOMMENDED_POI':
                return clickById('route-add-recommended') || openDock('route');
            case 'OPEN_ROUTE':
                return openDock('route');
            case 'TOGGLE_VIEW_MODE':
                return clickById('view-mode-planet') || clickById('view-mode-tile');
            case 'SET_VIEW_MODE':
                return payload.mode === 'presentation' || payload.mode === 'planet'
                    ? clickById('view-mode-planet')
                    : clickById('view-mode-tile');
            case 'OPEN_PUBLIC_DATA':
                return clickById('maqueta-public-sources-open') || clickById('toggle-technical-controls');
            case 'START_PRESENTATION':
                return clickById('toggle-clean-mode');
            case 'RESET_VIEW':
                return clickById('reset-zone-zoom') || clickById('show-zones-drawer');
            default:
                return false;
        }
    }

    function normaliseIntent(intent) {
        if (!intent || typeof intent !== 'object') {
            return null;
        }
        return {
            type: String(intent.type || '').trim().toUpperCase(),
            source: allowedSources.indexOf(intent.source) >= 0 ? intent.source : 'debug',
            payload: intent.payload || {},
            expectedEffect: intent.expectedEffect || '',
            safeFallback: intent.safeFallback || 'Mantener estado actual.',
            analyticsEvent: intent.analyticsEvent || ''
        };
    }

    window.MaquetaVivaInputController = {
        version: VERSION,
        dispatchIntent: function (rawIntent) {
            var intent = normaliseIntent(rawIntent);
            if (!intent || intentTypes.indexOf(intent.type) < 0) {
                var invalid = rawIntent || {};
                warn('Intent invalido o no soportado.', invalid);
                emit('maqueta:intent_failed', { intent: invalid, reason: 'unsupported_intent' });
                return false;
            }

            emit('maqueta:intent', { intent: intent });

            try {
                var applied = applyIntent(intent);
                if (!applied) {
                    warn('Intent sin accion disponible en esta UI.', intent);
                    emit('maqueta:intent_failed', { intent: intent, reason: 'missing_ui_action' });
                    return false;
                }
                emit('maqueta:intent_applied', { intent: intent });
                return true;
            } catch (error) {
                warn(error && error.message ? error.message : 'Intent failed.', intent);
                emit('maqueta:intent_failed', { intent: intent, reason: 'exception' });
                return false;
            }
        },
        getAvailableIntents: function () {
            return intentTypes.slice();
        },
        getState: function () {
            return {
                version: VERSION,
                inputMode: inputMode,
                zoneId: currentZoneId(),
                availableIntents: intentTypes.slice()
            };
        },
        setInputMode: function (mode) {
            inputMode = String(mode || 'manual');
            emit('maqueta:input_mode_changed', { mode: inputMode });
            return inputMode;
        }
    };
}());

