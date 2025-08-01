import Searchbar from '@/components/Searchbar';
import React from 'react';

function SearchbarPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Find Your Healthcare Provider</h1>
          <p className="text-base-content/70">
            Search by specialty, provider name, or location in the Dallas Metroplex
          </p>
        </div>
        
        <div className="bg-base-200 p-8 rounded-lg">
          <Searchbar />
        </div>
      </div>
    </div>
  )
}

export default SearchbarPage 