import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import mongoose from 'mongoose';
import blogRouter from './routes/blogRoutes.js';
import userRouter from './routes/userRoutes.js';
import orderRouter from './routes/orderRoutes.js';
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

app.use(
  cors({
    origin: 'https://techchronicles.vercel.app',
    credentials: true,
  })
);

// app.use(
//   cors({
//     origin: 'http://localhost:',
//     credentials: true,
//   })
// );

// app.use((req, res, next) => {
//   res.setHeader(
//     'Access-Control-Allow-Origin',
//     'https://www.nailsrepublic.shop'
//   );
//   res.header(
//     'Access-Control-Allow-Headers',
//     'Origin, X-Requested-With, Content-Type, Accept'
//   );
//   next();
// });

// app.use((req, res, next) => {
//   res.header('Access-Control-Allow-Origin', '*');
//   res.header(
//     'Access-Control-Allow-Headers',
//     'Origin,X-Requested-With,Content-Type,Accept,Authorization'
//   );
//   if (req.method === 'OPTIONS') {
//     res.header('Access-Control-Allow-Methods', 'PUT,POST,PATCH,DELETE');
//     return res.status(200).json({});
//   }
//   next();
// });

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
app.use('/api/orders', orderRouter);

app.use((err, req, res, next) => {
  res.status(500).send({ message: err.message });
});

const port = process.env.PORT || 5111;
app.listen(port, () => {
  console.log(`serve at http://localhost:${port}`);
});
