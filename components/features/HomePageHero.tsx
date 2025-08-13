"use client";

import React from 'react';
import { Heart, Activity, Syringe, Wind, Pill } from 'lucide-react';
import Link from 'next/link';
import styles from './HomePageHero.module.css';

const medicalCategories = [
  { id: 'heart', icon: Heart, label: "Heart", color: "teal", specialty: "Cardiology" },
  { id: 'lungs', icon: Activity, label: "Lungs", color: "teal", specialty: "Pulmonology" },
  { id: 'diabetics', icon: Syringe, label: "Diabetics", color: "teal", specialty: "Endocrinology" },
  { id: 'oxygen', icon: Wind, label: "Oxygen", color: "teal", specialty: "Pulmonology" },
  { id: 'prescribe', icon: Pill, label: "Prescribe", color: "teal", specialty: "Primary Care (Family or Internal Medicine)" },
];

const insuranceProviders = [
  { id: 'aetna', name: "Aetna", logo: "/Aetna.png" },
  { id: 'anthem', name: "Anthem BlueCross", logo: "/AnthemTile.png" },
  { id: 'humana', name: "Humana", logo: "/Humana.png" },
  { id: 'united', name: "UnitedHealthcare", logo: "/UnitedTile.png" },
  { id: 'caresource', name: "CareSource", logo: "/CareSource.png" },
];

export function HomePageHero() {
  return (
    <div className={styles.heroContainer}>
      <div className={styles.content}>
        <div className={styles.quickConsultSection}>
          <h2 className={styles.sectionTitle}>Quick Consult For</h2>
          <div className="w-16 h-1 bg-gradient-to-r from-teal-500 to-purple-600 mx-auto mb-6 rounded-full"></div>
          
          <div className={styles.medicalCategories}>
            {medicalCategories.map((category) => (
              <Link 
                key={category.id} 
                href={`/search?specialty=${encodeURIComponent(category.specialty)}`}
                className={styles.categoryCard}
              >
                <category.icon className={styles.categoryIcon} size={32} />
                <span className={styles.categoryLabel}>{category.label}</span>
              </Link>
            ))}
          </div>
          
          <Link href="/search" className={styles.viewAllButton}>
            View All
          </Link>
        </div>

        <div className={styles.doctorSection}>
          <h2 className={styles.doctorTitle}>Find an in-network doctor</h2>
          <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-orange-500 mx-auto mb-6 rounded-full"></div>
          <p className={styles.doctorSubtitle}>from over 1,000 insurance plans</p>
          <p className={styles.doctorNote}>
            Always confirm doctor participation before booking. Not all specialties may be available in every plan.
          </p>
          
          <div className={styles.insuranceProviders}>
            {insuranceProviders.map((provider) => (
              <div key={provider.id} className={styles.insuranceCard}>
                <img 
                  src={provider.logo} 
                  alt={provider.name}
                  className={styles.insuranceLogo}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 