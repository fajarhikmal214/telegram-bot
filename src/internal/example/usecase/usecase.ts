import winston from 'winston'
import { Context, Telegraf } from 'telegraf'
import { Update } from 'telegraf/typings/core/types/typegram'

import { Config } from '../../../config/config.interface'

import User from '../../../database/mongo/schemas/user.schema'
import Checkin, {
    ICheckin,
} from '../../../database/mongo/schemas/checkin.schema'

class Usecase {
    constructor(
        private config: Config,
        private logger: winston.Logger,
        private bot: Telegraf<Context<Update>>
    ) {}

    public launch() {
        // Load all commands
        this.start()
        this.help()

        this.list_user()
        this.add_user()
        this.delete_user()

        this.moderator()
        this.next()
        this.skip()
        this.reset()

        this.bot.launch()
        this.logger.info(`🚀 Bot launched`)

        this.bot.action('help', (ctx) => {
            this.func_help(ctx)
        })
    }

    private start() {
        this.bot.command('start', async (ctx) => {
            this.logger.info(ctx.from)

            await this.bot.telegram.sendMessage(
                ctx.chat.id,
                `👋 Hello ${ctx.from.first_name}, Nice to meet you! 👋`,
                {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: 'Need Help ?',
                                    callback_data: 'help',
                                },
                            ],
                        ],
                    },
                }
            )
        })
    }

    private help() {
        this.bot.command('help', async (ctx) => {
            this.logger.info(ctx.from)

            await this.func_help(ctx)
        })
    }

    private list_user() {
        this.bot.command('list', async (ctx) => {
            this.logger.info(ctx.from)

            await this.func_list_user(ctx)
        })
    }

    private add_user() {
        this.bot.command('add', async (ctx) => {
            this.logger.info(ctx.from)

            await this.func_add_user(ctx)
        })
    }

    private delete_user() {
        this.bot.command('delete', async (ctx) => {
            this.logger.info(ctx.from)

            await this.func_delete_user(ctx)
        })
    }

    private moderator() {
        this.bot.command('moderator', async (ctx) => {
            this.logger.info(ctx.from)

            await this.func_moderator(ctx)
        })
    }

    private next() {
        this.bot.command('next', async (ctx) => {
            this.logger.info(ctx.from)

            await this.func_next(ctx)
        })
    }

    private skip() {
        this.bot.command('skip', async (ctx) => {
            this.logger.info(ctx.from)

            await this.func_skip(ctx)
        })
    }

    private reset() {
        this.bot.command('reset', async (ctx) => {
            this.logger.info(ctx.from)

            await this.func_reset(ctx)
        })
    }

    private async func_help(ctx: any) {
        let message = 'Available commands : \n \n'

        message += '- /start : Starts the bot \n'
        message += '- /help : List of commands \n'
        message += '- /list : list of registered people \n'
        message += '- /add <username> <name> : Add people \n'
        message += '- /delete <username> : Delete people \n'

        message += '- /moderator : To find out who is moderator checkins \n'
        message +=
            '- /next <username> : Choose other moderator checkins with tagging previous person is queued \n'
        message +=
            '- /skip : Skip and choose other moderator checkins without tagging previous person is queued \n'
        message += '- /reset : Reset queue for moderator checkins \n'

        await this.bot.telegram.sendMessage(ctx.chat.id, message)
    }

    private async func_list_user(ctx: any) {
        const users = await User.find()

        if (!users.length) {
            await this.bot.telegram.sendMessage(
                ctx.chat.id,
                "😔 There's no one on the list"
            )

            return
        }

        let message =
            'This is a list of people who are registered as members of the backsquad \n\n'

        message += users
            .map(
                (user, index) => `${index + 1}. ${user.name} (${user.username})`
            )
            .join('\n')

        await this.bot.telegram.sendMessage(ctx.chat.id, message)
    }

    private async func_add_user(ctx: any) {
        const text = ctx.update.message.text.split(' ')

        let username = text.slice(1, 2)[0]
        if (username && username.charAt(0) !== '@') {
            this.bot.telegram.sendMessage(
                ctx.chat.id,
                `❌ Username must start with @`
            )

            return
        }

        let name = text.slice(2).join(' ')

        if (!username) {
            username = `@${ctx.from.username!}`
        }

        const isExists = await User.findOne({ username })
        if (isExists) {
            this.bot.telegram.sendMessage(ctx.chat.id, `❌ User already added`)

            return
        }

        if (!name) {
            name = username.substring(1)
        }

        const user = new User({ username, name })
        await user.save()

        this.bot.telegram.sendMessage(ctx.chat.id, `✅ New user added`)
    }

    private async func_delete_user(ctx: any) {
        let username = ctx.update.message.text.split(' ')?.slice(1, 2)[0]

        if (!username) {
            username = `@${ctx.from.username!}`
        }

        const isExists = await User.findOne({ username })
        if (!isExists) {
            this.bot.telegram.sendMessage(ctx.chat.id, `❌ User not found`)

            return
        }

        await User.deleteOne({ username })
        this.bot.telegram.sendMessage(ctx.chat.id, `✅ User deleted`)
    }

    private async func_moderator(ctx: any) {
        await this.func_isAnyoneLeft(ctx)

        const moderator = await Checkin.findOne({ on_duty: true })
        if (moderator) {
            this.bot.telegram.sendMessage(
                ctx.chat.id,
                `The moderator on duty is ${moderator.username}`
            )

            return
        }

        const userOnDuty: ICheckin[] = await Checkin.aggregate([
            { $match: { finished: false } },
            { $sample: { size: 1 } },
        ]).exec()

        await Checkin.updateOne(
            { username: userOnDuty[0].username },
            { on_duty: true }
        )

        this.bot.telegram.sendMessage(
            ctx.chat.id,
            `The moderator on duty is ${userOnDuty[0].username}`
        )
    }

    private async func_skip(ctx: any) {
        const moderator = await Checkin.findOne({ on_duty: true })
        if (moderator) {
            // Update as a finished member
            await Checkin.updateOne(
                { username: moderator.username },
                { on_duty: false }
            )
        }

        const userOnDuty = await Checkin.aggregate([
            { $match: { finished: false } },
            { $sample: { size: 1 } },
        ]).exec()

        await Checkin.updateOne(
            { username: userOnDuty[0].username },
            { on_duty: true }
        )

        this.bot.telegram.sendMessage(
            ctx.chat.id,
            `The moderator on duty is ${userOnDuty[0].username}`
        )
    }

    private async func_next(ctx: any) {
        await this.func_isAnyoneLeft(ctx)

        const moderator = await Checkin.findOne({ on_duty: true })
        if (moderator) {
            // Update as a finished member
            await Checkin.updateOne(
                { username: moderator.username },
                { on_duty: false, finished: true }
            )
        }

        const username = ctx.update.message.text.split(' ')?.slice(1, 2)[0]
        let userOnDuty = await this.func_force_next(username)

        if (!userOnDuty) {
            const findUserOnDuty = await Checkin.aggregate([
                { $match: { finished: false } },
                { $sample: { size: 1 } },
            ]).exec()

            userOnDuty = findUserOnDuty[0]
        }

        if (!userOnDuty) {
            await this.func_next(ctx)
            return
        }

        await Checkin.updateOne(
            { username: userOnDuty.username },
            { on_duty: true }
        )

        this.bot.telegram.sendMessage(
            ctx.chat.id,
            `The moderator on duty is ${userOnDuty.username}`
        )
    }

    private async func_force_next(username: string) {
        if (!username) {
            return
        }

        await Checkin.updateOne({}, { on_duty: false })

        const user = await Checkin.findOne({ username })
        if (user) {
            await Checkin.updateOne(
                { username: user.username },
                { finished: false }
            )
        }

        return user
    }

    private async func_isAnyoneLeft(ctx: any) {
        const isAnyoneLeft = await Checkin.findOne({ finished: false })
        if (!isAnyoneLeft) {
            await this.bot.telegram.sendMessage(
                ctx.chat.id,
                `Everyone has done it. Need to reset again.`
            )

            await this.func_reset(ctx)
        }
    }

    private async func_reset(ctx: any) {
        await Checkin.deleteMany({})

        const users = await User.find({})
        const checkin: Partial<ICheckin>[] = []

        users.forEach((user) => {
            checkin.push({
                username: user.username,
                finished: false,
            })
        })

        await Checkin.insertMany(checkin)

        this.bot.telegram.sendMessage(
            ctx.chat.id,
            `✅ Moderator queue checkins reset`
        )
    }
}

export default Usecase
