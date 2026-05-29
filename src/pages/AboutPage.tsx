import React from 'react';
import { Search, ShieldCheck, TrendingDown, ArrowRightLeft, Star, Heart, Users, MapPin, Eye, CreditCard, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import useSEO from '../hooks/useSEO';

const AboutPage: React.FC = () => {
  useSEO({
    title: 'About',
    description: 'ProductWhisper helps Nigerian shoppers compare prices across Jumia, Konga, and Jiji — find the best deals and shop with confidence.',
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero */}
      <div className="bg-gradient-to-br from-[#1c3454] to-[#2a4a6e] text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">
            Shop Smarter Across Nigeria
          </h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto leading-relaxed">
            ProductWhisper compares prices from Jumia, Konga, and Jiji so you can find the best deal — without opening three different tabs.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 -mt-10">
          {[
            { value: '3', label: 'Platforms Compared' },
            { value: '1000s', label: 'Products Tracked' },
            { value: 'Free', label: 'Always Free to Use' },
            { value: 'Real-time', label: 'Price Updates' },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-xl shadow-lg p-5 text-center">
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* What We Do For You */}
        <section className="py-14">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">What We Do For You</h2>
          <p className="text-gray-500 text-center mb-10 max-w-xl mx-auto">
            Everything you need to make confident buying decisions online in Nigeria.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: ArrowRightLeft,
                title: 'Compare Prices Instantly',
                desc: 'See what the same product costs on Jumia, Konga, and Jiji — side by side. No more tab-switching.',
                color: 'blue',
              },
              {
                icon: TrendingDown,
                title: 'Track Price Drops',
                desc: 'We monitor prices daily so you can spot real deals, see price history, and buy at the right time.',
                color: 'green',
              },
              {
                icon: ShieldCheck,
                title: 'Check Seller Reliability',
                desc: 'Every listing shows seller ratings, verification status, and trust indicators to help you avoid bad sellers.',
                color: 'purple',
              },
              {
                icon: Star,
                title: 'Read Real Reviews',
                desc: 'See what actual Nigerian buyers are saying — the good and the bad. We highlight common praises and complaints.',
                color: 'amber',
              },
              {
                icon: Search,
                title: 'Search Once, See Everything',
                desc: 'Type any product — phones, laptops, TVs, generators, SSDs. We search all three platforms at the same time.',
                color: 'red',
              },
              {
                icon: Heart,
                title: 'Save Your Favourites',
                desc: 'Bookmark products you\'re interested in and come back to check if the price has dropped.',
                color: 'pink',
              },
            ].map((item, i) => (
              <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-11 h-11 rounded-lg bg-${item.color}-100 flex items-center justify-center mb-4`}>
                  <item.icon className={`h-5 w-5 text-${item.color}-600`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section className="py-14 border-t border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">How It Works</h2>
          <p className="text-gray-500 text-center mb-10">Three simple steps</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Search for a Product',
                desc: 'Type what you\'re looking for — "iPhone 15 Pro Max", "32 inch TV", "WD Blue SSD". We handle the rest.',
              },
              {
                step: '2',
                title: 'Compare Results',
                desc: 'See prices from multiple sellers across Jumia, Konga, and Jiji. Check ratings, conditions, and seller info.',
              },
              {
                step: '3',
                title: 'Buy With Confidence',
                desc: 'Click through to the platform with the best deal. We link you directly — no middleman, no extra fees.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#1c3454] text-white flex items-center justify-center text-xl font-bold">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Platforms We Cover */}
        <section className="py-14 border-t border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Platforms We Cover</h2>
          <p className="text-gray-500 text-center mb-10 max-w-xl mx-auto">
            We compare products across Nigeria's biggest online marketplaces.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                name: 'Jumia',
                desc: 'Nigeria\'s largest online marketplace. Wide product range with buyer protection on most items.',
                color: 'orange',
                status: 'Live',
              },
              {
                name: 'Konga',
                desc: 'Trusted Nigerian e-commerce platform with vetted sellers and diverse electronics catalog.',
                color: 'blue',
                status: 'Live',
              },
              {
                name: 'Jiji',
                desc: 'Nigeria\'s #1 classifieds marketplace — great deals from individual sellers. Always inspect before paying.',
                color: 'green',
                status: 'Live',
              },
            ].map((platform, i) => (
              <div key={i} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">{platform.name}</h3>
                  <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full bg-${platform.color}-100 text-${platform.color}-700`}>
                    {platform.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{platform.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Safety Tips */}
        <section className="py-14 border-t border-gray-100">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-amber-900 text-center mb-2">Stay Safe When Shopping Online</h2>
            <p className="text-amber-700 text-center mb-8 max-w-xl mx-auto">
              ProductWhisper helps you find deals, but always take precautions when buying online in Nigeria.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                { icon: CreditCard, title: 'Never pay in advance', desc: 'Don\'t send money upfront, even for delivery. Pay only when you have the item in hand.' },
                { icon: MapPin, title: 'Meet in a safe public place', desc: 'Choose busy, well-lit locations for in-person transactions. Bring someone if possible.' },
                { icon: Eye, title: 'Inspect before you pay', desc: 'Check the product thoroughly. Make sure it matches the listing and works properly.' },
                { icon: Package, title: 'Verify the packed item', desc: 'If the seller packs it, open and confirm it\'s the same item you inspected.' },
                { icon: ShieldCheck, title: 'Check seller ratings', desc: 'Look at seller verification status and buyer reviews before making a purchase.' },
                { icon: Users, title: 'Trust your instincts', desc: 'If something feels off — wrong model, pushy seller, price too good to be true — walk away.' },
              ].map((tip, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="p-1.5 bg-amber-100 rounded-lg flex-shrink-0 mt-0.5">
                    <tip.icon className="h-4 w-4 text-amber-700" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-amber-900">{tip.title}</p>
                    <p className="text-xs text-amber-700 mt-0.5">{tip.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Why ProductWhisper */}
        <section className="py-14 border-t border-gray-100">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">Why ProductWhisper?</h2>
          <p className="text-gray-500 text-center mb-10 max-w-xl mx-auto">
            We built this because shopping online in Nigeria shouldn't be so stressful.
          </p>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
            <div className="max-w-2xl mx-auto space-y-4 text-gray-700 leading-relaxed">
              <p>
                If you've ever shopped online in Nigeria, you know the struggle — you find a product on Jumia,
                then wonder if it's cheaper on Konga, then check Jiji for a used option, and by the time you've
                compared everything in separate tabs, you're exhausted.
              </p>
              <p>
                That's why we built ProductWhisper. One search gives you prices from all three platforms, shows
                you which sellers are reliable, and highlights the best deals — so you can make quick, confident
                buying decisions.
              </p>
              <p>
                We're a small team of Nigerian developers who got tired of overpaying and dealing with unreliable
                sellers. ProductWhisper is free to use and we don't sell products ourselves — we just help you
                find the best deals and avoid the bad ones.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-14 text-center">
          <div className="bg-gradient-to-br from-[#1c3454] to-[#2a4a6e] rounded-2xl p-10 text-white">
            <h2 className="text-2xl font-bold mb-3">Ready to Find Better Deals?</h2>
            <p className="text-white/70 mb-6 max-w-md mx-auto">
              Search any product and compare prices across Jumia, Konga, and Jiji — free, no signup needed.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/prices"
                className="px-6 py-3 bg-white text-[#1c3454] font-semibold rounded-lg hover:bg-gray-100 transition-colors"
              >
                Compare Prices
              </Link>
              <Link
                to="/deals"
                className="px-6 py-3 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors border border-white/20"
              >
                View Today's Deals
              </Link>
            </div>
          </div>
        </section>

        {/* Disclaimer */}
        <div className="pb-10 text-center">
          <p className="text-xs text-gray-400">
            ProductWhisper aggregates product listings from third-party platforms. We do not sell products
            directly and are not responsible for transactions between buyers and sellers. Always exercise caution
            when shopping online.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
