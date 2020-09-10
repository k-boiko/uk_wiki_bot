/*
 * Based on https://github.com/sasalatart/on-this-day/blob/master/packages/scraper/src/scrape.ts
 */
const cheerio = require('cheerio');
const request = require('request-promise');
const texts = require('./texts');
const {UNNECESSARY_CHAPTERS} = require('../config');

// for some reason cheerio throwed an error because of apostrophe
// so i have to replace it
const REGEX_REPLACEMENTS = [
  [/Народні_повір'я/gi, "Народні_повіря"],
  [/_пам'ятні_/gi, "_памятні_"],
  [/,_/gi, "_"]
];

const SEE_MORE_REGEX = /Дивись також/gi;

const CITATION_REGEX = /\[citation needed\]|\[\d+\]/gi;

function scrapDescription($) {
  return $('#mw-content-text > div > p')
    .filter((i, element) => {
      const text = $(element).text();
      return !!text && text.slice(-1) !== ':';
    })
    .map((i, element) => $(element).text())
    .get()
    .join('\n')
    .replace(CITATION_REGEX, '');
}

function scrapEpisodes($, episodeKind) {
  let episodes = [];
  let currentEl = $(`#${episodeKind}`).parent().next();

  do {
    const tagName = currentEl.prop('tagName').toUpperCase();

    // Reached next episodes kind
    if (!['UL', 'H3', 'P', 'DL', 'DIV'].includes(tagName)) break;
    // first unnecessary paragraph

    if (currentEl.text().match(SEE_MORE_REGEX)) continue;

    // h3 is sub-calendar, div is thumbnail image
    if (['H3', 'DIV'].includes(tagName)) continue;

    if (['UL', 'DL'].includes(tagName)) {
      episodes = episodes.concat(
        currentEl
          // Hack because of different structure in ukrainian wiki
          .children(tagName === 'DL' ? 'dd' : 'li')
          .map((_, element) => itemToEpisode($(element)))
          .get()
          .filter((episode) => episode && episode.description) // doesn't work with this
          // .get(),
      );
    }
    if (tagName === 'P') {
      //it's a tricky story
      // a paragraph can contain a single event or multiple
      // so we need to know if we can split by \n
      // and if there are multiple events, wrap them in proper objects and join in array
      const {description} = itemToHoliday(currentEl);
      const descriptions = description
        .split(/\n/)
        .filter(s => s.length)
        .map(d => ({description: d.trim()}));

      episodes = episodes.concat(descriptions);
    }
  } while ((currentEl = currentEl.next()));

  return episodes;
}

const itemToEpisode = (elementNode) => {
  // specific chars at ukrainian wikipedia ¯\_(ツ)_/¯
  const [year, ...data] = elementNode.text().split(`${String.fromCharCode(160)}${String.fromCharCode(8212)}${String.fromCharCode(32)}`);
  if (data.length) {
    const dataString = data.join(' – ');

    if (Number.isNaN(+year) || !dataString) {
      return {};
    }

    const yearSymbol = year.includes('BC') || year.includes('B.C') ? -1 : 1;

    return {
      year: +year.replace(/\D/g, '') * yearSymbol,
      description: prepareItemText(dataString),
    };
  }
  return itemToHoliday(elementNode);
};

const prepareItemText = text => text.trim().replace(CITATION_REGEX, '').replace(/\*/g, '');

const itemToHoliday = (element) => ({
  description: prepareItemText(element.text()),
});


const transcription = {
  ґ: 'g',
  й: 'y',
  ц: 'ts',
  у: 'u',
  к: 'k',
  е: 'e',
  н: 'n',
  г: 'h',
  ш: 'sh',
  щ: 'shch',
  з: 'z',
  х: 'h',
  ї: 'yi',
  ф: 'f',
  і: 'i',
  в: 'v',
  а: 'a',
  п: 'p',
  р: 'r',
  о: 'o',
  л: 'l',
  д: 'd',
  ж: 'zh',
  є: 'ye',
  я: 'ya',
  ч: 'ch',
  с: 's',
  м: 'm',
  и: 'y',
  т: 't',
  ь: '',
  б: 'b',
  ю: 'yu'
};

const transcript = word => word.toLowerCase().split('').map(l => transcription[l] || '').join('');

/*
 returns object like
 {
  description: parsed first paragraph of article
  narodylys: {
    title: 'Народились',
    episodes: [
      { year: string, description: string }
    ]
  },
  ...
 }
 */
function scrape(htmlBody) {
  htmlBody = REGEX_REPLACEMENTS.reduce((html, [regex, replacement]) => html.replace(regex, replacement), htmlBody);
  const $ = cheerio.load(htmlBody);

  const sections = $('h2 .mw-headline')
    .map((_, element) => ({
      id: $(element).prop('id'),
      title: $(element).text(),
      keyName: transcript($(element).prop('id'))
    }))
    .get()
    .filter(({title}) => !UNNECESSARY_CHAPTERS.includes(title));

  return sections.reduce((acc, {id, title, keyName}) => ({
    ...acc,
    [keyName]: {
      title,
      episodes: scrapEpisodes($, id)
    }
  }), {
    description: scrapDescription($).split('\n').shift()
  });
}

module.exports = scrape;

function getWikiDay(monthIndex, dayOfMonth) {
  return request(`https://uk.wikipedia.org/wiki/${dayOfMonth}_${encodeURIComponent(texts.MONTHS[monthIndex])}`)
    .catch(err => console.error(`ERROR: ${err.statusCode || 0} GET article for ${monthIndex}.${dayOfMonth} unsuccessful`))
    .then((body) => scrape(body))
    .catch(err => console.error(`ERROR: ${err.message} SCRAPE article for ${monthIndex}.${dayOfMonth} unsuccessful`));
}

module.exports.getWikiDay = getWikiDay;
