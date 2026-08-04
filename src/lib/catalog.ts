import type { HeadacheType, Impact, MedicationClass } from './types';

export interface CatalogItem {
  id: string;
  de: string;
  en: string;
}

export type Lang = 'de' | 'en';

export function label(item: CatalogItem | undefined, lang: Lang): string {
  if (!item) return '';
  return lang === 'de' ? item.de : item.en;
}

/** Resolves an id against a catalog, falling back to the raw value for custom entries. */
export function resolveLabel(catalog: CatalogItem[], id: string, lang: Lang): string {
  const found = catalog.find((item) => item.id === id);
  return found ? label(found, lang) : id;
}

export const TRIGGERS: CatalogItem[] = [
  { id: 'stress', de: 'Stress', en: 'Stress' },
  { id: 'stress_letdown', de: 'Entspannung nach Stress', en: 'Let-down after stress' },
  { id: 'sleep_lack', de: 'Zu wenig Schlaf', en: 'Too little sleep' },
  { id: 'sleep_excess', de: 'Zu viel Schlaf', en: 'Too much sleep' },
  { id: 'sleep_irregular', de: 'Unregelmäßiger Schlaf', en: 'Irregular sleep' },
  { id: 'missed_meal', de: 'Mahlzeit ausgelassen', en: 'Skipped meal' },
  { id: 'dehydration', de: 'Zu wenig getrunken', en: 'Dehydration' },
  { id: 'alcohol', de: 'Alkohol', en: 'Alcohol' },
  { id: 'red_wine', de: 'Rotwein', en: 'Red wine' },
  { id: 'caffeine', de: 'Koffein', en: 'Caffeine' },
  { id: 'caffeine_withdrawal', de: 'Koffein-Entzug', en: 'Caffeine withdrawal' },
  { id: 'chocolate', de: 'Schokolade', en: 'Chocolate' },
  { id: 'cheese', de: 'Käse', en: 'Cheese' },
  { id: 'histamine', de: 'Histaminreiches Essen', en: 'Histamine-rich food' },
  { id: 'additives', de: 'Zusatzstoffe (z. B. Glutamat)', en: 'Additives (e.g. MSG)' },
  { id: 'weather', de: 'Wetterwechsel', en: 'Weather change' },
  { id: 'heat', de: 'Hitze', en: 'Heat' },
  { id: 'cold', de: 'Kälte', en: 'Cold' },
  { id: 'bright_light', de: 'Grelles Licht', en: 'Bright light' },
  { id: 'flicker', de: 'Flackerndes Licht', en: 'Flickering light' },
  { id: 'loud_noise', de: 'Lärm', en: 'Loud noise' },
  { id: 'strong_smell', de: 'Starke Gerüche', en: 'Strong smells' },
  { id: 'screen_time', de: 'Bildschirmarbeit', en: 'Screen time' },
  { id: 'posture', de: 'Haltung', en: 'Posture' },
  { id: 'neck_tension', de: 'Nackenverspannung', en: 'Neck tension' },
  { id: 'exertion', de: 'Körperliche Anstrengung', en: 'Physical exertion' },
  { id: 'travel', de: 'Reise', en: 'Travel' },
  { id: 'altitude', de: 'Höhenlage / Flug', en: 'Altitude / flight' },
  { id: 'hormones', de: 'Hormonschwankung', en: 'Hormonal change' },
  { id: 'menstruation', de: 'Menstruation', en: 'Menstruation' },
  { id: 'ovulation', de: 'Eisprung', en: 'Ovulation' },
  { id: 'medication', de: 'Medikament', en: 'Medication' },
  { id: 'smoking', de: 'Rauchen', en: 'Smoking' },
  { id: 'fasting', de: 'Fasten', en: 'Fasting' },
  { id: 'air_conditioning', de: 'Klimaanlage / Zugluft', en: 'Air conditioning / draught' },
  { id: 'infection', de: 'Infekt', en: 'Infection' },
  { id: 'allergy', de: 'Allergie', en: 'Allergy' },
];

