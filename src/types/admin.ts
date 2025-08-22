export interface AdminVendor {
  id: string;
  name: string;
  category: string;
  city: string;
  region: string;
  website: string;
  email: string;
  phone: string;
  isSuspended: boolean;
  fraudFlags: string[];
  duplicateOfId?: string;
}

export interface VendorOwner {
  email: string;
}

export interface VendorInquiry {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface SimilarVendor {
  id: string;
  name: string;
  similarity: number;
}

export interface CandidateVendor {
  id: string;
  name: string;
}

export interface AdminVendorDetails {
  vendor: AdminVendor;
  owner: VendorOwner | null;
  inquiries: VendorInquiry[];
  similar: SimilarVendor[];
  candidates: CandidateVendor[];
}

export interface AdminUser {
  id: string;
  email: string;
  role: string;
  onboardingCompleted: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserStats {
  vendors: number;
  directoryVendors: number;
  guests: number;
  budgets: number;
}

export interface AdminUserDetails {
  user: AdminUser;
  stats: AdminUserStats;
}
