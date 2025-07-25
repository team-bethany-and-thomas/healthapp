import React from 'react'


const LandingPage = () => {
  return (
    <>

      <div className="container mx-auto p-4 space-y-6">
        {/* Theme Color Examples */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-base-content">Theme Colors</h2>
          <div className="bg-primary text-primary-content p-4 rounded-lg">
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
          <h2 className="text-2xl font-bold text-base-content">Buttons</h2>
          <div className="flex gap-2 flex-wrap">
            <button className="btn btn-primary">Primary Button</button>
            <button className="btn btn-secondary">Secondary Button</button>
            <button className="btn btn-accent">Accent Button</button>
            <button className="btn btn-ghost">Ghost Button</button>
          </div>
        </section>

        {/* Card Examples */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-base-content">Cards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Health Tracking</h2>
                <p>Track your daily health metrics and goals</p>
                <div className="card-actions justify-end">
                  <button className="btn btn-primary">Get Started</button>
                </div>
              </div>
            </div>
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h2 className="card-title">Analytics</h2>
                <p>View detailed insights about your health progress</p>
                <div className="card-actions justify-end">
                  <button className="btn btn-secondary">View Reports</button>
                </div>
              </div>
            </div>
          </div>
        </section>

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
   </>
  )
}

export default LandingPage
