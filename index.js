const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

mongoose.connect('mongodb://localhost:27017/tournaments');

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Import routes
const usersRoute = require('./routes/users');
const tournamentsRoute = require('./routes/tournaments');

// Use routes
app.use('/users', usersRoute);


// Home route
app.get('/', (req, res) => {
    res.redirect('/users');
});

app.get('/users', (req, res) => {
    res.render('login');
});

app.get('/users/register', (req, res) => {
    res.render('register');
});

app.get('/users/forgot-password', (req, res) => {
    res.render('forgot-password');
});

// Start the server
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server is running on port ${port}`));