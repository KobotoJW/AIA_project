const express = require('express');
const router = express.Router();
const Tournament = require('../models/Tournament');

router.get('/', async (req, res) => {
    const page = req.query.page || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    try {
        const tournaments = await Tournament.find().skip(skip).limit(limit);
        res.render('tournaments', { tournaments, session: req.session});
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.get('/add', (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/users');
    }
    res.render('add-tournament');
});

router.post('/add', async (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/users');
    }
    const user = req.session.user;
    const { name, discipline, time, location, maxParticipants, applicationDeadline } = req.body;

    try {
        const tournament = new Tournament({
            name,
            discipline,
            organizer: user._id,
            time,
            location,
            maxParticipants,
            applicationDeadline
        });

        await tournament.save();
        res.redirect('/tournaments');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;