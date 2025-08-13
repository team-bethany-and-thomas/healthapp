'use client'

export default function AboutPage() {
    const teamMembers = [
        {
            name: "Michelle Parker",
            role: "Chief Executive Officer",
            image: "/team/michelle.png",
            bio: "Leading Pulse Clinic with over 15 years of healthcare administration experience."
        },
        {
            name: "Dr. Amanda Rodriguez",
            role: "Chief Medical Officer",
            image: "/team/amanda.png",
            bio: "Board-certified physician ensuring the highest standards of medical care."
        },
        {
            name: "Marcus Thompson",
            role: "Director of Operations",
            image: "/team/marcus.png",
            bio: "Streamlining operations to provide seamless patient experiences."
        },
        {
            name: "Jennifer Liu",
            role: "Head of Technology",
            image: "/team/jennifer.png",
            bio: "Developing innovative healthcare technology solutions for better patient care."
        },
        {
            name: "Carlos Mendez",
            role: "Patient Care Coordinator",
            image: "/team/carlos.png",
            bio: "Ensuring every patient receives personalized and compassionate care."
        },
        {
            name: "Rachel Green",
            role: "Head of Nursing",
            image: "/team/rachel.png",
            bio: "Leading our nursing team with expertise in patient care and safety."
        }
    ];

    const values = [
        {
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
            ),
            title: "Compassionate Care",
            description: "We treat every patient with empathy, respect, and dignity, ensuring they feel heard and valued throughout their healthcare journey."
        },
        {
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
            ),
            title: "Excellence in Medicine",
            description: "We maintain the highest standards of medical practice, utilizing evidence-based treatments and cutting-edge technology."
        },
        {
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
            ),
            title: "Community Focus",
            description: "We're committed to improving the health and wellbeing of our entire community through accessible, quality healthcare."
        },
        {
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            ),
            title: "Innovation",
            description: "We embrace new technologies and treatment methods to provide the most effective and efficient care possible."
        }
    ];

    const stats = [
        { number: "50,000+", label: "Patients Served" },
        { number: "15+", label: "Years of Service" },
        { number: "98%", label: "Patient Satisfaction" },
        { number: "24/7", label: "Emergency Support" }
    ];

    return (
        <div className="min-h-screen bg-[#C7F7F1]">
            {/* Hero Section */}
            <section className="relative py-20 px-6">
                <div className="max-w-6xl mx-auto text-center">
                    <h1 className="text-5xl font-bold text-primary mb-4">About Pulse Clinic</h1>
                    <p className="text-xl text-base-content/80 max-w-3xl mx-auto leading-relaxed">
                        Transforming healthcare through compassionate care, innovative technology, 
                        and a commitment to your wellbeing. We&#39;re more than a clinic – we&#39;re your 
                        partners in health.
                    </p>
                </div>
            </section>

            {/* Mission & Vision */}
            <section className="py-16 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        {/* Mission */}
                        <div className="bg-base-100 rounded-2xl p-8 shadow-xl border border-gray-200 hover:shadow-2xl transition-all duration-300">
                            <div className="flex items-center mb-6">
                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mr-4">
                                    <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <h2 className="text-3xl font-bold text-primary">Our Mission</h2>
                            </div>
                            <p className="text-base-content/80 text-lg leading-relaxed">
                                To provide exceptional, patient-centered healthcare that combines clinical excellence 
                                with compassionate care. We strive to create a welcoming environment where every 
                                individual feels valued, respected, and empowered to achieve their best health.
                            </p>
                        </div>

                        {/* Vision */}
                        <div className="bg-base-100 rounded-2xl p-8 shadow-xl border border-gray-200 hover:shadow-2xl transition-all duration-300">
                            <div className="flex items-center mb-6">
                                <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mr-4">
                                    <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                </div>
                                <h2 className="text-3xl font-bold text-secondary">Our Vision</h2>
                            </div>
                            <p className="text-base-content/80 text-lg leading-relaxed">
                                To be the leading healthcare provider in our community, recognized for innovation, 
                                excellence, and our unwavering commitment to improving the health and wellness of 
                                the families we serve. Together, building a healthier tomorrow.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 px-6 bg-gradient-to-r from-primary/5 to-secondary/5">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-bold text-center text-primary mb-12">Our Impact</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                        {stats.map((stat, index) => (
                            <div key={index} className="text-center">
                                <div className="text-4xl font-bold text-secondary mb-2">{stat.number}</div>
                                <div className="text-base-content/70 text-lg">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Values Section */}
            <section className="py-16 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-primary mb-4">Our Core Values</h2>
                        <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
                            These principles guide everything we do and shape the care we provide.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {values.map((value, index) => (
                            <div key={index} className="bg-base-100 rounded-2xl p-6 shadow-xl border border-gray-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                                <div className="flex items-start gap-4">
                                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary flex-shrink-0">
                                        {value.icon}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-semibold text-primary mb-3">{value.title}</h3>
                                        <p className="text-base-content/80 leading-relaxed">{value.description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Clinic Image Section */}
            <section className="py-16 px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-base-100 rounded-2xl p-8 shadow-xl border border-gray-200">
                        <h2 className="text-3xl font-bold text-center text-primary mb-8">Our Modern Facility</h2>
                        <div className="rounded-2xl overflow-hidden shadow-lg">
                            <img 
                                src="/clinic.png"
                                alt="Pulse Clinic modern facility"
                                className="w-full h-[400px] object-cover"
                            />
                        </div>
                        <p className="text-center text-base-content/70 mt-6 text-lg">
                            Our state-of-the-art facility is designed with your comfort and care in mind, 
                            featuring the latest medical technology and a welcoming environment.
                        </p>
                    </div>
                </div>
            </section>

            {/* Team Section */}
            <section className="py-16 px-6 bg-gradient-to-r from-primary/5 to-secondary/5">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold text-primary mb-4">Meet Our Leadership Team</h2>
                        <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
                            Our dedicated leadership team brings together decades of experience in healthcare, 
                            technology, and patient care to ensure you receive the best possible service.
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {teamMembers.map((member, index) => (
                            <div key={index} className="bg-base-100 rounded-2xl p-6 shadow-xl border border-gray-200 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 text-center">
                                <div className="avatar mb-4">
                                    <div className="w-24 h-24 rounded-full ring-2 ring-primary ring-offset-2 ring-offset-base-100 mx-auto">
                                        <img 
                                            src={member.image}
                                            alt={member.name}
                                            className="object-cover rounded-full"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'%3E%3Crect width='96' height='96' fill='%23e5e7eb'/%3E%3Ctext x='48' y='48' font-family='Arial' font-size='12' fill='%236b7280' text-anchor='middle' dy='.3em'%3E${member.name.split(' ').map(n => n[0]).join('')}%3C/text%3E%3C/svg%3E`;
                                            }}
                                        />
                                    </div>
                                </div>
                                <h3 className="text-xl font-semibold text-primary mb-1">{member.name}</h3>
                                <p className="text-secondary font-medium mb-3">{member.role}</p>
                                <p className="text-base-content/70 text-sm leading-relaxed">{member.bio}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-12 text-primary-content shadow-2xl">
                        <h2 className="text-3xl font-bold mb-4">Ready to Experience Better Healthcare?</h2>
                        <p className="text-xl mb-8 opacity-90">
                            Join thousands of patients who trust Pulse Clinic for their healthcare needs. 
                            Schedule your appointment today and discover the difference personalized care makes.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <a 
                                href="/contact" 
                                className="btn btn-accent btn-lg rounded-xl hover:btn-warning transition-all duration-300 text-lg"
                            >
                                Contact Us Today
                                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </a>
                            <a 
                                href="/search" 
                                className="btn btn-outline btn-accent btn-lg rounded-xl hover:btn-accent hover:text-accent-content transition-all duration-300 text-lg border-2"
                            >
                                Find a Doctor
                                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}