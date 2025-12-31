
export interface UserMeasurements {
  height?: number;
  weight?: number;
  chest?: number;
  waist?: number;
  foot_size?: number;
  age?: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  profile_image?: string;
  sex?: 'male' | 'female' | 'other';
  measurements: UserMeasurements;
  preferences: string[];
  has_completed_onboarding: boolean;
  created_at?: string;
}

export interface ClothingItem {
  id: string;
  user_id: string;
  image_url: string;
  category: 'top' | 'bottom' | 'shoes' | 'accessory' | 'other';
  color?: string;
  tags: string[];
  season?: string;
  created_at: string;
}

export interface CommunityPost {
  id: string;
  user_id: string;
  image_url: string;
  caption: string;
  likes: number;
  comments_count: number;
  user_name: string;
  user_avatar?: string;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  content: string;
  parent_id?: string;
  likes: number;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string; // recipient
  actor_id: string; // initiator
  actor_name: string;
  actor_avatar?: string;
  type: 'like' | 'comment' | 'follow' | 'reply' | 'comment_like';
  post_id?: string;
  comment_id?: string;
  read: boolean;
  created_at: string;
}

export interface TrendingItem {
  id: string;
  name: string;
  price: string;
  image: string;
  store: string;
  link: string;
  matchScore?: number;
  matchReason?: string;
}
