# Pruebas en dispositivos reales

Lo que ya está comprobado de forma automática (Edge/Chromium de escritorio con emulación) queda marcado como ✅. El resto debe probarse en un **Android con Chrome** y un **iPhone o iPad con Safari**, sobre la web publicada: <https://jmgo93.github.io/pensar-en-digital/>.

| Prueba | Automático | Android (Chrome) | iOS (Safari) |
|---|---|---|---|
| **Instalación** | ✅ DevTools: 0 errores de instalabilidad | ☐ Inicio → «Instalar» abre el diálogo del sistema | ☐ Inicio → «Instalar» muestra los pasos Compartir → Añadir a pantalla de inicio |
| Icono y nombre en la pantalla de inicio | ✅ maskable y monochrome | ☐ Icono naranja con bombilla, «Pensar Digital» | ☐ apple-touch-icon correcto |
| Accesos directos (mantener pulsado el icono) | ✅ en el manifest | ☐ IA · Plantilla · Bibliografía | — (iOS no los admite) |
| **Modo sin conexión** | ✅ 9 rutas en modo avión emulado | ☐ Abrir una vez con conexión, activar modo avión, navegar por todas las secciones | ☐ Igual |
| Aviso «Nueva versión disponible» | ✅ simulado | ☐ Tras una publicación, al volver a abrir la app | ☐ Igual |
| **Lectura en voz alta** | ✅ voz es-ES de Windows | ☐ Panel ♿ → «Leer en voz alta» → ▶ en un bloque: suena en español y se resalta el párrafo | ☐ Igual (voces de Apple; si no suena, revisar el modo silencio) |
| Pausa y reanudación | — | ☐ | ☐ |
| Lectura en inglés | — | ☐ Idioma English → voz inglesa | ☐ |
| **Pictogramas** | ✅ tiras y atribución | ☐ Panel ♿ → «Modo pictográfico»: tiras bajo los bloques | ☐ |
| Pictogramas sin conexión (tras verlos una vez) | — | ☐ | ☐ |
| **Safe areas** (notch, isla, barra de gestos) | — | ☐ Barra superior e inferior sin taparse en la app instalada | ☐ Igual, en vertical y horizontal |
| **Letra al 200 %** | ✅ sin scroll horizontal de 320 a 1440 px | ☐ Todo legible, sin cortes | ☐ Igual |
| Letra al 200 % + interlineado amplio | ✅ | ☐ | ☐ |
| Tema oscuro y alto contraste | ✅ axe en 4 esquemas | ☐ | ☐ |
| Lector de pantalla | — | ☐ TalkBack: recorrer Inicio y la plantilla | ☐ VoiceOver: recorrer Inicio y la plantilla |
| Plantilla: completar y «Imprimir o guardar PDF» | ✅ escritorio | ☐ | ☐ |
| Plantilla: «Copiar como texto» | ✅ escritorio | ☐ | ☐ |
| Banco de prompts: Copiar / Compartir | ✅ copiar en escritorio | ☐ Compartir abre el menú del sistema | ☐ |
| «Abrir en IA» | Ver `docs/pruebas-prompts.md` | ☐ | ☐ |
| QR de la presentación | — | ☐ Escanear desde la última fila de una sala grande | ☐ |
| Presentación con mando | ✅ teclas | ☐ Probar el mando real del auditorio (Av/Re Pág o flechas) | — |

## Antes del día

- [ ] Abrir la presentación en el equipo de la sala, pulsar **F** (pantalla completa) y comprobar la legibilidad desde el fondo.
- [ ] Abrir `?notas` en el portátil (si hay dos pantallas) o confiar en `docs/escaleta.pdf` impresa.
- [ ] Si hay votación: probar el formulario con un móvil y comprobar que las barras se mueven (ver `docs/votaciones.md`). Ejecutar `vaciarRespuestas` después.
- [ ] Sin wifi: la presentación funciona sin conexión si se ha abierto antes en ese navegador. Las votaciones pasan a «mano alzada».
