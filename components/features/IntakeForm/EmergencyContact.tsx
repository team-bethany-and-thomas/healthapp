"use client";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
interface EmergencyContactFormData {
  contact_id: string;
  patient_id: string;
  first_name: string;
  last_name: string;
  relationship: string;
  phone_primary: string;
  phone_secondary: string;
  email: string;
  priority_order: string;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

const EmergencyContactSchema = z.object({
  contact_id: z.string(),
  patient_id: z.string(),
  first_name: z.string().min(1, "First Name is required"),
  last_name: z.string().min(1, "Last name is required"),
  relationship: z.string().min(1, "Relationship is required"),
  phone_primary: z.string().min(9, "Phone number must be at least 9 digits"),
  phone_secondary: z.string().min(9, "Phone number must be at least 9 digits"),
  email: z.string().email("Invalid email address"),
  priority_order: z.string("priority number is required"),
  created_at: z.date(),
  updated_at: z.date(),
  is_active: z.boolean(),
});

interface EmergencyContactFormProps {
  onSubmit: (data: EmergencyContactFormData) => void;
  defaultValues: EmergencyContactFormData;
}

export const EmergencyContact: React.FC<EmergencyContactFormProps> = ({
  onSubmit,
  defaultValues,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: defaultValues,
    resolver: zodResolver(EmergencyContactSchema),
  });
  useEffect(() => {
    reset(defaultValues);
  }, [defaultValues, reset]);

  const handleNextClick = handleSubmit((data) => onSubmit(data));

  return (
    <form className="card bg-base-100 shadow-xl ">
      <div className="card-body">
        <h2 className="card-title text-xl  mb-4">
          Emergency Contact Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">First Name</span>
            </label>
            <input
              type="text"
              {...register("first_name")}
              className={`input  input-bordered w-full bg-base-200 text-base-content ${
                errors.first_name ? "input-error" : ""
              }`}
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
              className="input  input-bordered w-full bg-base-200 text-base-content "
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
              <span className="label-text">Relationship </span>
            </label>
            <input
              type="text"
              {...register("relationship")}
              className="input  input-bordered w-full bg-base-200 text-base-content "
              placeholder="Enter Relationship"
            />
            {errors.relationship && (
              <span className="text-error">{errors.relationship.message}</span>
            )}
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Phone Number(primary)</span>
            </label>
            <input
              type="text"
              {...register("phone_primary")}
              className="input  input-bordered w-full  bg-base-200 text-base-content"
              placeholder="Enter phone number"
            />
            {errors.phone_primary && (
              <span className="text-error">{errors.phone_primary.message}</span>
            )}
          </div>
        </div>

        <div className="form-control">
          <label className="label">
            <span className="label-text">Phone Number(secondary)</span>
          </label>
          <input
            type="text"
            {...register("phone_secondary")}
            className="input  input-bordered w-full  bg-base-200 text-base-content"
            placeholder="Enter phone number"
          />
          {errors.phone_secondary && (
            <span className="text-error">{errors.phone_secondary.message}</span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Email </span>
            </label>
            <input
              type="text"
              {...register("email")}
              className="input  input-bordered w-full bg-base-200 text-base-content "
              placeholder="Enter email"
            />
            {errors.email && (
              <span className="text-error">{errors.email.message}</span>
            )}
          </div>
          <div className="form-control mb-4">
            <label className="label">Priority Order</label>
            <input
              type="number"
              {...register("priority_order")}
              className="input input-bordered w-full  bg-base-200 text-base-content "
              placeholder="Enter priority order"
            />
            {errors.priority_order && (
              <span className="text-error">
                {errors.priority_order.message}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={handleNextClick}
          className="btn btn-primary mt-4"
        >
          Next
        </button>
      </div>
    </form>
  );
};
