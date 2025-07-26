import React from 'react'
import { ProviderSearch } from './ProviderSearch'

const LandingPage = () => {
  return (
    <>
      {/* Provider Search Section */}
      <div className="py-8">
        <ProviderSearch />
      </div>

      <div className="container mx-auto p-4 space-y-6">
        {/* Theme Color Examples */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-black">Theme Colors</h2>
          <div className="bg-primary text-primary-content">
            Primary background with primary content text
          </div>
          <div className="bg-secondary text-secondary-content p-4 rounded-lg">
            Secondary background with secondary content text
          </div>
          <div className="bg-accent text-accent-content p-4 rounded-lg">
            Accent background with accent content text
          </div>
        </section>

        {/* Button Examples */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-black">Buttons</h2>
          <div className="flex gap-2 flex-wrap">
            <button className="btn btn-primary">Primary Button</button>
            <button className="btn btn-secondary">Secondary Button</button>
            <button className="btn btn-accent">Accent Button</button>
            <button className="btn btn-ghost">Ghost Button</button>
          </div>
        </section>

        {/* Card Examples */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-black">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card bg-white shadow-xl border border-gray-200">
              <div className="card-body">
                <h2 className="card-title text-black">Health Tracking</h2>
                <p className="text-black">Track your daily health metrics and goals</p>
                <div className="card-actions justify-end">
                  <button className="btn btn-primary">Get Started</button>
                </div>
              </div>
            </div>
            <div className="card bg-white shadow-xl border border-gray-200">
              <div className="card-body">
                <h2 className="card-title text-black">Analytics</h2>
                <p className="text-black">View detailed insights about your health progress</p>
                <div className="card-actions justify-end">
                  <button className="btn btn-secondary">View Reports</button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Alert Examples */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-black">Alerts</h2>
          <div className="space-y-2">
            <div className="alert alert-info bg-blue-50 border border-blue-200">
              <span className="text-black">Info: Your daily goal is almost complete!</span>
            </div>
            <div className="alert alert-success bg-green-50 border border-green-200">
              <span className="text-black">Success: Health data saved successfully!</span>
            </div>
            <div className="alert alert-warning bg-yellow-50 border border-yellow-200">
              <span className="text-black">Warning: Remember to log your water intake.</span>
            </div>
            <div className="alert alert-error bg-red-50 border border-red-200">
              <span className="text-black">Error: Unable to sync data. Please try again.</span>
            </div>
          </div>
        </section>

        {/* Badge Examples */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-black">Badges</h2>
          <div className="flex gap-2 flex-wrap">
            <span className="badge badge-primary">Primary</span>
            <span className="badge badge-secondary">Secondary</span>
            <span className="badge badge-accent">Accent</span>
            <span className="badge badge-ghost">Ghost</span>
            <span className="badge badge-outline">Outline</span>
          </div>
        </section>
      </div>
   </>
  )
}

export default LandingPage
