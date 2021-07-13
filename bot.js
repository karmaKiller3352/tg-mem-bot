 
const TelegramApi = require('node-telegram-bot-api')
const express = require('express');
const moment = require('moment');

const { connectDb } = require('./db')
const { handleMessage, countRate, groupByAuthors, getQuery, buildMessage } = require('./helpers')
const Mem = require('./models')
const COMMANDS = require('./commands');

require('dotenv').config();

const app = express()

moment.locale('ru')

const bot = new TelegramApi(process.env.TG_KEY, { polling: true })
bot.setMyCommands(COMMANDS);

const shippingOptions = ['0','1', '2', '3', '4', '5']

const MEMProccess = async (msg) => {
  const chatId = msg.chat.id.toString().slice(4)
  const messageTitle = `ID МЕМА: ${msg.message_id}\nОцените <a href="https://t.me/c/${chatId}/${msg.message_id}">МЕМЧИК</a> от <a href="tg://user?id=${msg.from.id}">@${msg.from.username}</a>`
  await bot.sendMessage(msg.chat.id, messageTitle, { parse_mode: 'HTML' })

  const pollConfig = await bot.sendPoll(msg.chat.id, 'Оцените:', shippingOptions, { is_anonymous: true, parse_mode: 'HTML' })
  const message = handleMessage(msg, pollConfig.poll)
  const mem = new Mem(message)
  await mem.save()
  console.log(`Mem ${message.id} was added to database`)
}

bot.on('message', async (msg) => {
  const caption = msg.caption || ''
  if (caption.match(/(MEM)/)) {
    await MEMProccess(msg)
  }
})

bot.onText(/(MEM)/g, async (msg) => {
  await MEMProccess(msg)
})

bot.on('poll', async (poll) => {
  const { pollId, rate } = countRate(poll)
  
  const mem = await Mem.findOne({ pollId })

  if (mem) {
    mem.rate = rate
    await mem.save()
    console.log(`Mem ${mem.id} rate was updated to ${rate}`)
  }
})


bot.onText(/(\/reset_reports)/g, async (ctx) => {
  await Mem.deleteMany()
  bot.sendMessage(ctx.chat.id, 'Статистика обнулена')
})



bot.onText(/(\/show_month)|(\/show_year)/g, async (ctx, match) => {
  const command = match[0]
  const chatId = ctx.chat.id.toString().slice(4)
  const query = getQuery(command)

  const memes = await Mem.find(query, [], { sort:{ rate: -1 } })
  const bestMemes = memes.slice(0, 5)

  const authors = groupByAuthors(memes)

  const message = buildMessage(command, authors, bestMemes, chatId)
  bot.sendMessage(ctx.chat.id, message, { parse_mode: 'HTML' })
})


connectDb()

const port = process.env.PORT || 8080

app.listen(port, function () {
  console.log(`Bot API was runned on port ${port}!`);
});


