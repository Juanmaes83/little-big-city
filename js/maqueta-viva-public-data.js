(function () {
    'use strict';

    var REGISTRY_URL = './data/maqueta-viva/public-sources.registry.json';
    var CONFIG_URL = './data/maqueta-viva/torrevieja.config.json';
    var registryCache = null;
    var configCache = null;

    function analytics(eventName, payload) {
        if (window.trackMaquetaEvent) {
            window.trackMaquetaEvent(eventName, payload || {});
        }
    }

    function withTimeout(promise, ms) {
        return new Promise(function (resolve, reject) {
            var timer = window.setTimeout(function () {
                reject(new Error('timeout'));
            }, ms || 5500);
            promise.then(function (value) {
                window.clearTimeout(timer);
                resolve(value);
            }).catch(function (err) {
                window.clearTimeout(timer);
                reject(err);
            });
        });
    }

    function safeFetchJson(url, options) {
        return withTimeout(fetch(url, options || {}).then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
        }), (options && options.timeoutMs) || 5500);
    }

    function loadRegistry() {
        if (registryCache) return Promise.resolve(registryCache);
        return safeFetchJson(REGISTRY_URL).then(function (registry) {
            registryCache = registry;
            return registry;
        }).catch(function (err) {
            registryCache = { version: 'fallback', sources: [], error: err.message };
            return registryCache;
        });
    }

    function loadConfig() {
        if (configCache) return Promise.resolve(configCache);
        return safeFetchJson(CONFIG_URL).then(function (config) {
            configCache = config;
            return config;
        });
    }

    function zoneId(zone) {
        return zone && (zone.id || zone.zone) || 'centro';
    }

    function metadata(source, status, extra) {
        return Object.assign({
            source: source,
            status: status,
            fetchedAt: new Date().toISOString(),
            attributionRequired: true
        }, extra || {});
    }

    function publicDataFallback(type, zone, error) {
        return loadConfig().then(function (config) {
            var id = zoneId(zone);
            var pois = (config.pois || []).filter(function (poi) { return poi.zone === id; });
            var sound = (config.soundscapes || []).find(function (item) { return item.zone === id; }) || null;
            var story = (config.podcastStories || []).find(function (item) { return item.zone === id; }) || null;
            var media = (config.immersiveMedia || []).filter(function (item) { return item.zone === id; });
            return {
                type: type,
                zone: id,
                pois: pois,
                soundscape: sound,
                story: story,
                media: media,
                metadata: metadata('local-fallback', 'local-fallback', {
                    license: 'Curated local config / placeholders',
                    error: error ? String(error.message || error) : null
                })
            };
        });
    }

    function overpassQuery(zone, radius) {
        var lat = Number(zone && zone.lat);
        var lng = Number(zone && zone.lng);
        var meters = Number(radius || 750);
        return '[out:json][timeout:8];('
            + 'node(around:' + meters + ',' + lat + ',' + lng + ')[tourism~"attraction|museum|hotel|viewpoint"];'
            + 'node(around:' + meters + ',' + lat + ',' + lng + ')[historic];'
            + 'node(around:' + meters + ',' + lat + ',' + lng + ')[amenity~"restaurant|cafe|parking|place_of_worship"];'
            + 'node(around:' + meters + ',' + lat + ',' + lng + ')[leisure=park];'
            + 'node(around:' + meters + ',' + lat + ',' + lng + ')[natural=beach];'
            + ');out tags center 25;';
    }

    function normalizeOsm(elements) {
        return (elements || []).slice(0, 25).map(function (item) {
            var tags = item.tags || {};
            return {
                id: 'osm-' + item.id,
                title: tags.name || tags.tourism || tags.amenity || tags.historic || 'POI publico',
                category: tags.tourism || tags.amenity || tags.historic || tags.leisure || tags.natural || 'public-data',
                description: 'POI publico detectado en OpenStreetMap. Requiere revision editorial antes de incorporarlo como POI curado.',
                lat: item.lat,
                lng: item.lon,
                sourceStatus: 'public-data',
                accessType: 'public',
                sourceUrl: 'https://www.openstreetmap.org/' + item.type + '/' + item.id
            };
        });
    }

    function getPublicPois(zone) {
        analytics('public_pois_requested', { zone: zoneId(zone) });
        return loadConfig().then(function (config) {
            var publicData = config.publicData || {};
            var osm = publicData.providers && publicData.providers.osm;
            if (!publicData.enabled || !osm || !osm.enabled) {
                return publicDataFallback('public-pois', zone).then(function (fallback) {
                    fallback.metadata.status = 'disabled-local-fallback';
                    return fallback;
                });
            }
            var body = 'data=' + encodeURIComponent(overpassQuery(zone, osm.radiusMeters || 750));
            return safeFetchJson('https://overpass-api.de/api/interpreter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
                body: body,
                timeoutMs: 6500
            }).then(function (data) {
                var pois = normalizeOsm(data.elements);
                analytics('public_pois_loaded', { zone: zoneId(zone), total: pois.length });
                return {
                    type: 'public-pois',
                    zone: zoneId(zone),
                    pois: pois,
                    metadata: metadata('osm-overpass', 'api-response', {
                        license: 'ODbL / OpenStreetMap contributors'
                    })
                };
            }).catch(function (err) {
                analytics('public_pois_failed', { zone: zoneId(zone), error: err.message });
                return publicDataFallback('public-pois', zone, err);
            });
        });
    }

    function getWeatherContext(zone) {
        analytics('weather_requested', { zone: zoneId(zone) });
        return loadConfig().then(function (config) {
            var signals = config.publicSignals || {};
            return {
                zone: zoneId(zone),
                localTime: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
                weather: null,
                beachStatus: null,
                message: signals.weather && signals.weather.requiresKey
                    ? 'Clima preparado para integracion AEMET. No hay API key configurada en frontend.'
                    : 'Clima no conectado.',
                beachMessage: 'Estado de playa pendiente de fuente oficial. No se inventan banderas.',
                metadata: metadata('aemet-opendata', 'api-ready-no-key', {
                    license: 'AEMET OpenData; requiere configuracion',
                    attributionRequired: true
                })
            };
        }).catch(function (err) {
            analytics('weather_failed', { zone: zoneId(zone), error: err.message });
            return {
                zone: zoneId(zone),
                localTime: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
                weather: null,
                beachStatus: null,
                message: 'Clima no disponible. Fallback local activo.',
                beachMessage: 'Estado de playa pendiente de fuente oficial.',
                metadata: metadata('local-fallback', 'fallback', { error: err.message })
            };
        });
    }

    function getWikidataSummary(item) {
        analytics('wikidata_summary_requested', { id: item && item.id, wikidataId: item && item.wikidataId });
        return Promise.resolve({
            itemId: item && item.id,
            summary: item && item.wikidataId ? null : 'Pendiente de vincular con Wikidata.',
            metadata: metadata('wikidata', item && item.wikidataId ? 'api-ready' : 'manual-review', {
                license: 'CC0'
            })
        });
    }

    function getCommonsMedia(item) {
        analytics('commons_media_requested', { id: item && item.id, commonsCategory: item && item.commonsCategory });
        return Promise.resolve({
            itemId: item && item.id,
            mediaAssets: item && item.mediaAssets || [],
            message: item && item.commonsCategory ? 'Categoria Commons preparada para consulta futura.' : 'Pendiente de vincular con Wikimedia Commons.',
            metadata: metadata('wikimedia-commons', item && item.commonsCategory ? 'api-ready' : 'manual-review', {
                license: 'Variable por archivo; requiere attribution'
            })
        });
    }

    function getBeachStatus(zone) {
        analytics('beach_status_requested', { zone: zoneId(zone) });
        analytics('beach_status_unavailable', { zone: zoneId(zone) });
        return Promise.resolve({
            zone: zoneId(zone),
            flag: null,
            occupancy: null,
            message: 'Estado de playa pendiente de fuente oficial. No se inventan banderas.',
            metadata: metadata('beach-status-api-ready', 'manual-review', {
                license: 'Pendiente de fuente oficial'
            })
        });
    }

    function getImmersiveLinks(zone) {
        return loadConfig().then(function (config) {
            var id = zoneId(zone);
            var links = [];
            (config.zones || []).filter(function (z) { return z.id === id; }).forEach(function (z) {
                links = links.concat(z.immersiveLinks || []);
            });
            (config.pois || []).filter(function (poi) { return poi.zone === id; }).forEach(function (poi) {
                links = links.concat(poi.immersiveLinks || []);
            });
            return {
                zone: id,
                links: links,
                metadata: metadata('immersive-links-curated', links.length ? 'curated' : 'placeholder', {
                    license: 'manual-review por enlace'
                })
            };
        });
    }

    function getAttribution() {
        return loadRegistry().then(function (registry) {
            return {
                registry: registry,
                text: 'Maqueta Viva usa datos locales curados y esta preparada para fuentes publicas con atribucion: OSM/Overpass, Wikidata, Wikimedia Commons, AEMET y datos.gob.es.'
            };
        });
    }

    window.MaquetaVivaPublicData = {
        withTimeout: withTimeout,
        safeFetchJson: safeFetchJson,
        publicDataFallback: publicDataFallback,
        getPublicPois: getPublicPois,
        getWeatherContext: getWeatherContext,
        getCommonsMedia: getCommonsMedia,
        getWikidataSummary: getWikidataSummary,
        getBeachStatus: getBeachStatus,
        getImmersiveLinks: getImmersiveLinks,
        getSourceRegistry: loadRegistry,
        getAttribution: getAttribution
    };
})();
