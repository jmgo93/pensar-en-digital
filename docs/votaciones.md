# Votaciones en directo y perfil de ponente · Instrucciones

## Cómo funciona

```
Móvil del público ──QR──▶ Google Form (1 pregunta, sin registro)
                                │
                                ▼
           Apps Script (tu cuenta) cuenta las respuestas
                                │   JSON cada 4 s
                                ▼
   Diapositivas de votación y presentacion/resultados.html → barras en tiempo real

Panel del ponente ──contraseña──▶ Apps Script: archiva en una hoja de cálculo de tu Drive y pone todo a cero
```

- **El público** escanea el QR, toca una opción y pulsa *Enviar*: 3 toques, sin iniciar sesión.
- **Los formularios** se crean a partir de `content/votaciones.json`, la misma fuente que usan las diapositivas.
- **Privacidad:** los votos son anónimos (no se recogen correos) y se guardan solo en tu cuenta de Google.
- **Sin conexión:** la diapositiva muestra «votamos a mano alzada» y mantiene las opciones visibles.
- **Barras:** la longitud de cada barra es el porcentaje de votos de esa opción; la más votada va en naranja.

## Las votaciones: una pregunta de activación por bloque

Cada votación abre su bloque y va **justo antes** del contenido que la responde: el público se compromete con una idea y después la contrasta.

| Id | Diap. | Min | Bloque | Pregunta | Opciones |
|---|---|---|---|---|---|
| **v0** | 3 | 1 | Apertura: el marco y tres lentes | Si el alumnado ve un vídeo y responde un test en la tablet, ¿qué cambio le hará aprender más? | Usar una aplicación más interactiva y atractiva · Añadir puntos, insignias y clasificación · Que lo expliquen con sus palabras y lo contrasten con un compañero · Que usen una IA para resolverlo más rápido |
| v1 | 15 | 9,25 | 1 · ¿Digitalizar o innovar? (Primaria) | Si pegas estas dos tareas en una IA, ¿cuál crees que resolverá sola en segundos? | Solo la A · Solo la B · Las dos · Ninguna |
| v2 | 22 | 15,25 | 2 · ¿Qué hace con la información? (ESO) | Piensa en tu próxima clase con tecnología: ¿qué hará sobre todo tu alumnado? | Recibir: ver, escuchar, leer · Manipular: copiar, completar, subrayar · Generar: explicar, crear algo nuevo · Co-construir: debatir y crear con otros |
| v6 | 28 | 21,25 | 3 · Atención y «nativos digitales» (Bachillerato) | Si un estudiante estudia con el móvil y varias pestañas abiertas, ¿aprenderá igual de bien? | Sí, aprenderá igual de bien · No, aprenderá peor · Dependerá de la persona |
| v3 | 35 | 27,25 | 4 · IA: ¿muleta o tutor? (EOI) | Si los estudiantes practican matemáticas con ChatGPT sin límites y después hacen un examen sin IA, ¿qué crees que sucederá? | Sacarán mejor nota que quien no usó IA · Sacarán la misma nota · Sacarán peor nota · Dependerá de cómo usen la IA |
| v7 | 43 | 34,25 | 5 · Evaluar para aprender (Conservatorio) | Si devuelves un trabajo corregido, ¿qué crees que hará la mayoría de tu alumnado? | Mirará la nota y lo guardará · Leerá los comentarios · Lo corregirá y lo volverá a entregar · No lo sé |
| **v5** | 49 | 41,25 | Cierre | Si el alumnado ve un vídeo y responde un test en la tablet, ¿qué cambio le hará aprender más? | Usar una aplicación más interactiva y atractiva · Añadir puntos, insignias y clasificación · Que lo expliquen con sus palabras y lo contrasten con un compañero · Que usen una IA para resolverlo más rápido |

La v4 («¿Qué vas a probar el lunes?») ya no está en la presentación: el compromiso se pide de palabra al mostrar el kit. Su formulario se conserva y se archiva con las demás.

## Añadir las votaciones nuevas (v6 y v7)

1. En el editor de Apps Script, ejecuta `crearFormularios`. Solo crea las que faltan (v6 y v7). El registro muestra sus enlaces `forms.gle`: **envíamelos** y conecto los QR.
2. En cada formulario nuevo: si aparece **Publicar**, púlsalo; sin recoger correos y con «Limitar a 1 respuesta» desactivado.
3. Ejecuta `actualizarFormularios` para poner al día los títulos de bloque de las demás. Si una pregunta no cambia, no borra sus respuestas.
4. No hace falta publicar una nueva versión del script: el código no ha cambiado.

### Antes y después (v0 → v5)

- **La diapositiva 50, «¿Ha cambiado algo?»,** muestra las dos distribuciones una al lado de la otra (con etiquetas cortas) y una línea grande con el cambio en la opción buscada: *«Explicar y contrastar»: 23 % → 61 %*. La opción buscada está marcada en `content/votaciones.json` con `"target": 2`.
- No digas en v0 cuál es la buena. Es una medida orientativa: votos anónimos, sin emparejar personas.

## Perfil de ponente

