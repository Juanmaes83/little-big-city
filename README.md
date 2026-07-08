# Little Big City / Maqueta Viva 3D

Este repositorio conserva la demo original de **Little Big City** y aÃƒÂ±ade una capa productizada premium:

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

Las zonas de Maqueta Viva 3D usan coordenadas aproximadas dentro del entorno de Torrevieja. La maqueta depende del motor heredado Little Big City y de los datos vectoriales disponibles en cada coordenada, por lo que algunas zonas urbanas cercanas pueden generar geometrÃ­as parecidas.

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
