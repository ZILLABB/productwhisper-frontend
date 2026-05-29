import React from 'react';
import { Link } from 'react-router-dom';

const PrivacyPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Privacy Policy</h1>

      <div className="prose prose-lg max-w-none space-y-6 text-gray-700">
        <p className="text-sm text-gray-500">Last updated: January 2025</p>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">1. Information We Collect</h2>
          <p>
            ProductWhisper collects minimal data to provide our product analysis services.
            We may collect search queries, browsing patterns on our platform, and basic device
            information to improve your experience.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">2. How We Use Your Data</h2>
          <p>
            Your data is used solely to provide product comparisons, personalized
            recommendations, and to improve our platform. We do not sell your personal
            information to third parties.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">3. Data Security</h2>
          <p>
            We implement industry-standard security measures to protect your data, including
            encryption in transit and at rest. Access to personal data is restricted to
            authorized personnel only.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">4. Cookies</h2>
          <p>
            We use essential cookies to maintain your session and preferences. Analytics
            cookies help us understand how our platform is used. You can manage cookie
            preferences through your browser settings.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">5. Your Rights</h2>
          <p>
            You have the right to access, correct, or delete your personal data. To exercise
            these rights, please contact us at{' '}
            <a href="mailto:privacy@productwhisper.ng" className="text-primary hover:underline">
              privacy@productwhisper.ng
            </a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-gray-900 mt-8 mb-3">6. Contact Us</h2>
          <p>
            For questions about this privacy policy, please reach out via our{' '}
            <Link to="/contact" className="text-primary hover:underline">contact page</Link>.
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPage;
