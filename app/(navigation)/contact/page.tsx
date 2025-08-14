'use client'
import { useState } from 'react';

export default function ContactPage() {
    const [submitted, setSubmitted] = useState(false);
    const [form, setForm] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        preferredContact: 'email',
        urgency: 'general'
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
            subject: '',
            message: '',
            preferredContact: 'email',
            urgency: 'general'
        });
    };

    const contactMethods = [
        {
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
            ),
            title: "Call Us",
            description: "Speak with our staff",
            value: "(214) 555-1234",
            action: "tel:+12145551234",
            hours: "Mon-Fri: 8AM-6PM"
        },
        {
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
            ),
            title: "Email Us",
            description: "Send us a message",
            value: "hello@pulseclinic.com",
            action: "mailto:hello@pulseclinic.com",
            hours: "24/7 Response"
        },
        {
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
            ),
            title: "Live Chat",
            description: "Chat with support",
            value: "Available Now",
            action: "#",
            hours: "Mon-Fri: 9AM-5PM"
        }
    ];

    const emergencyInfo = {
        title: "Medical Emergency?",
        description: "For life-threatening emergencies, call 911 immediately or go to your nearest emergency room.",
        urgentCare: "For urgent but non-emergency care, visit our urgent care center or call our after-hours line."
    };

    const faqs = [
        {
            question: "What are your office hours?",
            answer: "Monday-Friday: 8:00 AM - 6:00 PM, Saturday: 9:00 AM - 2:00 PM, Sunday: Locations Vary"
        },
        {
            question: "Do you accept walk-ins?",
            answer: "We accept limited walk-ins for urgent care. However, we recommend scheduling an appointment for the best service."
        },
        {
            question: "What insurance plans do you accept?",
            answer: "We accept most major insurance plans. Please call us to verify your specific coverage."
        },
        {
            question: "How can I access my medical records?",
            answer: "You can access your medical records through our patient portal or by visiting our office with proper identification."
        }
    ];

    return (
        <div className="min-h-screen bg-[#C7F7F1]">
            <div className="mx-auto max-w-7xl px-6 py-10">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-primary mb-2">Get In Touch</h1>
                    <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
                        We&#39;re here to help with your healthcare needs. Reach out to us through any of the methods below.
                    </p>
                </div>

                {/* Emergency Alert */}
                <div className="alert alert-error mb-8 max-w-4xl mx-auto rounded-2xl">
                    <svg xmlns="http://www.w3.org/2000/svg" className="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                    <div>
                        <h3 className="font-bold">{emergencyInfo.title}</h3>
                        <div className="text-sm">{emergencyInfo.description}</div>
                    </div>
                </div>

                {/* Contact Methods */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {contactMethods.map((method, index) => (
                        <div key={index} className="card bg-base-100 shadow-xl rounded-2xl hover:shadow-2xl transition-all duration-300 border border-gray-200 group hover:-translate-y-1">
                            <div className="card-body text-center p-8">
                                <div className="flex justify-center mb-4">
                                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-content transition-all duration-300">
                                        {method.icon}
                                    </div>
                                </div>
                                <h3 className="card-title justify-center text-xl mb-2">{method.title}</h3>
                                <p className="text-base-content/70 mb-3">{method.description}</p>
                                <a 
                                    href={method.action}
                                    className="font-semibold text-primary hover:text-secondary transition-colors text-lg"
                                >
                                    {method.value}
                                </a>
                                <p className="text-sm text-base-content/50 mt-2">{method.hours}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Map & Office Info */}
                    <section className="bg-base-100 rounded-2xl p-8 shadow-xl border border-gray-200 flex flex-col h-full">
                        {/* Map */}
                        <div className="w-full flex-1 rounded-2xl overflow-hidden shadow-lg mb-6">
                            <iframe
                                title="Dallas, TX - Map"
                                className="w-full h-full rounded-2xl min-h-[300px]"
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                src="https://www.google.com/maps?q=Dallas,TX&z=12&output=embed"
                            />
                        </div>
                        
                        {/* Office Information */}
                        <div className="flex-shrink-0">
                            <h3 className="text-xl font-semibold mb-4 text-primary">Visit Our Office</h3>
                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-secondary mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <div>
                                        <p className="font-medium">Main Location</p>
                                        <p className="text-base-content/70">123 Health Street<br />Dallas, TX 75201</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-secondary mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <div>
                                        <p className="font-medium">Office Hours</p>
                                        <p className="text-base-content/70">Mon-Fri: 8AM-6PM<br />Sat: 9AM-2PM<br />Sun: Locations Vary</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <svg className="w-5 h-5 text-secondary mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a2 2 0 012 2v1H3V9a2 2 0 012-2h3z" />
                                    </svg>
                                    <div>
                                        <p className="font-medium">Parking</p>
                                        <p className="text-base-content/70">Free parking available<br />Handicap accessible</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Contact Form & FAQ */}
                    <section className="flex flex-col h-full">
                        <div className="space-y-8 h-full flex flex-col">
                        {/* Contact Form */}
                        <div className="bg-base-100 rounded-2xl p-8 shadow-xl border border-gray-200 flex-1">
                            <div className="mb-6">
                                <h2 className="text-2xl font-semibold text-primary">Send Us a Message</h2>
                                <p className="text-sm mt-1 text-base-content/70">
                                    We&#39;ll get back to you within 24 hours.
                                </p>
                            </div>

                            {!submitted ? (
                                <form onSubmit={onSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <label className="form-control">
                                            <div className="label">
                                                <span className="label-text font-medium">Name *</span>
                                            </div>
                                            <input
                                                required
                                                type="text"
                                                name="name"
                                                value={form.name}
                                                onChange={handleChange}
                                                className="input input-bordered rounded-xl focus:input-primary bg-primary-content"
                                                placeholder="Your full name"
                                            />
                                        </label>

                                        <label className="form-control">
                                            <div className="label">
                                                <span className="label-text font-medium">Email *</span>
                                            </div>
                                            <input
                                                required
                                                type="email"
                                                name="email"
                                                value={form.email}
                                                onChange={handleChange}
                                                className="input input-bordered rounded-xl focus:input-primary bg-primary-content"
                                                placeholder="you@example.com"
                                            />
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <label className="form-control">
                                            <div className="label">
                                                <span className="label-text font-medium">Phone</span>
                                            </div>
                                            <input
                                                type="tel"
                                                name="phone"
                                                value={form.phone}
                                                onChange={handleChange}
                                                className="input input-bordered rounded-xl focus:input-primary bg-primary-content"
                                                placeholder="(###) ###-####"
                                            />
                                        </label>

                                        <label className="form-control">
                                            <div className="label">
                                                <span className="label-text font-medium">Preferred Contact</span>
                                            </div>
                                            <select
                                                name="preferredContact"
                                                value={form.preferredContact}
                                                onChange={handleChange}
                                                className="select select-bordered rounded-xl focus:select-primary bg-primary-content"
                                            >
                                                <option value="email">Email</option>
                                                <option value="phone">Phone</option>
                                                <option value="either">Either</option>
                                            </select>
                                        </label>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <label className="form-control">
                                            <div className="label">
                                                <span className="label-text font-medium">Subject *</span>
                                            </div>
                                            <input
                                                required
                                                type="text"
                                                name="subject"
                                                value={form.subject}
                                                onChange={handleChange}
                                                className="input input-bordered rounded-xl focus:input-primary bg-primary-content"
                                                placeholder="What's this about?"
                                            />
                                        </label>

                                        <label className="form-control">
                                            <div className="label">
                                                <span className="label-text font-medium">Urgency</span>
                                            </div>
                                            <select
                                                name="urgency"
                                                value={form.urgency}
                                                onChange={handleChange}
                                                className="select select-bordered rounded-xl focus:select-primary bg-primary-content"
                                            >
                                                <option value="general">General Inquiry</option>
                                                <option value="appointment">Appointment Request</option>
                                                <option value="urgent">Urgent (Non-Emergency)</option>
                                                <option value="billing">Billing Question</option>
                                            </select>
                                        </label>
                                    </div>

                                    <label className="form-control">
                                        <div className="label">
                                            <span className="label-text font-medium">Message *</span>
                                        </div>
                                        <textarea
                                            required
                                            name="message"
                                            value={form.message}
                                            onChange={handleChange}
                                            className="textarea textarea-bordered rounded-xl min-h-[150px] focus:textarea-primary bg-primary-content w-full mb-4"
                                            placeholder="How can we help you today?"
                                        />
                                    </label>

                                    <button 
                                        type="submit" 
                                        className="w-full h-12 px-4 bg-teal-600 hover:bg-teal-700 text-white border-none rounded-lg font-semibold cursor-pointer transition-all duration-200 text-lg flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                        </svg>
                                        Send Message
                                    </button>
                                </form>
                            ) : (
                                <div className="rounded-xl bg-success/10 border border-success/20 p-6 text-center">
                                    <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-4">
                                        <svg className="w-8 h-8 text-success-content" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <h3 className="font-semibold text-success text-lg mb-2">Message Sent Successfully!</h3>
                                    <p className="text-success/80 mb-4">
                                        Thank you for reaching out. We&#39;ll get back to you within 24 hours.
                                    </p>
                                    <button
                                        className="btn btn-outline btn-success rounded-xl"
                                        onClick={() => setSubmitted(false)}
                                    >
                                        Send Another Message
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* FAQ Section */}
                        <div className="bg-base-100 rounded-2xl p-8 shadow-xl border border-gray-200 flex-shrink-0">
                            <h3 className="text-2xl font-semibold mb-6 text-primary">Frequently Asked Questions</h3>
                            <div className="space-y-4">
                                {faqs.map((faq, index) => (
                                    <div key={index} className="collapse collapse-plus border border-gray-200 rounded-xl">
                                        <input type="checkbox" aria-label={`Expand FAQ: ${faq.question}`} />
                                        <div className="collapse-title text-lg font-medium">
                                            {faq.question}
                                        </div>
                                        <div className="collapse-content">
                                            <p className="text-base-content/70">{faq.answer}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
