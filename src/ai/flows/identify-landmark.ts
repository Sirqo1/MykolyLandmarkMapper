'use server';

/**
 * @fileOverview An AI agent that identifies landmarks from an image.
 *
 * - identifyLandmark - A function that handles the landmark identification process.
 * - IdentifyLandmarkInput - The input type for the identifyLandmark function.
 * - IdentifyLandmarkOutput - The return type for the identifyLandmark function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IdentifyLandmarkInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a landmark, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type IdentifyLandmarkInput = z.infer<typeof IdentifyLandmarkInputSchema>;

const IdentifyLandmarkOutputSchema = z.object({
  landmarkName: z.string().describe('The name of the identified landmark.'),
  confidence: z
    .number()
    .describe('The confidence level of the landmark identification (0-1).'),
});
export type IdentifyLandmarkOutput = z.infer<typeof IdentifyLandmarkOutputSchema>;

export async function identifyLandmark(input: IdentifyLandmarkInput): Promise<IdentifyLandmarkOutput> {
  return identifyLandmarkFlow(input);
}

const identifyLandmarkPrompt = ai.definePrompt({
  name: 'identifyLandmarkPrompt',
  input: {schema: IdentifyLandmarkInputSchema},
  output: {schema: IdentifyLandmarkOutputSchema},
  prompt: `You are an expert in landmark recognition.

You will identify the landmark in the provided image and provide its name and a confidence score (0-1).

Image: {{media url=photoDataUri}}
`,
});

const identifyLandmarkFlow = ai.defineFlow(
  {
    name: 'identifyLandmarkFlow',
    inputSchema: IdentifyLandmarkInputSchema,
    outputSchema: IdentifyLandmarkOutputSchema,
  },
  async input => {
    const {output} = await identifyLandmarkPrompt(input);
    return output!;
  }
);
