# Ukrainian wikipedia bot [@uk_wiki_bot](https://t.me/uk_wiki_bit)
Telegram bot that sends daily digest of "On this day" Wikipedia project.

Developed by [School++](https://programming.kr.ua/en).

Support project - https://donate.kowo.me/en/help/

## For contributors

### Development

We don't use Wikipedia API here, instead we get specific article about the current day and parse it in `scrape.js`.
Ukrainian Wikipedia articles layout is sometimes specific and is different from Wikipedia in english.

Entrypoint is the `scripts/go.js`.

Please see basic setup steps in `Deployment` section.

### Deployment
This project is prepared for deployment with fo (by [School++](https://programming.kr.ua/en) team). If you want to deploy this project on your machine manually, please follow these steps:

1. Clone the repository

2. Install the dependencies:

    ```shell script
    npm i
   ```

3. Rename config.js.example to config.js

    ```shell script
    mv config.js.example config.js
   ```

4. Fill the telegram bot token in `config.js`

    ```javascript
    module.exports.TELEGRAM_TOKEN = 'TELEGRAM_BOT_TOKEN'; // your real bot token here
   ```

5. Create file for storing users
    
    ```shell script
    echo '{"users":{}}' >> storage/users.json
    ``` 
   
6. run project
    ```shell script
    npm start
    ```


## TODOs
- Ukrainian wikipedia has lots of categories. So we need to rewrite `scripts/scrape.js` to be flexible and to get list of all H2s and parse them. The titles of final message blocks might be the same as innerText of this headings.
- Add cute texts and options for bot. E.g. unsubscribe messages and daily greetings
- Choose greetings based on current time (Good morning/afternoon/evening)

## License
**The MIT License (MIT)**

The project uses some code from https://github.com/sasalatart/on-this-day .

Copyright © 2020 Kate Boyko
