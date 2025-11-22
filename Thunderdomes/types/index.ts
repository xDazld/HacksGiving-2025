export interface User {
  age: number;
  barcode: string;
  isAuthenticated: boolean;
  hasUsedTicket: boolean;
}

export interface TourPart {
  id: string;
  title: string;
  content: string;
  unlockProgress: number; // 0, 33, or 66
}

export interface Tour {
  id: string;
  title: string;
  description: string;
  parts: TourPart[];
}

export interface ScavengerHuntItem {
  id: string;
  name: string;
  description: string;
  completed: boolean;
}

export interface ScavengerHunt {
  id: string;
  title: string;
  description: string;
  items: ScavengerHuntItem[];
}

export interface CafeTour {
  id: string;
  title: string;
  description: string;
  parts: TourPart[];
}

export interface BeaconData {
  id: string;
  rssi: number;
  name: string;
}

export interface ProgressData {
  progress: number; // 0-100 percentage
}

export interface BeaconAPIFormat {
  ids: number[];
  rssi: number[];
}

