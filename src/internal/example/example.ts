import winston from 'winston'
import { Context, Telegraf } from 'telegraf'
import Usecase from './usecase/usecase'
import { Config } from '../../config/config.interface'
import { Update } from 'telegraf/typings/core/types/typegram'

class Example {
    constructor(
        private logger: winston.Logger,
        private config: Config,
        private bot: Telegraf<Context<Update>>
    ) {
        const usecase = new Usecase(this.config, this.logger, this.bot)

        usecase.launch()
    }
}

export default Example
