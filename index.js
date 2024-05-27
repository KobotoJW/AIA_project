const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60 * 60 * 1000 }
}));

mongoose.connect('mongodb://localhost:27017/tournaments');

app.use(bodyParser.json());

const usersRoute = require('./routes/users');
const tournamentsRoute = require('./routes/tournaments');

//users routes
app.use('/users', usersRoute);


app.get('/', (req, res) => {
    res.redirect('/users');
});

//tournament routes
app.use('/tournaments', tournamentsRoute);


const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server is running on port ${port}`));