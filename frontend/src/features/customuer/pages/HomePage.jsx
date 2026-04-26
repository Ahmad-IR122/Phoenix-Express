import React from 'react';
import HeroSection from '../components/HeroSection';
import FeaturesSection from '../components/FeaturesSection';
import PricingSection from '../components/PricingSection';
import CTASection from '../components/CTASection';

const HomePage = () => {
  return (
    <div>
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <CTASection />
    </div>
  );
}

export default HomePage;