- **El público** ve toda la app salvo lo de la presentación: no ve el botón «Abrir la presentación» ni el panel, y si abre `presentacion/` o `resultados.html` le sale la pantalla de acceso.
- **El ponente** entra con su contraseña (enlace «Acceso del ponente» al pie de cualquier página, o directamente en la presentación) y tiene: presentación, notas, pantalla de resultados, escaleta y **Archivar resultados y reiniciar**. El acceso se recuerda en ese navegador hasta pulsar «Cerrar sesión de ponente».
- **Archivar resultados y reiniciar** (en el panel, en la última diapositiva y en la ventana de notas):
  1. Guarda los recuentos y cada respuesta con su hora en una pestaña nueva de la hoja «Pensar en Digital · Resultados de las votaciones» de tu Drive.
  2. Después pone a cero las 6 votaciones.
  3. Te da el enlace a la hoja y una copia en CSV.
- **Seguridad, con honestidad:**
  - La contraseña real solo la conocen tú y tu script de Google. El servidor la comprueba antes de archivar o borrar nada, y bloquea durante 10 minutos tras 5 intentos fallidos.
  - En la web solo hay una huella cifrada (PBKDF2) para separar perfiles, también sin conexión.
  - El repositorio es público: quien sepa buscar puede leer el texto de las diapositivas. Lo que no puede es borrar ni archivar votos.

## Puesta en marcha de esta versión (unos 10 minutos)

Ya tienes los 6 formularios y el contador funcionando. Esta versión añade el archivo y el perfil de ponente, y cambia la pregunta de v3.

1. **Elige la contraseña del ponente** y fíjala en la web. En la terminal de VS Code, dentro de la carpeta del proyecto:
   ```
   npm run ponente
   ```
   - Te la pide dos veces, sin mostrarla, y guarda solo su huella en `content/site.json`.
   - Usa al menos 10 caracteres; mejor una frase.
   - Avísame cuando lo hayas hecho y la publico (o haz `npm run build:all`, commit y push).
2. **Actualiza el código del script:**
   - En <https://script.google.com>, abre tu proyecto y sustituye todo `Código.gs` por [`tools/apps-script/votaciones.gs`](https://github.com/jmgo93/pensar-en-digital/blob/main/tools/apps-script/votaciones.gs) (botón *Raw*).
   - Guarda.
3. **Pon la misma contraseña en el script:**
   - Entra en *⚙ Configuración del proyecto → Propiedades del script → Añadir propiedad del script*.
   - Nombre: `PONENTE_CLAVE`. Valor: tu contraseña. Guarda.
   - No borres las propiedades `v0`…`v5`: son tus formularios.
4. **Crea la hoja de resultados:**
   - Elige `prepararArchivo` en el desplegable y pulsa **Ejecutar**.
   - Acepta el permiso nuevo de Hojas de cálculo.
   - El registro muestra el enlace a la hoja.
5. **Actualiza las preguntas de los formularios** (la v3 ha cambiado):
   - Ejecuta `actualizarFormularios`.
   - El registro dirá «v3: pregunta actualizada (respuestas borradas)» y «sin cambios» en las demás.
   - Los enlaces y los QR no cambian.
6. **Publica la nueva versión del script:** *Implementar → Gestionar implementaciones → ✏️ Editar → Versión: Nueva versión → Implementar*. Así la URL `/exec` no cambia.
7. **Prueba:**
   - Entra en *Panel del ponente* (pie de página → «Acceso del ponente»).
   - Vota algo de prueba y pulsa **Archivar resultados y reiniciar**.
   - Debe aparecer el enlace a la hoja con una pestaña nueva, y los contadores deben volver a 0.

## Primera puesta en marcha (ya hecha el 22/11, por si hay que repetirla)

1. En <https://script.google.com>, crea un proyecto nuevo y pega `tools/apps-script/votaciones.gs`.
2. Ejecuta `crearFormularios` y acepta los permisos. El registro da los 6 enlaces `forms.gle`.
3. En cada formulario:
   - Si aparece **Publicar**, púlsalo, con acceso para cualquier persona con el enlace.
   - Sin recoger correos y con «Limitar a 1 respuesta» desactivado.
4. Pulsa *Implementar → Nueva implementación → Aplicación web*, con *Ejecutar como*: **Yo** y *Acceso*: **Cualquier usuario**. Copia la URL `/exec`.
5. En la web, pon los `formUrl` en `content/votaciones.json` y el `votingEndpoint` en `content/site.json`. Después, `npm run qr`, `npm run build:all` y publica.

## El día de la ponencia

- Abre la presentación en el portátil de la sala (con tu acceso) y las notas con la tecla **N**.
- **Si las teclas o el mando fallan:** arriba a la derecha hay botones de anterior, pantalla completa y siguiente. Se ocultan a los 3 segundos y vuelven al mover el ratón o tocar la pantalla.
- **Al terminar cada sesión:** pulsa **Archivar resultados y reiniciar** en la última diapositiva o en las notas. Ponle un nombre (por ejemplo, «25/11 tarde»).
- Si cambias el código del script, publica siempre como *Nueva versión* de la misma implementación.

## Límites conocidos

- La pantalla consulta cada 4 s y el script guarda el recuento 3 s, así que un voto tarda en aparecer entre 1 y 7 s.
- Apps Script está pensado para este volumen: unos cientos de respuestas y una sola pantalla consultando.
- Archivar tarda unos segundos (lee los 6 formularios y escribe la hoja).
