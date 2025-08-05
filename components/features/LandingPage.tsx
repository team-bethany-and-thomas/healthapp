import React from 'react';
import { ProviderSearch } from './ProviderSearch'
import { TopRatedDoctors } from './TopRatedDoctors/TopRatedDoctors'
import { HomePageHero } from './HomePageHero'

const LandingPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="py-8">
        <ProviderSearch />
      </div>
      <div className="py-8">
        <TopRatedDoctors />
      </div>
      <div className="py-8">
        <HomePageHero />
      </div>
    </div>
  );
};

export default LandingPage
