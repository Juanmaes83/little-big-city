# Maqueta Viva Media Assets

Esta carpeta esta preparada para que Juanma pueda anadir medios reales sin cambiar el motor 3D.

## Imagenes de POIs

Colocar en `asset/maqueta-viva/media/pois/`:

- `torre-del-moro.jpg`
- `plaza-iglesia.jpg`
- `centro-la-mata.jpg`
- `salinas.jpg`
- `puerto-marina.jpg`
- `frente-maritimo.jpg`
- `parque-naciones.jpg`
- `zona-comercial.jpg`
- `centro-urbano.jpg`

Si falta una imagen real, la app mantiene el SVG placeholder local.

## Imagenes de zonas

Colocar en `asset/maqueta-viva/media/zones/` usando los mismos slugs.

## Audio / mapa sonoro

Colocar en `asset/maqueta-viva/media/audio/`:

- `torre-del-moro-soundscape.mp3`
- `salinas-soundscape.mp3`
- `puerto-soundscape.mp3`
- `centro-soundscape.mp3`

No hay autoplay. El usuario debe activar el audio.

## Podcast

Colocar en `asset/maqueta-viva/media/podcast/`:

- `torre-del-moro-podcast.mp3`
- `salinas-podcast.mp3`
- `centro-la-mata-podcast.mp3`

Si falta audio, se muestra transcript.

## Video

Colocar en `asset/maqueta-viva/media/video/`:

- `torre-del-moro-drone.mp4`
- `salinas-nature.mp4`
- `centro-la-mata-video.mp4`
- `puerto-video.mp4`

Si falta video, se mantiene placeholder honesto.

## Inmersivo

Colocar manifiestos, enlaces o assets ligeros en `asset/maqueta-viva/media/immersive/`.

Tipos preparados:

- gaussian-splat
- 360-tour
- drone-video
- virtual-museum
- external-immersive-web
- official-website

## Licencias

Cada asset real debe tener propietario/licencia clara antes de usarse comercialmente.

Estados recomendados:

- `local-real`: asset propio validado.
- `placeholder-local`: SVG interno de Maqueta Viva.
- `remote-open`: asset abierto con licencia y atribucion.
- `manual-review`: pendiente de validar.
