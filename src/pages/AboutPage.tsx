import React from 'react';
import { motion } from 'framer-motion';
import { FiAward, FiBarChart2, FiUsers, FiTrendingUp, FiCheckCircle } from 'react-icons/fi';
import AnimatedCircles from '../components/ui/AnimatedCircles';
import useSEO from '../hooks/useSEO';

const AboutPage: React.FC = () => {
  useSEO({ title: 'About', description: 'Learn about ProductWhisper — Nigeria\'s price comparison platform helping shoppers find the best deals and avoid scams.' });
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <AnimatedCircles variant="mixed" count={10} />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
      >
        {/* Hero Section */}
        <div className="relative mb-16 bg-gradient-primary rounded-2xl overflow-hidden shadow-lg">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-secondary/30 blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-accent/20 blur-3xl"></div>
          </div>

          <div className="relative z-10 px-6 py-16 sm:px-12 sm:py-20 text-center">
            <motion.h1
              className="text-3xl md:text-5xl font-display font-bold text-white mb-4"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              About ProductWhisper
            </motion.h1>
            <motion.p
              className="text-white/80 text-lg max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.4 }}
            >
              Transforming how people discover and choose products through advanced sentiment analysis
            </motion.p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16 -mt-24">
          {[
            { icon: FiUsers, value: "3", label: "Platforms Tracked", color: "primary" },
            { icon: FiBarChart2, value: "100+", label: "Nigerian Pidgin Terms", color: "secondary" },
            { icon: FiAward, value: "5", label: "Trust Score Factors", color: "accent" },
            { icon: FiTrendingUp, value: "Real-time", label: "Price Monitoring", color: "primary" }
          ].map((stat, index) => (
            <motion.div
              key={index}
              className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + (index * 0.1) }}
              whileHover={{ y: -5, boxShadow: "0 15px 30px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
            >
              <div className={`bg-${stat.color}/10 p-4 rounded-full mb-4 text-${stat.color}`}>
                <stat.icon size={24} />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</h3>
              <p className="text-gray-600">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Mission and Values Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          <motion.div
            className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 relative overflow-hidden"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-tr-full"></div>

            <div className="flex items-center mb-6">
              <div className="bg-primary/10 p-3 rounded-full text-primary mr-4">
                <FiCheckCircle size={24} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 font-display">Our Mission</h2>
            </div>

            <div className="space-y-4 relative z-10">
              <p className="text-gray-700">
                ProductWhisper helps Nigerian consumers make smarter purchasing decisions by aggregating and analyzing
                product data across Jumia, Konga, and Jiji. Our AI-powered sentiment engine understands Nigerian
                Pidgin and local buying patterns to give you the real story behind any product.
              </p>
              <p className="text-gray-700">
                We monitor prices, detect scam listings, analyze vendor reliability, and surface authentic user
                sentiment so you can shop with confidence across Nigerian e-commerce platforms.
              </p>

              <div className="pt-4 mt-4 border-t border-gray-100">
                <h3 className="font-medium text-gray-900 mb-3">Our Core Values</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    "Nigerian Market Focus",
                    "Scam Detection",
                    "Price Transparency",
                    "Vendor Trust Scoring"
                  ].map((value, i) => (
                    <div key={i} className="flex items-center">
                      <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                      <span className="text-gray-700 text-sm">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 relative overflow-hidden"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="absolute top-0 left-0 w-32 h-32 bg-secondary/5 rounded-br-full"></div>
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-secondary/5 rounded-tl-full"></div>

            <div className="flex items-center mb-6">
              <div className="bg-secondary/10 p-3 rounded-full text-secondary mr-4">
                <FiUsers size={24} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 font-display">Our Story</h2>
            </div>

            <div className="space-y-4 relative z-10">
              <p className="text-gray-700">
                ProductWhisper was born from the frustration of shopping online in Nigeria. Between inflated prices,
                fake reviews, unreliable vendors, and the challenge of comparing products across multiple platforms,
                Nigerian consumers deserve better tools to make informed decisions.
              </p>
              <p className="text-gray-700">
                We built a platform that scrapes real-time product data from Jumia, Konga, and Jiji, analyzes reviews
                using AI that understands Nigerian Pidgin and local expressions, tracks price history, and computes
                trust scores for both products and vendors. Our goal is to be the go-to product intelligence tool
                for Nigerian e-commerce.
              </p>

              <div className="pt-4 mt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">2023</div>
                    <div className="text-xs text-gray-500">Founded</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">15+</div>
                    <div className="text-xs text-gray-500">Team Members</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">3</div>
                    <div className="text-xs text-gray-500">Global Offices</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Technology Section */}
        <div className="relative mb-16">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent rounded-2xl"></div>

          <motion.div
            className="relative bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-8 border border-gray-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="flex flex-col md:flex-row md:items-start gap-8">
              <div className="md:w-1/3">
                <div className="sticky top-8">
                  <div className="flex items-center mb-6">
                    <div className="bg-primary/10 p-3 rounded-full text-primary mr-4">
                      <FiBarChart2 size={24} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 font-display">Our Technology</h2>
                  </div>

                  <p className="text-gray-700 mb-6">
                    ProductWhisper combines real-time web scraping, Nigerian Pidgin-aware sentiment analysis, and multi-factor trust scoring to give you the full picture on any product.
                  </p>

                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                    <h3 className="font-medium text-primary mb-2">Why It Matters</h3>
                    <p className="text-gray-600 text-sm">
                      Unlike simple review aggregators, we understand Nigerian buying culture — from detecting "419" scam signals to recognizing when someone says "e dey kampe" means a product is great.
                    </p>
                  </div>
                </div>
              </div>

              <div className="md:w-2/3">
                <div className="space-y-6">
                  {[
                    {
                      title: "Live Scraping",
                      description: "Real-time product data from Jumia, Konga, and Jiji using JSON-LD structured data",
                      details: "Our scrapers extract prices, reviews, vendor info, and product details directly from Nigerian e-commerce platforms."
                    },
                    {
                      title: "Nigerian Pidgin NLP",
                      description: "Sentiment engine with 100+ Nigerian Pidgin and local expression terms",
                      details: "We understand 'wahala', 'na die', 'chop my money', 'dey kampe' and other expressions used in Nigerian product reviews."
                    },
                    {
                      title: "Scam Detection",
                      description: "Identifies fake listings, counterfeit products, and 419 signals in reviews",
                      details: "Our engine detects keywords like 'fake', 'counterfeit', '419', and 'scam' to flag potentially fraudulent products."
                    },
                    {
                      title: "Trust Scoring",
                      description: "5-factor algorithm: listing consistency, price reasonableness, vendor reliability, sentiment, and data completeness",
                      details: "Every product and vendor gets a trust score based on multiple weighted factors to help you gauge reliability."
                    },
                    {
                      title: "Price Tracking",
                      description: "Monitor price changes across all platforms with historical snapshots",
                      details: "We record daily price snapshots so you can see price trends, detect inflated pricing, and find the best time to buy."
                    }
                  ].map((step, index) => (
                    <motion.div
                      key={index}
                      className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.6 + (index * 0.1) }}
                    >
                      <div className="flex items-center mb-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-medium mr-4">
                          {index + 1}
                        </div>
                        <h3 className="font-display font-semibold text-lg text-gray-900">{step.title}</h3>
                      </div>
                      <p className="text-gray-700 mb-3">{step.description}</p>
                      <p className="text-gray-500 text-sm italic">{step.details}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Team Section */}
        <div className="relative mb-16">
          <div className="absolute inset-0 bg-gradient-to-b from-secondary/5 to-transparent rounded-2xl"></div>

          <motion.div
            className="relative bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-8 border border-gray-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            <div className="text-center mb-12">
              <motion.div
                className="inline-block bg-secondary/10 p-3 rounded-full text-secondary mb-4"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.9 }}
              >
                <FiUsers size={28} />
              </motion.div>
              <h2 className="text-3xl font-bold text-gray-900 font-display mb-4">Built for Nigeria</h2>
              <p className="text-gray-700 max-w-2xl mx-auto">
                ProductWhisper is an open-source project built to solve real problems Nigerian consumers face
                when shopping online. We're passionate about transparency and empowering buyers with data.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  name: "Jumia Integration",
                  role: "Live Scraping",
                  bio: "Real-time product data, prices, reviews, and vendor information from Nigeria's largest marketplace.",
                  image: "https://placehold.co/200x200/1e3a5f/ffffff?text=Jumia"
                },
                {
                  name: "Konga Integration",
                  role: "Coming Soon",
                  bio: "Price comparison and product tracking across Konga's catalog for the best deals.",
                  image: "https://placehold.co/200x200/1e3a5f/ffffff?text=Konga"
                },
                {
                  name: "Jiji Integration",
                  role: "Coming Soon",
                  bio: "Marketplace listings and vendor trust scoring for secondhand and new products.",
                  image: "https://placehold.co/200x200/1e3a5f/ffffff?text=Jiji"
                },
                {
                  name: "Nairaland Insights",
                  role: "Community Sentiment",
                  bio: "Discussion analysis from Nigeria's largest forum to capture authentic consumer opinions.",
                  image: "https://placehold.co/200x200/1e3a5f/ffffff?text=Nairaland"
                },
                {
                  name: "Nigerian Pidgin AI",
                  role: "Sentiment Engine",
                  bio: "Custom-built NLP engine with 100+ Nigerian Pidgin terms for accurate local sentiment analysis.",
                  image: "https://placehold.co/200x200/1e3a5f/ffffff?text=NLP"
                },
                {
                  name: "Trust Algorithm",
                  role: "5-Factor Scoring",
                  bio: "Multi-factor trust scoring considering listing consistency, price, vendor reliability, and more.",
                  image: "https://placehold.co/200x200/1e3a5f/ffffff?text=Trust"
                }
              ].map((member, index) => (
                <motion.div
                  key={index}
                  className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all group"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.8 + (index * 0.1) }}
                  whileHover={{ y: -5 }}
                >
                  <div className="flex items-center mb-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden mr-4 border-2 border-secondary/20">
                      <img
                        src={member.image}
                        alt={member.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div>
                      <h3 className="font-display font-semibold text-lg text-gray-900">{member.name}</h3>
                      <p className="text-secondary text-sm font-medium">{member.role}</p>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm">{member.bio}</p>
                </motion.div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <motion.button
                className="px-6 py-3 bg-secondary/10 text-secondary font-medium rounded-lg hover:bg-secondary/20 transition-colors inline-flex items-center"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <FiUsers className="mr-2" />
                Join Our Team
              </motion.button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default AboutPage;
