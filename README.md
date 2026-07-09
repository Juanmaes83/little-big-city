# Little Big City / Maqueta Viva 3D

Este repositorio conserva la demo original de **Little Big City** y aÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â±ade una capa productizada premium:

**Maqueta Viva 3D - Torrevieja Prototype v0.2**

Concepto comercial: **La ciudad se levanta ante ti.**

Mensaje central:

> No ensenamos un mapa. Levantamos tu territorio en 3D para que el usuario lo entienda, lo recuerde y quiera visitarlo.

No es una modernizacion completa del stack. Es un modulo externo premium en fase prototipo, preparado para evaluar integracion futura con Rubik, Living Map y La Batuta de Torrevieja.

## Demo tecnica original vs Maqueta Viva 3D

La demo original sigue viva en:

```text
index.html
```

La capa premium vive en:

```text
maqueta-viva-torrevieja.html
```

Diferencia clave:

- **Little Big City original**: demo WebGL tecnica con mapa, dat.GUI y export OBJ.
- **Maqueta Viva 3D**: experiencia territorial vendible, con relato, zonas, POIs, sectores, Ruta Viva, share basico, CTA y conexion con el ecosistema Rubik.

## URLs locales

```text
http://127.0.0.1:8137/
http://127.0.0.1:8137/maqueta-viva-torrevieja
http://127.0.0.1:8137/maqueta-viva-torrevieja?lng=-0.6822&lat=37.9787&style=tile
http://127.0.0.1:8137/maqueta-viva-torrevieja?lng=-0.6822&lat=37.9787&style=planet
http://127.0.0.1:8137/maqueta-viva-torrevieja?sector=inmobiliaria
http://127.0.0.1:8137/maqueta-viva-torrevieja?sector=eventos&view=clean
```

## Comandos

```bash
npm install --no-audit --no-fund
npm run build
npm run qa:maqueta-ui
npx serve -l 8137 .
```

En las pruebas, `npm run build` funciono con Node moderno sin necesitar:

```powershell
$env:NODE_OPTIONS="--openssl-legacy-provider"
```

`npm run qa:maqueta-ui` ejecuta una auditoria UI local de Maqueta Viva con Playwright. No anade dependencias: primero intenta cargar Playwright desde el proyecto y, si no existe, usa el runtime local de Codex para evitar el fallo de resolucion ESM observado en el REPL.

Nota tecnica: las rutas internas de Maqueta Viva usan la forma extensionless `maqueta-viva-torrevieja`. En `npx serve`, navegar con `.html` puede redirigir y contaminar el flujo de presets.

## Que anade v0.2

- Modo premium limpio: `dat.GUI` queda oculto por defecto.
- Boton **Controles tecnicos** para mostrar/ocultar `dat.GUI` sin romper `downloadOBJ`.
- Pantalla de carga visual: "Levantando la ciudad...".
- Selector de zonas de Torrevieja.
- POIs narrativos manuales.
- Ruta Viva basica con contador y limite recomendado de 5 POIs.
- Panel "Mi Ruta Viva" con copiar resumen y copiar enlace.
- Selector sectorial: turismo, inmobiliaria, eventos, retail, hotel, patrimonio y smart city.
- CTA comercial de prototipo.
- Ecosistema de experiencias: Living Map, Batuta y Maqueta Viva 3D.
- Panel de capas diferenciando motor real, capa de producto y capas futuras.
- Fallback visual mejorado si fallan datos 3D.
- Eventos simulados con `trackMaquetaEvent()` y prefijo `[Maqueta Viva Analytics]`.

## Que anade v0.3 - Premium Experience Layer

La v0.3 convierte Maqueta Viva 3D en una capa territorial premium preparada para vender experiencias de destino, rutas vivas, patrocinios y storytelling de marca.

