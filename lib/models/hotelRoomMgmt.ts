import { Schema, Model, model } from 'mongoose';

const userSchema = new Schema({
    name: { type: String },
    checkInDate: { type: Date },
    checkOutDate: { type: Date },
    numberOfGuests: { type: Number },
    contactNumber: { type: Number },
});

const userReviewOrRatingSchema = new Schema({
    name: { type: String },
    review: { type: String },
    rating: { type: Number },
    date: { type: Date, default: new Date() }
});

export const hotelRoomSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    contactDetails: {
        type: Number,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    rating: {
        type: Number,
        default: 0
    },
    usersBooked: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    usersReviewOrRating: [{ type: Schema.Types.ObjectId, ref: 'UserReview' }],
});
export interface IHotelLog {
    name: string,
    location: string,
    contactDetails: number,
    email: string,
    rating: number,
    usersBooked: IUserBookedLog['_id'][],
    usersReviewOrRating: IUserReviewOrRatingLog['_id'][]
}

export interface IUserBookedLog {
    _id:string,
    name: string,
    checkInDate: Date,
    checkOutDate: Date,
    numberOfGuests: number,
    contactNumber: number,
}

export interface IUserReviewOrRatingLog {
    _id:string,
    name: string,
    review: string,
    rating: number,
    date: Date,
}
export const HotelRoom: Model<IHotelLog> = model<IHotelLog>('HotelRoom', hotelRoomSchema);
export const User: Model<IUserBookedLog> = model<IUserBookedLog>('User', userSchema);
export const UserRevieworRating: Model<IUserReviewOrRatingLog> = model<IUserReviewOrRatingLog>('UserReview', userReviewOrRatingSchema);