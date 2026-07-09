# Maqueta Viva Input Contract

Estado: Map Intent Contract v0.1.  
Fecha: 2026-07-09.

## Objetivo

Definir una capa de entrada segura para Maqueta Viva 3D. Este contrato permite que Director de Orquesta, Living Map, Batuta, teclado, tactil, raton o futuros modulos de voz/camara pidan acciones de producto sin manipular directamente el motor 3D.

Regla critica: ningun gesto debe tocar directamente `lng`, `lat`, Maptalks, Nextzen, ClayGL, WebGL, `src/main.js` ni `dist/bundle.js`.

## Forma de un intent

```json
{
  "type": "SELECT_ZONE",
  "source": "gesture",
  "payload": {
    "zoneId": "centro"
  },
  "expectedEffect": "Activa una zona de Maqueta Viva usando la UI premium.",
  "safeFallback": "Mantener zona actual y mostrar warning controlado.",
  "analyticsEvent": "maqueta_intent_select_zone"
}
```

## Fuentes permitidas

- `gesture`
- `mouse`
- `touch`
- `keyboard`
- `director`
- `debug`
- `voice_future`

## Intents v0.1

| Intent | Payload minimo | Expected effect | Safe fallback | Analytics event |
|---|---|---|---|---|
| `NEXT_ZONE` | `{}` | Seleccionar la siguiente zona disponible. | Mantener zona actual. | `maqueta_intent_next_zone` |
| `PREVIOUS_ZONE` | `{}` | Seleccionar la zona anterior. | Mantener zona actual. | `maqueta_intent_previous_zone` |
| `SELECT_ZONE` | `{ "zoneId": "centro" }` | Activar una zona por ID. | Warning si no existe zona. | `maqueta_intent_select_zone` |
| `FOCUS_RECOMMENDED_POI` | `{}` | Llevar foco visual al POI recomendado. | Abrir panel de POIs si no hay foco. | `maqueta_intent_focus_recommended_poi` |
| `OPEN_POI` | `{ "poiId": "puerto-marina" }` | Abrir o enfocar POI. | Abrir dock de POIs. | `maqueta_intent_open_poi` |
| `ADD_RECOMMENDED_POI` | `{}` | Anadir POI recomendado a Ruta Viva. | Mostrar aviso si no hay POI. | `maqueta_intent_add_recommended_poi` |
| `OPEN_ROUTE` | `{}` | Abrir Ruta Viva. | Mostrar dock. | `maqueta_intent_open_route` |
| `TOGGLE_VIEW_MODE` | `{}` | Alternar precision/presentacion. | Mantener modo actual. | `maqueta_intent_toggle_view_mode` |
| `SET_VIEW_MODE` | `{ "mode": "precision" }` | Cambiar a `tile` o `planet` de forma segura. | Mantener modo actual. | `maqueta_intent_set_view_mode` |
| `OPEN_PUBLIC_DATA` | `{}` | Abrir datos/fuentes publicas preparadas. | Abrir toolbox si no hay panel. | `maqueta_intent_open_public_data` |
| `START_PRESENTATION` | `{}` | Activar modo presentacion/limpio. | Mostrar CTA de presentacion. | `maqueta_intent_start_presentation` |
| `RESET_VIEW` | `{}` | Resetear vista de zona actual. | Recargar preset actual o mantener estado. | `maqueta_intent_reset_view` |

## Eventos DOM

El controlador debe emitir:

- `maqueta:intent`
- `maqueta:intent_applied`
- `maqueta:intent_failed`

## Principios de seguridad

- Fallar con `console.warn`, no con excepciones no controladas.
- No pedir camara.
- No pedir GPS.
- No activar APIs remotas.
- No modificar motor.
- No declarar datos publicos como actuales o exactos.
- No afirmar gemelo digital.

