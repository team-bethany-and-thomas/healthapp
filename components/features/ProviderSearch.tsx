import React from 'react'
import { Search, Stethoscope, Hospital, Syringe, MapPin } from "lucide-react";
import styles from './ProviderSearch.module.css';

export function ProviderSearch() {
    return (
      <div className={styles['provider-search-container']}>
        <div className={styles['search-header']}>
          <Hospital className={styles['hospital-icon']} />
          <h1 className="text-black">Find a Healthcare Provider</h1>
        </div>
  
        <div className={styles['search-bar']}>
          <Search className={styles['search-icon']} />
          <input 
            type="text" 
            placeholder="Search by name, specialty, or location..." 
          />
          <button className={styles['search-button']}>
            <Stethoscope className={styles['button-icon']} />
            Search
          </button>
        </div>
  
        <div className={styles['filter-chips']}>
          <div className={styles.chip}>
            <Syringe size={16} />
            <span>Something</span>
          </div>
          <div className={styles.chip}>
            <Stethoscope size={16} />
            <span>Something</span>
          </div>
          <div className={styles.chip}>
            <MapPin size={16} />
            <span>Something else</span>
          </div>
        </div>
      </div>
    );
  }