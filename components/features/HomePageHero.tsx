"use client";

import React from 'react';
import { Heart, Activity, Syringe, Wind, Pill } from 'lucide-react';
import styles from './HomePageHero.module.css';

const medicalCategories = [
  { icon: Heart, label: "Heart", color: "teal" },
  { icon: Activity, label: "Lungs", color: "teal" },
  { icon: Syringe, label: "Diabetics", color: "teal" },
  { icon: Wind, label: "Oxygen", color: "teal" },
  { icon: Pill, label: "Prescribe", color: "teal" },
];

const insuranceProviders = [
  { name: "Aetna", logo: "/Aetna.png" },
  { name: "Anthem BlueCross", logo: "/AnthemTile.png" },
  { name: "Humana", logo: "/Humana.png" },
  { name: "UnitedHealthcare", logo: "/UnitedTile.png" },
  { name: "CareSource", logo: "/CareSource.png" },
];

export function HomePageHero() {
  return (
    <div className={styles.heroContainer}>
      <div className={styles.backgroundOverlay}>
      </div>
      
      <div className={styles.content}>
        <div className={styles.quickConsultSection}>
          <h2 className={styles.sectionTitle}>Quick Consult For</h2>
          
          <div className={styles.medicalCategories}>
            {medicalCategories.map((category, index) => (
              <div key={index} className={styles.categoryCard}>
                <category.icon className={styles.categoryIcon} size={32} />
                <span className={styles.categoryLabel}>{category.label}</span>
              </div>
            ))}
          </div>
          
          <button className={styles.viewAllButton}>
            View All
          </button>
        </div>

        <div className={styles.doctorSection}>
          <h2 className={styles.doctorTitle}>Find an in-network doctor</h2>
          <p className={styles.doctorSubtitle}>from over 1,000 insurance plans</p>
          <p className={styles.doctorNote}>
            Always confirm doctor participation before booking. Not all specialties may be available in every plan.
          </p>
          
          <div className={styles.insuranceProviders}>
            {insuranceProviders.map((provider, index) => (
              <div key={index} className={styles.insuranceCard}>
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