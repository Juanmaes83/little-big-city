# Little Big City / Maqueta Viva 3D

Este repositorio conserva la demo original de **Little Big City** y añade una primera capa productizada:

**Maqueta Viva 3D - Torrevieja Prototype**

Concepto comercial: **La ciudad se levanta ante ti.**

No es una modernizacion completa del stack. Es una v0.1 presentable para evaluar si la tecnologia puede convertirse en modulo externo premium para Rubik, Living Map y La Batuta de Torrevieja.

## Demos

Demo tecnica original:

```text
index.html
```

Experiencia productizada Torrevieja:

```text
maqueta-viva-torrevieja.html
```

URL local recomendada:

```text
http://127.0.0.1:8137/maqueta-viva-torrevieja.html
```

Preset Torrevieja directo:

```text
http://127.0.0.1:8137/maqueta-viva-torrevieja.html?lng=-0.6822&lat=37.9787&style=tile
```

Demo original con Torrevieja:

```text
http://127.0.0.1:8137/?lng=-0.6822&lat=37.9787&style=tile
```

## Comandos

```bash
npm install --no-audit --no-fund
npm run build
npx serve -l 8137 .
```

En la auditoria inicial, `npm run build` funciono con Node moderno sin necesitar:

```powershell
$env:NODE_OPTIONS="--openssl-legacy-provider"
```

## Que hace Maqueta Viva 3D

- Abre por defecto en Torrevieja: `lng=-0.6822`, `lat=37.9787`.
- Usa `style=tile` por defecto porque se lee mejor como maqueta territorial.
- Mantiene opcion `style=planet` para una lectura mas escenografica.
- Muestra edificios, carreteras, agua y tierra a partir de datos vectoriales.
- Mantiene controles tecnicos de `dat.GUI`, incluido `downloadOBJ`.
- Añade onboarding, claim, capa comercial y fallback visible si la carga de datos falla.
- Conserva creditos originales de Little Big City, ClayGL y Nextzen.

## Dependencias externas

La demo depende de:

- ClayGL.
- Maptalks.
- Nextzen vector tiles.
- OpenStreetMap raster tiles para el mapa de seleccion.
- WebGL en navegador.

Nextzen se consulta con una API key heredada del proyecto original. En pruebas, Torrevieja devolvio capas reales con edificios, roads, water, POIs y landuse, pero esta dependencia externa es un riesgo para producto.

## Sectores aplicables

Maqueta Viva 3D puede adaptarse a:

- turismo y destinos;
- ayuntamientos y smart cities;
- inmobiliaria y urbanismo;
- hoteles;
- eventos y ferias;
- retail territorial;
- museos y centros de interpretacion.

## Relacion futura con Living Map / Batuta / Rubik

Recomendacion de arquitectura:

- **Living Map**: exploracion territorial clara y ligera.
- **La Batuta de Torrevieja**: storytelling gestual y desbloqueo de puntos.
- **Maqueta Viva 3D**: vista externa premium de maqueta 3D para un punto o zona.
- **Rubik**: launcher/orquestador, no contenedor pesado del motor.

Maqueta Viva 3D deberia vivir como modulo externo enlazado desde Rubik o desde Batuta, por ejemplo con un boton: `Ver zona en maqueta 3D`.

## GitHub Pages

Este repo esta en rama `gh-pages`, pero si la URL publica no aparece, hay que activar en GitHub:

```text
Settings > Pages > Deploy from branch > gh-pages / root
```

No es necesario activar Pages desde terminal para esta v0.1.

## Riesgos tecnicos

- Stack antiguo: webpack 4, ClayGL antiguo y dependencias legacy.
- Bundle grande para movil.
- Dependencia critica de Nextzen y su API key.
- Si Nextzen falla, el motor original no tiene manejo completo de errores por tile.
- UI tecnica de `dat.GUI`, valida para prototipo pero no para cliente final.
- Mobile no esta productizado.
- Export OBJ existe, pero requiere QA visual/manual adicional para asegurar calidad de salida.

## Pendiente para v0.2

- Modernizar build sin reescribir el motor completo.
- Sustituir `dat.GUI` por panel comercial.
- Añadir selector de ciudad/sector por JSON.
- Gestionar errores de Nextzen con estado de carga real por tile.
- Añadir boton QR / enlace desde Batuta y Living Map.
- Crear preset inmobiliario y preset turismo.
- Optimizar rendimiento movil.
- Evaluar proveedor de tiles alternativo o cache propio si se vende a cliente.
