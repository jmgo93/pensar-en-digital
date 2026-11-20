# Hoja de pruebas · Banco de prompts e «Abrir en IA»

GENERADO por `tools/build-prompt-tests.mjs` a partir de `content/prompts.json`. Para editar los prompts, cambia el JSON y vuelve a generarlo.

## Cómo probar

1. Abre https://jmgo93.github.io/pensar-en-digital/ia/ en el móvil y en el ordenador. Usa la cuenta corporativa del centro si la tienes.
2. En cada tarjeta, despliega **Rellenar los huecos** y escribe los valores de prueba.
3. Pulsa **Copiar** y comprueba que aparece «Prompt copiado».
4. Pulsa **Gemini**, **ChatGPT** y **Claude**. Marca en la tabla si se abre el servicio y si el prompt aparece ya escrito.
5. Envía el prompt y valora la respuesta según el resultado esperado.
6. Marca **KO** en cualquier respuesta que pida o incluya datos personales, o que se invente normas o referencias.

## Estado de «Abrir en IA» (comprobado el 2026-11-20)

| Servicio | URL | Comportamiento comprobado | Alternativa |
|---|---|---|---|
| ChatGPT | `chatgpt.com/?q=` | Precarga el prompt; sin sesión, además lo envía. | El prompt se copia siempre: si no aparece, pegarlo. |
| Claude | `claude.ai/new?q=` | Pide iniciar sesión y conserva el parámetro tras hacerlo. **No verificado con sesión iniciada**: compruébalo tú. | Prompt copiado: pegarlo. |
| Gemini | `gemini.google.com/app` | No admite prompt precargado (`?q=` se ignora). | Se copia, se abre Gemini y aparece el aviso «Prompt copiado: pégalo en Gemini». |

## Prompts (23)

### 1. Material en tres niveles · _Crear contenido_

- Enlace: https://jmgo93.github.io/pensar-en-digital/ia/#crear-graduado
- Etapas: primaria, eso
- Valores de prueba: **materia** = Ciencias de la Naturaleza · **curso** = 5.º de Primaria · **tema** = la fotosíntesis
- Resultado esperado: Tres textos de unas 80, 120 y 160 palabras sobre la misma idea, cada uno con dos preguntas del tipo «explica por qué…».
- Comprueba también: ¿pide o incluye datos personales? (debe ser **no**) · ¿inventa normativa o referencias? · ¿respeta el formato pedido?

| Servicio | Abre y precarga | Respuesta útil | Sin datos personales | Notas |
|---|---|---|---|---|
| Gemini | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |
| ChatGPT | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |
| Claude | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |

### 2. Texto graduado por nivel MCER · _Crear contenido_

- Enlace: https://jmgo93.github.io/pensar-en-digital/ia/#crear-mcer
- Etapas: eoi
- Valores de prueba: **idioma** = inglés · **palabras** = 250 · **nivel MCER** = B1 · **tema** = buscar piso en otra ciudad
- Resultado esperado: Un texto de nivel B1, tres preguntas que piden deducir intenciones o causas, una tarea tipo «escribe un correo al casero» y la lista de estructuras con su justificación.
- Comprueba también: ¿pide o incluye datos personales? (debe ser **no**) · ¿inventa normativa o referencias? · ¿respeta el formato pedido?

| Servicio | Abre y precarga | Respuesta útil | Sin datos personales | Notas |
|---|---|---|---|---|
| Gemini | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |
| ChatGPT | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |
| Claude | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |

### 3. Lectura musical y análisis guiado · _Crear contenido_

- Enlace: https://jmgo93.github.io/pensar-en-digital/ia/#crear-musica
- Etapas: conservatorio
- Valores de prueba: **asignatura** = Lenguaje Musical · **curso** = 2.º de Enseñanzas Elementales · **número** = 4 · **contenido** = el fraseo en compás de 3/4
- Resultado esperado: Cuatro ejercicios del tipo «marca dónde respirarías en esta frase y explica qué cambia en el sentido musical», con una pregunta de reflexión cada uno.
- Comprueba también: ¿pide o incluye datos personales? (debe ser **no**) · ¿inventa normativa o referencias? · ¿respeta el formato pedido?

| Servicio | Abre y precarga | Respuesta útil | Sin datos personales | Notas |
|---|---|---|---|---|
| Gemini | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |
| ChatGPT | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |
| Claude | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |

