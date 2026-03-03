import React from "react";
import Banner from "/image/MainBanner.webp";
import HeroSection from "../components/HeroSection";
import HowItWorksSection from "./Home/HowItWorksSection";
import ScrollBuilderSection from "./Home/ScrollBuilderSection";
import ProductShowcaseSection from "./Home/ProductShowcaseSection";
import TestimonialsSection from "./Home/TestimonialsSection";
import CTABannerSection from "./Home/CTABannerSection";

const Home = () => {
  return (
    <div>
      <HeroSection />
      <HowItWorksSection />
      <ScrollBuilderSection />
      <ProductShowcaseSection />
      <TestimonialsSection />
      <CTABannerSection />
    </div>
  );
};

export default Home;