- Nuevas zonas y POIs: **Torre del Moro**, **Plaza de la Iglesia / Plaza de la Constitucion** y **Centro de La Mata / Plaza del Embarcadero**.
- Presets de zona con `zoom` controlado entre 15 y 17.
- Botones `Zoom -`, `Zoom +` y `Reset zoom de zona`.
- URLs internas con `zone`, `lng`, `lat`, `style`, `zoom`, `sector` y `refresh`.
- Barra fija de zonas para validar desplazamiento real entre Centro, Salinas, Zona Comercial, Torre del Moro, Plaza Iglesia y La Mata.
- Panel `calibrate=1` plegable por defecto para que no bloquee la experiencia.
- Panel `debug=1` y `analytics=1` de lectura pasiva, sin interceptar clics.
- Mapas sonoros por zona con estructura preparada y texto honesto: audio pendiente de integracion real.
- Video/directo/360/drone como placeholder frontend preparado por zona.
- Podcast/historias narradas con transcript y estado "preparado para locucion".
- Avatar frontend **Marina**, con reacciones contextuales a zona, POI, ruta, sonido, podcast y video.
- Cola local de analytics: `window.MAQUETA_ANALYTICS_EVENTS` y persistencia en `localStorage`.
- Descargas frontend: ficha de zona, Ruta Viva y briefing de marca en JSON.
- Espacios patrocinados demo por zona, listos para conectar con WhatsApp, reservas, CRM o URL externa.

Lo real en v0.3: presets, POIs, zoom URL, botones, analytics local, descargas JSON, avatar textual, modales, estructura JSON y QA local.

Lo placeholder en v0.3: audios reales, videos reales, streaming, avatar 3D/webcam, patrocinios conectados, backend y generacion visual final.

URLs de QA v0.3:

```text
http://127.0.0.1:8137/maqueta-viva-torrevieja?zone=torre-del-moro&sector=turismo&debug=1&calibrate=1&analytics=1
http://127.0.0.1:8137/maqueta-viva-torrevieja?zone=plaza-iglesia&zoom=17&sector=patrimonio
http://127.0.0.1:8137/maqueta-viva-torrevieja?zone=centro-la-mata&zoom=16&sector=turismo
http://127.0.0.1:8137/maqueta-viva-torrevieja?zone=salinas&zoom=15&style=planet&sector=turismo
```

## Que anade v0.4 - Premium Map-First UI

La v0.4 reorganiza la experiencia para que la maqueta 3D sea el centro visual y los controles no compitan con el mapa.

- Topbar compacta con marca, selector central de zona y acciones secundarias.
- Se elimina la barra permanente de chips de zona; las zonas pasan a dropdown y panel contextual.
- Hero card izquierda compacta con CTA de Ruta Viva, exploracion y demo.
- Panel derecho contextual por acordeones: Zonas, Ruta Viva y Modo de experiencia.
- Status strip unificado en una sola capsula.
- Bottom dock por pestanas: POIs narrativos, Mapa sonoro, Escuchar historia, Video/Directo, Espacios destacados y Descargas.
- POIs en carrusel horizontal compacto.
- Herramientas tecnicas, debug, analytics y calibracion quedan detras de un toolbox secundario.
- El mini mapa tecnico heredado queda oculto por defecto para no invadir la experiencia.
- `npm run qa:maqueta-ui` valida topbar, dropdown, tabs, toolbox, status strip, carrusel POI y cambio real de zona.

Limitacion honesta v0.4: algunos errores heredados del motor/datos vectoriales pueden activar el fallback de datos 3D en zonas concretas. El rediseño no cambia el motor Little Big City ni la dependencia de Nextzen; solo reduce el ruido visual y evita que los paneles tecnicos rompan la experiencia.

## Maqueta Viva v0.4.1 - Mobile Stabilization

La v0.4.1 estabiliza la experiencia mobile-first sin tocar el motor 3D ni `src/main.js`/`dist/bundle.js`.

- Deteccion ligera de modo movil con clase `maqueta-mobile-view`.
- Dock inferior minimizado por defecto en movil.
- Header compacto y selector de zonas tactil.
- Hero, panel contextual, status y dock convertidos en superficies compactas para que la maqueta siga siendo protagonista.
- Botones tactiles con minimo de 44px.
- Correcciones de overflow horizontal y viewport `100dvh`/`100svh`.
- Ajustes especificos para 390x844, 430x932, 768x1024 y landscape compacto.

Limitacion honesta v0.4.1: esta fase corrige usabilidad y composicion responsive. No modifica la carga de datos 3D, Nextzen, Maptalks, ClayGL ni el flujo de generacion de la maqueta.

## Maqueta Viva v0.3.1 - Visual POI, Media Activation & Gesture-Ready Layer

