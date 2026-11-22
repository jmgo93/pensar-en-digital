// @ts-check
/**
 * Fija la contraseña del ponente. Guarda en content/site.json SOLO su huella PBKDF2-SHA256 (sal aleatoria,
 * 210 000 iteraciones), que la web usa para separar el perfil de ponente del público (también sin conexión).
 * La contraseña no se guarda en ningún archivo del repositorio.
 *
 * Uso (en una terminal): `npm run ponente`. Después, pon la MISMA contraseña en Apps Script:
 * Configuración del proyecto → Propiedades del script → PONENTE_CLAVE (ver docs/votaciones.md).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { pbkdf2Sync, randomBytes } from 'node:crypto';

const ITERATIONS = 210000;
const file = new URL('../content/site.json', import.meta.url);

/**
 * Lee una línea sin mostrar lo que se escribe.
 * @param {string} prompt
 * @returns {Promise<string>}
 */
const askHidden = (prompt) =>
  new Promise((resolve, reject) => {
    const { stdin, stdout } = process;
    if (!stdin.isTTY) {
      reject(new Error('Ejecuta este comando en una terminal interactiva.'));
      return;
    }
    stdout.write(prompt);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    let value = '';
    /** @param {string} ch */
    const onData = (ch) => {
      for (const c of ch) {
        if (c === '\r' || c === '\n') {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off('data', onData);
          stdout.write('\n');
          resolve(value);
          return;
        }
        if (c === '\u0003') {
          stdout.write('\n');
          process.exit(130);
        }
        if (c === '\u007f' || c === '\b') {
          if (value.length) {
            value = value.slice(0, -1);
            stdout.write('\b \b');
          }
        } else {
          value += c;
          stdout.write('•');
        }
      }
    };
    stdin.on('data', onData);
  });

const pw = (await askHidden('Contraseña del ponente (mínimo 10 caracteres): ')).normalize('NFC');
if (pw.length < 10) {
  console.error('Demasiado corta: usa al menos 10 caracteres (mejor una frase).');
  process.exit(1);
}
const again = (await askHidden('Repítela: ')).normalize('NFC');
if (pw !== again) {
  console.error('No coinciden. No se ha cambiado nada.');
  process.exit(1);
}

const salt = randomBytes(16);
const hash = pbkdf2Sync(pw, salt, ITERATIONS, 32, 'sha256').toString('hex');
const site = JSON.parse(readFileSync(file, 'utf8'));
site.speaker = { salt: salt.toString('hex'), iterations: ITERATIONS, hash };
writeFileSync(file, `${JSON.stringify(site, null, 2)}\n`);

console.log(`
Huella guardada en content/site.json.

Ahora pon la MISMA contraseña en Apps Script:
  script.google.com → tu proyecto → ⚙ Configuración del proyecto → Propiedades del script
  → Añadir propiedad: PONENTE_CLAVE = (tu contraseña) → Guardar.

Después: npm run build:all, commit y push para publicar.`);
