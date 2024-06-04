const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TournamentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    discipline: {
        type: String,
        required: true
    },
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    time: {
        type: Date,
        required: true
    },
    location: {
        type: String,
        required: true
    },
    maxParticipants: {
        type: Number,
        required: true
    },
    applicationDeadline: {
        type: Date,
        required: true
    },
    sponsorLogos: {
        type: [String]
    },
    rankedPlayers: {
        type: Number,
        default: 0
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    ladder: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }]
});

module.exports = mongoose.model('Tournament', TournamentSchema);