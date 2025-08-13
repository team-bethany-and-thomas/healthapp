'use client'
import { useState } from 'react';

export default function ContactPage() {
    const [submitted, setSubmitted] = useState(false);
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        message: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setForm({
            ...form,
            [name]: value,
        });
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault(); 

        // Simulate form submission
        setSubmitted(true);
        setForm({
            name: '',
            email: '',
            phone: '',
            message: '',
        });
    };

    return (
   <div className="min-h-screen bg-[#C7F7F1]">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <h1 className="text-3xl font-bold mb-6">Contact</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Map */}
          <section className="rounded-2xl overflow-hidden shadow">
            <div className="w-full h-[600px] rounded-2xl overflow-hidden shadow">
              <iframe
                title="Dallas, TX - Map"
                className="w-full h-full rounded-2xl"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src="https://www.google.com/maps?q=Dallas,TX&z=12&output=embed"
              />
            </div>
          </section>

          {/* Contact + Form */}
          <section className="bg-white/80 rounded-2xl p-6 shadow space-y-6">
            <div>
              <h2 className="text-2xl font-semibold">Contact Us</h2>
              <p className="text-sm mt-1 opacity-75">
                We’d love to hear from you. Call, email, or send us a message below.
              </p>

              <div className="mt-4 space-y-1">
                {/* Replace with your real contact info */}
                <a href="tel:+12145551234" className="block hover:underline">
                  <span className="font-medium">Phone:</span> (214) 555‑1234
                </a>
                <a href="mailto:hello@pulseclinic.example" className="block hover:underline">
                  <span className="font-medium">Email:</span> hello@pulseclinic.com
                </a>
                <p className="text-sm opacity-70">Dallas, TX</p>
              </div>
            </div>

            {!submitted ? (
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex flex-col">
                    <span className="text-sm font-medium">Name</span>
                    <input
                      required
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      className="input input-bordered rounded-xl mt-1"
                      placeholder="Your full name"
                    />
                  </label>

                  <label className="flex flex-col">
                    <span className="text-sm font-medium">Email</span>
                    <input
                      required
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      className="input input-bordered rounded-xl mt-1"
                      placeholder="you@example.com"
                    />
                  </label>
                </div>

                <label className="flex flex-col">
                  <span className="text-sm font-medium">Phone</span>
                  <input
                    type="tel"
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="input input-bordered rounded-xl mt-1"
                    placeholder="(###) ###‑####"
                  />
                </label>

                <label className="flex flex-col">
                  <span className="text-sm font-medium">Message</span>
                  <textarea
                    required
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    className="textarea textarea-bordered rounded-xl mt-1 min-h-[120px]"
                    placeholder="How can we help?"
                  />
                </label>

                <button type="submit" className="btn btn-primary rounded-xl w-full md:w-auto">
                  Send Message
                </button>
              </form>
            ) : (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4">
                <h3 className="font-semibold text-emerald-800">Thank you!</h3>
                <p className="text-emerald-700">
                  We received your message and <strong>we will contact you soon</strong>.
                </p>
                <button
                  className="btn btn-sm mt-3"
                  onClick={() => setSubmitted(false)}
                >
                  Send another message
                </button>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}