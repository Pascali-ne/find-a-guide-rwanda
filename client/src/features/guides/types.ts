export interface GuideSummary {
  id: string;
  fullName: string;
  photoUrl: string | null;
  bio: string;
  languages: string[];
  experienceYears: number;
  specialization: string;
  location: string;
  pricePerDayRwf: number;
  pricePerDayUsd: number;
  services: string[];
  verificationStatus: "Pending" | "Verified" | "Rejected";
  averageRating: number;
  reviewCount: number;
}

export interface GuideReview {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  author: string;
}

export interface GuideDetail extends GuideSummary {
  availabilityDates: string[];
  reviews: GuideReview[];
}

export interface OwnProfile extends GuideSummary {
  email: string;
  phone: string;
  rejectionReason: string | null;
  availabilityDates: string[];
  documents: { id: string; fileName: string; uploadedAt: string }[];
}
