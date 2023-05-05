import e from 'express';
import express from 'express';
import expressAsyncHandler from 'express-async-handler';
import { isAuth, isAdmin } from '../utils.js';

import Blog from '../models/blogModel.js';
import User from '../models/userModel.js';

const blogRouter = express.Router();

blogRouter.get('/', async (req, res) => {
  const blogs = await Blog.find()
    .sort({ createdAt: -1 })
    .populate('user', ['name', 'images', 'bio']);
  res.send(blogs);
});

blogRouter.post(
  '/',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const newBlog = new Blog({
      name: 'sample name ' + Date.now(),
      slug: 'sample-name-' + Date.now(),
      image: '/images/2.png',
      category: 'sample category',
      smallPost: 'sample small post',
      rating: 0,
      numReviews: 0,
      post: 'sample post',
      user: req.user._id,
    });
    const blog = await newBlog.save();
    res.send({ message: 'Blog Created', blog });
  })
);

blogRouter.put(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const blogId = req.params.id;
    const blog = await Blog.findById(blogId);
    if (blog) {
      blog.name = req.body.name;
      blog.slug = req.body.slug;
      blog.image = req.body.image;
      blog.category = req.body.category;
      blog.post = req.body.post;
      blog.smallPost = req.body.smallPost;
      await blog.save();
      res.send({ message: 'Blog Post Updated' });
      res.json('Ok');
    } else {
      res.status(404).send({ message: 'Blog Post Not Found' });
    }
  })
);

blogRouter.delete(
  '/:id',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const product = await Blog.findById(req.params.id);
    if (product) {
      await product.remove();
      res.send({ message: 'Product Deleted' });
    } else {
      res.status(404).send({ message: 'Product Not Found' });
    }
  })
);

blogRouter.post(
  '/:id/reviews',
  isAuth,
  expressAsyncHandler(async (req, res) => {
    const productId = req.params.id;
    const product = await Blog.findById(productId);
    if (product) {
      if (product.reviews.find((x) => x.name === req.user.name)) {
        return res
          .status(400)
          .send({ message: 'You already submitted a review' });
      }

      const review = {
        name: req.user.name,
        comment: req.body.comment,
      };
      product.reviews.push(review);
      product.numReviews = product.reviews.length;
      const updatedProduct = await product.save();
      res.status(201).send({
        message: 'Review Created',
        review: updatedProduct.reviews[updatedProduct.reviews.length - 1],
        numReviews: product.numReviews,
      });
    } else {
      res.status(404).send({ message: 'Product Not Found' });
    }
  })
);

const PAGE_SIZE = 24;

blogRouter.get('/changepage', async (req, res) => {
  const { query } = req;
  const page = query.page || 1;
  const pageSize = query.pageSize || PAGE_SIZE;

  const products = await Blog.find()
    .sort({ createdAt: 1 })
    .skip(pageSize * (page - 1))
    .limit(pageSize);
  const countProducts = await Blog.countDocuments();
  res.send({
    products,
    countProducts,
    page,
    pages: Math.ceil(countProducts / pageSize),
  });
});

blogRouter.get(
  '/admin',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const { query } = req;
    const page = query.page || 1;
    const pageSize = query.pageSize || PAGE_SIZE;
    const userId = req.user._id;
    const products = await Blog.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(pageSize * (page - 1))
      .limit(pageSize);
    const countProducts = await Blog.countDocuments({ user: userId });

    res.send({
      products,
      countProducts,
      page,
      pages: Math.ceil(countProducts / pageSize),
    });
  })
);

blogRouter.get(
  '/super-admin',
  isAuth,
  isAdmin,
  expressAsyncHandler(async (req, res) => {
    const { query } = req;
    const page = query.page || 1;
    const pageSize = query.pageSize || PAGE_SIZE;
    const products = await Blog.find()
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .skip(pageSize * (page - 1))
      .limit(pageSize);
    const countProducts = await Blog.countDocuments().populate('user', 'name');

    res.send({
      products,
      countProducts,
      page,
      pages: Math.ceil(countProducts / pageSize),
    });
  })
);

blogRouter.get(
  '/search',
  expressAsyncHandler(async (req, res) => {
    const { query } = req;
    const pageSize = query.pageSize || PAGE_SIZE;
    const page = query.page || 1;
    const category = query.category || '';
    const price = query.price || '';
    const rating = query.rating || '';
    const order = query.order || '';
    const searchQuery = query.query || '';

    const queryFilter =
      searchQuery && searchQuery !== 'all'
        ? {
            name: {
              $regex: searchQuery,
              $options: 'i',
            },
          }
        : {};
    const categoryFilter = category && category !== 'all' ? { category } : {};
    const ratingFilter =
      rating && rating !== 'all'
        ? {
            rating: {
              $gte: Number(rating),
            },
          }
        : {};
    const priceFilter =
      price && price !== 'all'
        ? {
            // 1-50
            price: {
              $gte: Number(price.split('-')[0]),
              $lte: Number(price.split('-')[1]),
            },
          }
        : {};
    const sortOrder =
      order === 'featured'
        ? { featured: -1 }
        : order === 'lowest'
        ? { price: 1 }
        : order === 'highest'
        ? { price: -1 }
        : order === 'toprated'
        ? { rating: -1 }
        : order === 'newest'
        ? { createdAt: -1 }
        : { _id: -1 };

    const products = await Blog.find({
      ...queryFilter,
      ...categoryFilter,
      ...priceFilter,
      ...ratingFilter,
    })
      .sort(sortOrder)
      .skip(pageSize * (page - 1))
      .limit(pageSize);

    const countProducts = await Blog.countDocuments({
      ...queryFilter,
      ...categoryFilter,
      ...priceFilter,
      ...ratingFilter,
    });
    res.send({
      products,
      countProducts,
      page,
      pages: Math.ceil(countProducts / pageSize),
    });
  })
);

blogRouter.get(
  '/categories',
  expressAsyncHandler(async (req, res) => {
    const categories = await Blog.find().distinct('category');
    res.send(categories);
  })
);

blogRouter.get('/slug/:slug', async (req, res) => {
  const blog = await Blog.findOneAndUpdate(
    { slug: req.params.slug },
    { $inc: { views: 1 } },
    { new: true }
  ).populate('user', ['name', 'images', 'bio']);
  if (blog) {
    res.send(blog);
  } else {
    res.status(404).sendStatus({ message: 'Blogpost Not Found' });
  }
});

blogRouter.get('/:id', async (req, res) => {
  const blog = await Blog.findById({ _id: req.params.id });
  if (blog) {
    res.send(blog);
  } else {
    res.status(404).sendStatus({ message: 'Blogpost Not Found' });
  }
});

export default blogRouter;
