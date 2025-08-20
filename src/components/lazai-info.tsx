"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Network, 
  Shield, 
  Zap, 
  Brain, 
  CheckCircle, 
  Info, 
  Users, 
  BarChart3,
  Layers,
  Clock
} from "lucide-react";

export default function LazAIInfo() {
  const [isOpen, setIsOpen] = useState(false);

  const verificationSteps = [
    {
      step: 1,
      title: "Multi-Modal Analysis",
      description: "AI analyzes the artwork across different modalities - visual elements, composition, style, and technical quality.",
      icon: Brain,
      duration: "~2-3 seconds"
    },
    {
      step: 2,
      title: "Hyperion Node Consensus",
      description: "5 distributed Hyperion nodes independently evaluate the artwork and provide reasoning.",
      icon: Network,
      duration: "~3-5 seconds"
    },
    {
      step: 3,
      title: "Quality Validation",
      description: "LazAI compares results with baseline models (like Gemini) to ensure accuracy.",
      icon: Shield,
      duration: "~1-2 seconds"
    },
    {
      step: 4,
      title: "On-Chain Storage",
      description: "All reasoning, scores, and consensus data is permanently stored on Hyperion blockchain.",
      icon: CheckCircle,
      duration: "~10-15 seconds"
    }
  ];

  const benefits = [
    {
      title: "Decentralized Verification",
      description: "No single point of failure - 5 independent nodes validate your artwork",
      icon: Network,
      color: "text-blue-500"
    },
    {
      title: "Transparent Reasoning",
      description: "See exactly how AI evaluated your artwork with detailed explanations",
      icon: Info,
      color: "text-green-500"
    },
    {
      title: "Quality Assurance", 
      description: "Multi-layer validation ensures high-quality artistic evaluation",
      icon: Shield,
      color: "text-purple-500"
    },
    {
      title: "Community Trust",
      description: "Build reputation through verified, consensus-based artwork quality",
      icon: Users,
      color: "text-orange-500"
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Network className="w-4 h-4" />
          LazAI Info
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Network className="w-5 h-5 text-blue-500" />
            LazAI Verification Process
          </DialogTitle>
          <DialogDescription>
            Understanding how LazAI provides decentralized AI consensus for your artwork
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="process" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="process">Verification Process</TabsTrigger>
            <TabsTrigger value="benefits">Benefits</TabsTrigger>
            <TabsTrigger value="technical">Technical Details</TabsTrigger>
          </TabsList>

          <TabsContent value="process" className="space-y-6">
            <div className="space-y-4">
              {verificationSteps.map((step, index) => (
                <Card key={step.step}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400">
                        {step.step}
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base flex items-center gap-2">
                          <step.icon className="w-4 h-4" />
                          {step.title}
                        </CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {step.duration}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="benefits" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <Card key={index}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <benefit.icon className={`w-4 h-4 ${benefit.color}`} />
                      {benefit.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <p className="text-sm text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="technical" className="space-y-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    Architecture Overview
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm">LazAI Network</h4>
                      <p className="text-sm text-muted-foreground">
                        Decentralized AI infrastructure providing consensus-based reasoning for creative content
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Hyperion Nodes</h4>
                      <p className="text-sm text-muted-foreground">
                        5 independent nodes on Metis Hyperion network that validate and cross-reference AI outputs
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-sm">Consensus Mechanism</h4>
                      <p className="text-sm text-muted-foreground">
                        Multi-node agreement ensures reliable, unbiased evaluation of artistic quality and creativity
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Quality Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Artistic Composition</span>
                      <Badge variant="outline">0-100</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Technical Quality</span>
                      <Badge variant="outline">0-100</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Creativity Score</span>
                      <Badge variant="outline">0-100</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Overall Confidence</span>
                      <Badge variant="outline">0-1.0</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => window.open('https://docs.lazai.network', '_blank')}
            className="gap-2 flex-1"
          >
            <Info className="w-4 h-4" />
            Learn More
          </Button>
          <Button
            onClick={() => setIsOpen(false)}
            className="flex-1"
          >
            Got It!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
