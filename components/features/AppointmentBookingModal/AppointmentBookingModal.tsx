"use client";
import { useState, useEffect, useRef } from "react";
import React from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { useAuth } from "@/app/providers/AuthProvider";
import {
	appointmentBookingService,
	CreateAppointmentData,
} from "@/app/services/appointmentBookingService";
import { useAppointmentTypes } from "@/app/services/appointmentService";
import Link from "next/link";

interface AppointmentBookingModalProps {
	isOpen: boolean;
	onClose: () => void;
	providerId?: string;
	providerList: Doctor[];
	onAppointmentBooked?: () => void;
}

interface Doctor {
	$id: string;
	name: string;
	gender: string;
	specialty: string;
	location: string;
	phone: string;
	availability: string;
	availability_start?: string;
	availability_end?: string;
	weekend_available: boolean;
	weekend_start?: string;
	weekend_end?: string;
	bio: string;
	profile_picture_id: string;
	provider_id?: number; // Add this to match your schema
}

export const AppointmentBookingModal: React.FC<
	AppointmentBookingModalProps
> = ({
	isOpen,
	onClose,
	providerId = "",
	providerList = [],
	onAppointmentBooked,
}) => {
	const [appointmentType, setAppointmentType] = useState("");
	const { user, isLoading } = useAuth();

	const { appointmentTypes, loading: appointmentTypesLoading } =
		useAppointmentTypes({ isActive: true });

	const [date, setDate] = useState<Date | undefined>(new Date());
	const [appointmentTime, setAppointmentTime] = useState("");
	const [reasonForVisit, setReasonForVisit] = useState("");
	const [notes, setNotes] = useState(""); // Add separate notes field
	const [selectedDoctor, setSelectedDoctor] = useState<Doctor>({
		$id: "",
		name: "",
		gender: "",
		specialty: "",
		location: "",
		phone: "",
		availability: "",
		weekend_available: false,
		bio: "",
		profile_picture_id: "",
	});

	const [appointmentBooked, setAppointmentBooked] = useState<boolean>(false);
	const [appointmentIsSaving, setAppointmentIsSaving] =
		useState<boolean>(false);
	const [bookingError, setBookingError] = useState<string>("");
	const [bookedAppointmentData, setBookedAppointmentData] = useState<{
		appointment_id: string | number;
	} | null>(null);
	const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
	const [loadingTimeSlots, setLoadingTimeSlots] = useState<boolean>(false);

	const modalRef = useRef<HTMLDialogElement>(null);

	const formattedDate = date?.toLocaleDateString("en-US", {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	});

	const formatTime = (time: string) => {
		// Handle format like "8am", "5pm", "12pm", "12am"
		const amPmMatch = time.match(/(\d{1,2})(am|pm)/i);
		if (amPmMatch) {
			const hours = parseInt(amPmMatch[1]);
			const period = amPmMatch[2].toUpperCase();
			return `${hours}:00 ${period}`;
		}
		
		// Handle format like "09:00", "17:30"
		if (time.includes(':')) {
			const [hours, minutes] = time.split(":");
			const hour12 = parseInt(hours) % 12 || 12;
			const ampm = parseInt(hours) >= 12 ? "PM" : "AM";
			return `${hour12}:${minutes} ${ampm}`;
		}
		
		return time; // Return as-is if format is unrecognized
	};

	const handleAppointmentType = (e: React.ChangeEvent<HTMLSelectElement>) => {
		setAppointmentType(e.target.value);
	};

	const handleTimeSelection = (e: React.ChangeEvent<HTMLSelectElement>) =>
		setAppointmentTime(e.target.value);

	const handleVisitReason = (e: React.ChangeEvent<HTMLTextAreaElement>) =>
		setReasonForVisit(e.target.value);

	// const handleSubmit = () => {
	//   const mockPostRequest = (dataSubmitted: Appointment) => {
	//     setAppointmentIsSaving(true);
	//     setTimeout(() => {
	//       console.log("appointment booked", dataSubmitted);
	//       setAppointmentIsSaving(false);
	//       setAppointmentBooked(true);
	//     }, 2500);
	//   };

	//   const dataSubmitted: Appointment = {
	//     appointment_id: String(Math.floor(Math.random() * 10000 + 1)),
	//     patient_id: user?.$id || "",
	//     provider_id: selectedDoctor.$id,
	//     appointment_type_id: appointmentType,
	//     appointment_date: date || "",
	//     appointment_time: appointmentTime,
	//     status: "booked",
	//     reason_for_visit: reasonForVisit || "",
	//     notes: "",
	//     created_at: new Date(),
	//     updated_at: new Date(),
	//   };
	//   // console.log(dataSubmitted);
	//   formatAppointment();
	//   mockPostRequest(dataSubmitted);

	const handleNotes = (e: React.ChangeEvent<HTMLTextAreaElement>) =>
		setNotes(e.target.value);

	// Generate available time slots based on provider availability
	const generateAvailableTimeSlots = async (selectedDate: Date, doctor: Doctor, appointmentDuration: number = 30) => {
		console.log('=== generateAvailableTimeSlots ===');
		console.log('selectedDate:', selectedDate);
		console.log('doctor:', doctor);
		console.log('appointmentDuration:', appointmentDuration);

		if (!selectedDate || !doctor.$id) {
			console.log('Missing selectedDate or doctor.$id');
			return [];
		}

		const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 6 = Saturday
		const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
		const dateStr = selectedDate.toISOString().split('T')[0];

		console.log('dayOfWeek:', dayOfWeek, 'isWeekend:', isWeekend, 'dateStr:', dateStr);

		// Determine provider availability hours
		let startTime: string | undefined;
		let endTime: string | undefined;

		if (isWeekend && doctor.weekend_available) {
			startTime = doctor.weekend_start;
			endTime = doctor.weekend_end;
			console.log('Using weekend hours:', startTime, '-', endTime);
		} else if (!isWeekend) {
			startTime = doctor.availability_start;
			endTime = doctor.availability_end;
			console.log('Using weekday hours:', startTime, '-', endTime);
		}

		if (!startTime || !endTime) {
			console.log('No availability for this day - startTime:', startTime, 'endTime:', endTime);
			return []; // Provider not available on this day
		}

		// Parse time strings to minutes since midnight
		const parseTimeToMinutes = (timeStr: string): number => {
			// Handle format like "8am", "5pm", "12pm", "12am"
			const amPmMatch = timeStr.match(/(\d{1,2})(am|pm)/i);
			if (amPmMatch) {
				let hours = parseInt(amPmMatch[1]);
				const period = amPmMatch[2].toLowerCase();
				
				// Convert to 24-hour format
				if (period === 'pm' && hours !== 12) {
					hours += 12;
				} else if (period === 'am' && hours === 12) {
					hours = 0;
				}
				
				return hours * 60; // No minutes for am/pm format
			}
			
			// Handle format like "09:00", "17:30"
			if (timeStr.includes(':')) {
				const [hours, minutes] = timeStr.split(':').map(Number);
				return hours * 60 + minutes;
			}
			
			return 0; // Default fallback
		};

		const startMinutes = parseTimeToMinutes(startTime);
		const endMinutes = parseTimeToMinutes(endTime);

		console.log('startMinutes:', startMinutes, 'endMinutes:', endMinutes);

		// Generate all possible time slots
		const timeSlots: string[] = [];
		for (let minutes = startMinutes; minutes < endMinutes; minutes += appointmentDuration) {
			const hours = Math.floor(minutes / 60);
			const mins = minutes % 60;
			const timeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
			timeSlots.push(timeStr);
		}

		console.log('Generated time slots:', timeSlots);

		// If it's today, filter out past time slots
		const now = new Date();
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		
		let availableSlots = timeSlots;
		if (selectedDate.getTime() === today.getTime()) {
			console.log('Filtering past times for today');
			const currentMinutes = now.getHours() * 60 + now.getMinutes();
			availableSlots = timeSlots.filter(slot => {
				const slotMinutes = parseTimeToMinutes(slot);
				return slotMinutes > currentMinutes + 60; // Must be at least 1 hour in the future
			});
			console.log('Available slots after filtering past times:', availableSlots);
		}

		// For now, skip conflict checking to debug the basic slot generation
		console.log('Final available slots:', availableSlots);
		return availableSlots;

		// TODO: Re-enable conflict checking once basic slot generation works
		// Check for existing appointments and filter out conflicting slots
		// try {
		// 	const numericProviderId = getNumericProviderId(doctor);
		// 	const conflictingSlots: string[] = [];

		// 	// Check each slot for conflicts
		// 	for (const slot of availableSlots) {
		// 		const hasConflict = await appointmentBookingService.checkAppointmentConflict(
		// 			0, // We don't need patient ID for this check
		// 			numericProviderId,
		// 			dateStr,
		// 			slot,
		// 			appointmentDuration
		// 		);
		// 		if (hasConflict) {
		// 			conflictingSlots.push(slot);
		// 		}
		// 	}

		// 	// Remove conflicting slots
		// 	return availableSlots.filter(slot => !conflictingSlots.includes(slot));
		// } catch (error) {
		// 	console.error('Error checking appointment conflicts:', error);
		// 	return availableSlots; // Return all slots if conflict check fails
		// }
	};

	// Load available time slots when date or doctor changes
	useEffect(() => {
		const loadTimeSlots = async () => {
			console.log('loadTimeSlots useEffect triggered');
			console.log('date:', date);
			console.log('selectedDoctor.$id:', selectedDoctor.$id);
			console.log('appointmentType:', appointmentType);

			if (!date || !selectedDoctor.$id) {
				console.log('Missing date or selectedDoctor.$id, clearing slots');
				setAvailableTimeSlots([]);
				return;
			}

			setLoadingTimeSlots(true);
			setAppointmentTime(''); // Reset selected time

			try {
				// Get appointment duration from selected appointment type, or use default
				let duration = 30; // Default duration
				if (appointmentType) {
					const selectedAppointmentType = appointmentTypes.find(
						type => type.appointment_type_id.toString() === appointmentType
					);
					duration = selectedAppointmentType?.duration_minutes || 30;
				}

				console.log('Using duration:', duration);
				const slots = await generateAvailableTimeSlots(date, selectedDoctor, duration);
				console.log('Setting available time slots:', slots);
				setAvailableTimeSlots(slots);
			} catch (error) {
				console.error('Error loading time slots:', error);
				setAvailableTimeSlots([]);
			} finally {
				setLoadingTimeSlots(false);
			}
		};

		loadTimeSlots();
	}, [date, selectedDoctor, appointmentType, appointmentTypes]);

	// Helper function to get numeric IDs
	const getNumericUserId = (user: {
		userId?: string | number;
		id?: string | number;
		$id: string;
	}): number => {
		// If your user has a numeric ID field, use that
		if (user.userId) return Number(user.userId);
		if (user.id) return Number(user.id);

		// Otherwise, convert the string ID to a number (hash or simple conversion)
		// You might need to adjust this based on your user ID structure
		return parseInt(user.$id.replace(/[^0-9]/g, "")) || Date.now();
	};

	const getNumericProviderId = (doctor: Doctor): number => {
		// Use the provider_id if available, otherwise convert $id
		if (doctor.provider_id) return doctor.provider_id;

		// Convert string ID to number - adjust this logic as needed
		return parseInt(doctor.$id.replace(/[^0-9]/g, "")) || 1;
	};

	const handleSubmit = async () => {
		try {
			if (!user) {
				setBookingError("You must be logged in to book an appointment.");
				return;
			}

			if (
				!appointmentType ||
				!date ||
				!appointmentTime ||
				!reasonForVisit.trim()
			) {
				setBookingError("Please fill in all required fields.");
				return;
			}

			setAppointmentIsSaving(true);
			setBookingError("");

			const appointmentDateStr = date.toISOString().split("T")[0];
			const numericUserId = getNumericUserId(user);
			const numericProviderId = getNumericProviderId(selectedDoctor);

			// Get appointment duration from selected appointment type
			const selectedAppointmentType = appointmentTypes.find(
				type => type.appointment_type_id.toString() === appointmentType
			);
			const duration = selectedAppointmentType?.duration_minutes || 30;

			// Check for appointment conflicts
			const hasConflict =
				await appointmentBookingService.checkAppointmentConflict(
					numericUserId,
					numericProviderId,
					appointmentDateStr,
					appointmentTime,
					duration
				);

			if (hasConflict) {
				setBookingError(
					"This time slot is no longer available. Please select a different time."
				);
				setAppointmentIsSaving(false);
				return;
			}

			const appointmentData: CreateAppointmentData = {
				patient_id: numericUserId,
				provider_id: numericProviderId,
				appointment_type_id: parseInt(appointmentType),
				appointment_date: appointmentDateStr,
				appointment_time: appointmentTime,
				reason_for_visit: reasonForVisit.trim(),
				notes: notes.trim(), // Use the actual notes field
			};

			const bookedAppointment =
				await appointmentBookingService.createAppointment(appointmentData);

			setBookedAppointmentData(bookedAppointment);
			setAppointmentBooked(true);

			if (onAppointmentBooked) {
				onAppointmentBooked();
			}
		} catch (error) {
			console.error("Error booking appointment:", error);
			setBookingError(
				error instanceof Error
					? error.message
					: "Failed to book appointment. Please try again."
			);
		} finally {
			setAppointmentIsSaving(false);
		}
	};

	const handleCloseSuccess = () => {
		onClose();
		setTimeout(() => {
			setAppointmentBooked(false);
			setAppointmentType("");
			setDate(new Date());
			setAppointmentTime("");
			setReasonForVisit("");
			setNotes("");
			setBookingError("");
			setBookedAppointmentData(null);
		}, 300);
	};

	const resetForm = () => {
		setAppointmentType("");
		setDate(new Date());
		setAppointmentTime("");
		setReasonForVisit("");
		setNotes("");
		setBookingError("");
		setAppointmentBooked(false);
		setBookedAppointmentData(null);
	};

	const handleClose = () => {
		onClose();
		setTimeout(resetForm, 300);
	};

	useEffect(() => {
		const fetchSelectedDoctor = (id: string) => {
			return providerList.filter((provider) => provider.$id === id);
		};

		const modal = modalRef.current;
		if (!modal) return;

		if (isOpen) {
			if (!modal.open) {
				const selectedDoctorArray = fetchSelectedDoctor(providerId);
				
				if (selectedDoctorArray.length > 0) {
					console.log('Selected doctor data:', selectedDoctorArray[0]); // Debug log
					setSelectedDoctor(selectedDoctorArray[0]);
				} else {
					console.log('No doctor found with ID:', providerId); // Debug log
				}

				modal.showModal();
			}
		} else {
			if (modal.open) {
				modal.close();
			}
		}
	}, [isOpen, providerId, providerList]);
	// returns Loading... if checking for user. this ensures unauthorized does not show automatically.
	if (isLoading) {
	}
	[isOpen, providerId, providerList];

	if (isLoading || appointmentTypesLoading) {
		return (
			<dialog
				ref={modalRef}
				className="modal modal-bottom sm:modal-middle"
				onClose={handleClose}
			>
				<div className="modal-box bg-base-100">
					<div className="text-center py-8">
						<span className="loading loading-spinner loading-lg text-primary"></span>
						<p className="mt-4">Loading...</p>
					</div>
				</div>
			</dialog>
		);
	}

	if (appointmentBooked && bookedAppointmentData) {
		return (
			<dialog
				ref={modalRef}
				className="modal modal-bottom sm:modal-middle"
				onClose={handleClose}
			>
				<div className="modal-box bg-base-100">
					<div className="text-center">
						<div className="text-6xl mb-4">✅</div>
						<h1 className="font-bold text-lg mb-2 text-success">
							Success!
						</h1>
						<h2 className="font-bold text-lg mb-4">
							Your appointment is confirmed!
						</h2>

						<div className="bg-base-200 p-4 rounded-lg mb-6">
							<p className="mb-2">
								<span className="font-semibold text-primary">
									{selectedDoctor.name}
								</span>
							</p>
							<p className="mb-2">
								<span className="font-semibold">{formattedDate}</span>
							</p>
							<p className="mb-2">
								<span className="font-semibold">
									{formatTime(appointmentTime)}
								</span>
							</p>
							<p className="text-sm text-base-content/70">
								Appointment ID: {bookedAppointmentData.appointment_id}
							</p>
						</div>

						<p className="mb-6 text-sm">
							We&apos;ve reserved your spot! To help us prepare for your
							visit, please fill out a few forms or check your
							appointments in the dashboard.
						</p>

						<div className="flex gap-4 justify-center">
							<Link
								href="/dashboard"
								className="btn btn-primary flex-1"
								onClick={handleCloseSuccess}
							>
								View Appointments
							</Link>
							<Link
								href="/#"
								className="btn btn-outline flex-1"
								onClick={handleCloseSuccess}
							>
								Complete Forms
							</Link>
						</div>

						<div className="modal-action justify-center">
							<button
								type="button"
								className="btn btn-ghost btn-sm"
								onClick={handleCloseSuccess}
							>
								Close
							</button>
						</div>
					</div>
				</div>
			</dialog>
		);
	}

	if (user) {
		return (
			<dialog
				ref={modalRef}
				className="modal modal-bottom sm:modal-middle"
				onClose={handleClose}
			>
				<div className="modal-box bg-primary">
					<h3 className="font-bold text-lg text-base-content text-center">
						Book Appointment With: {selectedDoctor.name}
					</h3>

					{bookingError && (
						<div className="alert alert-error mt-4">
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
							<span className="text-sm">{bookingError}</span>
						</div>
					)}

					<div className="flex justify-center mt-4">
						<select
							value={appointmentType}
							className="select select-bordered w-3/4 mt-2 bg-base-200 text-base-content"
							onChange={handleAppointmentType}
							disabled={appointmentIsSaving}
						>
							<option value="">Select Appointment Type</option>
							{appointmentTypes
								.sort(
									(a, b) =>
										a.appointment_type_id - b.appointment_type_id
								)
								.map((aT) => (
									<option
										key={aT.appointment_type_id}
										value={aT.appointment_type_id}
									>
										{aT.type_name} ({aT.duration_minutes} min) - $
										{aT.base_cost}
									</option>
								))}
						</select>
					</div>

					<div className="flex justify-center mt-6 mb-6">
						<DayPicker
							className="react-day-picker bg-base-200 border border-base-300 rounded-lg p-4"
							mode="single"
							selected={date}
							onSelect={setDate}
							disabled={{
								before: new Date(), // Disable past dates
							}}
							footer={
								date
									? `Selected: ${date.toLocaleDateString()}`
									: "Pick a day."
							}
						/>
					</div>

					<div className="flex justify-center mt-2">
						<select
							value={appointmentTime}
							className="select bg-base-200 text-base-content select-bordered w-3/4"
							onChange={handleTimeSelection}
							disabled={appointmentIsSaving || loadingTimeSlots}
						>
							<option value="" disabled>
								{loadingTimeSlots 
									? "Loading available times..." 
									: availableTimeSlots.length === 0 
										? "No available times for this date"
										: "Please Select an Appointment Time"
								}
							</option>
							{availableTimeSlots.map((timeSlot) => (
								<option key={timeSlot} value={timeSlot}>
									{formatTime(timeSlot)}
								</option>
							))}
						</select>
					</div>

					{/* Show availability info */}
					{date && selectedDoctor.$id && (
						<div className="flex justify-center mt-2">
							<div className="text-sm text-base-content/70 text-center">
								{(() => {
									const dayOfWeek = date.getDay();
									const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
									const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
									
									if (isWeekend && selectedDoctor.weekend_available && selectedDoctor.weekend_start && selectedDoctor.weekend_end) {
										return `${dayName}: ${formatTime(selectedDoctor.weekend_start)} - ${formatTime(selectedDoctor.weekend_end)}`;
									} else if (!isWeekend && selectedDoctor.availability_start && selectedDoctor.availability_end) {
										return `${dayName}: ${formatTime(selectedDoctor.availability_start)} - ${formatTime(selectedDoctor.availability_end)}`;
									} else {
										return `${selectedDoctor.name} is not available on ${dayName}s`;
									}
								})()}
							</div>
						</div>
					)}

					<form className="py-4 flex justify-center">
						<div className="flex flex-col w-3/4">
							<label className="mb-3">Reason for Visit: *</label>
							<textarea
								value={reasonForVisit}
								onChange={handleVisitReason}
								id={"visitReason"}
								className="textarea textarea-bordered bg-base-200 text-base-content w-full mb-4"
								rows={3}
								disabled={appointmentIsSaving}
								placeholder="Please describe the reason for your visit..."
							></textarea>

							<label className="mb-3">
								Additional Notes: (Optional)
							</label>
							<textarea
								value={notes}
								onChange={handleNotes}
								id={"notes"}
								className="textarea textarea-bordered bg-base-200 text-base-content w-full"
								rows={3}
								disabled={appointmentIsSaving}
								placeholder="Any additional information you'd like to share..."
							></textarea>
						</div>
					</form>

					<div className="modal-action flex gap-4 justify-center">
						<button
							className="btn btn-primary btn-sm"
							disabled={
								appointmentIsSaving ||
								!appointmentType ||
								!date ||
								!appointmentTime ||
								!reasonForVisit.trim()
							}
							onClick={handleSubmit}
						>
							{appointmentIsSaving && (
								<span className="loading loading-spinner loading-xs"></span>
							)}
							{appointmentIsSaving
								? "Booking Appointment..."
								: "Book Appointment"}
						</button>
						<button
							type="button"
							className="btn btn-ghost btn-sm"
							onClick={handleClose}
							disabled={appointmentIsSaving}
						>
							Close
						</button>
					</div>
				</div>
			</dialog>
		);
	} else {
		return (
			<dialog
				ref={modalRef}
				className="modal modal-bottom sm:modal-middle"
				onClose={handleClose}
			>
				<div className="modal-box bg-base-100">
					<div className="text-center">
						<h2 className="font-bold text-lg mb-4">Ready to Book?</h2>
						<p className="mb-6">
							Please sign in to continue, or sign up to create your
							account and manage appointments.
						</p>
						<div className="flex gap-4 justify-center">
							<Link href="/login" className="btn btn-primary flex-1">
								Sign In
							</Link>
							<Link href="/register" className="btn btn-outline flex-1">
								Sign Up
							</Link>
						</div>

						<div className="modal-action justify-center">
							<button
								type="button"
								className="btn btn-ghost btn-sm"
								onClick={handleClose}
							>
								Close
							</button>
						</div>
					</div>
				</div>
			</dialog>
		);
	}
};