### 4. Revisión de errores y nivel · _Auditar contenido_

- Enlace: https://jmgo93.github.io/pensar-en-digital/ia/#auditar-errores
- Etapas: primaria, eso, eoi, conservatorio
- Valores de prueba: **materia** = Geografía e Historia · **curso** = 2.º de ESO · **pega aquí el texto, sin datos personales** = (pega un texto breve sin datos personales)
- Resultado esperado: Una tabla de 5 a 10 filas con fragmentos concretos, el problema detectado y una sugerencia, con avisos del tipo «no puedo verificar esta fecha».
- Comprueba también: ¿pide o incluye datos personales? (debe ser **no**) · ¿inventa normativa o referencias? · ¿respeta el formato pedido?

| Servicio | Abre y precarga | Respuesta útil | Sin datos personales | Notas |
|---|---|---|---|---|
| Gemini | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |
| ChatGPT | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |
| Claude | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |

### 5. Versión en lectura fácil · _Auditar contenido_

- Enlace: https://jmgo93.github.io/pensar-en-digital/ia/#auditar-lectura-facil
- Etapas: primaria, eso, eoi, conservatorio
- Valores de prueba: **destinatarios** = alumnado de 3.º de Primaria · **pega aquí el texto** = (pega un texto breve sin datos personales)
- Resultado esperado: El texto adaptado en párrafos cortos y una lista de «información que he quitado».
- Comprueba también: ¿pide o incluye datos personales? (debe ser **no**) · ¿inventa normativa o referencias? · ¿respeta el formato pedido?

| Servicio | Abre y precarga | Respuesta útil | Sin datos personales | Notas |
|---|---|---|---|---|
| Gemini | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |
| ChatGPT | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |
| Claude | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |

### 6. Comprobar la accesibilidad de un recurso · _Auditar contenido_

- Enlace: https://jmgo93.github.io/pensar-en-digital/ia/#auditar-accesibilidad
- Etapas: primaria, eso, eoi, conservatorio
- Valores de prueba: **describe el recurso: tipo, imágenes, vídeos, colores, cómo se navega** = presentación de 12 diapositivas con fotos, un vídeo de YouTube y texto blanco sobre fondo amarillo
- Resultado esperado: Una lista de comprobación de 8 a 10 puntos con arreglos rápidos: «añade texto alternativo a las fotos», «activa los subtítulos del vídeo», «cambia el texto a negro».
- Comprueba también: ¿pide o incluye datos personales? (debe ser **no**) · ¿inventa normativa o referencias? · ¿respeta el formato pedido?

| Servicio | Abre y precarga | Respuesta útil | Sin datos personales | Notas |
|---|---|---|---|---|
| Gemini | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |
| ChatGPT | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |
| Claude | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |

### 7. Detectar barreras DUA en una actividad · _Barreras DUA_

- Enlace: https://jmgo93.github.io/pensar-en-digital/ia/#dua-barreras
- Etapas: primaria, eso, eoi, conservatorio
- Valores de prueba: **curso** = 1.º de Bachillerato · **describe la actividad** = comentario de texto escrito individual de 45 minutos sobre un poema
- Resultado esperado: Una tabla de tres filas (implicación, representación, acción y expresión) con barreras y alternativas, y una mejora prioritaria.
- Comprueba también: ¿pide o incluye datos personales? (debe ser **no**) · ¿inventa normativa o referencias? · ¿respeta el formato pedido?

| Servicio | Abre y precarga | Respuesta útil | Sin datos personales | Notas |
|---|---|---|---|---|
| Gemini | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |
| ChatGPT | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |
| Claude | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |

### 8. Tres formas de demostrar lo aprendido · _Barreras DUA_

- Enlace: https://jmgo93.github.io/pensar-en-digital/ia/#dua-alternativas
- Etapas: primaria, eso, eoi, conservatorio
- Valores de prueba: **objetivo** = explicar las causas de un conflicto y valorar sus consecuencias · **curso** = 4.º de ESO
- Resultado esperado: Tres opciones (pódcast, mapa conceptual comentado, ensayo breve) y cuatro criterios comunes centrados en el contenido.
- Comprueba también: ¿pide o incluye datos personales? (debe ser **no**) · ¿inventa normativa o referencias? · ¿respeta el formato pedido?

