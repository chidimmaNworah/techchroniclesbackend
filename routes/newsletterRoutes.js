import express from 'express';
import Newsletter from '../models/newsletterModel.js';
import { isAdmin, isAuth } from '../utils.js';
import expressAsyncHandler from 'express-async-handler';
import dotenv from 'dotenv';
dotenv.config();

const newsletterRouter = express.Router();

newsletterRouter.get(
  '/',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const users = await Newsletter.find({});
    res.send(users);
  })
);

// userRouter.delete(
//   '/:id',
//   isAuth,
//   isAdmin,
//   expressAsyncHandler(async (req, res) => {
//     const user = await User.findById(req.params.id);
//     if (user) {
//       if (user.email === 'chidimmanworah12@gmail.com') {
//         res.status(400).send({ message: 'Can Not Delete Admin User' });
//         return;
//       }
//       await user.remove();
//       res.send({ message: 'User Deleted' });
//     } else {
//       res.status(404).send({ message: 'User Not Found' });
//     }
//   })
// );

newsletterRouter.post(
  '/signup',
  expressAsyncHandler(async (req, res) => {
    try {
      const newUser = new Newsletter({
        email: req.body.email,
      });
      const user = await newUser.save();

      res.status(201).send({
        message: 'Newsletter User, added successfully!',
        user,
      });
    } catch (error) {
      res.status(500).send({ message: 'Internal Server Error' });
    }
  })
);

export default newsletterRouter;