La v0.3.1 convierte los modulos frontend en una experiencia territorial mas viva sin tocar el motor 3D ni implementar webcam.

- POIs con thumbnails locales SVG en `asset/maqueta-viva/placeholders/`.
- Cada POI declara `thumbnail`, `imageAlt`, `visualStatus`, `accessType` y `screenPosition`.
- Las zonas declaran `heroImage`, `gallery`, `visualTheme` y `screenPosition`.
- Capa `maqueta-orientation-layer` con "Tu estas aqui", zona activa, pins de POIs, banderitas de Ruta Viva y linea punteada narrativa.
- Toggle de Orientacion dentro de Herramientas.
- Leyenda compacta y colapsable.
- Mapa sonoro con estado activo/inactivo y fallback honesto cuando `audioUrl` es `null`.
- Historia/Podcast abre transcript en modal compacto cuando no hay audio real.
- Video/Directo abre modal placeholder preparado para video 360, drone o camara en directo.
- Sponsors frontend filtrados por zona activa con CTA demo.
- Descargas frontend reales en JSON: ficha de zona, Ruta Viva y briefing de marca.
- Analytics reforzado en `window.MAQUETA_ANALYTICS_EVENTS` y `localStorage.maqueta_viva_analytics_events`.
- Arquitectura `MaquetaVivaInputController` con `setInputMode(mode)` y `handleNavigationIntent(intent, payload)` preparada para gestos futuros.

Limitaciones honestas v0.3.1:

- Los thumbnails son placeholders locales propios, no fotografias reales.
- Los pins usan posiciones narrativas de pantalla, no geolocalizacion 3D exacta.
- No hay webcam real, permisos de camara ni conexion con Gesture Lab en esta fase.
- No hay audio real ni video real si `audioUrl`/`url` siguen en `null`.
- La capa visual ayuda a orientacion y venta, pero no sustituye una calibracion GIS/3D precisa.

## Maqueta Viva v0.3.2 - Public Data, Real Media Binding & Immersive Connectors Layer

La v0.3.2 prepara Maqueta Viva 3D para conectarse con datos publicos, medios propios y experiencias inmersivas sin depender de APIs externas para funcionar.

Archivos clave:

```text
data/maqueta-viva/public-sources.registry.json
js/maqueta-viva-public-data.js
docs/public-data-sources.md
asset/maqueta-viva/media/README.md
```

Que esta realmente integrado ahora:

- Registro local de fuentes publicas y privadas.
- Conector frontend `window.MaquetaVivaPublicData`.
- Fallback local obligatorio para POIs, media, clima/playas y fuentes.
- Widget compacto "Ahora en la zona" con hora local.
- Mensajes honestos para clima AEMET y estado de playa sin inventar datos.
- Boton "Buscar POIs publicos" con fallback local porque Overpass esta desactivado por defecto.
- Enlaces inmersivos preparados por zona/POI sin cargar peso por defecto.
- Campos `wikidataId`, `commonsCategory`, `externalLinks`, `mediaAssets` e `immersiveLinks` preparados en POIs.
- Candidatos de assets locales para imagen, audio, podcast y video.
- Documentacion de licencias, fuentes, riesgos y atribuciones.

Que queda api-ready:

- OpenStreetMap / Overpass para POIs publicos.
- Wikidata para datos estructurados.
- Wikimedia Commons para media abierta.
- AEMET OpenData para clima si se configura clave de forma segura.
- datos.gob.es para datasets oficiales tras revision manual.
- Playas/banderas si aparece fuente oficial fiable.

Que queda placeholder:

- Clima real.
- Bandera/estado de playa.
- Audio real.
- Video real.
- Podcast real.
- Splats/360/drone reales.

Como anadir imagenes propias:

1. Subir `.jpg` a `asset/maqueta-viva/media/pois/` o `asset/maqueta-viva/media/zones/`.
2. Usar los nombres documentados en `asset/maqueta-viva/media/README.md`.
3. Cambiar `visualStatus` a `local-real` cuando el asset tenga derechos claros.

Como anadir audio, video o podcast:

