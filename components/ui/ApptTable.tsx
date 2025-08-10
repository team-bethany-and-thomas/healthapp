"use client";

import { useEffect, useState } from "react";
import { account, databases } from "../../app/lib/appwrite";
import { Query } from "appwrite";

type Appointment = {
  $id: string;
  date: string;
  doctor: string;
  facility: string;
  areaOfConcern: string;
  insurance: string;
  contact: string;
};

export const ApptTable = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const user = await account.get();
        const res = await databases.listDocuments(
          process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!,
          process.env.NEXT_PUBLIC_APPWRITE_APPOINTMENTS_COLLECTION_ID!,
          [Query.equal("id", user.$id)]
        );

        setAppointments(
          res.documents.map((doc: any) => ({
            $id: doc.$id,
            date: doc.date,
            doctor: doc.doctor,
            facility: doc.facility,
            areaOfConcern: doc.areaOfConcern,
            insurance: doc.insurance,
            contact: doc.contact,
          }))
        );
      } catch (err) {
        console.error("Failed to fetch appointments:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, []);
  return (
    <>
      <h3 className="text-xl font-semibold mb-4 mt-4">Appointments</h3>
      <button className="btn btn-primary rounded-md mb-4 ml-130">
        Schedule Appt
      </button>
      <div className="overflow-x-auto rounded-box border border-base-content/5 bg-base-100 mr-50 rounded-xl">
        <table className="table table-lg table-pin-rows table-pin-cols">
          <thead>
            <tr>
              <th>#</th>
              <td>Date</td>
              <td>Doctor</td>
              <td>Facility</td>
              <td>Area of Concern</td>
              <td>Insurance</td>
              <td>Contact</td>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center p-4">
                  Loading...
                </td>
              </tr>
            ) : appointments.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center p-4">
                  No appointments found.
                </td>
              </tr>
            ) : (
              appointments.map((appt, index) => (
                <tr key={appt.$id}>
                  <th>{index + 1}</th>
                  <td>{appt.date}</td>
                  <td>{appt.doctor}</td>
                  <td>{appt.facility}</td>
                  <td>{appt.areaOfConcern}</td>
                  <td>{appt.insurance}</td>
                  <td>{appt.contact}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );

}