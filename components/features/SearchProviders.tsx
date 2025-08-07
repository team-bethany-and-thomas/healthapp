"use client";

import React, { useState, useEffect } from "react";
import { Client, Databases, Storage, Query } from "appwrite";
import { useAuth } from "../../app/hooks/useAuth";

// Types
interface Doctor {
  $id: string;
  name: string;
  gender: string;
  specialty: string;
  location: string;
  phone: string;
  availability: string;
  weekend_available: boolean;
  bio: string;
  profile_picture_id: string;
}

// Appwrite configuration using environment variables
const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

const databases = new Databases(client);
const storage = new Storage(client);

// Environment variables for Appwrite configuration
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
const COLLECTION_ID =
  process.env.NEXT_PUBLIC_APPWRITE_PROVIDERS_COLLECTION_ID!;
const PROVIDERS_BUCKET_ID =
  process.env.NEXT_PUBLIC_APPWRITE_PROVIDERS_BUCKET_ID!;

const SearchProviders: React.FC = () => {
  const { user, isLoading: authLoading } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("");
  const [weekendFilter, setWeekendFilter] = useState<boolean | null>(null);

  const specialties = [
    "Primary Care (Family or Internal Medicine)",
    "Pediatrics",
    "Obstetrics & Gynecology",
    "Cardiology",
    "Dermatology",
    "Orthopedics",
    "Psychiatry & Mental Health",
    "Gastroenterology",
    "Neurology",
    "Endocrinology",
  ];

  // Fetch doctors from Appwrite
  useEffect(() => {
    const fetchDoctors = async () => {
      // Don't fetch if still loading auth or user is not authenticated
      if (authLoading) {
        return;
      }

      if (!user) {
        setError("Please log in to view healthcare providers.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Build queries based on filters
        const queries: string[] = [];

        if (searchTerm) {
          queries.push(Query.search("name", searchTerm));
        }

        if (selectedSpecialty) {
          queries.push(Query.equal("specialty", selectedSpecialty));
        }

        if (weekendFilter !== null) {
          queries.push(Query.equal("weekend_available", weekendFilter));
        }

        const response = await databases.listDocuments(
          DATABASE_ID,
          COLLECTION_ID,
          queries
        );

        setDoctors(response.documents as unknown as Doctor[]);
        setError(null);
      } catch (err) {
        console.error("Error fetching doctors:", err);
        if (err instanceof Error && err.message.includes("unauthorized")) {
          setError(
            "You are not authorized to view this content. Please check your permissions."
          );
        } else {
          setError("Failed to fetch doctors. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchDoctors();
  }, [searchTerm, selectedSpecialty, weekendFilter, user, authLoading]);

  // Get profile image URL
  const getProfileImageUrl = (profilePictureId: string): string => {
    if (!profilePictureId) {
      return "/default-avatar.png"; // Fallback image
    }

    try {
      return storage
        .getFilePreview(
          PROVIDERS_BUCKET_ID, // Using providers bucket for doctor profile images
          profilePictureId,
          300, // width
          300, // height
          undefined, // gravity
          85, // quality
          0, // borderWidth
          "000000", // borderColor
          0, // borderRadius
          1, // opacity
          0, // rotation
          "ffffff" // background
        )
        .toString();
    } catch (error) {
      console.error("Error getting image URL:", error);
      return "/default-avatar.png";
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedSpecialty("");
    setWeekendFilter(null);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-error max-w-md mx-auto mt-8">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="stroke-current shrink-0 h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">Find Healthcare Providers</h1>
        <p className="text-base-content/70">
          Search and filter through our network of qualified doctors
        </p>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-base-200 p-6 rounded-lg mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search by name */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Search by name</span>
            </label>
            <input
              type="text"
              placeholder="Enter doctor name..."
              className="input input-bordered w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter by specialty */}
          <div className="form-control">
            <label className="label" htmlFor="specialty-select">
              <span className="label-text">Specialty</span>
            </label>
            <select
              id="specialty-select"
              className="select select-bordered w-full"
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              title="Specialty Filter"
            >
              <option value="">All Specialties</option>
              {specialties.map((specialty) => (
                <option key={specialty} value={specialty}>
                  {specialty}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by weekend availability */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">Weekend Availability</span>
            </label>
            <label htmlFor="weekend-availability-select" className="sr-only">
              Weekend Availability
            </label>
            <select
              id="weekend-availability-select"
              className="select select-bordered w-full"
              value={weekendFilter === null ? "" : weekendFilter.toString()}
              onChange={(e) => {
                const value = e.target.value;
                setWeekendFilter(value === "" ? null : value === "true");
              }}
              title="Weekend Availability"
            >
              <option value="">All</option>
              <option value="true">Available Weekends</option>
              <option value="false">Weekdays Only</option>
            </select>
          </div>

          {/* Clear filters button */}
          <div className="form-control">
            <label className="label">
              <span className="label-text">&nbsp;</span>
            </label>
            <button className="btn btn-outline" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="mb-6">
        <p className="text-base-content/70">
          Found {doctors.length} provider{doctors.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Doctors Grid */}
      {doctors.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-2xl font-semibold mb-2">No providers found</h3>
          <p className="text-base-content/70">
            Try adjusting your search criteria
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {doctors.map((doctor) => (
            <div
              key={doctor.$id}
              className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <figure className="px-4 pt-4">
                <img
                  src={getProfileImageUrl(doctor.profile_picture_id)}
                  alt={`${doctor.name} profile`}
                  className="rounded-lg w-full h-48 object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "/default-avatar.png";
                  }}
                />
              </figure>
              <div className="card-body p-4">
                <h2 className="card-title text-lg font-semibold">
                  {doctor.name}
                </h2>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="badge badge-primary badge-sm">
                      {doctor.gender}
                    </span>
                    {doctor.weekend_available && (
                      <span className="badge badge-success badge-sm">
                        Weekend Available
                      </span>
                    )}
                  </div>

                  <p className="text-primary font-medium">{doctor.specialty}</p>

                  <div className="flex items-center gap-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-base-content/60"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    <span className="text-base-content/60">
                      {doctor.location}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-base-content/60"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-base-content/60 text-xs">
                      {doctor.availability}
                    </span>
                  </div>
                </div>

                <div className="card-actions justify-center mt-4">
                  <button className="btn btn-primary w-full">
                    Book Appointment
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchProviders;