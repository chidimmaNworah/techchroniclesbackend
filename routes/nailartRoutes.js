import e from 'express';
import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import { isAuth, isAdmin } from '../utils.js';

import Nailart from '../models/nailartModel.js';

const nailartRouter = express.Router();

nailartRouter.get('/', async (req, res) => {
  const nailarts = await Nailart.find();
  res.send(nailarts);
});

nailartRouter.post(
  '/',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const newProduct = new Nailart({
      name: 'sample name ' + Date.now(),
      slug: 'sample-name-' + Date.now(),
      image: '/images/2.png',
      price: 0,
      category: 'sample category',
      brand: 'sample brand',
      countInStock: 0,
      rating: 0,
      numReviews: 0,
      description: 'sample description',
    });
    const product = await newProduct.save();
    res.send({ message: 'Nailart Created', product });
  })
);

nailartRouter.put(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const productId = req.params.id;
    const product = await Nailart.findById(productId);
    if (product) {
      product.name = req.body.name;
      product.slug = req.body.slug;
      product.price = req.body.price;
      product.image = req.body.image;
      product.images = req.body.images;
      product.category = req.body.category;
      product.brand = req.body.brand;
      product.countInStock = req.body.countInStock;
      product.description = req.body.description;
      await product.save();
      res.send({ message: 'Nailart Updated' });
    } else {
      res.status(404).send({ message: 'Nailart Not Found' });
    }
  })
);

nailartRouter.delete(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const nailart = await Nailart.findById(req.params.id);
    if (nailart) {
      await nailart.remove();
      res.send({ message: 'Nailart Deleted' });
    } else {
      res.status(404).send({ message: 'Nailart Not Found' });
    }
  })
);

nailartRouter.post(
  '/:id/reviews',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const nailartId = req.params.id;
    const nailart = await Nailart.findById(nailartId);
    if (nailart) {
      if (nailart.reviews.find((x) => x.name === req.user.name)) {
        return res
          .status(400)
          .send({ message: 'You already submitted a review' });
      }

      const review = {
        name: req.user.name,
        rating: Number(req.body.rating),
        comment: req.body.comment,
      };
      nailart.reviews.push(review);
      nailart.numReviews = nailart.reviews.length;
      nailart.rating =
        nailart.reviews.reduce((a, c) => c.rating + a, 0) /
        nailart.reviews.length;
      const updatedNailart = await nailart.save();
      res.status(201).send({
        message: 'Review Created',
        review: updatedNailart.reviews[updatedNailart.reviews.length - 1],
        numReviews: nailart.numReviews,
        rating: nailart.rating,
      });
    } else {
      res.status(404).send({ message: 'Product Not Found' });
    }
  })
);

const PAGE_SIZE = 24;

nailartRouter.get('/changepage', async (req, res) => {
  const { query } = req;
  const page = query.page || 1;
  const pageSize = query.pageSize || PAGE_SIZE;

  const nailarts = await Nailart.find()
    .skip(pageSize * (page - 1))
    .limit(pageSize);
  const countNailarts = await Nailart.countDocuments();
  res.send({
    nailarts,
    countNailarts,
    page,
    pages: Math.ceil(countNailarts / pageSize),
  });
});

nailartRouter.get(
  '/admin',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const { query } = req;
    const page = query.page || 1;
    const pageSize = query.pageSize || PAGE_SIZE;

    const nailarts = await Nailart.find()
      .skip(pageSize * (page - 1))
      .limit(pageSize);
    const countNailarts = await Nailart.countDocuments();
    res.send({
      nailarts,
      countNailarts,
      page,
      pages: Math.ceil(countNailarts / pageSize),
    });
  })
);

nailartRouter.get(
  '/categories',
  expressAsyncHandler(async (req, res) => {
    const categories = await Nailart.find().distinct('category');
    res.send(categories);
  })
);

nailartRouter.get('/slug/:slug', async (req, res) => {
  const nailart = await Nailart.findOne({ slug: req.params.slug });
  if (nailart) {
    res.send(nailart);
  } else {
    res.status(404).sendStatus({ message: 'Nailart Not Found' });
  }
});

nailartRouter.get('/:id', async (req, res) => {
  const nailart = await Nailart.findById(req.params.id);
  if (nailart) {
    res.send(nailart);
  } else {
    res.status(404).sendStatus({ message: 'Nailart Not Found' });
  }
});

export default nailartRouter;
