# Maqueta Viva 3D - Public Data Sources

Maqueta Viva 3D puede enriquecerse con datos publicos, medios abiertos y assets propios, pero debe funcionar siempre con fallback local.

## OpenStreetMap / Overpass

- URL: https://overpass-api.de/
- Uso potencial: POIs publicos, servicios, parques, playas, monumentos, hoteles, restaurantes y aparcamientos.
- Estado: api-ready, desactivado por defecto.
- Licencia: ODbL / OpenStreetMap contributors.
- Requiere key: no.
- Riesgo: rate limits, cobertura irregular, datos comunitarios.
- Fallback: POIs curados en `data/maqueta-viva/torrevieja.config.json`.

## Wikidata

- URL: https://www.wikidata.org/
- Uso potencial: QIDs, coordenadas, patrimonio, enlaces oficiales e identificadores externos.
- Estado: api-ready.
- Licencia: CC0.
- Requiere key: no.
- Riesgo: no todos los POIs tienen QID fiable; validar antes de mostrar como dato oficial.
- Fallback: campos locales `wikidataId: null` y texto "pendiente de vincular".

## Wikimedia Commons

- URL: https://commons.wikimedia.org/
- Uso potencial: imagenes, audio y video abiertos.
- Estado: api-ready.
- Licencia: variable por archivo.
- Requiere key: no.
- Riesgo: cada asset requiere author, license y sourceUrl.
- Fallback: SVG placeholders locales en `asset/maqueta-viva/placeholders/`.

## AEMET OpenData

- URL: https://opendata.aemet.es/
- Uso potencial: tiempo, viento, cielo y avisos.
- Estado: api-ready sin clave.
- Licencia: revisar condiciones de AEMET OpenData.
- Requiere key: si.
- Riesgo: no hardcodear clave en frontend; no bloquear UI.
- Fallback: hora local y texto "Clima preparado para integracion AEMET".

## datos.gob.es

- URL: https://datos.gob.es/
- Uso potencial: datasets oficiales de turismo, cultura, movilidad, medio ambiente y playas.
- Estado: manual-review.
- Licencia: variable por dataset.
- Requiere key: normalmente no, depende del dataset.
- Riesgo: formatos heterogeneos y licencias distintas.
- Fallback: registry local.

## Playas / Banderas / Estado del Mar

- URL: pendiente de fuente oficial local/autonomica.
- Uso potencial: bandera, servicios, estado de mar, ocupacion si existe endpoint fiable.
- Estado: manual-review.
- Licencia: pendiente.
- Requiere key: desconocido.
- Riesgo: no inventar bandera, temperatura, ocupacion ni estado de playa.
- Fallback: "Estado de playa pendiente de fuente oficial".

## Assets Propios

- URL local: `asset/maqueta-viva/media/`
- Uso potencial: imagenes, audio, podcast, video, drone y media inmersiva propios.
- Estado: local-real-ready.
- Licencia: manual-review hasta validar propietario.
- Requiere key: no.
- Riesgo: asegurar derechos comerciales.
- Fallback: placeholders locales.

## Immersive Links

- Uso potencial: Gaussian Splats, tours 360, videos drone, museos virtuales y webs inmersivas.
- Estado: placeholder/manual-review.
- Licencia: manual-review por enlace.
- Requiere key: no para enlaces simples.
- Riesgo: peso tecnico, permisos de iframe y derechos de uso.
- Fallback: modal "Preparado para integracion".
