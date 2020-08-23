module.exports.TEXT_ON_START = `Привіт!
Я надсилаю дайджести з проекту Вікіпедії "Цей день в історії".
Іноді хочеться почати день з релаксації за чашечкою чаю. І посвяткувати події з усім світом :)
Тисни "підписатись" щоб і твої ранки стали такими.
`;
module.exports.TEXT_ON_SUBSCRIBE = `Чудово!
Я надсилатиму тобі дайджести о 7 ранку по Київському часу.
До завтра 👋`;
module.exports.TEXT_ON_UNSUBSCRIBE = `Добре, більше не присилатиму нотифікацій. цьом 🐌`;
module.exports.TEXT_ON_TIME_CHANGE_REQUEST = `Обери зручний час 👇, або відправ мені час у форматі ГГ:ХХ`;
module.exports.TEXT_ON_TIME_CHANGED = `Домовились!
Тепер надсилатиму дайджести о hours:minutes по Київському часу`;
module.exports.TEXT_DIGEST_TEMPLATE = ``;

module.exports.BUTTON_SUBSCRIBE = `Підписатись`;
module.exports.BUTTON_UNSUBSCRIBE = `Відписатись`;
module.exports.BUTTON_TIME_CHANGE_REQUEST = `Змінити час нотифікацій`;

module.exports.MONTHS = ['січня', 'лютого', 'березня', 'квітня', 'травня', 'червня', 'липня', 'серпня', 'вересня', 'жовтня', 'листопада', 'грудня'];


module.exports.getHolidays = ({holidays}) => !holidays || !holidays.length ? '' :
  `*Свята і пам'ятні дні*
${holidays.map(({description}) => `• ${description}`).join('\n')}
`;

// module.exports.getEvents = ({events}) => !events || !events.length ? '' :
//   `*Події*
// ${events.map(({year, description}) => `• ${year} — ${description}`).join('\n')}
// `;
//
// module.exports.getBirths = ({births}) => !births || !births.length ? '' :
//   `*Народились*
// ${births.map(({year, description}) => `• ${year} — ${description}`).join('\n')}
// `;
//
// module.exports.getDeaths = ({deaths}) => !deaths || !deaths.length ? '' :
//   `*Померли*
// ${deaths.map(({year, description}) => `• ${year} — ${description}`).join('\n')}
// `;
//
// module.exports.getNameDays = ({name_days}) => !name_days || !name_days.length ? '' :
//   `*Іменини*
// ${name_days.map(({description}) => description).join('\n')}
// `;

const getEvents = ({episodes, title}) => !episodes || !episodes.length ? '' :
  `*${title}*
${episodes.map(({description}) => `• ${description}`).join('\n')}
`;

const getDates = ({episodes, title}) => !episodes || !episodes.length ? '' :
  `*${title}*
${episodes.map(({year, description}) => `• ${year} — ${description}`).join('\n')}
`;


const getGreeting = () => 'Привіт! Сьогодні в нас:';

module.exports.composeDailyDigest = (rawDailyEvents) => `
${getGreeting()}
${rawDailyEvents.description}

${Object.keys(rawDailyEvents).map(keyName => {
  if(keyName === 'description') {
    return '';
  }
  const episodes = rawDailyEvents[keyName].episodes || [];

  if(episodes.length) {
    if(episodes[0].year) {
      return getDates(rawDailyEvents[keyName])
    }
    return getEvents(rawDailyEvents[keyName])
  }
  return '';
}).join('\n')}
`.replace(/\n\n\n/, '\n\n');

/*
 TODO: add possibility to subscribe to this types of events

 ${getBirths(rawDailyEvents)}

 ${getDeaths(rawDailyEvents)}
 */

/*
${module.exports.getHolidays(rawDailyEvents)}
${module.exports.getEvents(rawDailyEvents)}
${module.exports.getNameDays(rawDailyEvents)}\`
*/
