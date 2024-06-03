const express = require('express');
const router = express.Router();
const Tournament = require('../models/Tournament');
const User = require('../models/User');

router.get('/', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const size = 10;
    const search = req.query.search || '';

    try {
        const tournaments = await Tournament.find({
            $or: [
                { name: { $regex: new RegExp(search, 'i') } },
                { discipline: { $regex: new RegExp(search, 'i') } },

                { location: { $regex: new RegExp(search, 'i') } }
            ]
        })
        .skip((page - 1) * size)
        .limit(size);

        const totalTournaments = await Tournament.countDocuments({
            $or: [
                { name: { $regex: new RegExp(search, 'i') } },
                { discipline: { $regex: new RegExp(search, 'i') } },
                { location: { $regex: new RegExp(search, 'i') } }
            ]
        });

        res.render('tournaments', { 
            tournaments, 
            session: req.session,
            currentPage: page, 
            totalPages: Math.ceil(totalTournaments / size),
            search 
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

const seedTournament = async (tournamentId) => {
    try {
        const tournament = await Tournament.findById(tournamentId);
        if (!tournament) {
            console.error('Tournament not found');
            return;
        }

        const participants = await User.find({ _id: { $in: tournament.participants } }).sort({ ranking: -1 });

        tournament.ladder = participants.map(participant => participant._id);

        await tournament.save();
    } catch (err) {
        console.error(err);
    }
};

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

        const deadlineDate = new Date(applicationDeadline);
        const now = new Date();
        const delay = deadlineDate.getTime() - now.getTime();
        if (delay > 0) {
            setTimeout(() => seedTournament(tournament._id), delay);
        }

        res.redirect('/tournaments');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.get('/:id', async (req, res) => {
    try {
        const tournament = await Tournament.findById(req.params.id)
            .populate('organizer', 'firstName lastName')
            .populate('participants', 'firstName lastName')
            .orFail();

        res.render('tournament-details', { tournament });
    } catch (err) {
        console.error(err);
        if (err.name === 'DocumentNotFoundError') {
            const tournament = {
                organizer: { firstName: '[user deleted]', lastName: '' },
                participants: [{ firstName: '[user deleted]', lastName: '' }]
            };
            return res.render('tournament-details', { tournament });
        }
        res.status(500).send('Server Error');
    }
});

router.get('/edit/:id', async (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/users');
    }

    try {
        const tournament = await Tournament.findById(req.params.id);
        if (req.session.userId !== tournament.organizer.toString()) {
            return res.render('message-popup', { message: 'Unauthorized' });
        }

        res.render('edit-tournament', { tournament });
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.post('/edit/:id', async (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/users');
    }

    try {
        const tournament = await Tournament.findById(req.params.id);
        if (req.session.userId !== tournament.organizer.toString()) {
            return res.status(403).send('Unauthorized');
        }

        const { name, discipline, time, location, maxParticipants, applicationDeadline } = req.body;
        await Tournament.findByIdAndUpdate(req.params.id, {
            name,
            discipline,
            time,
            location,
            maxParticipants,
            applicationDeadline
        });

        res.redirect('/tournaments');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

router.post('/add-participant/:id', async (req, res) => {
    if (!req.session.userId) {
        return res.redirect('/users');
    }

    try {
        const user = await User.findById(req.session.userId);
        if (!user || !user.licenseNumber || !user.ranking) {
            return res.render('add-license-and-ranking', { redirect: `/tournaments/${req.params.id}` });
        }

        const tournament = await Tournament.findById(req.params.id);
        if (tournament.participants.includes(req.session.userId)) {
            return res.render('message-popup', { message: 'Already a participant' });
        }

        if (tournament.participants.length >= tournament.maxParticipants) {
            return res.render('message-popup', { message: 'No free slots available' });
        }

        await Tournament.findByIdAndUpdate(req.params.id, {
            $push: { participants: req.session.userId }
        });

        res.redirect(`/tournaments/${req.params.id}`);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

module.exports = router;