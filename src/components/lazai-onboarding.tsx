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
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          LazAI Interactive Onboarding
        </h1>
        <p className="text-lg text-muted-foreground">
          Experience the complete journey from prompt → LazAI enhancement → NFT creation
        </p>
        <Progress value={progressPercentage} className="w-full" />
        <p className="text-sm text-muted-foreground">
          {steps.filter(s => s.completed).length} of {steps.length} steps completed
        </p>
      </div>

      {/* Step Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {steps.map((step, index) => (
          <div
            key={step.id}
            className={`p-2 rounded-lg text-center cursor-pointer transition-all ${
              index === currentStep
                ? 'bg-primary text-primary-foreground'
                : step.completed
                ? 'bg-green-100 text-green-800'
                : 'bg-muted text-muted-foreground'
            }`}
            onClick={() => setCurrentStep(index)}
          >
            <div className="flex flex-col items-center gap-1">
              {step.completed ? <CheckCircle className="w-4 h-4" /> : step.icon}
              <span className="text-xs font-medium">{step.title}</span>
            </div>
          </div>
        ))}
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
                  <p>Processing through Hyperion nodes...</p>
                  <Progress value={75} className="w-full" />
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>✓ Connecting to decentralized reasoning network</p>
                    <p>✓ Generating proof-of-reasoning</p>
                    <p>• Analyzing artistic elements...</p>
                  </div>
                </div>
              )}

              {hyperionDemo.lazaiResult && (
                <div className="space-y-4">
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      LazAI enhancement completed! Proof hash: {hyperionDemo.lazaiResult.proofHash?.substring(0, 16)}...
                    </AlertDescription>
                  </Alert>
                  <div className="bg-muted p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Enhanced Reasoning:</h4>
                    <p className="text-sm">{hyperionDemo.lazaiResult.reasoning.substring(0, 300)}...</p>
                    <div className="mt-2 flex gap-2">
                      <Badge variant="secondary">Confidence: {Math.round((hyperionDemo.lazaiResult.confidence || 0) * 100)}%</Badge>
                      <Badge variant="secondary">Quality: {hyperionDemo.lazaiResult.qualityScore || 'N/A'}</Badge>
                    </div>
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

          {/* Remaining steps... */}
          {currentStep >= 4 && (
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
