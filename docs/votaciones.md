# Votaciones en directo · Instrucciones

## Cómo funciona

```
Móvil del público ──QR──▶ Google Form (1 pregunta, sin registro)
                                │
                                ▼
           Apps Script (tu cuenta) cuenta las respuestas
                                │   JSON cada 4 s
                                ▼
   Diapositivas de votación y presentacion/resultados.html → barras en tiempo real
```

- **El público** escanea el QR, toca una opción y pulsa *Enviar*: 3 toques, sin iniciar sesión.
- **Los formularios** se crean solos a partir de `content/votaciones.json`, la misma fuente que usan las diapositivas.
- **Privacidad:** los votos son anónimos (no se recogen correos) y se guardan solo en tu cuenta de Google.
- **Sin conexión:** la diapositiva muestra «votamos a mano alzada» y mantiene las opciones visibles.

## Las 6 votaciones

| Id | Diapositiva | Min | Pregunta | Opciones |
|---|---|---|---|---|
| **v0** | 3 | 1 | **Antes:** El alumnado ve un vídeo y responde un test en la tableta. ¿Qué cambio generaría más conocimiento? | Una aplicación más interactiva y atractiva · Puntos, insignias y clasificación · **Que lo expliquen con sus palabras y lo contrasten con un compañero** · Que usen una IA para resolverlo más rápido |
| v1 | 5 | 2,5 | ¿Cuál de las dos tareas puede resolver una IA sola, en segundos? | Solo la A · Solo la B · Las dos · Ninguna |
| v2 | 13 | 15 | La última vez que tu alumnado usó tecnología en clase, ¿qué hacía sobre todo? | Recibir · Manipular · Generar · Co-construir |
| v3 | 19 | 27,5 | ¿Qué te preocupa más de la IA generativa en tu aula? | Que copien sin aprender · Que dejen de pensar por sí mismos · La privacidad · Los sesgos y los errores · No me preocupa |
| **v5** | 24 | 38 | **Después:** la misma pregunta que v0 | Las mismas que v0 |
| v4 | 26 | 40,5 | ¿Qué vas a probar el lunes? | Rediseñar una tarea copiable · Evaluar el proceso · Usar la IA como tutor que pregunta · Revisar las barreras DUA · Pasar una actividad por la plantilla socrática |

## Medir el progreso: antes y después (v0 → v5)

- **Idea:** la misma pregunta diagnóstica al empezar (v0, minuto 1) y al terminar (v5, minuto 38). Son dos formularios distintos con la misma pregunta, para que los votos no se mezclen.
- **La respuesta buscada** es la tercera («que lo expliquen con sus palabras y lo contrasten con un compañero»). Es la que lleva la actividad de *Pasivo/Activo* a *Constructivo/Interactivo* (ICAP). Está marcada en `content/votaciones.json` con `"target": 2` (se cuenta desde 0).
- **La diapositiva 25, «¿Ha cambiado algo?»,** muestra las barras de v0 y v5 una al lado de la otra y una línea grande con el cambio: *«Que lo expliquen…»: 23 % → 61 %*. Se actualiza en directo.
- **No digas en v0 cuál es la buena.** Solo: «La volveremos a hacer al final».
- **Lo que mide y lo que no:**
  - Compara cómo se reparten los votos de la sala antes y después. No sigue a cada persona: los votos son anónimos y puede votar gente distinta al principio y al final.
  - Es una medida orientativa de comprensión, no una evaluación. Dilo así en la sala.
- **Después de la ponencia:** en cada formulario, *Respuestas → Vincular con Hojas de cálculo* te da una hoja con la hora de cada voto. Así puedes comparar la sesión del 25 con la del 26 (vacía las respuestas entre una y otra; ver más abajo) y guardar los porcentajes antes de borrar.

## Puesta en marcha paso a paso (unos 15 minutos, una sola vez)

Hazlo **con la web ya publicada**, porque el script lee las preguntas de la web.

