// @ts-check
/**
 * Genera docs/pruebas-prompts.md (hoja de pruebas de los prompts y de "Abrir en IA") desde content/prompts.json.
 * Ejecutar a mano: `npm run prompt-tests`.
 */
import { readFileSync, writeFileSync } from 'node:fs';

const bank = JSON.parse(readFileSync(new URL('../content/prompts.json', import.meta.url), 'utf8'));
const site = JSON.parse(readFileSync(new URL('../content/site.json', import.meta.url), 'utf8'));
/** @type {Record<string, string>} */
const cats = Object.fromEntries(bank.categories.map((/** @type {any} */ c) => [c.id, c.label.es]));

const rows = bank.cards
  .map(
    (/** @type {any} */ c, /** @type {number} */ i) => `
### ${i + 1}. ${c.title.es} · _${cats[c.category]}_

- Enlace: ${site.url}ia/#${c.id}
- Etapas: ${c.stages.join(', ')}
- Valores de prueba: ${c.vars.map((/** @type {any} */ v) => `**${v.es}** = ${v.sample.es || '(pega un texto breve sin datos personales)'}`).join(' · ')}
- Resultado esperado: ${c.example.es}
- Comprueba también: ¿pide o incluye datos personales? (debe ser **no**) · ¿inventa normativa o referencias? · ¿respeta el formato pedido?

| Servicio | Abre y precarga | Respuesta útil | Sin datos personales | Notas |
|---|---|---|---|---|
| Gemini | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |
| ChatGPT | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |
| Claude | ☐ OK ☐ KO | ☐ OK ☐ KO | ☐ OK ☐ KO | |
`,
  )
  .join('');

const md = `# Hoja de pruebas · Banco de prompts e «Abrir en IA»

GENERADO por \`tools/build-prompt-tests.mjs\` a partir de \`content/prompts.json\`. Para editar los prompts, cambia el JSON y vuelve a generarlo.

## Cómo probar

1. Abre ${site.url}ia/ en el móvil y en el ordenador. Usa la cuenta corporativa del centro si la tienes.
2. En cada tarjeta, despliega **Rellenar los huecos** y escribe los valores de prueba.
3. Pulsa **Copiar** y comprueba que aparece «Prompt copiado».
4. Pulsa **Gemini**, **ChatGPT** y **Claude**. Marca en la tabla si se abre el servicio y si el prompt aparece ya escrito.
5. Envía el prompt y valora la respuesta según el resultado esperado.
6. Marca **KO** en cualquier respuesta que pida o incluya datos personales, o que se invente normas o referencias.

## Estado de «Abrir en IA» (comprobado el ${bank.checked})

| Servicio | URL | Comportamiento comprobado | Alternativa |
|---|---|---|---|
| ChatGPT | \`chatgpt.com/?q=\` | Precarga el prompt; sin sesión, además lo envía. | El prompt se copia siempre: si no aparece, pegarlo. |
| Claude | \`claude.ai/new?q=\` | Pide iniciar sesión y conserva el parámetro tras hacerlo. **No verificado con sesión iniciada**: compruébalo tú. | Prompt copiado: pegarlo. |
| Gemini | \`gemini.google.com/app\` | No admite prompt precargado (\`?q=\` se ignora). | Se copia, se abre Gemini y aparece el aviso «Prompt copiado: pégalo en Gemini». |

## Prompts (${bank.cards.length})
${rows}`;

writeFileSync(new URL('../docs/pruebas-prompts.md', import.meta.url), md);
console.log(`docs/pruebas-prompts.md: ${bank.cards.length} prompts.`);
