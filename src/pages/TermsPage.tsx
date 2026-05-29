import React from 'react';
import { Link } from 'react-router-dom';

const TermsPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6 sm:py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Terms of Service</h1>

      <div className="prose prose-lg max-w-none space-y-6 text-gray-700">
        <p className="text-sm text-gray-500">Last updated: January 2025</p>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">1. Acceptance of Terms</h2>
          <p>
            By accessing and using ProductWhisper, you agree to be bound by these Terms of
            Service. If you do not agree, please do not use our platform.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">2. Service Description</h2>
          <p>
            ProductWhisper is a price comparison and product review platform for the Nigerian
            market. We aggregate product listings and reviews from e-commerce platforms
            to help consumers compare prices and make informed purchasing decisions.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">3. Disclaimer</h2>
          <p>
            Product prices, availability, and reviews displayed on ProductWhisper are sourced
            from third-party platforms and may not always be up to date. We are not responsible
            for the accuracy of third-party data. Always verify prices directly on the
            retailer's website before making a purchase.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">4. Intellectual Property</h2>
          <p>
            All content, features, and functionality on ProductWhisper are owned by us and
            are protected by copyright and other intellectual property laws.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">5. User Conduct</h2>
          <p>
            Users agree not to misuse the platform, attempt to scrape data without
            authorization, or use the service for any unlawful purpose.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">6. Contact</h2>
          <p>
            Questions about these terms? Reach out via our{' '}
            <Link to="/contact" className="text-primary hover:underline">contact page</Link>.
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsPage;
