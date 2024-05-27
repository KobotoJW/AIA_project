const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');

const router = express.Router();

router.get('/', (req, res) => {
    res.render('login');
});

router.get('/register', (req, res) => {
    res.render('register');
});

router.get('/forgot-password', (req, res) => {
    res.render('forgot-password');
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }

    if (!user.isConfirmed) {
        return res.status(400).json({ message: 'Please confirm your email' });
    }

    req.session.userId = user._id;
    req.session.user = user;
    res.redirect('/tournaments');
});

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        return res.status(400).json({ message: 'User not found' });
    } else if (!user.isConfirmed) {
        return res.status(400).json({ message: 'Please confirm your email' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpiration = Date.now() + 3600000; // 1 hour
    await user.save();

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      auth: {
        user: 'smaple.mail.to.delete@gmail.com',
        pass: 'qfmk dbhk woob mmzh',
      },
  });

    const mailOptions = {
        from: 'smaple.mail.to.delete@gmail.com',
        to: email,
        subject: 'Reset your password',
        text: `Click this link to reset your password: http://localhost:3000/users/reset-password/${resetToken}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });

    res.json({ message: 'Reset email sent successfully' });

});


router.post('/register', async (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName) {
        return res.status(400).json({ message: 'First name required' });
    } else if (!lastName) {
        return res.status(400).json({ message: 'Last name required' });
    } else if (!email) {
        return res.status(400).json({ message: 'Email required' });
    } else if (!password) {
        return res.status(400).json({ message: 'Password required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const confirmationToken = crypto.randomBytes(20).toString('hex');
    const confirmationTokenExpiration = Date.now() + 3600000 * 24;

    const newUser = new User({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        confirmationToken,
        confirmationTokenExpiration,
    });

    await newUser.save();

    const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        auth: {
          user: 'smaple.mail.to.delete@gmail.com',
          pass: 'qfmk dbhk woob mmzh',
        },
    });
    transporter.verify().then(console.log).catch(console.error);

    const mailOptions = {
        from: 'smaple.mail.to.delete@gmail.com',
        to: email,
        subject: 'Confirm your email',
        text: `Click this link to confirm your email: http://localhost:3000/users/confirm/${confirmationToken}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
        }
    });

    res.json({ message: 'User registered successfully' });
    res.redirect('/users');

});

router.get('/reset-password/:resetToken', async (req, res) => {
  const { resetToken } = req.params;

  const user = await User.findOne({ resetToken });
  if (!user) {
      return res.status(404).send('User not found');
  } else if (user.resetTokenExpiration < Date.now()) {
      return res.status(400).send('Reset token expired');
  }

  res.render('reset-password', { resetToken });
});

router.post('/reset-password/:resetToken', async (req, res) => {
    const { resetToken } = req.params;
    const { password } = req.body;

    const user = await User.findOne({ resetToken });
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    } else if (user.resetTokenExpiration < Date.now()) {
        return res.status(400).json({ message: 'Reset token expired' });
    } else if (!user.isConfirmed) {
        return res.status(400).json({ message: 'Please confirm your email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully' });
});


router.get('/confirm/:confirmationToken', async (req, res) => {
    const { confirmationToken } = req.params;

    const user = await User.findOne({ confirmationToken });
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    } else if (user.confirmationTokenExpiration < Date.now()) {
        return res.status(400).json({ message: 'Confirmation token expired' });
    }

    user.isConfirmed = true;
    user.confirmationToken = undefined;
    await user.save();

    res.json({ message: 'Email confirmed successfully' });
});

module.exports = router;
