"use client";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
interface PatientFormData {
  patient_id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  date_of_birth?: string;
  gender: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

const patientSchema = z.object({
  patient_id: z.string(),
  user_id: z.string(),
  first_name: z.string().min(1, "First Name is required"),
  last_name: z.string().min(1, "Last name is required"),
  phone: z.string().min(9, "Phone number must be at least 9 digits"),
  email: z.string().email("Invalid email address"),
  date_of_birth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format")
    .optional(), // Allows either a Date object or a valid date string
  gender: z.string("please enter your gender or 'prefer to discuss in person"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  zip_code: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code format"),
  created_at: z.date(),
  updated_at: z.date(),
  is_active: z.boolean(),
});

interface PatientFormProps {
  onSubmit: (data: PatientFormData) => void;
  defaultValues: PatientFormData;
  onClearFields?: () => void;
  onSaveProgress?: () => void;
  isLoading?: boolean;
  isReadOnly?: boolean;
}

export const PatientInformation: React.FC<PatientFormProps> = ({
  onSubmit,
  defaultValues,
  onClearFields,
  onSaveProgress,
  isLoading = false,
  isReadOnly = false,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: defaultValues,
    resolver: zodResolver(patientSchema),
  });
  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  interface State {
    value: string;
    name: string;
  }
  const states: State[] = [
    { value: "AL", name: "Alabama" },
    { value: "AK", name: "Alaska" },
    { value: "AZ", name: "Arizona" },
    { value: "AR", name: "Arkansas" },
    { value: "CA", name: "California" },
    { value: "CO", name: "Colorado" },
    { value: "CT", name: "Connecticut" },
    { value: "DE", name: "Delaware" },
    { value: "FL", name: "Florida" },
    { value: "GA", name: "Georgia" },
    { value: "HI", name: "Hawaii" },
    { value: "ID", name: "Idaho" },
    { value: "IL", name: "Illinois" },
    { value: "IN", name: "Indiana" },
    { value: "IA", name: "Iowa" },
    { value: "KS", name: "Kansas" },
    { value: "KY", name: "Kentucky" },
    { value: "LA", name: "Louisiana" },
    { value: "ME", name: "Maine" },
    { value: "MD", name: "Maryland" },
    { value: "MA", name: "Massachusetts" },
    { value: "MI", name: "Michigan" },
    { value: "MN", name: "Minnesota" },
    { value: "MS", name: "Mississippi" },
    { value: "MO", name: "Missouri" },
    { value: "MT", name: "Montana" },
    { value: "NE", name: "Nebraska" },
    { value: "NV", name: "Nevada" },
    { value: "NH", name: "New Hampshire" },
    { value: "NJ", name: "New Jersey" },
    { value: "NM", name: "New Mexico" },
    { value: "NY", name: "New York" },
    { value: "NC", name: "North Carolina" },
    { value: "ND", name: "North Dakota" },
    { value: "OH", name: "Ohio" },
    { value: "OK", name: "Oklahoma" },
    { value: "OR", name: "Oregon" },
    { value: "PA", name: "Pennsylvania" },
    { value: "RI", name: "Rhode Island" },
    { value: "SC", name: "South Carolina" },
    { value: "SD", name: "South Dakota" },
    { value: "TN", name: "Tennessee" },
    { value: "TX", name: "Texas" },
    { value: "UT", name: "Utah" },
    { value: "VT", name: "Vermont" },
    { value: "VA", name: "Virginia" },
    { value: "WA", name: "Washington" },
    { value: "WV", name: "West Virginia" },
    { value: "WI", name: "Wisconsin" },
    { value: "WY", name: "Wyoming" },
  ];

  const handleNextClick = handleSubmit((data) => onSubmit(data));

  return (
    <form className="card bg-base-100 shadow-xl rounded-2xl">
      <div className="card-body">
        <h2 className="card-title text-xl  mb-4">Patient Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">First Name</span>
            </label>
            <input
              type="text"
              {...register("first_name")}
              disabled={isReadOnly}
              className={`input input-bordered w-full rounded-lg ${
                isReadOnly 
                  ? "bg-gray-100 text-gray-600 cursor-not-allowed" 
                  : "bg-base-200 text-base-content"
              } ${errors.first_name ? "input-error" : ""}`}
              placeholder="Enter first name"
            />
            {errors.first_name && (
              <span className="text-error">{errors.first_name.message}</span>
            )}
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Last Name </span>
            </label>
            <input
              type="text"
              {...register("last_name")}
              disabled={isReadOnly}
              className={`input input-bordered w-full rounded-lg ${
                isReadOnly 
                  ? "bg-gray-100 text-gray-600 cursor-not-allowed" 
                  : "bg-base-200 text-base-content"
              }`}
              placeholder="Enter last name"
            />
            {errors.last_name && (
              <span className="text-error">{errors.last_name.message}</span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Email </span>
            </label>
            <input
              type="text"
              {...register("email")}
              disabled={isReadOnly}
              className={`input input-bordered w-full rounded-lg ${
                isReadOnly 
                  ? "bg-gray-100 text-gray-600 cursor-not-allowed" 
                  : "bg-base-200 text-base-content"
              }`}
              placeholder="Enter email"
            />
            {errors.email && (
              <span className="text-error">{errors.email.message}</span>
            )}
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Phone Number</span>
            </label>
            <input
              type="text"
              {...register("phone")}
              disabled={isReadOnly}
              className={`input input-bordered w-full rounded-lg ${
                isReadOnly 
                  ? "bg-gray-100 text-gray-600 cursor-not-allowed" 
                  : "bg-base-200 text-base-content"
              }`}
              placeholder="Enter phone number"
            />
            {errors.phone && (
              <span className="text-error">{errors.phone.message}</span>
            )}
          </div>
        </div>

        <div className="form-control mb-4">
          <label className="label">
            <span className="label-text">Address</span>
          </label>
          <input
            type="text"
            {...register("address")}
            disabled={isReadOnly}
            className={`input input-bordered w-full rounded-lg ${
              isReadOnly 
                ? "bg-gray-100 text-gray-600 cursor-not-allowed" 
                : "bg-base-200 text-base-content"
            }`}
            placeholder="Enter address"
          />
          {errors.address && (
            <span className="text-error">{errors.address.message}</span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">City</span>
            </label>
            <input
              type="text"
              {...register("city")}
              disabled={isReadOnly}
              className={`input input-bordered w-full rounded-lg ${
                isReadOnly 
                  ? "bg-gray-100 text-gray-600 cursor-not-allowed" 
                  : "bg-base-200 text-base-content"
              }`}
              placeholder="Enter city"
            />
            {errors.city && (
              <span className="text-error">{errors.city.message}</span>
            )}
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">State</span>
            </label>
            <select
              {...register("state")}
              disabled={isReadOnly}
              className={`select select-bordered w-full rounded-lg ${
                isReadOnly 
                  ? "bg-gray-100 text-gray-600 cursor-not-allowed" 
                  : "bg-base-200 text-base-content"
              }`}
              defaultValue={""}
            >
              <option value={""} disabled>
                Select Your State
              </option>

              {states.map((state) => (
                <option key={state.value} value={state.value}>
                  {state.name}
                </option>
              ))}
            </select>
            {errors.state && (
              <span className="text-error">{errors.state.message}</span>
            )}
          </div>
        </div>

        <div className="form-control mb-4">
          <label className="label">Zip Code</label>
          <input
            type="text"
            {...register("zip_code")}
            disabled={isReadOnly}
            className={`input input-bordered w-full rounded-lg ${
              isReadOnly 
                ? "bg-gray-100 text-gray-600 cursor-not-allowed" 
                : "bg-base-200 text-base-content"
            }`}
            placeholder="Enter Zip code"
          />
          {errors.zip_code && (
            <span className="text-error">{errors.zip_code.message}</span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="form-control">
            <input
              type="text"
              {...register("gender")}
              disabled={isReadOnly}
              className={`input input-bordered w-full rounded-lg ${
                isReadOnly 
                  ? "bg-gray-100 text-gray-600 cursor-not-allowed" 
                  : "bg-base-200 text-base-content"
              }`}
              placeholder="Type or select your gender"
              list="Genders"
            />

            <datalist id="Genders">
              <option value="Male"></option>
              <option value="Female"></option>
              <option value="Nonbinary"></option>
              <option value="Prefer to discuss in person"></option>
            </datalist>
            {errors.gender && (
              <span className="text-error">{errors.gender.message}</span>
            )}
          </div>
          <div className="form-control">
            <input
              type="date"
              {...register("date_of_birth")}
              disabled={isReadOnly}
              className={`input input-bordered w-full rounded-lg ${
                isReadOnly 
                  ? "bg-gray-100 text-gray-600 cursor-not-allowed" 
                  : "bg-base-200 text-base-content"
              }`}
              placeholder="Date of Birth"
            />
            {errors.date_of_birth && (
              <span className="text-error">{errors.date_of_birth.message}</span>
            )}
          </div>
        </div>
        {/* Action Buttons Row */}
        <div className="flex flex-col gap-4 mt-6">
          {/* Clear Fields and Save Progress Buttons */}
          {(onClearFields || onSaveProgress) && (
            <div className="flex justify-center gap-4">
              {onClearFields && (
                <button
                  type="button"
                  onClick={onClearFields}
                  disabled={isLoading}
                  className="bg-red-500 hover:bg-red-600 text-white border-none rounded-lg px-4 py-2 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 font-semibold min-w-[120px] hover:transform hover:-translate-y-0.5 hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Clear Fields
                </button>
              )}
              {onSaveProgress && (
                <button
                  type="button"
                  onClick={onSaveProgress}
                  disabled={isLoading}
                  className="bg-blue-500 hover:bg-blue-600 text-white border-none rounded-lg px-4 py-2 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 font-semibold min-w-[120px] hover:transform hover:-translate-y-0.5 hover:shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Saving...
                    </>
                  ) : (
                    "Save Progress"
                  )}
                </button>
              )}
            </div>
          )}
          
          {/* Next Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleNextClick}
              className="bg-[rgba(102,232,219,0.9)] hover:bg-[rgba(72,212,199,0.9)] text-white border-none rounded-lg px-6 py-3 flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 font-semibold min-w-[120px] hover:transform hover:-translate-y-0.5 hover:shadow-lg"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};
