import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, Link, Image, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

interface ExternalArtUploadProps {
  onImageSelected: (imageData: string, metadata: ExternalImageMetadata) => void;
  isProcessing?: boolean;
}

interface ExternalImageMetadata {
  source: 'upload' | 'url';
  originalName?: string;
  originalUrl?: string;
  fileSize?: number;
  dimensions?: { width: number; height: number };
  userTitle?: string;
  userDescription?: string;
  mimeType?: string;
  analysisResult?: AnalysisResult;
}

interface AnalysisResult {
  qualityScore: number;
  lazaiReasoning: string;
  suggestedTitle: string;
  enhancedDescription: string;
  confidence: number;
  analysisTimestamp: number;
}

export default function ExternalArtUpload({ onImageSelected, isProcessing = false }: ExternalArtUploadProps) {
  const [uploadMethod, setUploadMethod] = useState<'upload' | 'url'>('upload');
  const [imageUrl, setImageUrl] = useState('');
  const [userTitle, setUserTitle] = useState('');
  const [userDescription, setUserDescription] = useState('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const validateImageFile = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(file.type)) {
      setError('Please upload a JPG, PNG, or WebP image file.');
      return false;
    }

    if (file.size > maxSize) {
      setError('File size must be less than 10MB.');
      return false;
    }

    return true;
  };

  const getImageDimensions = (src: string): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = document.createElement('img');
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = reject;
      img.src = src;
    });
  };

  const analyzeImageWithLazAI = async (imageData: string, metadata: ExternalImageMetadata): Promise<AnalysisResult> => {
    try {
      setAnalysisProgress(25);
      
      const response = await fetch('/api/analyze-external-art', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageData,
          metadata,
          userTitle,
          userDescription,
        }),
      });

      setAnalysisProgress(75);

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const result = await response.json();
      setAnalysisProgress(100);
      
      return {
        qualityScore: result.qualityScore || 0.8,
        lazaiReasoning: result.lazaiReasoning || 'LazAI analysis completed successfully.',
        suggestedTitle: result.suggestedTitle || userTitle || 'External Artwork',
        enhancedDescription: result.enhancedDescription || userDescription || 'AI-analyzed external artwork',
        confidence: result.confidence || 0.85,
        analysisTimestamp: Date.now(),
      };
    } catch (error) {
      console.error('LazAI analysis error:', error);
      // Fallback analysis
      return {
        qualityScore: 0.75,
        lazaiReasoning: 'External artwork uploaded and ready for minting. LazAI analysis temporarily unavailable, using fallback quality assessment.',
        suggestedTitle: userTitle || 'External Artwork',
        enhancedDescription: userDescription || 'User-uploaded artwork ready for NFT minting',
        confidence: 0.70,
        analysisTimestamp: Date.now(),
      };
    }
  };

  const processImage = async (imageData: string, metadata: ExternalImageMetadata) => {
    try {
      setError(null);
      setIsAnalyzing(true);
      setAnalysisProgress(0);

      // Get image dimensions
      const dimensions = await getImageDimensions(imageData);
      const enhancedMetadata = { ...metadata, dimensions };

      // Analyze with LazAI
      const analysis = await analyzeImageWithLazAI(imageData, enhancedMetadata);
      setAnalysisResult(analysis);

      // Pass to parent component
      onImageSelected(imageData, {
        ...enhancedMetadata,
        analysisResult: analysis,
      });

    } catch (error) {
      setError(`Processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  };

  const handleFileUpload = useCallback((file: File) => {
    if (!validateImageFile(file)) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      setPreviewImage(imageData);
      
      const metadata: ExternalImageMetadata = {
        source: 'upload',
        originalName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        userTitle,
        userDescription,
      };

      processImage(imageData, metadata);
    };
    reader.readAsDataURL(file);
  }, [userTitle, userDescription]);

  const handleUrlUpload = async () => {
    if (!imageUrl.trim()) {
      setError('Please enter a valid image URL.');
      return;
    }

    try {
      setError(null);
      setIsAnalyzing(true);
      
      // Convert URL to base64 for processing
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error('Failed to fetch image from URL');
      
      const blob = await response.blob();
      if (!blob.type.startsWith('image/')) {
        throw new Error('URL does not point to a valid image');
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setPreviewImage(imageData);
        
        const metadata: ExternalImageMetadata = {
          source: 'url',
          originalUrl: imageUrl,
          fileSize: blob.size,
          mimeType: blob.type,
          userTitle,
          userDescription,
        };

        processImage(imageData, metadata);
      };
      reader.readAsDataURL(blob);
      
    } catch (error) {
      setError(`URL processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsAnalyzing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            External Artwork Minting
          </CardTitle>
          <CardDescription>
            Upload your own artwork or paste an image URL. Our LazAI system will analyze the quality and enhance the metadata for optimal NFT creation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Upload Method Selection */}
          <div className="flex gap-2">
            <Button
              variant={uploadMethod === 'upload' ? 'default' : 'outline'}
              onClick={() => setUploadMethod('upload')}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload File
            </Button>
            <Button
              variant={uploadMethod === 'url' ? 'default' : 'outline'}
              onClick={() => setUploadMethod('url')}
              className="flex-1"
            >
              <Link className="h-4 w-4 mr-2" />
              Image URL
            </Button>
          </div>

          {/* Metadata Input */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Artwork Title (Optional)</Label>
              <Input
                id="title"
                placeholder="Enter a title for your artwork"
                value={userTitle}
                onChange={(e) => setUserTitle(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Describe your artwork"
                value={userDescription}
                onChange={(e) => setUserDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Upload Interface */}
          {uploadMethod === 'upload' ? (
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Upload className="h-10 w-10 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">
                Drag & drop your image here
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Supports JPG, PNG, WebP up to 10MB
              </p>
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleInputChange}
                className="hidden"
                id="file-upload"
                disabled={isAnalyzing || isProcessing}
              />
              <Button asChild disabled={isAnalyzing || isProcessing}>
                <label htmlFor="file-upload" className="cursor-pointer">
                  Choose File
                </label>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="image-url">Image URL</Label>
                <Input
                  id="image-url"
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  disabled={isAnalyzing || isProcessing}
                />
              </div>
              <Button 
                onClick={handleUrlUpload}
                disabled={!imageUrl.trim() || isAnalyzing || isProcessing}
                className="w-full"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing URL...
                  </>
                ) : (
                  <>
                    <Link className="h-4 w-4 mr-2" />
                    Load from URL
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Analysis Progress */}
          {isAnalyzing && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Analyzing with LazAI...</span>
              </div>
              <Progress value={analysisProgress} className="w-full" />
            </div>
          )}

          {/* Preview and Analysis Results */}
          {previewImage && analysisResult && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Image Preview */}
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="border rounded-lg overflow-hidden">
                  <img 
                    src={previewImage} 
                    alt="Preview" 
                    className="w-full h-64 object-cover"
                  />
                </div>
              </div>

              {/* LazAI Analysis */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <Label>LazAI Analysis Complete</Label>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label className="text-sm font-medium">Quality Score</Label>
                    <div className="flex items-center gap-2">
                      <Progress value={analysisResult.qualityScore * 100} className="flex-1" />
                      <span className="text-sm font-medium">
                        {Math.round(analysisResult.qualityScore * 100)}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Confidence</Label>
                    <div className="flex items-center gap-2">
                      <Progress value={analysisResult.confidence * 100} className="flex-1" />
                      <span className="text-sm font-medium">
                        {Math.round(analysisResult.confidence * 100)}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Suggested Title</Label>
                    <p className="text-sm bg-gray-50 p-2 rounded">
                      {analysisResult.suggestedTitle}
                    </p>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">LazAI Reasoning</Label>
                    <p className="text-sm bg-gray-50 p-3 rounded leading-relaxed">
                      {analysisResult.lazaiReasoning}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
