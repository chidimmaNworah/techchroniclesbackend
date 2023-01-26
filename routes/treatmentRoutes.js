import e from 'express';
import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import { isAuth, isAdmin } from '../utils.js';

import Treatment from '../models/treatmentModel.js';

const treatmentRouter = express.Router();

treatmentRouter.get('/', async (req, res) => {
  const treatments = await Treatment.find().sort({ createdAt: 1 });
  res.send(treatments);
});

treatmentRouter.post(
  '/',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const newProduct = new Treatment({
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
    res.send({ message: 'Treatment Created', product });
  })
);

treatmentRouter.put(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const productId = req.params.id;
    const product = await Treatment.findById(productId);
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
      res.send({ message: 'Treatment Updated' });
    } else {
      res.status(404).send({ message: 'Treatment Not Found' });
    }
  })
);

treatmentRouter.delete(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const treatment = await Treatment.findById(req.params.id);
    if (treatment) {
      await treatment.remove();
      res.send({ message: 'Treatment Deleted' });
    } else {
      res.status(404).send({ message: 'Treatment Not Found' });
    }
  })
);

treatmentRouter.post(
  '/:id/reviews',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const treatmentId = req.params.id;
    const treatment = await Treatment.findById(treatmentId);
    if (treatment) {
      if (treatment.reviews.find((x) => x.name === req.user.name)) {
        return res
          .status(400)
          .send({ message: 'You already submitted a review' });
      }

      const review = {
        name: req.user.name,
        rating: Number(req.body.rating),
        comment: req.body.comment,
      };
      treatment.reviews.push(review);
      treatment.numReviews = treatment.reviews.length;
      treatment.rating =
        treatment.reviews.reduce((a, c) => c.rating + a, 0) /
        treatment.reviews.length;
      const updatedTreatment = await treatment.save();
      res.status(201).send({
        message: 'Review Created',
        review: updatedTreatment.reviews[updatedTreatment.reviews.length - 1],
        numReviews: treatment.numReviews,
        rating: treatment.rating,
      });
    } else {
      res.status(404).send({ message: 'Product Not Found' });
    }
  })
);

const PAGE_SIZE = 24;

treatmentRouter.get('/changepage', async (req, res) => {
  const { query } = req;
  const page = query.page || 1;
  const pageSize = query.pageSize || PAGE_SIZE;

  const treatments = await Treatment.find()
    .sort({ createdAt: 1 })
    .skip(pageSize * (page - 1))
    .limit(pageSize);
  const countTreatments = await Treatment.countDocuments();
  res.send({
    treatments,
    countTreatments,
    page,
    pages: Math.ceil(countTreatments / pageSize),
  });
});

treatmentRouter.get(
  '/admin',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const { query } = req;
    const page = query.page || 1;
    const pageSize = query.pageSize || PAGE_SIZE;

    const treatments = await Treatment.find()
      .skip(pageSize * (page - 1))
      .limit(pageSize);
    const countTreatments = await Treatment.countDocuments();
    res.send({
      treatments,
      countTreatments,
      page,
      pages: Math.ceil(countTreatments / pageSize),
    });
  })
);

treatmentRouter.get(
  '/categories',
  expressAsyncHandler(async (req, res) => {
    const categories = await Treatment.find().distinct('category');
    res.send(categories);
  })
);

treatmentRouter.get('/slug/:slug', async (req, res) => {
  const treatment = await Treatment.findOne({ slug: req.params.slug });
  if (treatment) {
    res.send(treatment);
  } else {
    res.status(404).sendStatus({ message: 'Treatment Not Found' });
  }
});

treatmentRouter.get('/:id', async (req, res) => {
  const treatment = await Treatment.findById(req.params.id);
  if (treatment) {
    res.send(treatment);
  } else {
    res.status(404).sendStatus({ message: 'Treatment Not Found' });
  }
});

export default treatmentRouter;