- Audio: `asset/maqueta-viva/media/audio/[zona]-soundscape.mp3`.
- Podcast: `asset/maqueta-viva/media/podcast/[zona]-podcast.mp3`.
- Video: `asset/maqueta-viva/media/video/[zona]-video.mp4`.
- No hay autoplay. Si falta el archivo, se mantiene placeholder honesto.

Como anadir splats, 360, drone o webs inmersivas:

- Editar `immersiveLinks` en zona o POI.
- Indicar `type`, `title`, `url`, `license`, `source`, `status` y `openMode`.
- No cargar assets pesados por defecto.

Licencias y atribuciones:

- OSM/Overpass: ODbL y atribucion OpenStreetMap contributors.
- Wikidata: CC0.
- Wikimedia Commons: licencia variable por archivo.
- AEMET/datos.gob.es/playas: revisar condiciones antes de uso comercial.
- Assets propios: usar `manual-review` hasta validar derechos.

Riesgo principal:

La capa publica esta preparada, pero no debe activarse masivamente en frontend sin control de cuota, cache, atribucion y fallback.

## Maqueta Viva v0.3.3 - Geo Truth, Markers & Precision/Presentation Layer

La v0.3.3 separa la verdad geografica del relato visual. El motor original Little Big City sigue siendo la fuente de verdad para `lng`, `lat`, `zoom`, `style`, Maptalks, tiles, Nextzen, geometria y `downloadOBJ`. La capa Maqueta Viva vive encima como UI premium, POIs, rutas, pins, media, public data, analytics y futura entrada gestual.

Regla de vistas:

- `style=tile` es la vista A de precision para calibracion, datos publicos, validacion de presets y revision manual.
- `style=planet` es la vista B de presentacion para storytelling y demos comerciales.
- En `debug=1` o `calibrate=1`, los presets prefieren `tile` salvo que el usuario haya elegido explicitamente `planet`.

Modelo geo normalizado:

- Zonas: `geoStatus`, `coordinateSource`, `viewMode`, `precisionStyle`, `presentationStyle` y `screenPositionStatus`.
- POIs: `lng`, `lat`, `geoStatus`, `coordinateSource`, `screenPosition`, `screenPositionStatus` y `positionTruth`.
- Si un POI hereda coordenadas de su zona, queda como `manual-review` y `zone-preset`, no como exacto.
- `screenPosition` sigue siendo posicion visual narrativa hasta que exista una proyeccion geo real.

Markers honestos:

- Sin GPS no se muestra "Tu estas aqui"; se muestra "Referencia de exploracion".
- Si el usuario pulsa "Usar mi ubicacion" y acepta `navigator.geolocation`, entonces se puede mostrar "Tu estas aqui" como ubicacion de sesion.
- La ubicacion no se pide automaticamente, no se guarda en `localStorage` y no se envia a backend.
- Cada marker expone `data-position-mode`, `data-geo-status` y `data-coordinate-source`.
- Los badges indican `aprox.`, `rev.`, `narr.`, `fuente`, `Manual` o `GPS`.

Flechas y rotulos:

- Las flechas solo aparecen si hay un siguiente POI de Ruta Viva o un recomendado claro de la zona.
- Los rotulos se limitan a zona activa, referencia de exploracion y POIs relevantes. No se intenta mostrar todos los POIs como geolocalizacion exacta.

Public data:

- Los POIs publicos siguen siendo sugerencias. No sustituyen los POIs curados, no mueven la maqueta y no se mezclan automaticamente.
- El widget publico muestra chips claros: hora local, clima pendiente AEMET y playa pendiente de fuente oficial. No inventa temperatura, bandera ni ocupacion.

## Maqueta Viva v0.4 - Gesture Navigation Layer (roadmap)

La siguiente capa natural no debe mezclarse dentro del motor 3D. Debe entrar como una capa de interaccion opcional, preparada para conectar con Gesture Lab, Batuta y futuros modulos de camara.

Objetivo:

- activar navegacion por webcam solo con permiso explicito;
- mostrar privacidad visible antes de encender camara;
- mantener fallback completo con raton, teclado y tactil;
- mover la maqueta con gestos simples: dirigir, acercar, alejar y seleccionar zona;
- mostrar estado de tracking, confianza, FPS y latencia;
- bloquear gestos ambiguos con mensajes claros;
- no cargar librerias de vision artificial en la experiencia base;
- permitir que la capa de gestos viva como modulo externo si pesa demasiado.

