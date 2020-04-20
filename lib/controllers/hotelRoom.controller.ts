import { Controller, Post, Put, Delete, Get } from '@overnightjs/core';
import { HotelRoom, IUserReviewOrRatingLog, IUserBookedLog, User, UserRevieworRating, IHotelLog } from '../models/hotelRoomMgmt';
import e = require('express');

@Controller('hotel-room')
export class HotelRoomController {
    constructor() {

    }

    @Get('reviews/:hotelId')
    getHotelReviews(req, res) {
        HotelRoom.findById(req.params.hotelId, { usersReviewOrRating: 1 }).populate('usersReviewOrRating').then((hotel) => {
            res.send({
                data: hotel.usersReviewOrRating.filter(revieworrating=>revieworrating.review && revieworrating.review.length),
                message: "Hotel review details retrieved successfully"
            })
        }).catch(err => {
            res.status(err.status).send(err.message);
        });
    }

    @Get('hotel/:hotelId')
    getHotelDetails(req, res) {
        HotelRoom.findById(req.params.hotelId, { usersBooked: 0, usersReviewOrRating: 0 }).then((hotel) => {
            res.send({
                data: hotel,
                message: "Hotel details retrieved successfully"
            })
        }).catch(err => {
            res.status(err.status).send(err.message);
        });
    }

    @Get('user/:bookingId')
    getUserBookingDetails(req, res) {
        User.findById(req.params.bookingId).then((user) => {
            res.send({
                data: user,
                message: "User details retrieved successfully"
            })
        }).catch(err => {
            res.status(err.status).send(err.message);
        });
    }
    /**
     *@description:We can create a new hotel->name,location,contactDetails,email
     * 
     * @param {*} req
     * @param {*} res
     * @memberof HotelRoomController
     */
    @Post()
    creatingANewHotelRoom(req, res) {
        const data = {
            name: req.body.name,
            location: req.body.location,
            contactDetails: req.body.contactDetails,
            email: req.body.email,
        }
        HotelRoom.create(data).then((data) => {
            res.send({
                data: data,
                message: "A new hotel is created successfully"
            })
        }).catch((err) => {
            res.send(err);
        })
    }

    /**
     *@description:Every time the user gives a review or rating  based on hotel it gets updated here 
     *
     * @param {*} req->req.body=>{username,review,rating,hotelId}
     * @param {*} res
     * @memberof HotelRoomController
     */
    @Post('reviewOrRating')
    createUserReviewOrRating(req, res) {
        const data: Partial<IUserReviewOrRatingLog> = {
            name: req.body.username,
            date: new Date()
        }
        if ((!req.body.review || !req.body.review.length) && !req.body.rating) {
            res.status(500).send("Either review or rating must be given")
        } else {
            if (req.body.review) {
                data.review = req.body.review
            }
            if (req.body.rating) {
                data.rating = req.body.rating
            }
        }
        UserRevieworRating.create(data).then((review) => {
            const reviewId = review.id.toString();
            HotelRoom.findByIdAndUpdate(req.body.hotelId, {
                $push: {
                    usersReviewOrRating: reviewId
                }
            }, { new: true }).then((data) => {
                if (req.body.rating) {
                    UserRevieworRating.find({
                        _id: {
                            $in: data.usersReviewOrRating
                        },
                        rating: {
                            $gt: 0
                        }
                    }, { rating: 1 }).then((userRating) => {
                        let total = 0;
                        userRating.forEach(element => {
                            total += element.rating;
                        });
                        HotelRoom.findByIdAndUpdate(req.body.hotelId, {
                            $set: {
                                rating: ((total) / (userRating.length)).toFixed(2)
                            }
                        }, { new: true }).then((data) => {
                            res.send({
                                data: data,
                                message: (req.body.review ? "Review and Rating" : "Rating") + " submitted successfully"
                            });
                        });
                    }).catch((err) => {
                        res.send(err);
                    });
                } else {
                    res.send({
                        data: data,
                        message: "Review updated successfully"
                    });
                }
            }).catch((err) => {
                res.send(err);
            });
        }).catch((err) => {
            res.send(err);
        });
    }
    /**
     *@description:Every users information is created here->name,checkInDate,numberOfGuests,contactNumber
     *
     * @param {*} req
     * @param {*} res
     * @memberof HotelRoomController
     */
    @Post('room')
    bookARoom(req, res) {
        const data: Partial<IUserBookedLog> = {
            name: req.body.username,
            checkInDate: req.body.checkInDate || new Date(),
            checkOutDate: req.body.checkOutDate || new Date(),
            numberOfGuests: req.body.numberOfGuests,
            contactNumber: req.body.contactNumber
        }
        User.create(data).then((user) => {
            HotelRoom.findByIdAndUpdate(req.body.hotelId, {
                $push: {
                    usersBooked: user._id
                }
            }, { new: true }).then(() => {
                res.send({
                    data: user,
                    message: "Created a room for user successfully"
                });
            }).catch((err) => {
                res.send(err);
            });
        }).catch((err) => {
            res.send(err);
        });
    }
    /**
     *@description:Updation of user booking details is done here assuming that the user can update their details before two days prior their current booking date of their checkInDate
     *
     * @param {*} req
     * @param {*} res
     * @memberof HotelRoomController
     */
    @Put('checkInDate')
    updateUserBookingDetails(req, res) {
        User.findById(req.body._id).then((userDetails) => {
            if ((new Date(userDetails.checkInDate).getTime() - new Date().getTime()) > 2 * 24 * 60 * 60) {
                User.findByIdAndUpdate(req.body._id, {
                    $set: {
                        checkInDate: req.body.checkInDate,
                        checkOutDate: req.body.checkOutDate,
                        numberOfGuests: req.body.numberOfGuests,
                    }
                }).then((data) => {
                    res.send({
                        data: data,
                        message: " updated user booking details"
                    });
                }).catch((err) => {
                    res.send(err);
                });
            } else {
                res.status(500).send("Date Cant be Changed before two days of  checkindate");
            }
        }).catch((err) => {
            res.send(err);
        });
    }


    @Put('hotel')
    updatingHotelDetails(req, res) {
        const options: Partial<IHotelLog> = {};
        if (req.body.contactDetails) {
            options.contactDetails = req.body.contactDetails;
        }
        if (req.body.email) {
            options.email = req.body.email;
        }
        HotelRoom.findByIdAndUpdate(req.body.hotelId, {
            $set: options
        }).then((hotel) => {
            res.send({
                data: hotel,
                message: " updated hotel details"
            });
        }).catch(err => {
            res.send(err);
        });
    }

    @Delete('user/:bookingId')
    deleteUserBookingDeatils(req, res) {
        User.findByIdAndDelete(req.params.bookingId).then((user) => {
            HotelRoom.findOneAndUpdate({ usersBooked: { $in: [req.params.bookingId] } }, {
                $pull: {
                    usersBooked: req.params.bookingId
                }
            }).then((hotel) => {
                res.send({
                    data: user,
                    message: "deleted booking details"
                });
            }).catch(err => {
                res.send(err);
            });
        }).catch(err => {
            res.send(err);
        });
    }


}