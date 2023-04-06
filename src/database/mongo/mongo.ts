import mongoose from 'mongoose'
import winston from 'winston'
import { Config } from '../../config/config.interface'

class Mongo {
    public static async connect(logger: winston.Logger, { db }: Config) {
        mongoose.set('strictQuery', false)

        return mongoose
            .connect(
                `mongodb+srv://${db.username}:${db.password}@${db.host}/?retryWrites=true&w=majority`
            )
            .then(() => {
                logger.info('Connection to database established')
            })
            .catch((e) => {
                logger.error(e.message)
                process.exit(-1)
            })
    }

    public static switch(database: string) {
        return mongoose.connection.useDb(database, {
            useCache: true,
        })
    }
}

export default Mongo
