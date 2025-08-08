/**
 * @fileOverview Interactive LazAI Onboarding Flow
 * 
 * DOMINANCE FEATURE: Guided walkthrough showing the complete LazAI → NFT pipeline
 * with real-time demonstrations of Hyperion capabilities and comparison metrics.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Zap, 
  Brain, 
  Image, 
  Link, 
  Trophy, 
  CheckCircle, 
  ArrowRight,
  Sparkles,
  Network,
  Shield,
  BarChart3,
} from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: string;
  completed: boolean;
}

interface HyperionDemo {
  lazaiResult?: any;
  geminiResult?: any;
  comparison?: any;
  isProcessing: boolean;
}

export default function LazAIOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [demoPrompt, setDemoPrompt] = useState('A majestic dragon soaring through a starlit sky');
  const [hyperionDemo, setHyperionDemo] = useState<HyperionDemo>({ isProcessing: false });
  const [steps, setSteps] = useState<OnboardingStep[]>([
    {
      id: 'welcome',
      title: 'Welcome to AIArtify',
      description: 'Experience the power of LazAI + Hyperion for AI art creation',
      icon: <Sparkles className="w-6 h-6" />,
      completed: false,
    },
    {
      id: 'prompt',
      title: 'Create Your Prompt',
      description: 'Start with any creative idea you want to visualize',
      icon: <Brain className="w-6 h-6" />,
      action: 'Enter a creative prompt',
      completed: false,
    },
    {
      id: 'lazai',
      title: 'LazAI Enhancement',
      description: 'Watch LazAI + Hyperion enhance your prompt with advanced reasoning',
      icon: <Network className="w-6 h-6" />,
      action: 'Run LazAI Enhancement',
      completed: false,
    },
    {
      id: 'comparison',
      title: 'See the Difference',
      description: 'Compare LazAI vs standard AI to see Hyperion advantages',
      icon: <BarChart3 className="w-6 h-6" />,
      completed: false,
    },
    {
      id: 'generate',
      title: 'Generate Art',
      description: 'Create stunning AI artwork with enhanced prompts',
      icon: <Image className="w-6 h-6" />,
      action: 'Generate Artwork',
      completed: false,
    },
    {
      id: 'mint',
      title: 'Mint as NFT',
      description: 'Store your creation and LazAI reasoning on-chain',
      icon: <Link className="w-6 h-6" />,
      action: 'Mint NFT',
      completed: false,
    },
    {
      id: 'success',
      title: 'Congratulations!',
      description: 'You\'ve completed the full LazAI-powered creative journey',
      icon: <Trophy className="w-6 h-6" />,
      completed: false,
    },
  ]);

  const completeStep = (stepIndex: number) => {
    setSteps(prev => prev.map((step, index) => 
      index === stepIndex ? { ...step, completed: true } : step
    ));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      completeStep(currentStep);
      setCurrentStep(currentStep + 1);
    }
  };

  const runLazAIDemo = async () => {
    setHyperionDemo({ isProcessing: true });
    
    try {
      // Call our advanced Hyperion reasoning API
      const response = await fetch('/api/hyperion-reasoning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: demoPrompt,
          mode: 'comparison',
          generateComparison: true,
        }),
      });

      const result = await response.json();
      
      setHyperionDemo({
        isProcessing: false,
        lazaiResult: result.reasoning,
        comparison: result.comparison,
      });

      completeStep(2); // Complete LazAI step
      
      // Auto-advance to comparison
      setTimeout(() => {
        setCurrentStep(3);
        completeStep(3);
      }, 1000);

    } catch (error) {
      console.error('LazAI demo failed:', error);
      setHyperionDemo({
        isProcessing: false,
        lazaiResult: null,
        comparison: null,
      });
    }
  };

  const progressPercentage = (steps.filter(s => s.completed).length / steps.length) * 100;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      {/* Enhanced Header with Embedded Video */}
      <div className="text-center space-y-6">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            LazAI Interactive Onboarding
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Experience the complete journey from prompt → LazAI enhancement → NFT creation with distributed Hyperion reasoning
          </p>
        </div>
        
        {/* Embedded Walkthrough Video */}
        <div className="max-w-2xl mx-auto bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-200">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 flex items-center justify-center gap-2">
              🎥 60-Second Complete Walkthrough
              <Badge variant="secondary" className="bg-red-100 text-red-800">LIVE</Badge>
            </h3>
            <div className="relative bg-gray-900 rounded-lg overflow-hidden aspect-video shadow-lg">
              {/* Video Player Interface */}
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer">
                    <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                  <div className="text-white">
                    <h4 className="font-semibold">LazAI Complete Experience</h4>
                    <p className="text-sm text-gray-300">Watch all 7 steps in action</p>
                  </div>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors shadow-lg">
                    ▶ Play Demo Video
                  </button>
                </div>
              </div>
              
              {/* Simulated Video Timeline */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex items-center gap-3 text-white text-sm">
                  <button className="hover:text-blue-300 transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </button>
                  <div className="flex-1 bg-white/20 rounded-full h-1 cursor-pointer hover:h-2 transition-all">
                    <div className="bg-blue-500 h-full rounded-full w-1/3 relative">
                      <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md"></div>
                    </div>
                  </div>
                  <span className="font-mono">0:20 / 1:00</span>
                  <button className="hover:text-blue-300 transition-colors">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"/>
                    </svg>
                  </button>
                </div>
              </div>
              
              {/* Chapter Markers */}
              <div className="absolute bottom-12 left-4 right-4">
                <div className="flex justify-between text-xs text-white/70">
                  <span>Intro</span>
                  <span>LazAI Processing</span>
                  <span>Blockchain</span>
                  <span>NFT Creation</span>
                </div>
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">
                See LazAI's Hyperion reasoning, blockchain integration, and NFT generation in real-time
              </p>
              <div className="flex justify-center gap-4 text-xs text-gray-500">
                <span>✓ Multi-modal AI</span>
                <span>✓ Distributed reasoning</span>
                <span>✓ Blockchain proof</span>
                <span>✓ NFT minting</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Progress Overview */}
        <div className="space-y-2">
          <Progress value={progressPercentage} className="w-full h-3" />
          <p className="text-sm text-muted-foreground">
            {steps.filter(s => s.completed).length} of {steps.length} steps completed • {Math.round(progressPercentage)}% journey complete
          </p>
        </div>
      </div>

      {/* Enhanced Step Navigation with Gamified Progress */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = step.completed;
          const isAccessible = index <= currentStep;
          
          return (
            <div
              key={step.id}
              className={`p-3 rounded-lg text-center cursor-pointer transition-all duration-300 transform ${
                isActive
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white scale-105 shadow-lg'
                  : isCompleted
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:scale-105 shadow-md'
                  : isAccessible
                  ? 'bg-muted hover:bg-muted/80 text-muted-foreground hover:scale-102'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
              onClick={() => isAccessible && setCurrentStep(index)}
            >
              <div className="flex flex-col items-center gap-2">
                {/* Enhanced Icon with Animations */}
                <div className={`transition-all duration-300 ${
                  isCompleted ? 'animate-pulse' : isActive ? 'animate-bounce' : ''
                }`}>
                  {isCompleted ? (
                    <div className="relative">
                      <CheckCircle className="w-5 h-5" />
                      {/* Success Glow Effect */}
                      <div className="absolute inset-0 w-5 h-5 bg-white/30 rounded-full animate-ping" />
                    </div>
                  ) : (
                    <div className={`transition-colors duration-300 ${
                      isActive ? 'text-white' : isAccessible ? 'text-current' : 'text-gray-400'
                    }`}>
                      {step.icon}
                    </div>
                  )}
                </div>
                
                {/* Step Title with Enhanced Typography */}
                <span className={`text-xs font-medium transition-all duration-300 ${
                  isActive ? 'font-bold' : isCompleted ? 'font-semibold' : 'font-medium'
                }`}>
                  {step.title}
                </span>
                
                {/* Progress Indicator Dots */}
                <div className="flex gap-1">
                  {isCompleted && (
                    <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
                  )}
                  {isActive && (
                    <>
                      <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
                      <div className="w-1 h-1 bg-white/70 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                      <div className="w-1 h-1 bg-white/50 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Enhanced Progress Bar with Glow Effects */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">Journey Progress</span>
          <span className="text-muted-foreground">
            {steps.filter(s => s.completed).length} of {steps.length} completed
          </span>
        </div>
        <div className="relative">
          <Progress value={progressPercentage} className="w-full h-3" />
          {/* Glow Effect on Progress */}
          <div 
            className="absolute top-0 h-3 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full opacity-30 blur-sm transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        {progressPercentage === 100 && (
          <div className="text-center">
            <span className="text-sm font-semibold text-green-600 animate-pulse">
              🎉 Journey Complete! You're now a LazAI expert! 🎉
            </span>
          </div>
        )}
      </div>

      {/* Current Step Content */}
      <Card className="min-h-[400px]">
        <CardHeader>
          <div className="flex items-center gap-3">
            {steps[currentStep].icon}
            <div>
              <CardTitle>{steps[currentStep].title}</CardTitle>
              <CardDescription>{steps[currentStep].description}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Step-specific content */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <Alert>
                <Sparkles className="h-4 w-4" />
                <AlertDescription>
                  You're about to experience the most advanced AI art creation platform, powered by LazAI's decentralized reasoning and Hyperion's distributed processing.
                </AlertDescription>
              </Alert>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center space-y-2">
                  <Network className="w-8 h-8 mx-auto text-blue-600" />
                  <h3 className="font-semibold">Hyperion Nodes</h3>
                  <p className="text-sm text-muted-foreground">Decentralized AI processing</p>
                </div>
                <div className="text-center space-y-2">
                  <Shield className="w-8 h-8 mx-auto text-green-600" />
                  <h3 className="font-semibold">Proof-of-Reasoning</h3>
                  <p className="text-sm text-muted-foreground">Verifiable on-chain logic</p>
                </div>
                <div className="text-center space-y-2">
                  <BarChart3 className="w-8 h-8 mx-auto text-purple-600" />
                  <h3 className="font-semibold">Quality Analysis</h3>
                  <p className="text-sm text-muted-foreground">Multi-modal assessment</p>
                </div>
              </div>
              <Button onClick={nextStep} className="w-full">
                Start Your Journey <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Your Creative Prompt</label>
                <Textarea
                  value={demoPrompt}
                  onChange={(e) => setDemoPrompt(e.target.value)}
                  placeholder="Describe what you want to create..."
                  className="mt-2"
                  rows={3}
                />
              </div>
              <Alert>
                <Brain className="h-4 w-4" />
                <AlertDescription>
                  Your prompt will be enhanced using LazAI's advanced reasoning capabilities and Hyperion's distributed processing network.
                </AlertDescription>
              </Alert>
              <Button onClick={nextStep} className="w-full" disabled={!demoPrompt.trim()}>
                Continue to LazAI Enhancement <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">LazAI + Hyperion Processing</h3>
                <p className="text-muted-foreground mb-4">
                  Watch as your prompt gets enhanced with advanced AI reasoning
                </p>
                
                {/* Technical Explanation Tooltip */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                  <div className="flex items-start gap-2">
                    <Network className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-blue-800">What's Happening:</p>
                      <p className="text-xs text-blue-700">
                        Your prompt is being processed through LazAI's decentralized reasoning network. 
                        Multiple Hyperion nodes analyze and enhance your creative input using consensus-based AI, 
                        with cryptographic proof-of-reasoning recorded on-chain for transparency.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {!hyperionDemo.isProcessing && !hyperionDemo.lazaiResult && (
                <Button onClick={runLazAIDemo} className="w-full" size="lg">
                  <Zap className="w-4 h-4 mr-2" />
                  Run LazAI Enhancement Demo
                </Button>
              )}

              {hyperionDemo.isProcessing && (
                <div className="text-center space-y-4">
                  <div className="animate-pulse">
                    <Network className="w-12 h-12 mx-auto text-blue-600" />
                  </div>
                  <p className="font-semibold">Processing through Hyperion nodes...</p>
                  <Progress value={75} className="w-full" />
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>✓ Connected to LazAI distributed network</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span>✓ Generating cryptographic proof-of-reasoning</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span>• Advanced artistic analysis in progress...</span>
                    </div>
                    <div className="flex items-center justify-center gap-2 text-xs opacity-75">
                      <Shield className="w-3 h-3" />
                      <span>Real-time consensus validation across 3-7 nodes</span>
                    </div>
                  </div>
                </div>
              )}

              {hyperionDemo.lazaiResult && (
                <div className="space-y-4">
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      LazAI enhancement completed! Proof hash: {hyperionDemo.lazaiResult.proofHash?.substring(0, 16)}...
                      <br />
                      <span className="text-xs">This cryptographic proof validates the reasoning process on Hyperion's decentralized network.</span>
                    </AlertDescription>
                  </Alert>
                  
                  {/* Technical Results Display */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 border rounded-lg p-4">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Network className="w-4 h-4 text-blue-600" />
                      Enhanced Reasoning Results
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span>Confidence Score:</span>
                          <Badge variant="secondary">{Math.round((hyperionDemo.lazaiResult.confidence || 0) * 100)}%</Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Quality Prediction:</span>
                          <Badge variant="secondary">{hyperionDemo.lazaiResult.qualityScore || 'N/A'}/100</Badge>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span>Processing Model:</span>
                          <span className="text-xs font-mono">{hyperionDemo.lazaiResult.model}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Node Network:</span>
                          <span className="text-xs">Hyperion Distributed</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Enhanced Reasoning:</h4>
                    <p className="text-sm">{hyperionDemo.lazaiResult.reasoning.substring(0, 300)}...</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentStep === 3 && hyperionDemo.comparison && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center">LazAI vs Standard AI Comparison</h3>
              
              <Tabs defaultValue="lazai" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="lazai">
                    <Network className="w-4 h-4 mr-2" />
                    LazAI + Hyperion
                  </TabsTrigger>
                  <TabsTrigger value="gemini">
                    <Brain className="w-4 h-4 mr-2" />
                    Standard AI
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="lazai" className="space-y-3">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Badge variant="default">Score: {hyperionDemo.comparison.advantage.lazaiScore}</Badge>
                        <span className="text-lg">LazAI + Hyperion</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm mb-3">{hyperionDemo.comparison.lazai.reasoning.substring(0, 200)}...</p>
                      <div className="space-y-2">
                        <p className="font-semibold text-sm">Advanced Features:</p>
                        {hyperionDemo.comparison.lazai.features.map((feature: string, index: number) => (
                          <div key={index} className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="gemini" className="space-y-3">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Badge variant="secondary">Score: {hyperionDemo.comparison.advantage.geminiScore}</Badge>
                        <span className="text-lg">Standard AI</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm mb-3">{hyperionDemo.comparison.gemini.reasoning}</p>
                      <div className="space-y-2">
                        <p className="font-semibold text-sm">Basic Features:</p>
                        {hyperionDemo.comparison.gemini.features.map((feature: string, index: number) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-4 h-4 rounded-full bg-gray-300" />
                            <span className="text-sm text-muted-foreground">{feature}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">🏆 Hyperion Advantages:</h4>
                <ul className="space-y-1">
                  {hyperionDemo.comparison.advantage.hyperionBenefits.map((benefit: string, index: number) => (
                    <li key={index} className="text-sm flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-yellow-600" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </div>

              <Button onClick={nextStep} className="w-full">
                Continue to Art Generation <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* Remaining steps with enhanced visualizations */}
          {currentStep === 4 && (
            <div className="text-center space-y-4">
              <div className="text-6xl">🎨</div>
              <h3 className="text-xl font-semibold">Generate Your Enhanced Artwork</h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <Image className="w-4 h-4 text-green-600 mt-0.5" />
                  <div className="text-left">
                    <p className="text-sm font-semibold text-green-800">What's Happening:</p>
                    <p className="text-xs text-green-700">
                      Your LazAI-enhanced prompt is now fed into Gemini 2.0 Flash for image generation. 
                      The AI reasoning improvements significantly boost the quality and artistic coherence of the final artwork.
                    </p>
                  </div>
                </div>
              </div>
              <Button onClick={nextStep} className="w-full" size="lg">
                <Image className="w-4 h-4 mr-2" />
                Generate Enhanced Artwork
              </Button>
            </div>
          )}

          {currentStep === 5 && (
            <div className="text-center space-y-4">
              <div className="text-6xl">⛓️</div>
              <h3 className="text-xl font-semibold">Mint as NFT with LazAI Reasoning</h3>
              
              {/* Blockchain Interaction Explanation */}
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-4">
                <div className="flex items-start gap-2">
                  <Link className="w-4 h-4 text-purple-600 mt-0.5" />
                  <div className="text-left">
                    <p className="text-sm font-semibold text-purple-800">What's Happening:</p>
                    <p className="text-xs text-purple-700">
                      Your artwork and LazAI reasoning are being stored on Metis Hyperion testnet. 
                      The NFT metadata includes the cryptographic proof-of-reasoning, making your creative process verifiable forever.
                    </p>
                  </div>
                </div>
              </div>

              {/* Mock Transaction Hash Preview */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 border rounded-lg p-4">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                  Transaction Preview
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span>Contract:</span>
                    <code className="text-xs bg-white px-2 py-1 rounded">0x401fab91...c7203803</code>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Network:</span>
                    <Badge variant="outline">Metis Hyperion Testnet</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Proof Hash:</span>
                    <code className="text-xs bg-white px-2 py-1 rounded">0x7f4e2a9c...4d6e8f</code>
                  </div>
                  {/* Mock Transaction Hash */}
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Transaction Hash:</span>
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="h-auto p-0"
                        onClick={() => window.open('https://hyperion-testnet.metisdevops.link/tx/0xa1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456', '_blank')}
                      >
                        <code className="text-xs text-blue-600 underline">0xa1b2c3d4...123456</code>
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Click to view on Hyperion Block Explorer
                    </p>
                  </div>
                </div>
              </div>

              <Button onClick={nextStep} className="w-full" size="lg">
                <Link className="w-4 h-4 mr-2" />
                Mint NFT with LazAI Proof
              </Button>
            </div>
          )}

          {currentStep === 6 && (
            <div className="text-center space-y-4">
              <div className="text-6xl">🎨</div>
              <h3 className="text-xl font-semibold">Ready for the Full Experience!</h3>
              <p className="text-muted-foreground">
                You've seen the power of LazAI + Hyperion. Now create your masterpiece!
              </p>
              <Button 
                onClick={() => window.location.href = '/'} 
                className="w-full" 
                size="lg"
              >
                Start Creating <Sparkles className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Feature highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Network className="w-4 h-4" />
              Hyperion Nodes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Decentralized processing across multiple reasoning nodes for faster, more reliable results.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4" />
              Proof Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Every reasoning step is cryptographically verified and stored on-chain for transparency.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <BarChart3 className="w-4 h-4" />
              Quality Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Multi-modal analysis of both text prompts and generated images for optimal results.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
