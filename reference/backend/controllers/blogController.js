import asyncHandler from '../middleware/asyncHandler.js';
import Blog from '../models/blogModel.js';

// ... getBlogs remains the same ...
const getBlogs = asyncHandler(async (req, res) => {
  const blogs = await Blog.find({});
  res.json(blogs);
});

// UPDATE THIS FUNCTION
const getBlogById = asyncHandler(async (req, res) => {
  // We use .populate('products') to replace the IDs with actual Product data (name, image, price)
  const blog = await Blog.findById(req.params.id).populate(
    'products',
    'name image price _id'
  );

  if (blog) {
    return res.json(blog);
  }
  res.status(404);
  throw new Error('Blog not found');
});

// ... createBlog remains the same ...
const createBlog = asyncHandler(async (req, res) => {
  const blog = new Blog({
    title: 'Sample Blog',
    user: req.user._id,
    image: '/images/sample.jpg',
    description: 'Sample description',
    content: 'Sample content',
    products: [], // Initialize empty
  });
  const createdBlog = await blog.save();
  res.status(201).json(createdBlog);
});

// UPDATE THIS FUNCTION
const updateBlog = asyncHandler(async (req, res) => {
  // Get products from the body
  const { title, description, image, content, products } = req.body;

  const blog = await Blog.findById(req.params.id);

  if (blog) {
    blog.title = title;
    blog.description = description;
    blog.image = image;
    blog.content = content;
    // Update products if provided
    if (products) {
      blog.products = products;
    }

    const updatedBlog = await blog.save();
    res.json(updatedBlog);
  } else {
    res.status(404);
    throw new Error('Blog not found');
  }
});

// ... deleteBlog remains the same ...
const deleteBlog = asyncHandler(async (req, res) => {
  const blog = await Blog.findById(req.params.id);
  if (blog) {
    await Blog.deleteOne({ _id: blog._id });
    res.json({ message: 'Blog removed' });
  } else {
    res.status(404);
    throw new Error('Blog not found');
  }
});

export { getBlogs, getBlogById, createBlog, updateBlog, deleteBlog };
