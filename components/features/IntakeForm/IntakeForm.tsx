"use client";

import {
  ContactRound,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
  Pill,
} from "lucide-react";

const PatientInformation: React.FC = () => {
  return (
    <div className="card bg-base-100 shadow-xl ">
      <div className="card-body">
        <h2 className="card-title text-xl  mb-4">Patient Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">First Name</span>
            </label>
            <input
              type="text"
              required
              className="input  input-bordered w-full"
              placeholder="Enter first name"
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Last Name </span>
            </label>
            <input
              type="text"
              required
              className="input  input-bordered w-full "
              placeholder="Enter last name"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">Email </span>
            </label>
            <input
              type="text"
              required
              className="input  input-bordered w-full "
              placeholder="Enter email"
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Phone Number</span>
            </label>
            <input
              type="text"
              required
              className="input  input-bordered w-full  bg-base-200 text-base-content"
              placeholder="Name"
            />
          </div>
        </div>

        <div className="form-control mb-4">
          <label className="label">
            <span className="label-text">Address</span>
          </label>
          <input
            type="text"
            required
            className="input  input-bordered w-full  bg-base-200 text-base-content"
            placeholder="Name"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">City</span>
            </label>
            <input
              type="text"
              required
              className="input  input-bordered w-full  bg-base-200 text-base-content"
              placeholder="Name"
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">State</span>
            </label>
            <select
              required
              className="select select-bordered w-full  bg-base-200 text-base-content"
            >
              <option disabled={true}>Select Your State</option>
            </select>
          </div>
        </div>

        <div className="form=control mb-4">
          <label className="label">Zip Code</label>
          <input
            type="text"
            required
            className="input input-bordered w-full  bg-base-200 text-base-content "
            placeholder="Name"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="form-control">
            <input
              type="text"
              required
              className="input input-bordered w-full  bg-base-200 text-base-content"
              placeholder="Which browser do you use"
              list="browsers"
            />
            <datalist id="Genders">
              <option value="Chrome"></option>
              <option value="Firefox"></option>
              <option value="Safari"></option>
              <option value="Opera"></option>
              <option value="Edge"></option>
            </datalist>
          </div>
          <div className="form-control">
            <input
              type="date"
              required
              className="input input-bordered w-full bg-base-200 text-base-content"
              placeholder="Date of Birth"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export const IntakeForm: React.FC = () => {
  return (
    // functionality
    // one card showing at a time based on current step
    //when clicked should add a 'step-secondary' class for section's step
    // similar to step 1 & <PatientInformation/>
    // state for step
    // button for increasing and decreasing steps
    <>
      <div className="flex justify-center z-10 border-b border-base-300  border-t py-4">
        <ul className="steps w-full max-w-4xl">
          <li className="step step-secondary flex-1">
            <span className="step-icon">
              <ContactRound />
            </span>
            Patient <br />
            Information
          </li>
          <li className="step step-secondary flex-1">
            <span className="step-icon">
              <ShieldAlert />
            </span>
            Emergency
            <br />
            Contact
          </li>
          <li className="step step-accent flex-1">
            <span className="step-icon">
              <ShieldCheck />
            </span>
            Insurance
            <br />
            Information
          </li>
          <li className="step flex-1">
            <span className="step-icon">
              <TriangleAlert />
            </span>
            Allergies
          </li>
          <li className="step flex-1">
            <span className="step-icon">
              <Pill />
            </span>
            Medications
          </li>
        </ul>
      </div>
      <main className=" flex justify-center items-start min-h-screen px-4">
        <div className="w-full max-w-3xl">
          <PatientInformation />
        </div>
      </main>
    </>
  );
};
