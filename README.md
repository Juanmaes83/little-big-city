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
http://127.0.0.1:8137/maqueta-viva-torrevieja.html
http://127.0.0.1:8137/maqueta-viva-torrevieja.html?lng=-0.6822&lat=37.9787&style=tile
http://127.0.0.1:8137/maqueta-viva-torrevieja.html?lng=-0.6822&lat=37.9787&style=planet
http://127.0.0.1:8137/maqueta-viva-torrevieja.html?sector=inmobiliaria
http://127.0.0.1:8137/maqueta-viva-torrevieja.html?sector=eventos&view=clean
```

## Comandos

```bash
npm install --no-audit --no-fund
npm run build
npx serve -l 8137 .
```

En las pruebas, `npm run build` funciono con Node moderno sin necesitar:

```powershell
$env:NODE_OPTIONS="--openssl-legacy-provider"
```

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
