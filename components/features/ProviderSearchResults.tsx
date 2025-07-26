import React, { useEffect, useState } from "react";

export const ProviderSearchResults = () => {
  const [providers, setProviders] = useState<unknown | []>([]);

  const allProviders = [
    {
      first_name: "Emily",
      last_name: "Chen",
      specialty: "Primary Care (Family or Internal Medicine)",
      city: "Dallas",
      state: "TX",
      zip: "75201",
      education: "MD - University of Texas Southwestern Medical School",
      practice_name: "Pulse Clinic - Downtown Dallas",
      languages_spoken: ["English", "Mandarin"],
      rating: 4.8,
      appointments: [
        {
          date: "2025-07-26",
          start_time: "09:00",
          length_minutes: 30,
        },
        {
          date: "2025-07-26",
          start_time: "10:30",
          length_minutes: 30,
        },
        {
          date: "2025-07-27",
          start_time: "08:00",
          length_minutes: 30,
        },
        {
          date: "2025-07-28",
          start_time: "14:00",
          length_minutes: 45,
        },
      ],
    },
    {
      first_name: "Marcus",
      last_name: "Patel",
      specialty: "Cardiology",
      city: "Plano",
      state: "TX",
      zip: "75023",
      education: "MD - Baylor College of Medicine",
      practice_name: "Pulse Clinic - Plano",
      languages_spoken: ["English", "Hindi", "Gujarati"],
      rating: 4.9,
      appointments: [
        {
          date: "2025-07-26",
          start_time: "11:00",
          length_minutes: 60,
        },
        {
          date: "2025-07-27",
          start_time: "09:30",
          length_minutes: 60,
        },
        {
          date: "2025-07-29",
          start_time: "13:00",
          length_minutes: 45,
        },
      ],
    },
    {
      first_name: "Rachel",
      last_name: "Nguyen",
      specialty: "Pediatrics",
      city: "Frisco",
      state: "TX",
      zip: "75034",
      education: "MD - Texas A&M Health Science Center",
      practice_name: "Pulse Clinic - Frisco",
      languages_spoken: ["English", "Vietnamese"],
      rating: 4.7,
      appointments: [
        {
          date: "2025-07-26",
          start_time: "10:00",
          length_minutes: 30,
        },
        {
          date: "2025-07-26",
          start_time: "15:30",
          length_minutes: 30,
        },
        {
          date: "2025-07-28",
          start_time: "09:00",
          length_minutes: 30,
        },
        {
          date: "2025-07-29",
          start_time: "16:00",
          length_minutes: 30,
        },
      ],
    },
    {
      first_name: "Thomas",
      last_name: "Brooks",
      specialty: "Orthopedics",
      city: "Arlington",
      state: "TX",
      zip: "76010",
      education: "MD - University of Texas Medical Branch",
      practice_name: "Pulse Clinic - Arlington",
      languages_spoken: ["English"],
      rating: 4.6,
      appointments: [
        {
          date: "2025-07-27",
          start_time: "08:30",
          length_minutes: 45,
        },
        {
          date: "2025-07-28",
          start_time: "10:15",
          length_minutes: 60,
        },
        {
          date: "2025-07-30",
          start_time: "14:30",
          length_minutes: 45,
        },
      ],
    },
    {
      first_name: "Aisha",
      last_name: "Roberts",
      specialty: "Obstetrics & Gynecology",
      city: "Fort Worth",
      state: "TX",
      zip: "76102",
      education: "MD - UT Health San Antonio",
      practice_name: "Pulse Clinic - Fort Worth",
      languages_spoken: ["English", "Spanish"],
      rating: 4.8,
      appointments: [
        {
          date: "2025-07-26",
          start_time: "13:00",
          length_minutes: 30,
        },
        {
          date: "2025-07-27",
          start_time: "11:30",
          length_minutes: 45,
        },
        {
          date: "2025-07-29",
          start_time: "09:00",
          length_minutes: 30,
        },
        {
          date: "2025-07-30",
          start_time: "15:00",
          length_minutes: 30,
        },
      ],
    },
    {
      first_name: "James",
      last_name: "Okafor",
      specialty: "Neurology",
      city: "Irving",
      state: "TX",
      zip: "75038",
      education: "MD - Texas Tech University Health Sciences Center",
      practice_name: "Pulse Clinic - Irving",
      languages_spoken: ["English", "Igbo"],
      rating: 4.5,
      appointments: [
        {
          date: "2025-07-27",
          start_time: "10:00",
          length_minutes: 60,
        },
        {
          date: "2025-07-28",
          start_time: "14:00",
          length_minutes: 60,
        },
        {
          date: "2025-07-31",
          start_time: "11:00",
          length_minutes: 45,
        },
      ],
    },
    {
      first_name: "Sofia",
      last_name: "Martinez",
      specialty: "Dermatology",
      city: "McKinney",
      state: "TX",
      zip: "75070",
      education: "MD - University of Texas Southwestern Medical School",
      practice_name: "Pulse Clinic - McKinney",
      languages_spoken: ["English", "Spanish"],
      rating: 4.9,
      appointments: [
        {
          date: "2025-07-26",
          start_time: "12:00",
          length_minutes: 30,
        },
        {
          date: "2025-07-27",
          start_time: "14:30",
          length_minutes: 30,
        },
        {
          date: "2025-07-28",
          start_time: "11:00",
          length_minutes: 30,
        },
        {
          date: "2025-07-30",
          start_time: "10:00",
          length_minutes: 30,
        },
      ],
    },
    {
      first_name: "Henry",
      last_name: "Kim",
      specialty: "Gastroenterology",
      city: "Richardson",
      state: "TX",
      zip: "75080",
      education: "MD - Baylor College of Medicine",
      practice_name: "Pulse Clinic - Richardson",
      languages_spoken: ["English", "Korean"],
      rating: 4.7,
      appointments: [
        {
          date: "2025-07-26",
          start_time: "08:00",
          length_minutes: 45,
        },
        {
          date: "2025-07-28",
          start_time: "13:30",
          length_minutes: 45,
        },
        {
          date: "2025-07-29",
          start_time: "10:30",
          length_minutes: 60,
        },
      ],
    },
    {
      first_name: "Olivia",
      last_name: "Adams",
      specialty: "Psychiatry & Mental Health",
      city: "Carrollton",
      state: "TX",
      zip: "75006",
      education: "MD - University of Texas Medical Branch",
      practice_name: "Pulse Clinic - Carrollton",
      languages_spoken: ["English"],
      rating: 4.6,
      appointments: [
        {
          date: "2025-07-27",
          start_time: "12:00",
          length_minutes: 60,
        },
        {
          date: "2025-07-28",
          start_time: "09:30",
          length_minutes: 60,
        },
        {
          date: "2025-07-30",
          start_time: "11:30",
          length_minutes: 60,
        },
      ],
    },
    {
      first_name: "Noah",
      last_name: "Singh",
      specialty: "Endocrinology",
      city: "Garland",
      state: "TX",
      zip: "75040",
      education: "MD - Texas A&M Health Science Center",
      practice_name: "Pulse Clinic - Garland",
      languages_spoken: ["English", "Punjabi", "Hindi"],
      rating: 4.8,
      appointments: [
        {
          date: "2025-07-26",
          start_time: "14:00",
          length_minutes: 45,
        },
        {
          date: "2025-07-27",
          start_time: "16:00",
          length_minutes: 45,
        },
        {
          date: "2025-07-29",
          start_time: "08:30",
          length_minutes: 45,
        },
        {
          date: "2025-07-31",
          start_time: "13:15",
          length_minutes: 45,
        },
      ],
    },
  ];

  useEffect(() => {
    const fetchProviders = async () => {
      console.log("mock fetch of all providers boo bop beep");
      setProviders(allProviders);
      console.log(providers);
    };
    fetchProviders();
  }, [allProviders]);
  setProviders(allProviders);
  return <></>;
};
