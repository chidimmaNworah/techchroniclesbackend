import e from 'express';
import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import { isAuth, isAdmin } from '../utils.js';

import Tools from '../models/toolModel.js';

const toolRouter = express.Router();

toolRouter.get('/', async (req, res) => {
  const tools = await Tools.find();
  res.send(tools);
});

toolRouter.post(
  '/',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const newProduct = new Tools({
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
    res.send({ message: 'Tools Created', product });
  })
);

toolRouter.put(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const productId = req.params.id;
    const product = await Tools.findById(productId);
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
      res.send({ message: 'Tools Updated' });
    } else {
      res.status(404).send({ message: 'Tool Not Found' });
    }
  })
);

toolRouter.delete(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const tool = await Tools.findById(req.params.id);
    if (tool) {
      await tool.remove();
      res.send({ message: 'tool Deleted' });
    } else {
      res.status(404).send({ message: 'tool Not Found' });
    }
  })
);

toolRouter.post(
  '/:id/reviews',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const toolId = req.params.id;
    const tool = await Tools.findById(toolId);
    if (tool) {
      if (tool.reviews.find((x) => x.name === req.user.name)) {
        return res
          .status(400)
          .send({ message: 'You already submitted a review' });
      }

      const review = {
        name: req.user.name,
        rating: Number(req.body.rating),
        comment: req.body.comment,
      };
      tool.reviews.push(review);
      tool.numReviews = tool.reviews.length;
      tool.rating =
        tool.reviews.reduce((a, c) => c.rating + a, 0) / tool.reviews.length;
      const updatedTool = await tool.save();
      res.status(201).send({
        message: 'Review Created',
        review: updatedTool.reviews[updatedTool.reviews.length - 1],
        numReviews: tool.numReviews,
        rating: tool.rating,
      });
    } else {
      res.status(404).send({ message: 'Product Not Found' });
    }
  })
);

const PAGE_SIZE = 24;

toolRouter.get('/changepage', async (req, res) => {
  const { query } = req;
  const page = query.page || 1;
  const pageSize = query.pageSize || PAGE_SIZE;

  const tools = await Tools.find()
    .skip(pageSize * (page - 1))
    .limit(pageSize);
  const countTools = await Tools.countDocuments();
  res.send({
    tools,
    countTools,
    page,
    pages: Math.ceil(countTools / pageSize),
  });
});

toolRouter.get(
  '/admin',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const { query } = req;
    const page = query.page || 1;
    const pageSize = query.pageSize || PAGE_SIZE;

    const tools = await Tools.find()
      .skip(pageSize * (page - 1))
      .limit(pageSize);
    const countTools = await Tools.countDocuments();
    res.send({
      tools,
      countTools,
      page,
      pages: Math.ceil(countTools / pageSize),
    });
  })
);

toolRouter.get(
  '/categories',
  expressAsyncHandler(async (req, res) => {
    const categories = await Tools.find().distinct('category');
    res.send(categories);
  })
);

toolRouter.get('/slug/:slug', async (req, res) => {
  const tool = await Tools.findOne({ slug: req.params.slug });
  if (tool) {
    res.send(tool);
  } else {
    res.status(404).sendStatus({ message: 'Tool Not Found' });
  }
});

toolRouter.get('/:id', async (req, res) => {
  const tool = await Tools.findById(req.params.id);
  if (tool) {
    res.send(tool);
  } else {
    res.status(404).sendStatus({ message: 'Tool Not Found' });
  }
});

export default toolRouter;
