import express from 'express';
import User from '../models/userModel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  generateEmailTemplate,
  generateToken,
  isAdmin,
  isAuth,
  mailTransport,
  passwordResetEmail,
  passwordResetMail,
} from '../utils.js';
import expressAsyncHandler from 'express-async-handler';
import Message from '../models/messageModel.js';
import VerificationToken from '../models/verificationTokenModel.js';
import { isValidObjectId } from 'mongoose';
import crypto from 'crypto';
import dotenv from 'dotenv';
dotenv.config();

const userRouter = express.Router();

userRouter.get(
  '/',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const users = await User.find({});
    res.send(users);
  })
);

userRouter.get(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const adminUser = await User.findOne({
      email: 'nailsrepublicofficial@gmail.com',
    });
    const user = await User.findById(req.params.id);
    if (adminUser) {
      res.send(user);
    } else {
      res.status(404).send({
        message:
          'You cannot access this user because you are not an admin manager',
      });
    }
  })
);

userRouter.put(
  '/profile',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.images = req.body.images;
      user.bio = req.body.bio;
      if (req.body.password) {
        user.password = bcrypt.hashSync(req.body.password, 8);
      }
      if (bcrypt.compareSync(req.body.confirmPassword, user.password)) {
        const updatedUser = await user.save();
        res.send({
          _id: updatedUser._id,
          name: updatedUser.name,
          email: updatedUser.email,
          image: updatedUser.image,
          bio: updatedUser.bio,
          isAdmin: updatedUser.isAdmin,
          token: generateToken(updatedUser),
        });
      }
    } else {
      res.status(404).send({ message: 'User not found' });
    }
  })
);

userRouter.put(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (user) {
      user.name = req.body.name || user.name;
      user.email = req.body.email || user.email;
      user.isAdmin = Boolean(req.body.isAdmin);
      const updatedUser = await user.save();
      res.send({ message: 'User Updated', user: updatedUser });
    } else {
      res.status(404).send({ message: 'User Not Found' });
    }
  })
);

userRouter.delete(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);
    if (user) {
      if (user.email === 'chidimmanworah12@gmail.com') {
        res.status(400).send({ message: 'Can Not Delete Admin User' });
        return;
      }
      await user.remove();
      res.send({ message: 'User Deleted' });
    } else {
      res.status(404).send({ message: 'User Not Found' });
    }
  })
);

userRouter.post(
  '/signin',
  expressAsyncHandler(async (req, res) => {
    const user = await User.findOne({ email: req.body.email });
    if (!user.verified) {
      let verifyToken = await VerificationToken.findOne({ userId: user._id });

      if (!verifyToken) {
        verifyToken = await new VerificationToken({
          userId: user._id,
          token: crypto.randomBytes(32).toString('hex'),
        }).save();

        const url = `${process.env.BASE_URL}/${user._id}/verify/${verifyToken.token}`;
        await mailTransport(
          user.email,
          'Verify Your Email',
          generateEmailTemplate(url)
        );
      }
      return res.status(400).send({
        message:
          'A verification link has been sent to your email, please confirm and try again',
      });
    }
    if (user) {
      if (bcrypt.compareSync(req.body.password, user.password)) {
        res.send({
          _id: user._id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin,
          verified: user.verified,
          token: generateToken(user),
        });
        return;
      }
    }
    res.status(401).send({ message: 'Invalid email or password' });
  })
);

userRouter.post(
  '/message',
  expressAsyncHandler(async (req, res) => {
    const newUser = new Message({
      name: req.body.name,
      email: req.body.email,
      subject: req.body.subject,
      message: req.body.message,
    });
    const user = await newUser.save();
    res.send({
      message: 'Message Sent',
      user,
    });
  })
);

userRouter.post(
  '/forgot-password',
  expressAsyncHandler(async (req, res) => {
    try {
      const user = await User.findOne({ email: req.body.email });

      if (!user) {
        return res.send('User does not exist');
      }

      const verifyToken = await new VerificationToken({
        userId: user._id,
        token: crypto.randomBytes(32).toString('hex'),
      }).save();

      const url = `${process.env.BASE_URL}/${verifyToken.userId}/password-reset/${verifyToken.token}`;
      console.log(url);
      await passwordResetMail(
        user.email,
        'Password Reset',
        passwordResetEmail(url)
      );

      return res.status(201).send({
        message:
          'A verification link has been sent to your email, please confirm and try again',
      });
    } catch (error) {
      res.status(400).send({ message: 'error somewhere' });
      console.log(error);
    }
  })
);

userRouter.get('/:id/password-reset/:token', async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id });
    if (!user)
      return res.status(400).send({ message: 'Invalid Link with no user' });

    const verificationToken = await VerificationToken.findOne({
      userId: user._id,
      token: req.params.token,
    });

    if (!verificationToken)
      return res
        .status(400)
        .send({ message: 'Invalid link with no verification token' });

    res.send('user verified');
  } catch (error) {
    res.status(500).send({ message: 'Internal Server Error' });
    console.log(error);
  }
});

userRouter.post('/:id/password-reset/:token', async (req, res) => {
  try {
    const user = await User.findById({ _id: req.params.id });
    if (!user)
      return res.status(400).send({ message: 'Invalid Link with no user' });

    const verificationToken = await VerificationToken.findOne({
      userId: user._id,
      token: req.params.token,
    });

    if (!verificationToken)
      return res
        .status(400)
        .send({ message: 'Invalid link with no verification token' });

    await User.updateOne(
      { _id: user._id },
      { password: bcrypt.hashSync(req.body.password, 8) }
    );

    res.status(200).send({ message: 'password changed' });

    // await verificationToken.remove();
  } catch (error) {
    res.status(500).send({ message: 'Internal Server Error' });
    console.log(error);
  }
});

userRouter.post(
  '/signup',
  expressAsyncHandler(async (req, res) => {
    try {
      const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        password: bcrypt.hashSync(req.body.password, 8),
      });
      const user = await newUser.save();

      if (!user && user.verified === false)
        return res
          .status(400)
          .send({ message: 'User Already exists, Sign in to continue' });

      const verifyToken = await new VerificationToken({
        userId: user._id,
        token: crypto.randomBytes(32).toString('hex'),
      }).save();

      const url = `${process.env.BASE_URL}/${verifyToken.userId}/verify/${verifyToken.token}`;

      await mailTransport(user.email, 'Verify Your Email', url);

      res.status(201).send({
        message:
          'A verification link has been sent to your account, please verify ',
      });
    } catch (error) {
      res.status(500).send({ message: 'Internal Server Error' });
    }
  })
);

userRouter.get('/:id/verify/:token', async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id });
    if (!user)
      return res.status(400).send({ message: 'Invalid Link with no user' });

    const verificationToken = await VerificationToken.findOne({
      userId: user._id,
      token: req.params.token,
    });

    if (!verificationToken)
      return res
        .status(400)
        .send({ message: 'Invalid link with no verification token' });

    await User.updateOne({ _id: user._id }, { verified: true });

    if (user.verified === true) {
      res.status(200).send({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        verified: user.verified,
        token: generateToken(user),
        message: 'Email verified successfully',
      });
    }

    await verificationToken.remove();
  } catch (error) {
    res.status(500).send({ message: 'Internal Server Error' });
    console.log(error);
  }
});

export default userRouter;
