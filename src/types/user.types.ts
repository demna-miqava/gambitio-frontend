export type User = {
  id: number;
  username: string;
  email: string;
  skill: string;
  avatarUrl: string | null;
  friendCount: number;
  blitzRating: number;
  bulletRating: number;
  rapidRating: number;
  /** Absent from responses of servers older than migration 008 */
  puzzleRating?: number;
  highestPuzzleRating?: number;
  createdAt: string;
};

export type AuthResponse = {
  user: User;
};

export type UserProfile = {
  id: number;
  username: string;
  avatarUrl: string | null;
  createdAt: string;
  rapidRating: number;
  blitzRating: number;
  bulletRating: number;
  puzzleRating?: number;
  friendCount: number;
};

export type UserProfileResponse = {
  user: UserProfile;
};
