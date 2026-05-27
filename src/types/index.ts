import { z } from 'zod';

export const HeadacheEntrySchema = z.object({
  id: z.string(),
  date: z.string(),
  intensity: z.number().min(1).max(10),
  duration: z.enum(['short', 'medium', 'long']),
  location: z.array(z.string()).optional(),
  symptoms: z.array(z.string()).optional(),
  triggers: z.array(z.string()).optional(),
  medications: z.array(z.string()).optional(),
  effectivenessRating: z.enum(['ja', 'nein', 'wenig']).optional(),
  notes: z.string().optional(),
});

export type HeadacheEntry = z.infer<typeof HeadacheEntrySchema>;

export const HeadacheEntryArraySchema = z.array(HeadacheEntrySchema);