export const SYMPTOMS: CatalogItem[] = [
  { id: 'nausea', de: 'Übelkeit', en: 'Nausea' },
  { id: 'vomiting', de: 'Erbrechen', en: 'Vomiting' },
  { id: 'photophobia', de: 'Lichtempfindlichkeit', en: 'Light sensitivity' },
  { id: 'phonophobia', de: 'Lärmempfindlichkeit', en: 'Sound sensitivity' },
  { id: 'osmophobia', de: 'Geruchsempfindlichkeit', en: 'Smell sensitivity' },
  { id: 'aura_visual', de: 'Visuelle Aura', en: 'Visual aura' },
  { id: 'aura_sensory', de: 'Sensible Aura (Kribbeln)', en: 'Sensory aura (tingling)' },
  { id: 'aura_speech', de: 'Sprachstörung', en: 'Speech disturbance' },
  { id: 'dizziness', de: 'Benommenheit', en: 'Dizziness' },
  { id: 'vertigo', de: 'Schwindel', en: 'Vertigo' },
  { id: 'neck_pain', de: 'Nackenschmerzen', en: 'Neck pain' },
  { id: 'tinnitus', de: 'Ohrgeräusche', en: 'Tinnitus' },
  { id: 'blurred_vision', de: 'Verschwommenes Sehen', en: 'Blurred vision' },
  { id: 'tearing', de: 'Tränendes Auge', en: 'Watering eye' },
  { id: 'nasal_congestion', de: 'Verstopfte Nase', en: 'Nasal congestion' },
  { id: 'ptosis', de: 'Hängendes Augenlid', en: 'Drooping eyelid' },
  { id: 'restlessness', de: 'Unruhe / Bewegungsdrang', en: 'Restlessness' },
  { id: 'fatigue', de: 'Erschöpfung', en: 'Fatigue' },
  { id: 'concentration', de: 'Konzentrationsprobleme', en: 'Trouble concentrating' },
  { id: 'irritability', de: 'Reizbarkeit', en: 'Irritability' },
  { id: 'yawning', de: 'Häufiges Gähnen', en: 'Frequent yawning' },
  { id: 'food_craving', de: 'Heißhunger', en: 'Food craving' },
  { id: 'allodynia', de: 'Berührungsempfindlichkeit', en: 'Skin sensitivity' },
  { id: 'numbness', de: 'Taubheitsgefühl', en: 'Numbness' },
  { id: 'stiff_neck', de: 'Nackensteife', en: 'Stiff neck' },
];

export const LOCATIONS: CatalogItem[] = [
  { id: 'left', de: 'Linksseitig', en: 'Left side' },
  { id: 'right', de: 'Rechtsseitig', en: 'Right side' },
  { id: 'bilateral', de: 'Beidseitig', en: 'Both sides' },
  { id: 'forehead', de: 'Stirn', en: 'Forehead' },
  { id: 'temple', de: 'Schläfe', en: 'Temple' },
  { id: 'eye', de: 'Hinter dem Auge', en: 'Behind the eye' },
  { id: 'back_head', de: 'Hinterkopf', en: 'Back of head' },
  { id: 'top_head', de: 'Scheitel', en: 'Top of head' },
  { id: 'neck', de: 'Nacken', en: 'Neck' },
  { id: 'face', de: 'Gesicht', en: 'Face' },
  { id: 'jaw', de: 'Kiefer', en: 'Jaw' },
  { id: 'whole_head', de: 'Ganzer Kopf', en: 'Whole head' },
];

export const RELIEF: CatalogItem[] = [
  { id: 'sleep', de: 'Schlaf', en: 'Sleep' },
  { id: 'dark_room', de: 'Dunkler Raum', en: 'Dark room' },
  { id: 'cold_pack', de: 'Kühlung', en: 'Cold pack' },
  { id: 'heat_pack', de: 'Wärme', en: 'Heat' },
  { id: 'coffee', de: 'Kaffee', en: 'Coffee' },
  { id: 'water', de: 'Trinken', en: 'Hydration' },
  { id: 'fresh_air', de: 'Frische Luft', en: 'Fresh air' },
  { id: 'rest', de: 'Ruhe', en: 'Rest' },
  { id: 'massage', de: 'Massage', en: 'Massage' },
  { id: 'movement', de: 'Bewegung', en: 'Movement' },
  { id: 'relaxation', de: 'Entspannungsübung', en: 'Relaxation exercise' },
  { id: 'peppermint_oil', de: 'Pfefferminzöl', en: 'Peppermint oil' },
];

export const HEADACHE_TYPES: { id: HeadacheType; de: string; en: string }[] = [
  { id: 'migraine', de: 'Migräne ohne Aura', en: 'Migraine without aura' },
  { id: 'migraine_aura', de: 'Migräne mit Aura', en: 'Migraine with aura' },
  { id: 'tension', de: 'Spannungskopfschmerz', en: 'Tension-type headache' },
  { id: 'cluster', de: 'Cluster-Kopfschmerz', en: 'Cluster headache' },
  { id: 'sinus', de: 'Sinus / Nebenhöhlen', en: 'Sinus headache' },
  { id: 'medication_overuse', de: 'Medikamenten-Kopfschmerz', en: 'Medication-overuse headache' },
  { id: 'other', de: 'Unklar / anderes', en: 'Unclear / other' },
];

export const IMPACTS: { id: Impact; de: string; en: string }[] = [
  { id: 'none', de: 'Keine Einschränkung', en: 'No limitation' },
  { id: 'mild', de: 'Leicht eingeschränkt', en: 'Slightly limited' },
  { id: 'moderate', de: 'Deutlich eingeschränkt', en: 'Clearly limited' },
  { id: 'severe', de: 'Arbeitsunfähig / Bettruhe', en: 'Unable to work / bedrest' },
];

