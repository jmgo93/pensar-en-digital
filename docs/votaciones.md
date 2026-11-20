# Votaciones en directo · Instrucciones

## Cómo funciona

```
Móvil del público ──QR──▶ Google Form (1 pregunta, sin registro)
                                │
                                ▼
           Apps Script (tu cuenta) cuenta las respuestas
                                │   JSON cada 4 s
                                ▼
     presentacion/resultados.html → barras en tiempo real en la pantalla
```

- **El público** escanea el QR, toca una opción y pulsa *Enviar*: 3 toques, sin iniciar sesión.
- **Los formularios** se crean solos a partir de `content/votaciones.json`, la misma fuente que usan las diapositivas.
- **Privacidad:** los votos son anónimos (no se recogen correos) y se guardan solo en tu cuenta de Google.
- **Sin conexión:** la pantalla muestra "votamos a mano alzada" y mantiene las opciones visibles.

## Las 4 votaciones

| Id | Min | Pregunta | Opciones |
|---|---|---|---|
| v1 | 0–5 | ¿Cuál de las dos tareas puede resolver una IA sola, en segundos? | Solo la A · Solo la B · Las dos · Ninguna |
| v2 | 10–20 | La última vez que tu alumnado usó tecnología en clase, ¿qué hacía sobre todo? | Recibir: ver, escuchar, leer · Manipular: copiar, completar, subrayar · Generar: explicar, crear algo nuevo · Co-construir: debatir y crear con otros |
| v3 | 32–40 | ¿Qué te preocupa más de la IA generativa en tu aula? | Que copien sin aprender · Que dejen de pensar por sí mismos · La privacidad de los datos · Los sesgos y los errores · No me preocupa |
| v4 | 40–45 | ¿Qué vas a probar el lunes? | Rediseñar una tarea copiable · Evaluar el proceso, no solo el producto · Usar la IA como tutor que pregunta · Revisar las barreras DUA de un material · Pasar una actividad por la plantilla socrática |

En la v1 la diapositiva muestra las dos tareas:
- **A:** «Escribe una redacción de 300 palabras sobre la importancia del agua».
- **B:** «Mide durante una semana el agua que se gasta en tu casa, compara tus datos con los de un compañero y proponed al centro una medida basada en ellos. La IA puede ayudaros a analizarlos, pero los datos son vuestros».

Para cambiar una pregunta, edita `content/votaciones.json` **antes** de crear los formularios.

## Puesta en marcha (unos 10 minutos, una sola vez)

1. **Crea el proyecto.** Entra en <https://script.google.com> con tu cuenta de Google, pulsa **Nuevo proyecto** y llámalo "Pensar en Digital · Votaciones".
2. **Pega el código.** Borra el contenido de `Código.gs` y pega el de [`tools/apps-script/votaciones.gs`](https://github.com/jmgo93/pensar-en-digital/blob/main/tools/apps-script/votaciones.gs). Guarda (icono del disquete).
3. **Crea los formularios.** En el desplegable de funciones elige `crearFormularios` y pulsa **Ejecutar**.
   - Google pedirá permisos. Si aparece "Google no ha verificado esta aplicación", pulsa *Configuración avanzada → Ir a Pensar en Digital · Votaciones*. Es tu propio script.
   - Abre el **Registro de ejecución**: verás 4 líneas como `v1  https://forms.gle/…  (editar: …)`. **Cópialas y envíamelas.**
4. **Revisa cada formulario** (enlace "editar"):
   - Si arriba aparece un botón **Publicar**, púlsalo. En *Gestionar*, el acceso de quien responde debe ser **Cualquier persona con el enlace**.
   - En *Configuración → Respuestas*: **no recopilar correos** y **"Limitar a 1 respuesta" desactivado**, porque activarlo obliga a iniciar sesión.
5. **Publica el contador.**
   - Pulsa **Implementar → Nueva implementación → ⚙ → Aplicación web**.
   - *Ejecutar como*: **Yo**. *Quién tiene acceso*: **Cualquier usuario**.
   - Pulsa **Implementar** y copia la URL que termina en `/exec`. **Envíamela.**
6. **Prueba.**
   - Abre `TU_URL/exec?v=v1` en el navegador: debe salir un JSON con `"total":0`.
   - Responde el formulario v1 desde el móvil y recarga: `"total":1`.
7. **Deja los contadores a cero** ejecutando `vaciarRespuestas` (borra las respuestas de prueba).

## El día de la ponencia

- Pantalla de resultados: `https://jmgo93.github.io/pensar-en-digital/presentacion/resultados.html?v=v1`.
  - ← / → (o el mando) cambian de votación.
  - Más adelante, estas barras irán dentro de las propias diapositivas (Fase 5).
- Ensayo sin formularios: añade `&demo` a la URL para ver datos ficticios.
- **Entre la sesión del 25 y la del 26:** ejecuta `vaciarRespuestas` en el editor de Apps Script.
- Si cambias el código del script, usa *Implementar → Gestionar implementaciones → Editar → Nueva versión*. Así la URL `/exec` no cambia.

## Límites conocidos

- La pantalla consulta cada 4 s y el script guarda el recuento 3 s, así que un voto tarda en aparecer entre 1 y 7 s.
- Apps Script está pensado para este volumen: unos cientos de respuestas y una sola pantalla consultando.
- No he podido ejecutar el script desde aquí porque necesita tu cuenta de Google. Los pasos 6 y 7 son la prueba real.
