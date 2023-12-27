import mongoose, { Document, Schema } from 'mongoose'

export interface IUser extends Document {
    username: string
    name: string
    emoji?: string
}

const schema: Schema<IUser> = new Schema({
    username: String,
    name: String,
    emoji: String,
})

export default mongoose.model('users', schema, 'users')
