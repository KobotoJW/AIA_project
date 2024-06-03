const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    confirmationToken: {
        type: String,
    },
    confirmationTokenExpiration: {
        type: Date,
    },
    isConfirmed: {
        type: Boolean,
        default: false,
    },
    resetToken: {
        type: String,
    },
    resetTokenExpiration: {
        type: Date,
    },
    licenseNumber: {
        type: String, unique: true
    },
    ranking: {
        type: Number, unique: true
    }
});

module.exports = mongoose.model('User', UserSchema);