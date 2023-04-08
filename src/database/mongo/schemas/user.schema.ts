import mongoose, { Document, Schema } from 'mongoose'

export interface IUser extends Document {
    username: string
    name: string
}

const schema: Schema<IUser> = new Schema({
    username: String,
    name: String,
})

export default mongoose.model('users', schema, 'users')
