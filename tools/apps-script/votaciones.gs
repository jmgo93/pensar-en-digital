/**
 * Pensar en Digital · Votaciones en directo (Google Apps Script).
 *
 * Qué hace:
 *  1. crearFormularios(): crea un Google Form por cada votación de content/votaciones.json (lo lee de la web
 *     publicada), sin registro, sin recoger correos, una sola pregunta obligatoria (3 toques: QR → opción → Enviar).
 *  2. doGet(): publicado como aplicación web, devuelve el recuento en JSON para que la presentación dibuje
 *     las barras en tiempo real.  ?v=v1  → recuento de esa votación.  Sin parámetros → lista de formularios.
 *  3. vaciarRespuestas(): borra todas las respuestas (entre la sesión del 25 y la del 26).
 *  4. doPost(): acciones del ponente desde la web, protegidas con la propiedad privada PONENTE_CLAVE.
 *     { action: 'archive', key, label } → copia los resultados a una hoja de cálculo y pone todo a cero.
 *  5. prepararArchivo(): crea la hoja de cálculo de resultados (y autoriza el permiso de Hojas de cálculo).
 *
 * Instrucciones paso a paso: docs/votaciones.md
 */

const SITE = 'https://jmgo93.github.io/pensar-en-digital/';
const CACHE_SECONDS = 3;
const VOTE_ID = /^v\d+$/;

/** Ids de las votaciones guardadas en las propiedades (hay otras: PONENTE_CLAVE, RESULTADOS_ID). */
function voteIds() {
  return Object.keys(PropertiesService.getScriptProperties().getProperties())
    .filter(function (k) { return VOTE_ID.test(k); })
    .sort();
}

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

/**
 * Pone al día los formularios ya creados con el texto actual de content/votaciones.json
 * (título, pregunta y opciones). Los enlaces y los QR no cambian. Si cambia la pregunta o las
 * opciones de una votación, sus respuestas se borran para que el recuento no mezcle versiones.
 */
function actualizarFormularios() {
  const votes = JSON.parse(UrlFetchApp.fetch(SITE + 'content/votaciones.json?t=' + Date.now()).getContentText());
  const props = PropertiesService.getScriptProperties();
  const lines = [];
  votes.forEach(function (v) {
    const formId = props.getProperty(v.id);
    if (!formId) {
      lines.push(v.id + ': no existe todavía; ejecuta crearFormularios');
      return;
    }
    const form = FormApp.openById(formId);
    form.setTitle(v.block.es);
    const item = form.getItems(FormApp.ItemType.MULTIPLE_CHOICE)[0].asMultipleChoiceItem();
    const choices = v.options.map(function (o) { return o.es; });
    const current = item.getChoices().map(function (c) { return c.getValue(); });
    const changed = item.getTitle() !== v.question.es || JSON.stringify(current) !== JSON.stringify(choices);
    if (changed) {
      item.setTitle(v.question.es).setChoiceValues(choices);
      form.deleteAllResponses();
      CacheService.getScriptCache().remove('r:' + v.id);
    }
    lines.push(v.id + (changed ? ': pregunta actualizada (respuestas borradas)' : ': sin cambios'));
  });
  Logger.log('Formularios:\n' + lines.join('\n'));
}

/** Borra las respuestas de todas las votaciones (para empezar limpia la siguiente sesión). */
function vaciarRespuestas() {
  const props = PropertiesService.getScriptProperties();
  const ids = voteIds();
  ids.forEach(function (id) {
    FormApp.openById(props.getProperty(id)).deleteAllResponses();
  });
  CacheService.getScriptCache().removeAll(ids.map(function (id) { return 'r:' + id; }));
  Logger.log('Respuestas borradas: ' + ids.join(', '));
}

