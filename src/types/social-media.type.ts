export enum SocialMediaType {
  FACEBOOK = 'facebook',
  INSTAGRAM = 'instagram',
  LINKEDIN = 'linkedin',
  TWITTER = 'twitter',
  YOUTUBE = 'youtube',
  TIKTOK = 'tiktok',
  WHATSAPP = 'whatsapp',
  TELEGRAM = 'telegram',
  DISCORD = 'discord',
  TWITCH = 'twitch'
}

export interface IEventSocialMedia {
  id: string;
  type: SocialMediaType;
  name: string;
  url: string;
  displayOrder: number;
  isActive: boolean;
}
