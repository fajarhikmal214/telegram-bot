import mongoose, { Document, Schema } from 'mongoose'

export interface ICheckin extends Document {
    username: string
    on_duty?: boolean
    finished?: boolean
    emoji?: string
}

const schema: Schema<ICheckin> = new Schema({
    username: {
        type: mongoose.Schema.Types.String,
        ref: 'user',
    },
    on_duty: {
        type: Boolean,
        default: false,
    },
    finished: {
        type: Boolean,
        default: false,
    },
    emoji: {
        type: String,
    },
})

export default mongoose.model('checkins', schema, 'checkins')
