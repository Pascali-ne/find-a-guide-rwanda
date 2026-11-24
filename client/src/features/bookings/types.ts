export type BookingStatus = "Pending" | "Confirmed" | "Declined" | "Cancelled" | "Completed";

export interface Booking {
  id: string;
  destination: string;
  startDate: string;
  endDate: string;
  notes: string | null;
  status: BookingStatus;
  createdAt: string;
  tourist: { id: string; fullName: string };
  guide: { id: string; fullName: string };
  hasReview: boolean;
}