| Servicio | Abre y precarga | Respuesta útil | Sin datos personales | Notas |
|---|---|---|---|---|
| Gemini | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |
| ChatGPT | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |
| Claude | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |

### 9. Situación de aprendizaje · _Planificar_

- Enlace: https://jmgo93.github.io/pensar-en-digital/ia/#planificar-sa
- Etapas: primaria, eso
- Valores de prueba: **curso** = 6.º de Primaria · **materia** = Matemáticas · **tema** = el consumo de agua en el colegio · **sesiones** = 6
- Resultado esperado: Un esquema con reto, producto, 6 sesiones, roles, uso de lo digital y una lista de competencias y criterios marcada como «por verificar».
- Comprueba también: ¿pide o incluye datos personales? (debe ser **no**) · ¿inventa normativa o referencias? · ¿respeta el formato pedido?

| Servicio | Abre y precarga | Respuesta útil | Sin datos personales | Notas |
|---|---|---|---|---|
| Gemini | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |
| ChatGPT | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |
| Claude | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |

### 10. Secuencia de sesiones con tarea final · _Planificar_

- Enlace: https://jmgo93.github.io/pensar-en-digital/ia/#planificar-eoi-cons
- Etapas: eoi, conservatorio
- Valores de prueba: **enseñanza** = inglés en Escuela Oficial de Idiomas · **sesiones** = 4 · **grupo** = un grupo de nivel A2 · **tarea final** = grabar una guía en audio de su barrio para visitantes
- Resultado esperado: Cuatro sesiones con objetivo, actividad, decisiones del alumnado y evidencias, más una guía de retroalimentación entre iguales.
- Comprueba también: ¿pide o incluye datos personales? (debe ser **no**) · ¿inventa normativa o referencias? · ¿respeta el formato pedido?

| Servicio | Abre y precarga | Respuesta útil | Sin datos personales | Notas |
|---|---|---|---|---|
| Gemini | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |
| ChatGPT | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |
| Claude | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |

### 11. Rúbrica que evalúa el proceso · _Evaluar_

- Enlace: https://jmgo93.github.io/pensar-en-digital/ia/#evaluar-rubrica
- Etapas: primaria, eso, eoi, conservatorio
- Valores de prueba: **tarea** = un pódcast por grupos sobre un problema del barrio · **curso** = 3.º de ESO
- Resultado esperado: Una tabla de 5 criterios × 4 niveles con descriptores observables y su versión «yo…» para autoevaluación.
- Comprueba también: ¿pide o incluye datos personales? (debe ser **no**) · ¿inventa normativa o referencias? · ¿respeta el formato pedido?

| Servicio | Abre y precarga | Respuesta útil | Sin datos personales | Notas |
|---|---|---|---|---|
| Gemini | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |
| ChatGPT | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |
| Claude | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |

### 12. Lista de cotejo rápida · _Evaluar_

- Enlace: https://jmgo93.github.io/pensar-en-digital/ia/#evaluar-cotejo
- Etapas: primaria, eso, eoi, conservatorio
- Valores de prueba: **materia** = Danza Española · **curso** = 3.º de Enseñanzas Profesionales · **aprendizaje esperado** = coordina braceo y zapateado en una sevillana
- Resultado esperado: Ocho ítems del tipo «mantiene el compás durante toda la copla» y dos preguntas de confirmación.
- Comprueba también: ¿pide o incluye datos personales? (debe ser **no**) · ¿inventa normativa o referencias? · ¿respeta el formato pedido?

| Servicio | Abre y precarga | Respuesta útil | Sin datos personales | Notas |
|---|---|---|---|---|
| Gemini | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |
| ChatGPT | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |
| Claude | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |

### 13. Retroalimentación formativa · _Evaluar_

- Enlace: https://jmgo93.github.io/pensar-en-digital/ia/#evaluar-feedback
- Etapas: primaria, eso, eoi, conservatorio
- Valores de prueba: **curso** = B2 de inglés (EOI) · **tarea** = carta de reclamación · **criterios** = adecuación, cohesión, riqueza léxica, corrección · **pega la producción anónima** = (pega un texto breve sin datos personales)
- Resultado esperado: Un párrafo breve con un acierto, una mejora ejemplificada y «tu siguiente paso es…».
- Comprueba también: ¿pide o incluye datos personales? (debe ser **no**) · ¿inventa normativa o referencias? · ¿respeta el formato pedido?

