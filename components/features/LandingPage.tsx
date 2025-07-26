import React from 'react'
import { ProviderSearch } from './ProviderSearch'

const LandingPage = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Provider Search Section */}
      <div className="py-8">
        <ProviderSearch />
      </div>
    
      {/* Card Component */}
      <div className="card bg-base-100 shadow-sm" style={{ width: "180px" }}>
  <figure>
    <img
      src="https://shelleefisher.com/site/wp-content/uploads/2024/08/RobertWood02-scaled-1.jpg"
      alt="Dr. Robert Wood"
      className="w-full h-auto"
    />
  </figure>
  <div className="card-body p-2">
    <h2 className="card-title text-secondary text-sm">Dr. Robert Wood</h2>
    <p className="text-base-content text-primary text-xs">Cardiac Surgeon</p>
    <div className="card-actions justify-center w-[90%] mt-1">
      <button className="btn btn-primary btn-xs w-full">Consult Now</button>
    </div>
  </div>
</div>
<>
</>
<>
</>

      {/* Alert Examples */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-base-content">Alerts</h2>
        <div className="space-y-2">
          <div className="alert alert-info">
            <span>Info: Your daily goal is almost complete!</span>
          </div>
          <div className="alert alert-success">
            <span>Success: Health data saved successfully!</span>
          </div>
          <div className="alert alert-warning">
            <span>Warning: Remember to log your water intake.</span>
          </div>
          <div className="alert alert-error">
            <span>Error: Unable to sync data. Please try again.</span>
          </div>
        </div>
      </section>

      {/* Badge Examples */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-base-content">Badges</h2>
        <div className="flex gap-2 flex-wrap">
          <span className="badge badge-primary">Primary</span>
          <span className="badge badge-secondary">Secondary</span>
          <span className="badge badge-accent">Accent</span>
          <span className="badge badge-ghost">Ghost</span>
          <span className="badge badge-outline">Outline</span>
        </div>
      </section>
    </div>
  )
}

export default LandingPage
