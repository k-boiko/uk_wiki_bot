/*
 * From https://github.com/sasalatart/on-this-day/blob/master/packages/scraper/src/scrape.ts
 */
const cheerio = require('cheerio');

// for some reason cheerio throwed an error because of apostrophe
// so i have to replace it
const HOLIDAYS_REGEX = /Свята_і_пам'ятні_дні/gi;
const HOLIDAYS_REPLACEMENT = "Свята_і_памятні_дні";

const EpisodeKindsTagIDs = {
  EVENTS: 'Події',
  BIRTHS: 'Народились',
  DEATHS: 'Померли',
  HOLIDAYS: HOLIDAYS_REPLACEMENT,
  NAME_DAYS: 'Іменини'
};


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

function scrapEpisodes($, episodeKind, lambda) {
  let episodes = [];
  let currentEl = $(`#${episodeKind}`).parent().next();

  do {
    const tagName = currentEl.prop('tagName').toUpperCase();

    // Reached next episodes kind
    if (!['UL', 'H3', 'P', 'DL'].includes(tagName)) break;

    // Sub-calendar
    if (tagName === 'H3') continue;

    // if(episodeKind === EpisodeKindsTagIDs.NAME_DAYS) {
    //   console.log(currentEl
    //   // Hack because name days have different structure than other events in ukrainian wiki
    //     .children(episodeKind === EpisodeKindsTagIDs.NAME_DAYS ? 'dd' : 'li')
    //     .map((_, element) => lambda($(element))).get());
    // }
    // console.log(currentEl.children(episodeKind === EpisodeKindsTagIDs.NAME_DAYS ? 'dd' : 'li')
    //   .map((_, element) => lambda($(element))))
    episodes = episodes.concat(
      currentEl
      // Hack because name days have different structure than other events in ukrainian wiki
        .children(episodeKind === EpisodeKindsTagIDs.NAME_DAYS ? 'dd' : 'li')
        .map((_, element) => lambda($(element)))
        // .filter((episode) => !!episode)
        .get(),
    );
  } while ((currentEl = currentEl.next()));

  return episodes;
}

const itemToEpisode = (elementNode) => {
  // specific chars at ukrainian wikipedia ¯\_(ツ)_/¯
  const [year, ...data] = elementNode.text().split(`${String.fromCharCode(160)}${String.fromCharCode(8212)}${String.fromCharCode(32)}`);
  const dataString = data.join(' – ');

  if (Number.isNaN(+year) || !dataString) {
    return undefined;
  }

  const yearSymbol = year.includes('BC') || year.includes('B.C') ? -1 : 1;

  return {
    year: +year.replace(/\D/g, '') * yearSymbol,
    description: dataString.replace(CITATION_REGEX, ''),
  };
};

const itemToHoliday = (element) => ({
  description: element.text().trim().replace(CITATION_REGEX, ''),
});

function scrape(htmlBody) {
  const $ = cheerio.load(htmlBody.replace(HOLIDAYS_REGEX, HOLIDAYS_REPLACEMENT));

  return {
    description: scrapDescription($).split('\n').shift(),
    events: scrapEpisodes($, EpisodeKindsTagIDs.EVENTS, itemToEpisode),
    births: scrapEpisodes($, EpisodeKindsTagIDs.BIRTHS, itemToEpisode),
    deaths: scrapEpisodes($, EpisodeKindsTagIDs.DEATHS, itemToEpisode),
    name_days: scrapEpisodes($, EpisodeKindsTagIDs.NAME_DAYS, itemToHoliday),
    holidays: scrapEpisodes($, EpisodeKindsTagIDs.HOLIDAYS, itemToHoliday)
  };
}

module.exports = scrape;
