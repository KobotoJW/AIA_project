const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const User = require('../models/User');

const router = express.Router();
const app = express();

router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Check if the password is correct
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Check if the user has confirmed their email
    if (!user.isConfirmed) {
        return res.status(400).json({ message: 'Please confirm your email' });
    }

    res.json({ message: 'Logged in successfully' });
});

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
        return res.status(400).json({ message: 'User not found' });
    } else if (!user.isConfirmed) {
        return res.status(400).json({ message: 'Please confirm your email' });
    }

    // Generate a reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpiration = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send a reset email
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

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate a confirmation token
    const confirmationToken = crypto.randomBytes(20).toString('hex');

    // Create a new user
    const newUser = new User({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        confirmationToken,
    });

    // Save the user to the database
    await newUser.save();

    // Send a confirmation email
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

  // Find the user with the given reset token
  const user = await User.findOne({ resetToken });
  if (!user) {
      return res.status(404).send('User not found');
  } else if (user.resetTokenExpiration < Date.now()) {
      return res.status(400).send('Reset token expired');
  }

  // Render the reset password page
  res.render('reset-password', { resetToken });
});

router.post('/reset-password/:resetToken', async (req, res) => {
    const { resetToken } = req.params;
    const { password } = req.body;

    // Find the user with the given reset token
    const user = await User.findOne({ resetToken });
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    } else if (user.resetTokenExpiration < Date.now()) {
        return res.status(400).json({ message: 'Reset token expired' });
    } else if (!user.isConfirmed) {
        return res.status(400).json({ message: 'Please confirm your email' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update the user's password and reset token
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;
    await user.save();

    res.json({ message: 'Password reset successfully' });
});


router.get('/confirm/:confirmationToken', async (req, res) => {
    const { confirmationToken } = req.params;

    // Find the user with the given confirmation token
    const user = await User.findOne({ confirmationToken });
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }

    // Update the user's isConfirmed field
    user.isConfirmed = true;
    user.confirmationToken = undefined;
    await user.save();

    res.json({ message: 'Email confirmed successfully' });
});

module.exports = router;
