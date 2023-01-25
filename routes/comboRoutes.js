import e from 'express';
import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import { isAuth, isAdmin } from '../utils.js';

import Combo from '../models/comboModel.js';

const comboRouter = express.Router();

comboRouter.get('/', async (req, res) => {
  const combos = await Combo.find();
  res.send(combos);
});

comboRouter.post(
  '/',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const newProduct = new Combo({
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
    res.send({ message: 'Combo Created', product });
  })
);

comboRouter.put(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const productId = req.params.id;
    const product = await Combo.findById(productId);
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
      res.send({ message: 'Combo Updated' });
    } else {
      res.status(404).send({ message: 'Combo Not Found' });
    }
  })
);

comboRouter.delete(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const combo = await Combo.findById(req.params.id);
    if (combo) {
      await combo.remove();
      res.send({ message: 'Combo Deleted' });
    } else {
      res.status(404).send({ message: 'Combo Not Found' });
    }
  })
);

comboRouter.post(
  '/:id/reviews',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const comboId = req.params.id;
    const combo = await Combo.findById(comboId);
    if (combo) {
      if (combo.reviews.find((x) => x.name === req.user.name)) {
        return res
          .status(400)
          .send({ message: 'You already submitted a review' });
      }

      const review = {
        name: req.user.name,
        rating: Number(req.body.rating),
        comment: req.body.comment,
      };
      combo.reviews.push(review);
      combo.numReviews = combo.reviews.length;
      combo.rating =
        combo.reviews.reduce((a, c) => c.rating + a, 0) / combo.reviews.length;
      const updatedCombo = await combo.save();
      res.status(201).send({
        message: 'Review Created',
        review: updatedCombo.reviews[updatedCombo.reviews.length - 1],
        numReviews: combo.numReviews,
        rating: combo.rating,
      });
    } else {
      res.status(404).send({ message: 'Product Not Found' });
    }
  })
);

const PAGE_SIZE = 24;

comboRouter.get('/changepage', async (req, res) => {
  const { query } = req;
  const page = query.page || 1;
  const pageSize = query.pageSize || PAGE_SIZE;

  const combos = await Combo.find()
    .skip(pageSize * (page - 1))
    .limit(pageSize);
  const countCombos = await Combo.countDocuments();
  res.send({
    combos,
    countCombos,
    page,
    pages: Math.ceil(countCombos / pageSize),
  });
});

comboRouter.get(
  '/admin',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const { query } = req;
    const page = query.page || 1;
    const pageSize = query.pageSize || PAGE_SIZE;

    const combos = await Combo.find()
      .skip(pageSize * (page - 1))
      .limit(pageSize);
    const countCombos = await Combo.countDocuments();
    res.send({
      combos,
      countCombos,
      page,
      pages: Math.ceil(countCombos / pageSize),
    });
  })
);

comboRouter.get(
  '/categories',
  expressAsyncHandler(async (req, res) => {
    const categories = await Combo.find().distinct('category');
    res.send(categories);
  })
);

comboRouter.get('/slug/:slug', async (req, res) => {
  const combo = await Combo.findOne({ slug: req.params.slug });
  if (combo) {
    res.send(combo);
  } else {
    res.status(404).sendStatus({ message: 'Combo Not Found' });
  }
});

comboRouter.get('/:id', async (req, res) => {
  const combo = await Combo.findById(req.params.id);
  if (combo) {
    res.send(combo);
  } else {
    res.status(404).sendStatus({ message: 'Combo Not Found' });
  }
});

export default comboRouter;
