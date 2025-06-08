"use client";

import type { ChangeEvent } from "react";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Landmark, MapPin, Share2, UploadCloud, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { identifyLandmark, type IdentifyLandmarkOutput } from "@/ai/flows/identify-landmark";
import { fileToDataUri } from "@/lib/image-utils";

const LOW_CONFIDENCE_THRESHOLD = 0.7; // Example threshold: 70%

function ImageUploadForm({
  onImageSubmit,
  isLoading,
}: {
  onImageSubmit: (file: File) => void;
  isLoading: boolean;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (file) {
      onImageSubmit(file);
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="image-upload" className="text-lg font-medium">Upload Landmark Image</Label>
        <div className="mt-2 flex items-center justify-center w-full">
          <label
            htmlFor="image-upload"
            className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer bg-card hover:bg-muted transition-colors"
          >
            {previewUrl ? (
              <Image src={previewUrl} alt="Image preview" width={256} height={256} className="max-h-56 w-auto object-contain rounded-md" />
            ) : (
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <UploadCloud className="w-10 h-10 mb-3 text-muted-foreground" />
                <p className="mb-2 text-sm text-muted-foreground">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
              </div>
            )}
            <Input id="image-upload" type="file" className="hidden" onChange={handleFileChange} accept="image/png, image/jpeg, image/gif" />
          </label>
        </div>
      </div>
      <Button type="submit" disabled={!file || isLoading} className="w-full">
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Identifying...
          </>
        ) : (
          <>
            <Landmark className="mr-2 h-4 w-4" /> Identify Landmark
          </>
        )}
      </Button>
    </form>
  );
}

function MapDisplayPlaceholder({ landmarkName }: { landmarkName: string }) {
  return (
    <div className="mt-4 p-4 border rounded-lg bg-muted/50 flex flex-col items-center text-center">
      <MapPin className="w-12 h-12 text-primary mb-2" />
      <p className="font-semibold text-lg">Map for {landmarkName}</p>
      <p className="text-sm text-muted-foreground">
        Map integration coming soon.
      </p>
      <p className="text-xs text-muted-foreground mt-1">
        (Requires Google Maps API Key for full functionality)
      </p>
    </div>
  );
}

function ShareButtonComponent({ landmarkName, imagePreviewUrl }: { landmarkName: string; imagePreviewUrl: string }) {
  const { toast } = useToast();

  const handleShare = async () => {
    const shareData = {
      title: "MykolyLandmarkMapper",
      text: `I identified this landmark: ${landmarkName}! Check it out.`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        // To share an image, it needs to be fetched and converted to a File object
        // For simplicity, we'll share text and URL.
        await navigator.share(shareData);
        toast({ title: "Shared successfully!" });
      } catch (err) {
        console.error("Share failed:", err);
        toast({ title: "Could not share", description: "Sharing was cancelled or failed.", variant: "destructive" });
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      try {
        await navigator.clipboard.writeText(`${shareData.text} Image: ${imagePreviewUrl} Link: ${shareData.url}`);
        toast({ title: "Copied to clipboard!", description: "Share link and details copied." });
      } catch (err) {
        toast({ title: "Failed to copy", variant: "destructive" });
      }
    }
  };

  return (
    <Button onClick={handleShare} variant="outline" className="w-full">
      <Share2 className="mr-2 h-4 w-4" /> Share
    </Button>
  );
}


function LandmarkResultCard({
  result,
  imagePreviewUrl,
}: {
  result: IdentifyLandmarkOutput;
  imagePreviewUrl: string;
}) {
  const confidencePercentage = Math.round(result.confidence * 100);
  const isLowConfidence = result.confidence < LOW_CONFIDENCE_THRESHOLD;

  return (
    <Card className="w-full max-w-md shadow-xl transition-all duration-500 ease-out transform scale-100 opacity-100">
      <CardHeader>
        <CardTitle className="text-2xl font-headline flex items-center">
          <Landmark className="mr-2 h-6 w-6 text-primary" /> {result.landmarkName}
        </CardTitle>
        <CardDescription>AI Identification Result</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative w-full h-64 rounded-lg overflow-hidden border">
          <Image src={imagePreviewUrl} alt={result.landmarkName} layout="fill" objectFit="contain" />
        </div>
        <div>
          <p className="text-sm font-medium">Confidence Score:</p>
          <div className="flex items-center gap-2 mt-1">
            <Progress value={confidencePercentage} className="w-full h-3" />
            <span className="text-sm font-semibold text-primary">{confidencePercentage}%</span>
          </div>
          {isLowConfidence && (
            <div className="mt-2 p-3 bg-destructive/10 border border-destructive/30 rounded-md text-sm text-destructive flex items-start">
              <AlertTriangle className="h-4 w-4 mr-2 mt-0.5 shrink-0" />
              <span>AI is not very confident about this result. It might be inaccurate.</span>
            </div>
          )}
        </div>
        <MapDisplayPlaceholder landmarkName={result.landmarkName} />
      </CardContent>
      <CardFooter>
        <ShareButtonComponent landmarkName={result.landmarkName} imagePreviewUrl={imagePreviewUrl} />
      </CardFooter>
    </Card>
  );
}


export default function ClientPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<IdentifyLandmarkOutput | null>(null);
  const [currentImagePreview, setCurrentImagePreview] = useState<string | null>(null);
  const { toast } = useToast();

  const handleImageSubmit = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    // Generate preview URL for the submitted file
    const previewUrl = URL.createObjectURL(file);
    setCurrentImagePreview(previewUrl);

    try {
      const dataUri = await fileToDataUri(file);
      const aiResult = await identifyLandmark({ photoDataUri: dataUri });
      setResult(aiResult);
      toast({
        title: "Landmark Identified!",
        description: `${aiResult.landmarkName} (Confidence: ${Math.round(aiResult.confidence * 100)}%)`,
      });
    } catch (err) {
      console.error("Error identifying landmark:", err);
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
      setError(`Failed to identify landmark: ${errorMessage}`);
      toast({
        title: "Identification Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Clean up object URL when currentImagePreview changes or component unmounts
  useEffect(() => {
    return () => {
      if (currentImagePreview) {
        URL.revokeObjectURL(currentImagePreview);
      }
    };
  }, [currentImagePreview]);

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col items-center space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-headline font-bold text-primary">MykolyLandmarkMapper</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Upload an image to identify famous landmarks using AI.
        </p>
      </div>

      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="p-6">
          <ImageUploadForm onImageSubmit={handleImageSubmit} isLoading={isLoading} />
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex flex-col items-center space-y-2 mt-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Identifying your landmark, please wait...</p>
        </div>
      )}

      {error && (
         <Card className="w-full max-w-md bg-destructive/10 border-destructive text-destructive mt-8">
           <CardHeader>
             <CardTitle className="flex items-center"><AlertTriangle className="mr-2 h-5 w-5" />Error</CardTitle>
           </CardHeader>
           <CardContent>
             <p>{error}</p>
           </CardContent>
         </Card>
      )}

      {result && currentImagePreview && !isLoading && (
        <LandmarkResultCard result={result} imagePreviewUrl={currentImagePreview} />
      )}
    </div>
  );
}
