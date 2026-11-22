// @ts-check
/**
 * Tokenización, palabras que se omiten y lemas para el modo pictográfico.
 * Compartido entre el navegador (js/picto.js) y el precálculo (tools/build-picto-map.mjs).
 *
 * - SKIP: artículos, preposiciones y partículas sin significado propio. No se dibujan en la tira
 *   (la frase completa sigue escrita encima). Las palabras que cambian el sentido («no», «sin», «con»,
 *   «más», «todos», «nunca»…) NO se omiten: llevan su pictograma.
 * - LEMMA: forma de búsqueda en ARASAAC para las formas conjugadas o derivadas (ARASAAC indexa
 *   sobre todo infinitivos y singulares). La palabra original se sigue mostrando bajo el pictograma.
 */

/** @type {Record<'es' | 'en', Set<string>>} */
export const SKIP = {
  es: new Set(
    'a al de del el la las lo los un una unos unas que se le les me te os nos su sus mi mis tu tus e o u y ni en por es son era fue ha han hay ser sea esa ese eso esta este esto estas estos esas esos'.split(' '),
  ),
  en: new Set('a an the of to in on at by as and or is are was were be been am it its that this these those which who do does did so than there their about for'.split(' ')),
};

/** Compatibilidad: nombre anterior. */
export const STOPWORDS = SKIP;

/** @type {Record<'es' | 'en', Record<string, string>>} */
export const LEMMA = {
  es: {
    piensa: 'pensar',
    piensas: 'pensar',
    piensen: 'pensar',
    deben: 'deber',
    crean: 'crear',
    miran: 'mirar',
    mira: 'mirar',
    copian: 'copiar',
    sabes: 'saber',
    sabe: 'saber',
    comparte: 'compartir',
    mejora: 'mejorar',
    mejoras: 'mejorar',
    tratamos: 'tratar',
    puede: 'poder',
    pueda: 'poder',
    pueden: 'poder',
    revisamos: 'revisar',
    trabajamos: 'trabajar',
    aprendan: 'aprender',
    aprende: 'aprender',
    hablamos: 'hablar',
    habla: 'hablar',
    hablas: 'hablar',
    cambia: 'cambiar',
    dicen: 'decir',
    dice: 'decir',
    contesta: 'contestar',
    respondes: 'responder',
    graba: 'grabar',
    escucha: 'escuchar',
    necesita: 'necesitar',
    enseñan: 'enseñar',
    enseña: 'enseñar',
    usa: 'usar',
    usas: 'usar',
    elige: 'elegir',
    hace: 'hacer',
    haz: 'hacer',
    ayuda: 'ayudar',
    quita: 'quitar',
    alumnos: 'alumno',
    profesores: 'profesor',
    poca: 'poco',
    puedes: 'poder',
    da: 'dar',
    hacen: 'hacer',
    seguros: 'proteger',
    próximo: 'siguiente',
    respuestas: 'responder',
    demás: 'otros',
    material: 'material escolar',
    cosas: 'objeto',
    tabletas: 'tablet',
    pongas: 'escribir',
    parte: 'trozo',
    incorrectas: 'incorrecto',
    aprenden: 'aprender',
  },
  en: {
    talked: 'talk',
    not: 'no',
    can: 'be able to',
    safe: 'security',
    cannot: 'no',
    using: 'use',
    harm: 'damage',
    resource: 'material',
    record: 'video',
    own: 'alone',
    stay: 'be',
    task: 'homework',
    treat: 'respect',
    check: 'revise',
    part: 'piece',
    gives: 'give',
    most: 'more',
    also: 'too',
    easier: 'easy',
    improved: 'improve',
    creating: 'create',
    teaches: 'teach',
    tells: 'tell',
    asks: 'ask',
    helps: 'help',
    learns: 'learn',
    uses: 'use',
    removes: 'remove',
    students: 'student',
    teachers: 'teacher',
    tablets: 'tablet',
    videos: 'video',
    knows: 'know',
    needs: 'need',
    answers: 'answer',
    questions: 'question',
  },
};

/**
 * Palabras en minúsculas (con tildes) de un texto.
 * @param {string} text
 * @param {'es' | 'en'} lang
 * @returns {string[]}
 */
export const words = (text, lang) =>
  (text.toLocaleLowerCase(lang).match(/[\p{L}]+/gu) ?? []).filter((w) => w.length > 1 || w === 'y' || w === 'o' || w === 'i');
