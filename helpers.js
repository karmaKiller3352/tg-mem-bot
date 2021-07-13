const { pathOr, path, reduce, add, pluck, pipe, uniq, find, equals, prop, mergeRight, length, filter, map, keys, sort, propOr } = require("ramda")
const moment = require('moment');

moment.locale('ru')

const dateFormats = {
  Y: 'YYYY',
  M: 'MMMM YYYY'
}

const commandMapper = {
  '/show_month': {
    format: 'M',
    fieldName: 'publicationMonth'
  },
  '/show_year': {
    format: 'Y',
    fieldName: 'publicationYear'
  }
}


const getStrDate = (dateType, unix ) => {
  const format = propOr('', dateType, dateFormats)

  return unix ? moment.unix(unix).format(format) : moment().format(format)
}

const countRate = (poll) => {
  const pollId = pathOr(null, ['id'], poll)
  const rate = reduce((acc, { text, voter_count }) => add(acc, text * voter_count), 0, poll.options)

  return {
    pollId,
    rate
  }
}

const handleMessage = (message, poll) => {
  const author = path(['from', 'username'], message)
  const authorId = path(['from', 'id'], message)
  const id = path(['message_id'], message)
  const date = path(['date'], message)
  const publicationYear = getStrDate('Y', date)
  const publicationMonth = getStrDate('M', date)
  
  const title = pathOr('', ['text'], message)
  const description = pathOr('', ['caption'], message)
  const videoId = pathOr(null, ['video', 'file_id'], message)
  const photoId = pathOr(null, ['photo', 0, 'file_id'], message)

  const { pollId, rate } = countRate(poll)

  return {
    id,
    author,
    authorId,
    publicationYear,
    publicationMonth,
    title,
    description,
    videoId,
    photoId,
    pollId,
    rate
  }
}

const groupByAuthors = (memes) => {
  const userNames = pipe(
    pluck('author'),
    uniq
  )(memes)

  const groupByAuthor = reduce(
    (acc, author) => {
      const authorMemes = filter(pipe(
        prop('author'), 
        equals(author)
      ), memes)

      const authorId = path([0, 'authorId'], authorMemes)
      const summarizeRate = reduce((acc, { rate }) => add(acc, rate) ,0, authorMemes)
      const authorRates = pipe(pluck('rate'), map(Number))(authorMemes)
      const maxRate = Math.max(...authorRates)
      const minRate = Math.min(...authorRates)
      
      const bestMem = find(pipe(prop('rate'), Number, equals(maxRate)), authorMemes)
      const worstMem = find(pipe(prop('rate'), Number, equals(minRate)), authorMemes)

      return mergeRight(acc, { [author]: {
        author,
        authorId,
        memes: authorMemes,
        memesCount: length(authorMemes),
        summarizeRate,
        maxRate,
        minRate,
        bestMem,
        worstMem
      } })
    },
    {},
    userNames
  )

  const groupByRate = reduce(
    (acc, a) => {
      const author = groupByAuthor[a]
      const key = prop('summarizeRate', author)
      return mergeRight(acc, {
        [key]: author
      })
    },
    {},
    keys(groupByAuthor)
  )

  const comparator = (a, b) => b - a

  const sortedRates = sort(comparator, keys(groupByRate)) 

  const sortedByRate = map((rate) => groupByRate[rate] , sortedRates)
  const winner = pathOr({}, [0], sortedByRate)

  
  return {
    sortedByRate,
    winner
  }
}


const getQuery = (command, unix) => {
  const { fieldName, format } = path([command], commandMapper)
  console.log(fieldName, format)

  return { 
    [fieldName]: getStrDate(format, unix),
  }
}


const buildMessage = (command, authors, bestMemes, chatId, unix) => {
  const authorsCount = length(authors.sortedByRate)
  const winner = authors.sortedByRate[0]
  const loser = authors.sortedByRate[authorsCount - 1]

  const format = path([command, 'format'], commandMapper)
  const currentDate = getStrDate(format, unix)

  const message = `
<b>Статистика за ${currentDate}</b>

<b>Доска почета и остракизма:</b>
<i>Первое место в данный момент занимает <a href="tg://user?id=${prop('authorId', winner)}">@${prop('author', winner)}</a> набрав суммарно ${prop('summarizeRate', winner)} баллов
<a href="https://t.me/c/${chatId}/${path(['bestMem', 'id'], winner)}">Лучший его мем</a> набрал ${path(['bestMem', 'rate'], winner)} баллов
<a href="https://t.me/c/${chatId}/${path(['worstMem', 'id'], winner)}">Худший его мем</a> набрал ${path(['worstMem', 'rate'], winner)} баллов

Худший конечно же <a href="tg://user?id=${prop('authorId', loser)}">@${prop('author', loser)}</a> набрав суммарно ${path(['summarizeRate'], loser)} баллов
<a href="https://t.me/c/${chatId}/${path(['bestMem', 'id'], loser)}">Лучший его мем</a> набрал ${path(['bestMem', 'rate'], winner)} баллов
<a href="https://t.me/c/${chatId}/${path(['worstMem', 'id'], loser)}">Худший его мем</a> набрал ${path(['worstMem', 'rate'], winner)} баллов</i>

<b>Авторы:</b>
${reduce((acc, a) => `${acc}<a href="tg://user?id=${prop('authorId', a)}">@${prop('author', a)}</a>: ${prop('summarizeRate', a)} баллов. <a href="https://t.me/c/${chatId}/${path(['bestMem', 'id'], a)}">Лучший его мем</a> набрал ${path(['bestMem', 'rate'], a)} баллов\n`, 
'', 
authors.sortedByRate)}

<b>Лучшие мемы:</b>
${reduce((acc, a) => `${acc}<a href="https://t.me/c/${chatId}/${path(['id'], a)}">МЕМ</a> набрал ${path(['rate'], a)} баллов. Автор: <a href="tg://user?id=${path(['authorId'], a)}">@${prop('author', a)}</a> \n`, 
'', 
bestMemes)}
  `

  return message
}


module.exports = { handleMessage, countRate, groupByAuthors, getQuery, buildMessage }