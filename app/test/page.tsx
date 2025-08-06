'use client';

import { useEffect, useState } from 'react';
import { saveAppointment } from '@/app/lib/saveAppointment';

type Appointment = {
  $id: number;
  reason_for_visit: string;
  appointment_date: string;
};

export default function TestAppointmentPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const createTest = async () => {
      try {
        await saveAppointment({
          appointment_id: 103,
          patient_id: 1,
          provider_id: 103,
          appointment_type_id: 3,
          appointment_date: '2026-06-01',
          appointment_time: '09:00',
          reason_for_visit: 'Routine Checkup',
          status: 'pending',
          notes: 'Initial test appointment',
          start_time: '09:00',
          length_minutes: '30',
        });
        // testing to see if it loads into appwrite
        // Simulate fetching appointments after saving
        setAppointments([
          {
            $id: 102,
            reason_for_visit: 'Routine Checkup',
            appointment_date: '2024-06-01',
          },
        ]);
      } catch (e: unknown) {
        if (e && typeof e === 'object' && 'message' in e) {
          setError((e as { message: string }).message);
        } else {
          setError('Failed to save appointment');
        }
      }
    };

    createTest();
  }, []);

  return (
    <div>
      <h1>Test Appointment</h1>
      {error && <p className="text-red-500">{error}</p>}
      {appointments.length === 0 ? (
        <p>No appointments found</p>
      ) : (
        <ul>
          {appointments.map((apt) => (
            <li key={apt.$id}>
              <strong>{apt.reason_for_visit}</strong> – {apt.appointment_date}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}