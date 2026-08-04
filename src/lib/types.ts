export type HeadacheType =
  | 'migraine'
  | 'migraine_aura'
  | 'tension'
  | 'cluster'
  | 'sinus'
  | 'medication_overuse'
  | 'other';

export type Effectiveness = 'none' | 'partial' | 'full' | 'unknown';

/** Drug classes relevant for the medication-overuse-headache (MOH) thresholds. */
export type MedicationClass =
  | 'triptan'
  | 'analgesic'
  | 'nsaid'
  | 'combination'
  | 'ergot'
  | 'opioid'
  | 'antiemetic'
  | 'preventive'
  | 'cgrp'
  | 'other';

export interface MedicationIntake {
  id: string;
  name: string;
  doseMg?: number;
  time?: string; // HH:mm
  medClass: MedicationClass;
  effectiveness: Effectiveness;
}

export type Impact = 'none' | 'mild' | 'moderate' | 'severe';

export interface Attack {
  id: string;
  /** ISO date (yyyy-MM-dd) on which the attack started. */
  date: string;
  /** HH:mm, local time. */
  startTime?: string;
  /** Total duration in minutes. */
  durationMinutes?: number;
  /** 1-10 pain scale. */
  intensity: number;
  type: HeadacheType;
  aura: boolean;
  locations: string[];
  symptoms: string[];
  triggers: string[];
  medications: MedicationIntake[];
  relief: string[];
  impact: Impact;
  menstruation?: boolean;
  weatherChange?: boolean;
  sleepHours?: number;
  /** 0-10 self reported stress on that day. */
  stressLevel?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type Plan = 'free' | 'pro';

export interface License {
  token: string;
  email?: string;
  plan: Plan;
  /** ISO timestamp of the last successful server side verification. */
  verifiedAt: string;
  /** ISO timestamp, undefined for lifetime licenses. */
  expiresAt?: string;
}

export interface Trial {
  startedAt: string;
  endsAt: string;
}

export interface Settings {
  language: 'de' | 'en';
  theme: 'light' | 'dark' | 'system';
  /** Extra options the user added to the pickers. */
  customTriggers: string[];
  customSymptoms: string[];
  customMedications: string[];
  /** Cycle tracking shows the menstruation toggle in the editor. */
  trackCycle: boolean;
  reminderEnabled: boolean;
  reminderTime: string; // HH:mm
  /** Personal data used on the doctor report. */
  patientName?: string;
  patientBirthDate?: string;
  onboardingDone: boolean;
}

export interface AppData {
  version: number;
  attacks: Attack[];
  settings: Settings;
  license?: License;
  trial?: Trial;
  updatedAt: string;
}

/** Legacy shape written by the first version of the app. */
export interface LegacyEntry {
  id: string;
  date: string;
  intensity: number;
  duration?: 'short' | 'medium' | 'long';
  location?: string[];
  symptoms?: string[];
  triggers?: string[];
  medications?: string[];
  effectivenessRating?: 'ja' | 'nein' | 'wenig';
  notes?: string;
}
