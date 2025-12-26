const products = [
  // --- NEW VARIANT PRODUCT (Similar to your screenshot) ---
  {
    name: 'Organic Baby Kimono Suit',
    image: '/images/daurasuruwal.jpg', // Default/Main image
    description:
      'Soft, breathable organic cotton kimono style suit. Perfect for newborns and sensitive skin. Features easy-tie strings.',
    brand: 'Nevan Baby',
    category: 'Clothing',
    price: 2850, // Display price (used for filtering/sorting)
    countInStock: 10, // Total stock (optional usage)
    rating: 5,
    numReviews: 4,
    variants: [
      // GREEN VARIANTS
      {
        size: 'S (0-3m)',
        color: 'Green',
        image: '/images/daurasuruwal.jpg',
        price: 2850,
        countInStock: 5,
      },
      {
        size: 'M (3-6m)',
        color: 'Green',
        image: '/images/daurasuruwal.jpg',
        price: 2850,
        countInStock: 3,
      },
      {
        size: 'L (6-12m)',
        color: 'Green',
        image: '/images/daurasuruwal.jpg',
        price: 2950, // Price increase for larger size
        countInStock: 0, // Out of stock test
      },

      // BLUE VARIANTS
      {
        size: 'S (0-3m)',
        color: 'Blue',
        image: '/images/daurasuruwal.jpg',
        price: 2850,
        countInStock: 8,
      },
      {
        size: 'M (3-6m)',
        color: 'Blue',
        image: '/images/daurasuruwal.jpg',
        price: 2850,
        countInStock: 2,
      },

      // PURPLE VARIANTS
      {
        size: 'S (0-3m)',
        color: 'Purple',
        image: '/images/daurasuruwal.jpg',
        price: 2850,
        countInStock: 6,
      },
    ],
  },
];

export default products;