1. **Crea el proyecto.**
   - Entra en <https://script.google.com> con tu cuenta de Google.
   - Pulsa **Nuevo proyecto** y llámalo «Pensar en Digital · Votaciones».
2. **Pega el código.**
   - Borra todo el contenido de `Código.gs`.
   - Pega el de [`tools/apps-script/votaciones.gs`](https://github.com/jmgo93/pensar-en-digital/blob/main/tools/apps-script/votaciones.gs) (botón *Raw*, seleccionar todo, copiar).
   - Guarda (icono del disquete).
3. **Crea los 6 formularios.**
   - En el desplegable de funciones (arriba) elige `crearFormularios` y pulsa **Ejecutar**.
   - Google pedirá permisos: *Revisar permisos* → tu cuenta. Si aparece «Google no ha verificado esta aplicación», pulsa *Configuración avanzada → Ir a Pensar en Digital · Votaciones (no seguro)*. Es tu propio script.
   - Abajo, en el **Registro de ejecución**, verás 6 líneas como `v0  https://forms.gle/…  (editar: …)`. **Cópialas y envíamelas.**
4. **Revisa cada formulario** (abre el enlace «editar» de cada uno):
   - Si arriba aparece el botón **Publicar**, púlsalo. En *Gestionar*, el acceso de quien responde debe ser **Cualquier persona con el enlace**.
   - En *Configuración → Respuestas*: **no recopilar correos** y **«Limitar a 1 respuesta» desactivado** (si se activa, obliga a iniciar sesión).
5. **Publica el contador.**
   - Pulsa **Implementar → Nueva implementación → ⚙ (tipo) → Aplicación web**.
   - *Ejecutar como*: **Yo**. *Quién tiene acceso*: **Cualquier usuario**.
   - Pulsa **Implementar**, autoriza si lo pide y copia la URL que termina en `/exec`. **Envíamela.**
6. **Prueba.**
   - Abre en el navegador `TU_URL/exec?v=v0`: debe salir un JSON con `"total":0`.
   - Responde el formulario v0 desde el móvil y recarga: `"total":1`.
7. **Yo conecto la web:** pongo los 6 `formUrl` y el `votingEndpoint`, regenero los QR (`npm run qr` y `npm run build:all`) y publico. Las diapositivas de votación mostrarán entonces su QR y las barras en directo.
8. **Ensayo completo:** abre la presentación, ve a la diapositiva 3 (v0), vota desde el móvil; luego a la 24 (v5), vota otra opción, y pasa a la 25: deben salir las dos barras y la línea «antes → después».
9. **Deja los contadores a cero** ejecutando `vaciarRespuestas` en el editor (borra las respuestas de prueba de los 6 formularios).

## El día de la ponencia

- Las barras salen en las propias diapositivas. Pantalla aparte, si la quieres: `https://jmgo93.github.io/pensar-en-digital/presentacion/resultados.html?v=v0` (← / → cambian de votación; `&demo` para ensayar con datos ficticios).
- **Entre la sesión del 25 y la del 26:** guarda los resultados (hoja de cálculo o captura de la diapositiva 25) y ejecuta `vaciarRespuestas`.
- Si cambias el código del script, usa *Implementar → Gestionar implementaciones → Editar → Nueva versión*. Así la URL `/exec` no cambia.
- Si cambias una pregunta en `content/votaciones.json` después de crear los formularios, el formulario **no** se actualiza solo: edítalo a mano con el mismo texto y las mismas opciones, en el mismo orden (el recuento compara el texto de las opciones).

## Límites conocidos

- La pantalla consulta cada 4 s y el script guarda el recuento 3 s, así que un voto tarda en aparecer entre 1 y 7 s.
- Apps Script está pensado para este volumen: unos cientos de respuestas y una sola pantalla consultando.
- No he podido ejecutar el script desde aquí porque necesita tu cuenta de Google. Los pasos 6 y 8 son la prueba real.
