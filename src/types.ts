
export interface Program {
  id: string;
  title: string;
  category: string;
  description: string;
  image: string;
  time?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  content?: string;
  date: string;
  category: string;
  image: string;
}

export enum Page {
  Home = 'home',
  About = 'about',
  Emissions = 'emissions',
  Live = 'live',
  News = 'news',
  NewsDetail = 'news-detail',
  Contact = 'contact',
  Privacy = 'privacy',
  Terms = 'terms',
  Cookies = 'cookies',
  Disclaimer = 'disclaimer',
  LegalMentions = 'legal-mentions',
  Login = 'login',
  Register = 'register',
  ForgotPassword = 'forgot-password',
  Dashboard = 'dashboard',
  AdminDashboard = 'admin-dashboard',
  Blog = 'blog',
  BlogDetail = 'blog-detail',
  FirebaseDiagnostics = 'firebase-diagnostics',
  Programmes = 'programmes',
  EspaceCitoyen = 'espace-citoyen',
  Sports = 'sports',
  SportsDiagnostics = 'sports-diagnostics',
  SystemStatus = 'system-status'
}

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  role: 'admin' | 'listener' | 'user';
  createdAt: any;
  lastLogin: any;
  totalListeningTime: number; // in seconds
  listeningTime?: number; // in seconds, requested by prompt
  points?: number; // requested by prompt
  avatar: string;
  photoURL?: string; // requested by prompt
  status: 'active' | 'disabled';
  badge?: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  featuredImage: string;
  category: string;
  author: string;
  published: boolean;
  views: number;
  createdAt: any;
  updatedAt: any;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  createdAt: any;
}

export interface ListeningSession {
  id: string;
  userId: string;
  startTime: any;
  endTime: any;
  duration: number; // in seconds
  date: string; // YYYY-MM-DD
}

export interface WelcomeAnnouncement {
  title: string;
  content: string;
  imageUrl: string;
  enabled: boolean;
  autoCloseDuration: number; // in seconds
  views: number;
  dismissals: number;
  updatedAt?: any;
}

export interface Sponsor {
  id: string;
  name: string;
  imageUrl: string;
  description: string;
  websiteUrl?: string;
  mapsUrl?: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: any;
  updatedAt: any;
}

export interface DbProgram {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  hostName: string;
  dayOfWeek: number; // 0 (Sunday) to 6 (Saturday)
  startTime: string; // "HH:MM"
  endTime: string; // "HH:MM"
  category: string;
  isActive: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface BreakingNewsAlert {
  id: string;
  title: string;
  message: string;
  link?: string;
  priority: 'low' | 'medium' | 'high';
  createdAt: any;
  expiresAt: any; // Date/timestamp or ISO string
  isActive: boolean;
  isPinned: boolean;
}

export interface CitizenReport {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  title: string;
  description: string;
  category: string;
  location: string;
  mediaUrls: string[]; // JPG, PNG, WEBP, MP4, MOV, WEBM etc.
  supportingFilesUrls?: string[];
  status: 'pending' | 'review' | 'approved' | 'rejected' | 'published';
  userId?: string;
  createdAt: any;
  updatedAt: any;
}


