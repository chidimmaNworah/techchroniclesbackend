import e from 'express';
import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import { isAuth, isAdmin } from '../utils.js';

import Discount from '../models/discountModel.js';

const discountRouter = express.Router();

discountRouter.get('/', async (req, res) => {
  const discounts = await Discount.find().sort({ createdAt: 1 });
  res.send(discounts);
});

discountRouter.post(
  '/',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const newProduct = new Discount({
      name: 'sample name ' + Date.now(),
      slug: 'sample-name-' + Date.now(),
      image: '/images/2.png',
      price: 0,
      discount: 40,
      category: 'sample category',
      brand: 'sample brand',
      countInStock: 0,
      rating: 0,
      numReviews: 0,
      description: 'sample description',
    });
    const product = await newProduct.save();
    res.send({ message: 'Discount Created', product });
  })
);

discountRouter.put(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const productId = req.params.id;
    const product = await Discount.findById(productId);
    if (product) {
      product.name = req.body.name;
      product.slug = req.body.slug;
      product.price = req.body.price;
      product.discount = req.body.discount;
      product.image = req.body.image;
      product.images = req.body.images;
      product.category = req.body.category;
      product.brand = req.body.brand;
      product.countInStock = req.body.countInStock;
      product.description = req.body.description;
      await product.save();
      res.send({ message: 'Discount Updated' });
    } else {
      res.status(404).send({ message: 'Discount Not Found' });
    }
  })
);

discountRouter.delete(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const discount = await Discount.findById(req.params.id);
    if (discount) {
      await discount.remove();
      res.send({ message: 'Discount Deleted' });
    } else {
      res.status(404).send({ message: 'Discount Not Found' });
    }
  })
);

discountRouter.post(
  '/:id/reviews',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const discountId = req.params.id;
    const discount = await Discount.findById(discountId);
    if (discount) {
      if (discount.reviews.find((x) => x.name === req.user.name)) {
        return res
          .status(400)
          .send({ message: 'You already submitted a review' });
      }

      const review = {
        name: req.user.name,
        rating: Number(req.body.rating),
        comment: req.body.comment,
      };
      discount.reviews.push(review);
      discount.numReviews = discount.reviews.length;
      discount.rating =
        discount.reviews.reduce((a, c) => c.rating + a, 0) /
        discount.reviews.length;
      const updatedDiscount = await discount.save();
      res.status(201).send({
        message: 'Review Created',
        review: updatedDiscount.reviews[updatedDiscount.reviews.length - 1],
        numReviews: discount.numReviews,
        rating: discount.rating,
      });
    } else {
      res.status(404).send({ message: 'Discount Not Found' });
    }
  })
);

const PAGE_SIZE = 24;

discountRouter.get('/changepage', async (req, res) => {
  const { query } = req;
  const page = query.page || 1;
  const pageSize = query.pageSize || PAGE_SIZE;

  const discounts = await Discount.find()
    .sort({ createdAt: 1 })
    .skip(pageSize * (page - 1))
    .limit(pageSize);
  const countDiscounts = await Discount.countDocuments();
  res.send({
    discounts,
    countDiscounts,
    page,
    pages: Math.ceil(countDiscounts / pageSize),
  });
});

discountRouter.get(
  '/admin',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const { query } = req;
    const page = query.page || 1;
    const pageSize = query.pageSize || PAGE_SIZE;

    const discounts = await Discount.find()
      .skip(pageSize * (page - 1))
      .limit(pageSize);
    const countDiscounts = await Discount.countDocuments();
    res.send({
      discounts,
      countDiscounts,
      page,
      pages: Math.ceil(countDiscounts / pageSize),
    });
  })
);

discountRouter.get(
  '/categories',
  expressAsyncHandler(async (req, res) => {
    const categories = await Discount.find().distinct('category');
    res.send(categories);
  })
);

discountRouter.get('/slug/:slug', async (req, res) => {
  const discount = await Discount.findOne({ slug: req.params.slug });
  if (discount) {
    res.send(discount);
  } else {
    res.status(404).sendStatus({ message: 'Discount Not Found' });
  }
});

discountRouter.get('/:id', async (req, res) => {
  const discount = await Discount.findById(req.params.id);
  if (discount) {
    res.send(discount);
  } else {
    res.status(404).sendStatus({ message: 'Discount Not Found' });
  }
});

export default discountRouter;
