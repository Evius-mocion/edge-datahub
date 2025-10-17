export interface IDates {
  startDate: string;
  endDate: string;
}

export interface IContent {
  type : TypeContentConfig;
  link: string
  iframe: string;
  provider: TypeContentProvider;
}

export enum TypeContentConfig {
  stream = 'stream',
  video = 'video',
}

export enum TypeContentProvider {
  dacast = 'dacast',
  vimeo = 'vimeo',
  iframe = 'iframe',
  url = 'url',
}


export type DynamicField = {
  label: string;
  placeholder?: string;
  name: string;
  dependsOn?: string;
  isRequerid: boolean;
  rules?: DynamicRuleObject;
  visibleToAdminsOnly?: boolean;
  type: TypeDynamicField;
  specialField: ("country" | "stateAndDepartment" | "city") | null;
  origin: FieldOrigin;
  mapsToUserField?: 'age' | 'gender' | 'residenceCountry' | 'birthDate';
  options?: { value: string; label: string }[];
  dynamicVisibility?: {
    type: "major" | "minor" | "equal" | "different";
    value: string | number | null;
  };
};

export enum TypeDynamicField {
	text = 'text',
	number = 'number',
	select = 'select',
	optionsButton = 'optionsButton',
	phone = 'phone',
}


export interface IEventAppearance {
  textColor: string;
  primaryColor: string;
  bgColor: string;
  bannerImage?: string;
  footerImage?: string;
  bgImage?: string;
  logoImage?: string;
  bannerMobile?: string;
  footerMobile?: string;
}

export type FieldOrigin = "predefined" | "custom";
export type DynamicRuleObject = {
  min?: Rule<number>;
  max?: Rule<number>;
};

export interface Rule<T = string | number> {
  active: boolean;
  value: T;
  message?: string;
}

export interface IEventSections {
  news: boolean;
  sponsors: boolean;
}

export interface ISocialZoneConfig {
  generalChat: boolean;
  privateChat: boolean;
  showAttendeesList: boolean;
}

export interface IAccessManagerConfig {
  accessLevels: number;
  currency: string;
  customRolesEnabled: boolean;
  votingPointsEnabled: boolean;
}

export enum LandingSectionTitles {
  Counter = "counter",
  Description = "description",
  Speakers = "Conferencistas",
  Activities = "activities",
  Sponsors = "sponsors",
}

export interface ILandingSection {
  title: string;
  alias?: string;
  visible: boolean;
}

export enum EventType {
  ONLINE = 'online',
  ONSITE = 'onsite',
  HYBRID = 'hybrid',
}

export enum EventAccessType {
  FREE_BY_REGISTER = 'freeByRegister',
  FREE_WITHOUT_REGISTER = 'freeWithoutRegister',
  BY_INVITATION = 'byInvitation',
  PAYMENT = 'payment',
}


export enum EventState {
  IN_PROCESS = 'in_process',
  EXECUTED = 'executed',
  CANCELED = 'canceled',
  PENDING = 'pending'
}
