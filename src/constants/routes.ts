/**
 * Application route constants
 */
export const ROUTES = {
  // Main pages
  HOME: '/',
  SEARCH: '/search',
  TRENDS: '/trends',
  COMPARE: '/compare',
  PRICES: '/prices',
  ABOUT: '/about',
  CONTACT: '/contact',
  PRIVACY: '/privacy',
  TERMS: '/terms',
  PRODUCT: '/product/:id',

  // Helper function to generate product page URL with ID
  getProductRoute: (id: string | number) => `/product/${id}`,
};
