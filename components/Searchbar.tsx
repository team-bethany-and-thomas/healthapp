"use client";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
// import { Stethoscope } from "lucide-react";
// import { Brain } from "lucide-react";
// import { MapPin } from "lucide-react";
const Searchbar = () => {
  type FormData = {
    specialty?: string;
    provider?: string;
    location?: string;
  };

  const { register, handleSubmit } = useForm<FormData>();

  const onSubmit = (formData: FormData) => {
    console.log(formData);
  };

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-row">
        <div>
          <input
            {...register("specialty")}
            type="text"
            className="input"
            placeholder="Medical Specialty"
            list="specialties"
          />

          {/* <Brain /> */}

          <datalist id="specialties">
            <option value="Primary Care (Family or Internal Medicine)"></option>
            <option value="Pediatrics"></option>
            <option value="Obstetrics & Gynecology"></option>
            <option value="Cardiology"></option>
            <option value="Dermatology"></option>
            <option value="Orthopedics"></option>
            <option value="Psychiatry & Mental Health"></option>
            <option value="Gastroenterology"></option>
            <option value="Neurology"></option>
            <option value="Endocrinology"></option>
          </datalist>
        </div>

        <input
          {...register("provider")}
          type="text"
          className="input"
          placeholder="Search by provider name"
          list="providers"
        />

        {/* <Stethoscope /> */}

        <datalist id="providers">
          <option value="Dr. Emily Chen"></option>
          <option value="Dr. Marcus Patel"></option>
          <option value="Dr. Rachel Nguyen"></option>
          <option value="Dr. Thomas Brooks"></option>
          <option value="Dr. Aisha Roberts"></option>
          <option value="Dr. James Okafor"></option>
          <option value="Dr. Sofia Martinez"></option>
          <option value="Dr. Henry Kim"></option>
          <option value="Dr. Olivia Adams"></option>
          <option value="Dr. Noah Singh"></option>
        </datalist>

        <input
          {...register("location")}
          type="text"
          className="input"
          placeholder="Where in the Dallas Metroplex are you?"
          list="locations"
        />

        {/* <MapPin /> */}

        <datalist id="locations">
          <option value="Dallas"></option>
          <option value="Fort Worth"></option>
          <option value="Arlington"></option>
          <option value="Plano"></option>
          <option value="Frisco"></option>
          <option value="Irving"></option>
          <option value="Carrollton"></option>
          <option value="Garland"></option>
          <option value="Richardson"></option>
          <option value="Grand Prairie"></option>
          <option value="McKinney"></option>
          <option value="Allen"></option>
          <option value="The Colony"></option>
          <option value="Lewisville"></option>
          <option value="Mesquite"></option>
          <option value="Denton"></option>
          <option value="Flower Mound"></option>
          <option value="Euless"></option>
          <option value="Keller"></option>
          <option value="Southlake"></option>
        </datalist>
        <button className="btn btn-soft btn-primary" type="submit">
          Search
        </button>
      </form>
    </div>
  );
};

export default Searchbar;
