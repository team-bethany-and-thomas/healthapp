"use client";


import React from "react";
import DashboardOverview from "../../../components/ui/DashboardOverview";
import styles from "../../../components/ui/DashboardOverview.module.css";

function page() {
  return (
    <div className="p-6">
      <div className={styles.headerSection}>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dashboard Overview
        </h1>
        <p className="text-gray-600">
          Welcome back! Here&apos;s an overview of your health information.
        </p>
      </div>

      {/* Overview Cards Section */}
      <section className="mb-8">
        <DashboardOverview />
      </section>
    </div>
  );
}

export default page;
