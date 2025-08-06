import { NextResponse } from "next/server";
import { getUserAppointment } from "../../../lib/getUserAppointment";

export async function GET(req: Request) {
    console.log('=== API ROUTE CALLED ===');
    console.log('Request URL:', req.url);
    
    // Check environment variables
    console.log('Environment check:');
    console.log('NEXT_PUBLIC_APPWRITE_DATABASE_ID:', process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID);
    console.log('NEXT_PUBLIC_APPWRITE_APPOINTMENTS_COLLECTION_ID:', process.env.NEXT_PUBLIC_APPWRITE_APPOINTMENTS_COLLECTION_ID);
    
    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get('patient_id');
    
    console.log('Patient ID from query params:', patientId);
    console.log('Type of patientId:', typeof patientId);

    if (!patientId) {
        console.log('No patient_id provided');
        return NextResponse.json({ error: 'Missing patient_id' }, { status: 400 });
    }

    try {
        console.log('About to call getUserAppointment with:', patientId);
        const appointments = await getUserAppointment(patientId);
        console.log('getUserAppointment returned:', appointments);
        console.log('Number of appointments found:', appointments.length);
        
        return NextResponse.json({ 
            success: true,
            patient_id: patientId,
            appointments: appointments,
            count: appointments.length
        }, { status: 200 });

    } catch (error) {
        console.error('Error in API route:', error);
        return NextResponse.json({ 
            error: 'Internal Server Error',
            message: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
