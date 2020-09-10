const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs')
const Sentry = require('@sentry/node');
const Tracing = require("@sentry/tracing");

const config = require('../config');

Sentry.init({
  dsn: config.SENTRY_DSN,
  integrations: [
    // enable HTTP calls tracing
    new Sentry.Integrations.Http({ tracing: true }),
    // enable Express.js middleware tracing
    new Tracing.Integrations.Express({ app }),
  ],
  tracesSampleRate: 1.0,
});



const {getWikiDay} = require('./scrape');
const texts = require('./texts');
const {addLeadingZero, chunkBy} = require('./utils');

process.env.TZ = 'Europe/Kiev';

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(config.TELEGRAM_TOKEN, {polling: true});

const defaultKeyboardConfig = {
  keyboard: [[{text: texts.BUTTON_TIME_CHANGE_REQUEST}, {text: texts.BUTTON_UNSUBSCRIBE}]],
  one_time_keyboard: true,
  resize_keyboard: true
};

function generateTimeButtons() {
  return Array
    .from({length: 4}, (v, i) => i)
    .map((row) =>
      Array
        .from({length: 6}, (v, i) => i)
        .map(col =>
          ({
            text: `${addLeadingZero(6 * row + col)}:00`,
            // callback_data: JSON.stringify({
            //   'command': 'settime',
            //   'amount': `${addLeadingZero(6*row + col)}:00`
            // })
          })
        )
    )
}

function updateUser(userId, update) {
  console.log(`updating user ${userId} ${JSON.stringify(update)}`);

  const {users} = JSON.parse(fs.readFileSync(config.DB_LOCATION, 'utf8'));
  if (!users[userId]) {
    users[userId] = {};
  } else {
    users[userId] = {
      ...users[userId],
      ...update
    }
  }
  fs.writeFileSync(config.DB_LOCATION, JSON.stringify({users}));
}

// on bot start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  updateUser(chatId, {status: 'started', notifications_time: {}});

  bot.sendMessage(
    chatId,
    texts.TEXT_ON_START,
    {reply_markup: {keyboard: [[texts.BUTTON_SUBSCRIBE]]}}
  );
});

// on user unsubscribe
bot.onText(new RegExp(texts.BUTTON_TIME_CHANGE_REQUEST), (msg) => {
  const chatId = msg.chat.id;

  bot.sendMessage(chatId, texts.TEXT_ON_TIME_CHANGE_REQUEST, {
    reply_markup: {
      keyboard: generateTimeButtons(),
      one_time_keyboard: true
    }
  });
});

// on user unsubscribe
bot.onText(new RegExp(texts.BUTTON_UNSUBSCRIBE), (msg) => {
  const chatId = msg.chat.id;
  updateUser(chatId, {status: 'unsubscribed'});

  // TODO: array of random cute unsubscribe confirmation messages
  bot.sendMessage(chatId, texts.TEXT_ON_UNSUBSCRIBE, {
    reply_markup: {
      keyboard: [[texts.BUTTON_SUBSCRIBE]],
      one_time_keyboard: true
    }
  });
});

// on user subscribe
bot.onText(new RegExp(texts.BUTTON_SUBSCRIBE), (msg) => {
  const chatId = msg.chat.id;
  updateUser(chatId, {
    status: 'subscribed',
    notifications_time: {
      hour: 7,
      minute: 0
    }
  });

  bot.sendMessage(chatId, texts.TEXT_ON_SUBSCRIBE, {
    reply_markup: defaultKeyboardConfig
  });
});

// on user selected time of notifications
bot.onText(/\d\d:\d\d/, (msg, match) => {

  const chatId = msg.chat.id;

  const [hours, minutes] = match[0].split(':');
  updateUser(chatId, {
    notifications_time: {
      hour: +hours,
      minute: +minutes
    }
  });

  bot.sendMessage(chatId, texts.TEXT_ON_TIME_CHANGED.replace('hours', hours).replace('minutes', minutes), {
    reply_markup: defaultKeyboardConfig
  });
});

setInterval(async function () {
  const today = new Date();
  const nextDay = new Date(today.getTime() + (24 * 60 * 60 * 1000));
  const currentTime = {
    month: today.getMonth(),
    day: today.getDate(),
    hour: today.getHours(),
    minute: today.getMinutes()
  };

  const thisDayEvents = await getWikiDay(currentTime.month, currentTime.day);
  const {users} = JSON.parse(fs.readFileSync(config.DB_LOCATION, 'utf8'));
  const digest = texts.composeDailyDigest(thisDayEvents);
  Object.keys(users).forEach(userId => {
    const user = users[userId];
    if (user.status === 'subscribed') {
      if (
        user.notifications_time.hour === currentTime.hour &&
        user.notifications_time.minute === currentTime.minute
      ) {
        console.log(`It is ${addLeadingZero(currentTime.hour)}:${addLeadingZero(currentTime.minute)}, and I am sending digest to user ${userId}`);
        sendDigest(bot, userId, digest);
      }
    }

    // if user is admin, than send him a next day's digest beforehand
    if(user.role === 'admin') {
      if (
        user.notifications_time.hour === currentTime.hour &&
        user.notifications_time.minute === currentTime.minute
      ) {
        getWikiDay(nextDay.getMonth(), nextDay.getDate())
          .then(nextDayEvents => {
            sendDigest(bot, userId, texts.composeDailyDigest(nextDayEvents));
          }
        );

      }
    }
  });
}, 1000 * 60); // every minute



function sendDigest(bot, userId, digest) {
  chunkBy(digest, 4096).forEach(async (chunk) => {
    try {
      await bot.sendMessage(userId, chunk, {
        parse_mode: 'Markdown',
        reply_markup: defaultKeyboardConfig
      });
    } catch (e) {
      console.log(`ERROR: SENDING to ${userId} (${e.message})`)
    }
  })
}

module.exports.sendDigest = sendDigest;
