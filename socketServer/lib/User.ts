export type User = {
  id: string;
  nickname: string;
  email: string;
  avatarURL: string | null;
  lastRoom: string;
  lastPosition: string;
  isAdmin: boolean;
  createdAt: string;
  onMute: boolean;
  onVideoMute: boolean;
  onScreenShare: boolean;
};
