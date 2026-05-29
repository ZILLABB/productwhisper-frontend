import React, { useState } from 'react';
import {
  FiMail,
  FiPhone,
  FiMapPin,
  FiSend,
  FiMessageCircle,
  FiHelpCircle,
  FiCheckCircle,
  FiAlertCircle,
  FiClock
} from 'react-icons/fi';
import { apiService } from '../services/api';
import useSEO from '../hooks/useSEO';

const ContactPage: React.FC = () => {
  useSEO({ title: 'Contact Us', description: 'Get in touch with the ProductWhisper team. We\'d love to hear from you.' });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      await apiService.submitContactForm(formData);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (err: any) {
      setSubmitError(err?.message || 'There was an error sending your message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12">

        {/* Hero Section */}
        <div className="relative mb-16 bg-gradient-primary rounded-premium overflow-hidden shadow-premium">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-64 h-64 rounded-full bg-secondary/30 blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-80 h-80 rounded-full bg-accent/20 blur-3xl"></div>
          </div>
          <div className="relative z-10 px-6 py-16 sm:px-12 sm:py-20 text-center">
            <h1 className="text-3xl md:text-5xl font-display font-bold text-white mb-4">Get in Touch</h1>
            <p className="text-white/80 text-lg max-w-2xl mx-auto">
              Have questions about ProductWhisper? We're here to help and would love to hear from you.
            </p>
            <div className="w-24 h-1 bg-secondary mx-auto mt-8"></div>
          </div>
        </div>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16 -mt-24">
          {[
            {
              icon: <FiMail size={28} />,
              iconBg: 'bg-primary/10 text-primary',
              title: 'Email Us',
              desc: 'Our friendly team is here to help with any questions.',
              link: 'mailto:hello@productwhisper.ng',
              linkText: 'hello@productwhisper.ng',
              linkClass: 'text-primary',
            },
            {
              icon: <FiPhone size={28} />,
              iconBg: 'bg-secondary/10 text-secondary',
              title: 'Call Us',
              desc: 'Mon-Fri from 9am to 5pm WAT.',
              link: 'tel:+2348012345678',
              linkText: '+234 801 234 5678',
              linkClass: 'text-secondary',
            },
            {
              icon: <FiMapPin size={28} />,
              iconBg: 'bg-accent/10 text-accent',
              title: 'Visit Us',
              desc: 'Come say hello at our office in Lagos.',
              linkText: '12 Admiralty Way\nLekki Phase 1, Lagos',
              linkClass: 'text-accent',
            },
          ].map((card, i) => (
            <div key={i} className="bg-white rounded-xl shadow-lg p-8 flex flex-col items-center text-center hover:-translate-y-1 transition-transform duration-200">
              <div className={`${card.iconBg} p-4 rounded-full mb-6`}>{card.icon}</div>
              <h3 className="text-xl font-display font-semibold mb-3 text-gray-900">{card.title}</h3>
              <p className="text-gray-600 mb-6">{card.desc}</p>
              {card.link ? (
                <a href={card.link} className={`${card.linkClass} font-medium hover:opacity-80 transition-colors`}>
                  {card.linkText}
                </a>
              ) : (
                <p className={`${card.linkClass} font-medium whitespace-pre-line`}>{card.linkText}</p>
              )}
            </div>
          ))}
        </div>

        {/* Contact Form Section */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-16">
          {/* Left Column - Form */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8">
              <div className="flex items-center mb-8">
                <div className="bg-primary/10 p-3 rounded-full text-primary mr-4">
                  <FiMessageCircle size={24} />
                </div>
                <h2 className="text-2xl font-display font-semibold text-gray-900">Send Us a Message</h2>
              </div>

              {submitSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded-lg mb-8 flex items-start">
                  <FiCheckCircle className="mr-3 mt-0.5 flex-shrink-0" size={18} />
                  <p>Thank you for your message! We'll get back to you soon.</p>
                </div>
              )}

              {submitError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg mb-8 flex items-start">
                  <FiAlertCircle className="mr-3 mt-0.5 flex-shrink-0" size={18} />
                  <p>{submitError}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Your Name</label>
                    <input
                      type="text" id="name" name="name"
                      value={formData.name} onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-colors"
                      placeholder="Chinedu Okafor" required
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Your Email</label>
                    <input
                      type="email" id="email" name="email"
                      value={formData.email} onChange={handleChange}
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-colors"
                      placeholder="chinedu@example.com" required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <select
                    id="subject" name="subject"
                    value={formData.subject} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-colors"
                    required
                  >
                    <option value="">Select a subject</option>
                    <option value="general">General Inquiry</option>
                    <option value="support">Technical Support</option>
                    <option value="feedback">Product Feedback</option>
                    <option value="partnership">Partnership Opportunity</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">Your Message</label>
                  <textarea
                    id="message" name="message" rows={6}
                    value={formData.message} onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-colors"
                    placeholder="How can we help you?" required
                  ></textarea>
                </div>

                <div>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-primary text-white font-medium rounded-lg shadow-sm hover:bg-primary-dark transition-colors flex items-center justify-center disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        <FiSend className="mr-2" size={18} />
                        Send Message
                      </span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Column - FAQ and Info */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8 mb-8">
              <div className="flex items-center mb-6">
                <div className="bg-secondary/10 p-3 rounded-full text-secondary mr-4">
                  <FiHelpCircle size={24} />
                </div>
                <h2 className="text-xl font-display font-semibold text-gray-900">Frequently Asked</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">How does ProductWhisper work?</h3>
                  <p className="text-gray-600 text-sm">We search Jumia, Konga, and Jiji in real-time to compare prices on the same product, helping you find the cheapest deal across Nigerian e-commerce platforms.</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">How do I know if a seller is trustworthy?</h3>
                  <p className="text-gray-600 text-sm">Each listing shows a seller trust badge based on their rating, verification status, and sales history. Look for "Trusted" or "Verified" badges for safer purchases.</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Is ProductWhisper free to use?</h3>
                  <p className="text-gray-600 text-sm">Yes! ProductWhisper is completely free. We help Nigerian shoppers save money by comparing prices across all major platforms.</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl shadow-sm border border-gray-100 p-8">
              <div className="flex items-center mb-6">
                <div className="bg-white/80 p-3 rounded-full text-primary mr-4">
                  <FiClock size={24} />
                </div>
                <h2 className="text-xl font-display font-semibold text-gray-900">Business Hours</h2>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Monday - Friday</span>
                  <span className="font-medium text-gray-900">9:00 AM - 5:00 PM</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Saturday</span>
                  <span className="font-medium text-gray-900">10:00 AM - 2:00 PM</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Sunday</span>
                  <span className="font-medium text-gray-900">Closed</span>
                </div>
                <div className="pt-4 mt-4 border-t border-gray-200">
                  <p className="text-gray-600 text-sm">
                    All times are in West Africa Time (WAT/GMT+1).
                    Our support team typically responds within 24 hours.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;
