// This is an AI-powered function that prompts the user with possible landmark matches and confidence scores.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ClarifyLandmarkIdentificationInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a landmark, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  possibleMatches: z
    .array(z.object({
      landmarkName: z.string(),
      confidenceScore: z.number(),
    }))
    .describe('An array of possible landmark matches with confidence scores.'),
});

export type ClarifyLandmarkIdentificationInput =
  z.infer<typeof ClarifyLandmarkIdentificationInputSchema>;

const ClarifyLandmarkIdentificationOutputSchema = z.object({
  selectedLandmark: z.string().describe('The landmark selected by the user.'),
});

export type ClarifyLandmarkIdentificationOutput =
  z.infer<typeof ClarifyLandmarkIdentificationOutputSchema>;

export async function clarifyLandmarkIdentification(
  input: ClarifyLandmarkIdentificationInput
): Promise<ClarifyLandmarkIdentificationOutput> {
  return clarifyLandmarkIdentificationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'clarifyLandmarkIdentificationPrompt',
  input: {schema: ClarifyLandmarkIdentificationInputSchema},
  output: {schema: ClarifyLandmarkIdentificationOutputSchema},
  prompt: `Based on the photo, I was able to narrow it down to a few possible landmarks. Could you confirm which one it is?

Photo: {{media url=photoDataUri}}

Here are the possible matches:
{{#each possibleMatches}}
  - {{landmarkName}} (Confidence: {{confidenceScore}})
{{/each}}

Please select the correct landmark from the list above. Just respond with the landmark name. Do not add any additional information. I need just the name of the landmark.
`,
});

const clarifyLandmarkIdentificationFlow = ai.defineFlow(
  {
    name: 'clarifyLandmarkIdentificationFlow',
    inputSchema: ClarifyLandmarkIdentificationInputSchema,
    outputSchema: ClarifyLandmarkIdentificationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
