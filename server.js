import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import mongoose from 'mongoose';
import blogRouter from './routes/blogRoutes.js';
import userRouter from './routes/userRoutes.js';
import newsletterRouter from './routes/newsletterRoutes.js';
import uploadRouter from './routes/uploadRoutes.js';
import cors from 'cors';
import Stripe from 'stripe';

dotenv.config();

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('connected to db');
  })
  .catch((err) => {
    console.log(err.message);
  });

const app = express();

// app.use(
//   cors({
//     origin: 'https://www.kimmotech.blog',
//     credentials: true,
//   })
// );

app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  })
);

const stripe = new Stripe(process.env.SECRET_KEY);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/keys/paypal', (req, res) => {
  res.send(process.env.PAYPAL_CLIENT_ID || 'sb');
});
app.post('/api/keys/stripe-payment', (req, res) => {
  let status, error;
  const { token, amount } = req.body;
  console.log(token);
});
app.get('/api/keys/google', (req, res) => {
  res.send({ key: process.env.GOOGLE_API_KEY || '' });
});
app.use('/api/upload', uploadRouter);
app.use('/api/blogs', blogRouter);
app.use('/api/users', userRouter);
app.use('/api/newsletter', newsletterRouter);

app.use((err, req, res, next) => {
  res.status(500).send({ message: err.message });
});

const port = process.env.PORT || 5111;
app.listen(port, () => {
  console.log(`serve at http://localhost:${port}`);
});