export const MEDICATION_CLASSES: { id: MedicationClass; de: string; en: string }[] = [
  { id: 'analgesic', de: 'Einfaches Schmerzmittel', en: 'Simple analgesic' },
  { id: 'nsaid', de: 'NSAR', en: 'NSAID' },
  { id: 'triptan', de: 'Triptan', en: 'Triptan' },
  { id: 'combination', de: 'Kombinationspräparat', en: 'Combination analgesic' },
  { id: 'ergot', de: 'Ergotamin', en: 'Ergotamine' },
  { id: 'opioid', de: 'Opioid', en: 'Opioid' },
  { id: 'antiemetic', de: 'Antiemetikum', en: 'Antiemetic' },
  { id: 'cgrp', de: 'CGRP-Wirkstoff', en: 'CGRP drug' },
  { id: 'preventive', de: 'Prophylaxe', en: 'Preventive' },
  { id: 'other', de: 'Sonstiges', en: 'Other' },
];

export interface KnownMedication {
  name: string;
  medClass: MedicationClass;
  defaultDose?: number;
}

/** Frequently used substances, pre-classified so the MOH warning works out of the box. */
export const KNOWN_MEDICATIONS: KnownMedication[] = [
  { name: 'Ibuprofen', medClass: 'nsaid', defaultDose: 400 },
  { name: 'Naproxen', medClass: 'nsaid', defaultDose: 500 },
  { name: 'Diclofenac', medClass: 'nsaid', defaultDose: 50 },
  { name: 'Paracetamol', medClass: 'analgesic', defaultDose: 1000 },
  { name: 'ASS / Aspirin', medClass: 'analgesic', defaultDose: 1000 },
  { name: 'Metamizol', medClass: 'analgesic', defaultDose: 500 },
  { name: 'Thomapyrin', medClass: 'combination' },
  { name: 'Sumatriptan', medClass: 'triptan', defaultDose: 50 },
  { name: 'Rizatriptan', medClass: 'triptan', defaultDose: 10 },
  { name: 'Zolmitriptan', medClass: 'triptan', defaultDose: 2.5 },
  { name: 'Eletriptan', medClass: 'triptan', defaultDose: 40 },
  { name: 'Almotriptan', medClass: 'triptan', defaultDose: 12.5 },
  { name: 'Naratriptan', medClass: 'triptan', defaultDose: 2.5 },
  { name: 'Frovatriptan', medClass: 'triptan', defaultDose: 2.5 },
  { name: 'Metoclopramid', medClass: 'antiemetic', defaultDose: 10 },
  { name: 'Domperidon', medClass: 'antiemetic', defaultDose: 10 },
  { name: 'Dimenhydrinat', medClass: 'antiemetic', defaultDose: 50 },
  { name: 'Tilidin', medClass: 'opioid' },
  { name: 'Tramadol', medClass: 'opioid', defaultDose: 50 },
  { name: 'Ergotamin', medClass: 'ergot' },
  { name: 'Rimegepant', medClass: 'cgrp', defaultDose: 75 },
  { name: 'Erenumab', medClass: 'cgrp', defaultDose: 70 },
  { name: 'Fremanezumab', medClass: 'cgrp', defaultDose: 225 },
  { name: 'Galcanezumab', medClass: 'cgrp', defaultDose: 120 },
  { name: 'Propranolol', medClass: 'preventive', defaultDose: 40 },
  { name: 'Metoprolol', medClass: 'preventive', defaultDose: 50 },
  { name: 'Topiramat', medClass: 'preventive', defaultDose: 50 },
  { name: 'Amitriptylin', medClass: 'preventive', defaultDose: 25 },
  { name: 'Flunarizin', medClass: 'preventive', defaultDose: 5 },
  { name: 'Candesartan', medClass: 'preventive', defaultDose: 8 },
  { name: 'Magnesium', medClass: 'preventive', defaultDose: 300 },
  { name: 'Riboflavin (B2)', medClass: 'preventive', defaultDose: 400 },
  { name: 'Coenzym Q10', medClass: 'preventive', defaultDose: 100 },
];

export function guessMedicationClass(name: string): MedicationClass {
  const needle = name.trim().toLowerCase();
  if (!needle) return 'other';
  const known = KNOWN_MEDICATIONS.find((med) => med.name.toLowerCase() === needle);
  if (known) return known.medClass;
  if (needle.endsWith('triptan')) return 'triptan';
  if (needle.includes('ibu') || needle.includes('naproxen') || needle.includes('diclofenac')) return 'nsaid';
  if (needle.includes('parace') || needle.includes('aspirin') || needle.includes('ass')) return 'analgesic';
  if (needle.includes('mab') || needle.includes('gepant')) return 'cgrp';
  return 'other';
}

/** Classes counted for the 10-day MOH threshold; simple analgesics use 15 days. */
export const MOH_LOW_THRESHOLD_CLASSES: MedicationClass[] = ['triptan', 'combination', 'ergot', 'opioid', 'cgrp'];
export const MOH_HIGH_THRESHOLD_CLASSES: MedicationClass[] = ['analgesic', 'nsaid'];
