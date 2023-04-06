import config from './config/config'
import Mongo from './database/mongo/mongo'
import Logger from './pkg/logger'

const main = async () => {
    const { logger } = new Logger(config)
    await Mongo.connect(logger, config)
}

export default main()
