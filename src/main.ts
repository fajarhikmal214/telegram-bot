import config from './config/config'
import Mongo from './database/mongo/mongo'
import Logger from './pkg/logger'
import Example from './internal/example/example'
import Bot from './external/telegram-bot'

const main = async () => {
    const { logger } = new Logger(config)
    const bot = await Bot.connect(logger, config)

    await Mongo.connect(logger, config)

    // Load internal apps
    new Example(logger, config, bot)
}

export default main()
