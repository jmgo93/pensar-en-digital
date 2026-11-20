/**
 * Pensar en Digital · Votaciones en directo (Google Apps Script).
 *
 * Qué hace:
 *  1. crearFormularios(): crea un Google Form por cada votación de content/votaciones.json (lo lee de la web
 *     publicada), sin registro, sin recoger correos, una sola pregunta obligatoria (3 toques: QR → opción → Enviar).
 *  2. doGet(): publicado como aplicación web, devuelve el recuento en JSON para que la presentación dibuje
 *     las barras en tiempo real.  ?v=v1  → recuento de esa votación.  Sin parámetros → lista de formularios.
 *  3. vaciarRespuestas(): borra todas las respuestas (entre la sesión del 25 y la del 26).
 *
 * Instrucciones paso a paso: docs/votaciones.md
 */

const SITE = 'https://jmgo93.github.io/pensar-en-digital/';
const CACHE_SECONDS = 3;

/** Crea los formularios que falten. Se puede ejecutar varias veces: no duplica. */
function crearFormularios() {
  const votes = JSON.parse(UrlFetchApp.fetch(SITE + 'content/votaciones.json').getContentText());
  const props = PropertiesService.getScriptProperties();
  const lines = [];

  votes.forEach(function (v) {
    let form;
    const existingId = props.getProperty(v.id);
    if (existingId) {
      form = FormApp.openById(existingId);
    } else {
      form = FormApp.create('Pensar en Digital · ' + v.block.es);
      form.setTitle(v.block.es);
      form.setDescription('Votación anónima. No se recoge ningún dato personal.');
      tryCall(function () { form.setCollectEmail(false); });
      tryCall(function () { form.setRequireLogin(false); }); // solo existe en cuentas de Google Workspace
      form.setLimitOneResponsePerUser(false); // true obligaría a iniciar sesión
      form.setAllowResponseEdits(false);
      form.setShowLinkToRespondAgain(false);
      form.setPublishingSummary(false);
      form.setProgressBar(false);
      form.setConfirmationMessage('¡Gracias! Mira la pantalla.');
      form
        .addMultipleChoiceItem()
        .setTitle(v.question.es)
        .setChoiceValues(v.options.map(function (o) { return o.es; }))
        .setRequired(true);
      tryCall(function () { form.setPublished(true); }); // modelo de publicación nuevo de Forms
      props.setProperty(v.id, form.getId());
    }
    const url = form.getPublishedUrl();
    let shortUrl = url;
    tryCall(function () { shortUrl = form.shortenFormUrl(url); });
    lines.push(v.id + '  ' + shortUrl + '  (editar: ' + form.getEditUrl() + ')');
  });

  Logger.log('Formularios:\n' + lines.join('\n'));
}

/** Borra las respuestas de todas las votaciones (para empezar limpia la siguiente sesión). */
function vaciarRespuestas() {
  const props = PropertiesService.getScriptProperties().getProperties();
  Object.keys(props).forEach(function (id) {
    FormApp.openById(props[id]).deleteAllResponses();
  });
  CacheService.getScriptCache().removeAll(Object.keys(props).map(function (id) { return 'r:' + id; }));
  Logger.log('Respuestas borradas: ' + Object.keys(props).join(', '));
}

/** Aplicación web: recuento en JSON (o JSONP con ?callback=). Solo lectura. */
function doGet(e) {
  const params = (e && e.parameter) || {};
  const props = PropertiesService.getScriptProperties();
  let payload;

  if (!params.v) {
    const all = props.getProperties();
    payload = {
      votes: Object.keys(all).sort().map(function (id) {
        return { id: id, url: FormApp.openById(all[id]).getPublishedUrl() };
      }),
    };
  } else {
    const formId = props.getProperty(params.v);
    if (!formId) {
      payload = { error: 'Votación desconocida: ' + params.v };
    } else {
      const cache = CacheService.getScriptCache();
      const cached = cache.get('r:' + params.v);
      if (cached) {
        payload = JSON.parse(cached);
      } else {
        payload = count(params.v, FormApp.openById(formId));
        cache.put('r:' + params.v, JSON.stringify(payload), CACHE_SECONDS);
      }
    }
  }
  return output(payload, params.callback);
}

function count(id, form) {
  const item = form.getItems(FormApp.ItemType.MULTIPLE_CHOICE)[0].asMultipleChoiceItem();
  const options = item.getChoices().map(function (c) { return c.getValue(); });
  const counts = options.map(function () { return 0; });
  form.getResponses().forEach(function (r) {
    const ir = r.getResponseForItem(item);
    if (!ir) return;
    const i = options.indexOf(ir.getResponse());
    if (i >= 0) counts[i]++;
  });
  return {
    v: id,
    options: options,
    counts: counts,
    total: counts.reduce(function (a, b) { return a + b; }, 0),
    accepting: form.isAcceptingResponses(),
    updated: new Date().toISOString(),
  };
}

function output(payload, callback) {
  const json = JSON.stringify(payload);
  if (callback && /^[A-Za-z_$][\w$.]{0,63}$/.test(callback)) {
    return ContentService.createTextOutput(callback + '(' + json + ');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function tryCall(fn) {
  try {
    fn();
  } catch (err) {
    Logger.log('Aviso: ' + err);
  }
}
