// @ts-check
/**
 * Tokenización y palabras vacías para el modo pictográfico.
 * Compartido entre el navegador (js/picto.js) y el precálculo (tools/build-picto-map.mjs).
 */

/** @type {Record<'es' | 'en', Set<string>>} */
export const STOPWORDS = {
  es: new Set(
    'a al algo algunos ante antes aquí así aun aunque bien cada como con contra cual cuando de del desde donde dos e el ella ellas ello ellos en entre era es esa ese eso esta este esto estos fue ha han hasta hay la las le les lo los más me mi mis muy nada ni no nos o os otra otro para pero poco por porque que qué se sea ser si sí sin sino sobre son su sus también tan te tiene tienen todo todos tu tus un una uno unos y ya yo'.split(' '),
  ),
  en: new Set(
    'a about after all also an and any are as at be because been but by can could do does for from had has have he her his how i if in into is it its just me more most my no not of on one or other our out she so some than that the their them then there these they this those to too up us very was we were what when which who will with you your'.split(' '),
  ),
};

/**
 * Palabras en minúsculas (con tildes) de un texto.
 * @param {string} text
 * @param {'es' | 'en'} lang
 * @returns {string[]}
 */
export const words = (text, lang) =>
  (text.toLocaleLowerCase(lang).match(/[\p{L}]+/gu) ?? []).filter((w) => w.length > 1 || w === 'y');
