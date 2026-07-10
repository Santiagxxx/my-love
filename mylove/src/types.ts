export interface SavedDate {
  id: string;
  siteName: string;
  activityName: string;
  date: string;
  photos?: string[];
  completed?: boolean;
  completedAt?: string | null;
  notes?: string;
}