Estados recomendados:

- `sin camara`: experiencia normal con controles manuales;
- `camara disponible`: CTA para activar Gesture Navigation;
- `tracking activo`: gestos reconocidos y HUD de confianza visible;
- `tracking perdido`: aviso amarillo y fallback inmediato;
- `modo presentacion`: sin paneles tecnicos ni debug.

Esta capa queda registrada como roadmap. No esta implementada en v0.4.

## Integracion Director de Orquesta / Gesture Bridge

Maqueta Viva 3D queda preparada como receptor de intenciones dentro del ecosistema Rubik Sota. Director de Orquesta orquesta, Map Gesture Controls interpreta gestos en Living Map/Batuta y Maqueta Viva representa la ciudad 3D.

La integracion se hara por contrato, no por acoplamiento directo al motor. Los gestos no deben manipular `lng`, `lat`, Maptalks, Nextzen, ClayGL, WebGL, `src/main.js` ni `dist/bundle.js`.

Archivos clave:

```text
docs/MAQUETA_VIVA_INPUT_CONTRACT.md
docs/public-data-sources.md
js/maqueta-viva-input-controller.js
```

URL publica:

```text
https://juanmaes83.github.io/little-big-city/maqueta-viva-torrevieja.html
```

El controlador expone `window.MaquetaVivaInputController` con `dispatchIntent(intent)`, `getAvailableIntents()`, `getState()` y `setInputMode(mode)`. Si una accion de UI no existe, falla con `console.warn` y evento `maqueta:intent_failed`; no rompe la experiencia ni toca el motor.


## Nota v0.2.2 - prueba visual de zonas

Las zonas de Maqueta Viva 3D usan coordenadas aproximadas dentro del entorno de Torrevieja. La maqueta depende del motor heredado Little Big City y de los datos vectoriales disponibles en cada coordenada, por lo que algunas zonas urbanas cercanas pueden generar geometrÃƒÆ’Ã‚Â­as parecidas.

La version v0.2.2 anade una prueba visual de zona activa para que el cambio sea verificable: URL con `zone`, `lng`, `lat`, `style`, `sector`, `route` y `refresh`; estado visible reforzado; marcador narrativo sobre la maqueta; loading contextual; sincronizacion garantizada de inputs LNG/LAT; y badges `En esta zona` en POIs vinculados a la zona activa.

Esta capa no afirma geolocalizacion 3D exacta. En v0.3 se debe implementar una capa real de POIs/pins georreferenciados sobre la maqueta, con posicionamiento visual ligado a coordenadas y ruta 3D verificable.

## Zonas disponibles

Las coordenadas son aproximadas para prototipo. No deben venderse como precision geoespacial final.

- Centro urbano.
- Puerto / Marina.
- Frente maritimo.
- Parque de las Naciones.
- Salinas / entorno natural.
- Zona comercial.
- Torre del Moro.
- Plaza de la Iglesia / Plaza de la Constitucion.
- Centro de La Mata / Plaza del Embarcadero.

Cada zona define `lng`, `lat`, estilo recomendado y sector principal en:

```text
data/maqueta-viva/torrevieja.config.json
```

## POIs narrativos

Los POIs actuales son capa de producto, no marcadores 3D exactos sobre la maqueta.

- Puerto / Marina.
- Paseo maritimo.
- Centro urbano.
- Parque de las Naciones.
- Salinas.
- Zona comercial.
- Frente costero.
- Torre del Moro.
- Plaza de la Iglesia / Plaza de la Constitucion.
- Centro de La Mata / Plaza del Embarcadero.

Cada POI permite:

- anadir a Ruta Viva;
- abrir/ver su zona aproximada;
- aportar relato y valor para visitante.

## Ruta Viva y share basico

El usuario puede seleccionar hasta 5 POIs y crear una salida de experiencia:

**Tu Ruta Viva de Torrevieja esta lista.**

La tarjeta/resumen compartible v0.2 permite:

- ver los POIs elegidos;
- copiar resumen;
- copiar enlace.

No genera imagen real, backend ni QR todavia. Es el primer paso hacia viralidad y share.

## Modos sectoriales

El selector cambia microcopy, CTA y beneficios:

