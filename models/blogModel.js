import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    comment: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

const blogpostSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    image: { type: String, required: true, index: true },
    images: [String],
    category: { type: String, required: true },
    post: { type: String },
    smallPost: { type: String, required: true },
    rating: { type: Number, required: true },
    numReviews: { type: Number, required: true },
    views: { type: Number },
    reviews: [reviewSchema],
  },
  {
    timestamps: true,
  }
);

const Blog = mongoose.model('Blogpost', blogpostSchema);
export default Blog;
