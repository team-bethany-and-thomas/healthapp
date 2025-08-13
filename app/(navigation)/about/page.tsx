'use client'

export default function AboutPage() {
  return (
    <div className="p-8 bg-[#C7F7F1] min-h-screen">
        <h1 className="text-3xl font-bold mb-4">About Us</h1>

        {/* Mission Section */}
        <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-2">Our Mission</h2>
            <p>
                Our mission is to provide high-quality health services and promote wellness in our community. 
                We strive to create a welcoming environment where every patient feels valued and supported. 
                Through compassionate care, education, and innovation, we aim to empower individuals to lead healthier lives and foster a stronger, healthier community for all.
            </p>
        </section>

        {/*Image Section */}
        <section className="mb-10">
                <img 
                    src="/clinic.png"
                    alt="Clinic"
                    className="max-w-md w-full h-auto object-cover rounded-lg shadow-lg mx-auto"
                />
        </section>

        {/*Team section*/}
        <section>
            <h2 className="text-2xl font-semibold mb-4">Meet the Team</h2>
            <div className="space-y-4">
                <p>
                    Our dedicated staff is a diverse group of professionals, from
                    experienced doctors and nurses to friendly administrative personnel.
                    All working together to ensure you recieve the best care possible.
                </p>
                <ul className="list-disc ml-6">
                    <li>Dr.Micheal Chen - Family Medicine</li>
                    <li>Sally Johnson - Clinic Adminstrator</li>
                    <li>David Lee - Registerd Nurse</li>
                    <li>Emily Davis - Medical Assistant</li>
                    <li>James Wilson - Pharmacist</li>
                    <li>Linda Martinez - Receptionist</li>
                    <li>Robert Brown - Lab Technician</li>
                </ul>
            </div>
        </section>

    </div>
  );
}