- Turismo.
- Inmobiliaria.
- Eventos.
- Retail.
- Hotel.
- Patrimonio.
- Smart City.

Ejemplo:

- Turismo: "Convierte el destino en una ruta memorable."
- Inmobiliaria: "Explora el entorno antes de visitar la propiedad."
- Eventos: "Convierte el recinto en una experiencia navegable."

## Ecosistema Rubik

Arquitectura recomendada:

- **Living Map**: exploras el territorio.
- **Batuta**: despiertas la ciudad con gestos.
- **Maqueta Viva 3D**: la ciudad se levanta ante ti.
- **Rubik**: orquesta todas las experiencias.

Enlaces actuales:

```text
https://juanmaes83.github.io/map-gesture-controls/demo/living-map.html
https://juanmaes83.github.io/map-gesture-controls/demo/batuta-torrevieja.html
```

Frase de ecosistema:

**Explora. Despierta. Levanta.**

## Dependencias externas

La demo depende de:

- ClayGL.
- Maptalks.
- Nextzen vector tiles.
- OpenStreetMap raster tiles para el mapa de seleccion.
- WebGL en navegador.

Nextzen se consulta con una API key heredada del proyecto original. En pruebas, Torrevieja devolvio capas reales con edificios, roads, water, POIs y landuse, pero esta dependencia externa es un riesgo para producto.

## GitHub Pages

Este repo esta en rama `gh-pages`, pero si la URL publica no aparece, hay que activar en GitHub:

```text
Settings > Pages > Deploy from branch > gh-pages / root
```

No se debe hacer push directo a `gh-pages` desde una fase de prototipo sin revision.


## Nota v0.2.3 - reconstruccion real por zona y debug de motor

Diagnostico: la capa premium cambiaba estado, URL y textos, pero el motor heredado no dejaba una prueba visible suficiente de que estaba reconstruyendo la escena desde las nuevas coordenadas. La causa raiz detectada fue doble: el motor original leia `location.search`, pero su `makeUrl()` reconstruia URLs como `./?...`, lo que podia sacar la experiencia premium de `maqueta-viva-torrevieja.html` y llevarla a la raiz `/`; ademas no existian logs ni panel de debug para verificar `map.getCenter()`, tiles, fetches de Nextzen y reconstruccion de geometria.

Correccion v0.2.3:

- `src/main.js` conserva ahora `location.pathname` al actualizar URL interna.
- `src/main.js` convierte `lng/lat` de URL a numeros antes de inicializar `maptalks.Map`.
- Se anaden logs con prefijos `[Maqueta Viva Engine]`, `[Maqueta Viva Tiles]`, `[Maqueta Viva Fetch]`, `[Maqueta Viva Geometry]` y `[Maqueta Viva Zone]`.
- El bundle compilado expone un panel de debug solo si la URL incluye `debug=1`.
- El debug muestra zona, lng/lat de URL, lng/lat aplicados al motor, center real, tile IDs, ultimo fetch, ultima reconstruccion y conteo de features cuando el tile lo permite.

Uso de debug:

```text
maqueta-viva-torrevieja.html?zone=puerto&sector=turismo&debug=1
maqueta-viva-torrevieja.html?zone=salinas&sector=patrimonio&debug=1
maqueta-viva-torrevieja.html?zone=zona-comercial&sector=retail&debug=1
```

Limitacion honesta: si dos zonas cercanas producen tiles o geometria visualmente similares, el panel debug permite demostrar si el motor cambio center/tile/fetch aunque la maqueta sea parecida. La solucion definitiva v0.3 sigue siendo una capa de POIs/pins georreferenciados reales sobre la maqueta.

Evidencia QA de tiles Nextzen z16 con cabecera de navegador:

| Zona | Tile z/x/y | Capas detectadas |
| --- | --- | --- |
| Centro urbano | 16/32643/25284 | buildings 797, roads 94, water 6 |
| Puerto / Marina | 16/32642/25286 | buildings 1, roads 2, water 2 |
| Frente maritimo | 16/32645/25285 | buildings 0, roads 0, water 2 |
| Salinas / entorno natural | 16/32636/25276 | buildings 0, roads 0, water 1 |
| Zona comercial | 16/32640/25282 | buildings 7, roads 11, water 9 |