/** Aplicación web: recuento en JSON (o JSONP con ?callback=). Solo lectura. */
function doGet(e) {
  const params = (e && e.parameter) || {};
  const props = PropertiesService.getScriptProperties();
  let payload;

  if (!params.v) {
    payload = {
      votes: voteIds().map(function (id) {
        return { id: id, url: FormApp.openById(props.getProperty(id)).getPublishedUrl() };
      }),
    };
  } else {
    const formId = VOTE_ID.test(params.v) ? props.getProperty(params.v) : null;
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

/** Acciones del ponente. Cuerpo JSON en texto plano (sin preflight CORS). */
function doPost(e) {
  let body = {};
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
  } catch (err) {
    body = {};
  }
  return output(speakerAction(body));
}

function speakerAction(body) {
  const props = PropertiesService.getScriptProperties();
  const cache = CacheService.getScriptCache();
  const fails = Number(cache.get('fails') || 0);
  if (fails >= 5) return { ok: false, error: 'locked' };
  const secret = props.getProperty('PONENTE_CLAVE');
  if (!secret) return { ok: false, error: 'no-key' };
  if (typeof body.key !== 'string' || body.key !== secret) {
    cache.put('fails', String(fails + 1), 600);
    return { ok: false, error: 'bad-key' };
  }
  cache.remove('fails');
  if (body.action === 'check') return { ok: true };
  if (body.action === 'archive') return archive(String(body.label || '').slice(0, 60));
  return { ok: false, error: 'unknown-action' };
}

/** Hoja de cálculo de resultados (se crea la primera vez en tu Drive). */
function resultsSpreadsheet() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty('RESULTADOS_ID');
  if (id) {
    try {
      return SpreadsheetApp.openById(id);
    } catch (err) {
      Logger.log('La hoja anterior no está disponible; se crea otra.');
    }
  }
  const ss = SpreadsheetApp.create('Pensar en Digital · Resultados de las votaciones');
  props.setProperty('RESULTADOS_ID', ss.getId());
  return ss;
}

/** Ejecútalo una vez desde el editor: crea la hoja y concede el permiso de Hojas de cálculo. */
function prepararArchivo() {
  Logger.log('Hoja de resultados: ' + resultsSpreadsheet().getUrl());
}

/** Copia recuentos y respuestas individuales a una pestaña nueva y pone todas las votaciones a cero. */
function archive(label) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const props = PropertiesService.getScriptProperties();
    const tz = Session.getScriptTimeZone();
    const ss = resultsSpreadsheet();
    const stamp = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd HH:mm');
    const name = (stamp + (label ? ' · ' + label : '')).replace(/[\[\]*?\/\\:]/g, '-').slice(0, 95);
    const sheet = ss.insertSheet(ss.getSheetByName(name) ? name + ' (' + Date.now() + ')' : name);
    const rows = [['Sesión', label, 'Archivado', stamp, '', ''], [], ['Votación', 'Pregunta', 'Opción', 'Votos', '%', 'Total']];
    const detail = [['Votación', 'Fecha y hora', 'Opción', '', '', '']];
    const summary = [];
    voteIds().forEach(function (id) {
      const form = FormApp.openById(props.getProperty(id));
      const item = form.getItems(FormApp.ItemType.MULTIPLE_CHOICE)[0];
      const question = item.getTitle();
      const r = count(id, form);
      r.options.forEach(function (o, i) {
        rows.push([id, question, o, r.counts[i], r.total ? Math.round((r.counts[i] / r.total) * 100) : 0, r.total]);
      });
      form.getResponses().forEach(function (resp) {
        const ir = resp.getResponseForItem(item);
        detail.push([id, Utilities.formatDate(resp.getTimestamp(), tz, 'yyyy-MM-dd HH:mm:ss'), ir ? String(ir.getResponse()) : '', '', '', '']);
      });
      summary.push({ v: id, question: question, options: r.options, counts: r.counts, total: r.total });
    });
    const all = rows.concat([[], ['Respuestas individuales']], detail).map(function (row) {
      const x = row.slice(0, 6);
      while (x.length < 6) x.push('');
      return x;
    });
    sheet.getRange(1, 1, all.length, 6).setValues(all);
    sheet.getRange(3, 1, 1, 6).setFontWeight('bold');
    sheet.autoResizeColumns(1, 6);
    // Solo después de guardar: poner a cero.
    voteIds().forEach(function (id) {
      FormApp.openById(props.getProperty(id)).deleteAllResponses();
    });
    CacheService.getScriptCache().removeAll(voteIds().map(function (id) { return 'r:' + id; }));
    return { ok: true, url: ss.getUrl() + '#gid=' + sheet.getSheetId(), sheet: sheet.getName(), summary: summary };
  } finally {
    lock.releaseLock();
  }
}

function count(id, form) {
  // getResponseForItem() necesita el Item genérico, no el MultipleChoiceItem.
  const item = form.getItems(FormApp.ItemType.MULTIPLE_CHOICE)[0];
  const options = item.asMultipleChoiceItem().getChoices().map(function (c) { return c.getValue(); });
  const counts = options.map(function () { return 0; });
  form.getResponses().forEach(function (r) {
    const ir = r.getResponseForItem(item);
    if (!ir) return;
    const i = options.indexOf(String(ir.getResponse()));
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