| Servicio | Abre y precarga | Respuesta útil | Sin datos personales | Notas |
|---|---|---|---|---|
| Gemini | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |
| ChatGPT | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |
| Claude | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |

### 14. Tutor socrático que no da la respuesta · _Tutor socrático_

- Enlace: https://jmgo93.github.io/pensar-en-digital/ia/#tutor-socratico
- Etapas: primaria, eso, eoi, conservatorio
- Valores de prueba: **materia** = Física y Química · **curso** = 4.º de ESO · **tarea o pregunta** = por qué un barco de acero flota
- Resultado esperado: La IA responde con una pregunta («¿Qué sabes de la densidad?») y va guiando paso a paso sin resolver.
- Comprueba también: ¿pide o incluye datos personales? (debe ser **no**) · ¿inventa normativa o referencias? · ¿respeta el formato pedido?

| Servicio | Abre y precarga | Respuesta útil | Sin datos personales | Notas |
|---|---|---|---|---|
| Gemini | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |
| ChatGPT | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |
| Claude | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |

### 15. Compañero de conversación que no corrige por ti · _Tutor socrático_

- Enlace: https://jmgo93.github.io/pensar-en-digital/ia/#tutor-idiomas
- Etapas: eoi
- Valores de prueba: **idioma** = francés · **nivel MCER** = A2 · **tema** = planes para el fin de semana
- Resultado esperado: Una conversación en la lengua meta en la que la IA marca *errores* con su tipo y espera la autocorrección.
- Comprueba también: ¿pide o incluye datos personales? (debe ser **no**) · ¿inventa normativa o referencias? · ¿respeta el formato pedido?

| Servicio | Abre y precarga | Respuesta útil | Sin datos personales | Notas |
|---|---|---|---|---|
| Gemini | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |
| ChatGPT | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |
| Claude | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |

### 16. De copiable a generadora de conocimiento · _Tareas resistentes a la IA_

- Enlace: https://jmgo93.github.io/pensar-en-digital/ia/#resistentes-redisenar
- Etapas: primaria, eso, eoi, conservatorio
- Valores de prueba: **curso** = 1.º de ESO · **enunciado de la tarea** = Haz un trabajo sobre los volcanes
- Resultado esperado: Un diagnóstico breve, dos rediseños (p. ej., comparar el riesgo volcánico de dos lugares con datos reales y defender una decisión) y la respuesta a «qué piensa ahora».
- Comprueba también: ¿pide o incluye datos personales? (debe ser **no**) · ¿inventa normativa o referencias? · ¿respeta el formato pedido?

| Servicio | Abre y precarga | Respuesta útil | Sin datos personales | Notas |
|---|---|---|---|---|
| Gemini | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |
| ChatGPT | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |
| Claude | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |

### 17. Ponla a prueba: el alumno que quiere copiar · _Tareas resistentes a la IA_

- Enlace: https://jmgo93.github.io/pensar-en-digital/ia/#resistentes-test
- Etapas: eso, eoi
- Valores de prueba: **curso** = 1.º de Bachillerato · **enunciado de la tarea** = Comenta la importancia de la Ilustración en 300 palabras
- Resultado esperado: Una respuesta «de copia», un análisis de sus señales de alarma y tres cambios concretos en la tarea.
- Comprueba también: ¿pide o incluye datos personales? (debe ser **no**) · ¿inventa normativa o referencias? · ¿respeta el formato pedido?

| Servicio | Abre y precarga | Respuesta útil | Sin datos personales | Notas |
|---|---|---|---|---|
| Gemini | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |
| ChatGPT | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |
| Claude | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |

### 18. Caso de ciberconvivencia para debatir · _Convivencia y bienestar digital_

- Enlace: https://jmgo93.github.io/pensar-en-digital/ia/#convivencia-caso
- Etapas: primaria, eso
- Valores de prueba: **curso** = 6.º de Primaria · **situación** = la exclusión de un compañero de un grupo de mensajería de la clase
- Resultado esperado: Un caso breve con tres perspectivas, cinco preguntas abiertas y una dinámica para pactar una norma.
- Comprueba también: ¿pide o incluye datos personales? (debe ser **no**) · ¿inventa normativa o referencias? · ¿respeta el formato pedido?