Conclusion tecnica: los tiles/fetches cambian entre zonas. Cuando una zona natural o costera parece pobre, la causa es la disponibilidad de geometria en los datos vectoriales a ese tile/zoom, no que el motor siga leyendo siempre el centro.

## Roadmap Premium posterior a v0.2.3

1. Mapas sonoros:
   - sonido por zona;
   - paisajes sonoros;
   - epocas historicas;
   - narraciones sonoras por lugar;
   - audio activado por usuario, no autoplay.

2. Avatar narrativo reactivo:
   - personaje guia;
   - movimiento de ojos;
   - labios sincronizados;
   - manos, senalar y saludar;
   - reaccion a webcam/gestos;
   - conexion futura con modulos de webcam/gesture.

3. Espacios patrocinados:
   - empresas cerca de enclaves;
   - POIs patrocinados;
   - rutas comerciales;
   - hoteles, restaurantes y comercios;
   - WhatsApp, reservas y leads;
   - modelo de monetizacion.

4. Videos y streaming:
   - videos inmersivos;
   - video 360;
   - drone;
   - camaras en directo;
   - playas, lagunas y parajes naturales;
   - contenido estacional.

5. Branding avanzado:
   - configuracion por cliente;
   - paleta;
   - logo;
   - avatar;
   - tono narrativo;
   - campanas;
   - salida compartible/viral.
## Riesgos tecnicos

- Stack antiguo: webpack 4, ClayGL antiguo y dependencias legacy.
- Bundle grande para movil.
- Dependencia critica de Nextzen y su API key.
- Si Nextzen falla, el motor original no tiene manejo completo de errores por tile.
- UI tecnica de `dat.GUI`, valida como control tecnico pero no como panel final.
- Mobile no esta productizado al 100%.
- Export OBJ existe, pero requiere QA manual adicional para asegurar calidad de salida.
- POIs y zonas son aproximados en v0.2.

## Roadmap v0.3

- POIs georreferenciados sobre la maqueta.
- Ruta visual 3D real.
- Captura de imagen/poster.
- QR/share real.
- Proveedor de tiles configurable.
- Configs branded por cliente.
- Modo kiosk avanzado.
- Integracion como launcher en Rubik.
- Conexion directa desde Batuta/Living Map.
- Analitica real.
- Reemplazo/modernizacion progresiva del stack.

## Nota v0.2.4 - calibracion de presets por zona

Diagnostico: el motor si cambia la maqueta cuando se introducen manualmente `LNG`, `LAT` y se pulsa `GO`. El fallo estaba en producto/calibracion: los presets de zona podian vivir duplicados entre `maqueta-viva-torrevieja.html` y `data/maqueta-viva/torrevieja.config.json`, lo que hacia dificil saber que coordenadas estaba usando cada flujo.

Correccion v0.2.4:

- La fuente principal de zonas es ahora `data/maqueta-viva/torrevieja.config.json`.
- El HTML conserva solo un fallback minimo de arranque para el centro si el JSON todavia no ha cargado.
- Si la URL llega con `zone` pero sin `lng`, `lat` o `style`, la capa de producto carga el JSON y reemplaza la URL con el preset oficial de esa zona.
- Cada zona incluye `calibrationStatus`.
- La UI muestra si una zona esta `Aproximada`, en `Revision manual` o `Verificada manualmente`.
- El motor ya no abandona un tile completo si Nextzen no devuelve `buildings`; sigue procesando `roads` y `water` cuando existan.

Precedencia real de coordenadas:

1. URL con `lng`, `lat` y `style`: manda sobre el preset, porque representa una prueba manual o enlace calibrado.
2. URL con `zone` pero sin coordenadas completas: se completa desde el JSON oficial.
3. Click en una zona del panel: usa la zona del JSON y reconstruye la URL con `lng`, `lat`, `style`, `zone`, `sector` y `refresh`.
4. Cambio manual en `LNG/LAT` + `GO`: manda temporalmente en el motor y en la URL actual; es el flujo de calibracion manual.
5. Copiar enlace normal de Ruta Viva: usa el preset oficial de la zona activa.
6. Copiar URL de prueba en modo calibracion: usa las coordenadas manuales actuales.

Modo calibracion:

```text
maqueta-viva-torrevieja.html?zone=zona-comercial&sector=retail&calibrate=1&debug=1
```

El panel `Calibracion de zona` permite:

- ver zona activa, `lng`, `lat`, `style` y estado de calibracion;
- probar directamente las 6 zonas con los presets del JSON;
- copiar coordenadas actuales;
- copiar un bloque JSON listo para pegar con `calibrationStatus: "manual-review"`;
- copiar una URL de prueba con `calibrate=1`.

Nota honesta sobre `Zona comercial`: el preset actual es aproximado. Si debe representar un centro comercial, area retail concreta o activo inmobiliario real, hay que abrir `?calibrate=1`, ajustar `LNG/LAT` con `GO`, confirmar visualmente la maqueta y pegar el preset resultante en `torrevieja.config.json`.

QA recomendado para esta fase:

```bash
npm run build
node --check src/main.js
node --check js/maqueta-viva-product.js
python -m json.tool data/maqueta-viva/torrevieja.config.json > NUL
git diff --check
npx serve -l 8137 .
```

Pruebas manuales:

- Abrir `http://127.0.0.1:8137/maqueta-viva-torrevieja.html?zone=centro&calibrate=1&debug=1`.
- Pulsar cada boton `Probar ...` y confirmar que la URL cambia a la zona correspondiente.
- Cambiar `LNG/LAT`, pulsar `GO` y confirmar que el panel refleja las coordenadas actuales.
- Copiar `preset JSON` y verificar que incluye la zona seleccionada y `calibrationStatus: "manual-review"`.
- Abrir `?debug=1` y confirmar que scroll, Ruta Viva, dat.GUI y panel de debug siguen funcionando.

## Nota v0.2.5 - presets clicables y coordenadas manuales

Diagnostico: despues de la calibracion v0.2.4, el motor respondia cuando el usuario escribia `LNG/LAT` manualmente y pulsaba `GO`, pero algunos botones de zona no aplicaban el preset completo. El sintoma visible era que la experiencia podia quedarse en `Centro urbano` aunque el usuario pulsara `Puerto`, `Salinas` o `Zona comercial`.

Correccion v0.2.5:

- Se crea un flujo unico `applyZonePreset(zoneId, source)` para botones de zona, POIs, pruebas directas de calibracion y accesos heredados.
- Cada tarjeta de zona declara `data-zone-id`, `data-zone-lng`, `data-zone-lat` y `data-zone-style`.
- El click de una zona reconstruye una URL absoluta sobre `maqueta-viva-torrevieja.html`, preservando `debug=1`, `calibrate=1`, `route` y `view`.
- Se elimina `config=%7B%7D` cuando no hay configuracion diferencial real.
- El modo manual `LNG/LAT + GO` marca la URL como `zone=custom` y el estado visible como `Coordenadas manuales`.
- El debug de clics aparece con `debug=1` y muestra ultimo boton pulsado, coordenadas aplicadas, metodo de navegacion, URL generada, inputs actuales y zona activa.
- El JSON sigue siendo la fuente principal de presets; el HTML conserva solo fallback minimo.

Prueba critica:

```text
maqueta-viva-torrevieja.html?zone=centro&lng=-0.6822&lat=37.9787&style=tile&sector=turismo&calibrate=1&debug=1
```

Desde esa URL, pulsar `Puerto / Marina`, `Salinas / entorno natural` y `Zona comercial` debe cambiar URL, inputs `LNG/LAT`, estado visible y debug de clics. Si el usuario introduce coordenadas manuales y pulsa `GO`, la URL debe quedar como `zone=custom`.

## Roadmap premium posterior al fix de presets

Esta fase deja estabilizada la navegacion por presets. A partir de aqui, la evolucion premium debe centrarse en valor vendible, no en mas botones:

- Capa real de pins/POIs georreferenciados sobre la maqueta.
- Ruta 3D visible entre lugares seleccionados.
- Presets calibrados por cliente o sector.
- Branding configurable por campana.
- Poster o recuerdo descargable de la Ruta Viva.
- QR/link final para compartir una ruta cerrada.
- Integracion externa con Living Map y La Batuta sin mezclar motores.
- Fallback elegante cuando Nextzen no devuelve edificios.