| Servicio | Abre y precarga | Respuesta útil | Sin datos personales | Notas |
|---|---|---|---|---|
| Gemini | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |
| ChatGPT | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |
| Claude | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |

### 19. Dilema de bienestar digital · _Convivencia y bienestar digital_

- Enlace: https://jmgo93.github.io/pensar-en-digital/ia/#convivencia-bienestar
- Etapas: eso, eoi, conservatorio
- Valores de prueba: **grupo** = alumnado de conservatorio de 15-17 años · **tema** = grabarse y publicar en redes sus interpretaciones
- Resultado esperado: Un dilema breve, cuatro argumentos equilibrados y una pregunta de síntesis.
- Comprueba también: ¿pide o incluye datos personales? (debe ser **no**) · ¿inventa normativa o referencias? · ¿respeta el formato pedido?

| Servicio | Abre y precarga | Respuesta útil | Sin datos personales | Notas |
|---|---|---|---|---|
| Gemini | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |
| ChatGPT | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |
| Claude | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |

### 20. Detectar estereotipos en un material · _Igualdad_

- Enlace: https://jmgo93.github.io/pensar-en-digital/ia/#igualdad-materiales
- Etapas: primaria, eso, eoi, conservatorio
- Valores de prueba: **pega aquí el texto o describe las imágenes** = (pega un texto breve sin datos personales)
- Resultado esperado: Una lista de hallazgos con cita, explicación y alternativa, o la conclusión de que no hay sesgos claros.
- Comprueba también: ¿pide o incluye datos personales? (debe ser **no**) · ¿inventa normativa o referencias? · ¿respeta el formato pedido?

| Servicio | Abre y precarga | Respuesta útil | Sin datos personales | Notas |
|---|---|---|---|---|
| Gemini | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |
| ChatGPT | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |
| Claude | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |

### 21. ¿Está sesgada la IA? Un experimento para el aula · _Igualdad_

- Enlace: https://jmgo93.github.io/pensar-en-digital/ia/#igualdad-ia
- Etapas: eso, eoi
- Valores de prueba: **materia** = Filosofía · **curso** = 1.º de Bachillerato
- Resultado esperado: Cuatro pares de peticiones («describe a un ingeniero» / «describe a una ingeniera»), una ficha de registro y tres preguntas de reflexión.
- Comprueba también: ¿pide o incluye datos personales? (debe ser **no**) · ¿inventa normativa o referencias? · ¿respeta el formato pedido?

| Servicio | Abre y precarga | Respuesta útil | Sin datos personales | Notas |
|---|---|---|---|---|
| Gemini | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |
| ChatGPT | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |
| Claude | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |

### 22. Adaptaciones de acceso · _Atención a la diversidad_

- Enlace: https://jmgo93.github.io/pensar-en-digital/ia/#diversidad-acceso
- Etapas: primaria, eso, eoi, conservatorio
- Valores de prueba: **curso** = 2.º de Enseñanzas Elementales de piano · **necesidad descrita en general** = dificultades de atención sostenida · **actividad** = estudio de una pieza de 32 compases
- Resultado esperado: Dos listas (para todos / específicas) con apoyos concretos y una nota de coordinación con orientación.
- Comprueba también: ¿pide o incluye datos personales? (debe ser **no**) · ¿inventa normativa o referencias? · ¿respeta el formato pedido?

| Servicio | Abre y precarga | Respuesta útil | Sin datos personales | Notas |
|---|---|---|---|---|
| Gemini | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |
| ChatGPT | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |
| Claude | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |

### 23. Enriquecimiento para altas capacidades · _Atención a la diversidad_

- Enlace: https://jmgo93.github.io/pensar-en-digital/ia/#diversidad-altas
- Etapas: primaria, eso, eoi, conservatorio
- Valores de prueba: **curso** = 4.º de Primaria · **tema** = las fracciones
- Resultado esperado: Un problema abierto (p. ej., fracciones en el ritmo musical), su conexión interdisciplinar, el producto para compartir y cómo se evalúa.
- Comprueba también: ¿pide o incluye datos personales? (debe ser **no**) · ¿inventa normativa o referencias? · ¿respeta el formato pedido?

| Servicio | Abre y precarga | Respuesta útil | Sin datos personales | Notas |
|---|---|---|---|---|
| Gemini | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |
| ChatGPT | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |
| Claude | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |
