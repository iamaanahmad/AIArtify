/**
 * Phase 4: Analytics Dashboard Component
 * Real-time analytics and insights dashboard
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Zap, 
  Share2, 
  Download,
  RefreshCw,
  Eye,
  Target,
  Sparkles
} from 'lucide-react';
import { useAnalytics } from '@/lib/analytics';

interface AnalyticsDashboardProps {
  onRefresh?: () => void;
}

export default function AnalyticsDashboard({ onRefresh }: AnalyticsDashboardProps) {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { getDashboardData, exportData } = useAnalytics();

  const refreshData = () => {
    setIsLoading(true);
    try {
      const data = getDashboardData();
      setDashboardData(data);
      onRefresh?.();
    } catch (error) {
      console.error('Failed to refresh analytics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  if (!dashboardData) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading analytics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { kpis, charts, insights } = dashboardData;
  
  // Check if we're showing demo data
  const isDemoMode = kpis[0].value >= 200; // Demo data has higher numbers

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h2>
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground">
              Track your AI art generation performance and engagement
            </p>
            {isDemoMode && (
              <Badge variant="secondary" className="text-xs">
                Demo Data
              </Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={refreshData} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={exportData}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi: any, index: number) => {
          const icons = [Users, Target, Zap, Share2];
          const Icon = icons[index];
          const isPositive = typeof kpi.change === 'string' ? kpi.change.startsWith('+') : kpi.change > 0;
          
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {isPositive ? (
                    <TrendingUp className="w-3 h-3 text-green-500" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-500" />
                  )}
                  {kpi.change} {kpi.changeLabel}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Quality Level Usage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Quality Level Usage
                </CardTitle>
                <CardDescription>
                  Distribution of AI quality settings used
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(charts.qualityLevelUsage).map(([level, count]: [string, any]) => {
                  const total = Object.values(charts.qualityLevelUsage).reduce((a: any, b: any) => a + b, 0);
                  const percentage = total > 0 ? (count / total) * 100 : 0;
                  
                  return (
                    <div key={level} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium capitalize">{level}</span>
                        <span className="text-sm text-muted-foreground">{count} ({percentage.toFixed(1)}%)</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Current Session */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-5 h-5" />
                  Current Session
                </CardTitle>
                <CardDescription>
                  Your activity in this session
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Generations</p>
                    <p className="text-2xl font-bold">{insights.currentSession?.totalGenerations || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Successful Mints</p>
                    <p className="text-2xl font-bold">{insights.currentSession?.successfulMints || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Quality</p>
                    <p className="text-2xl font-bold">
                      {insights.currentSession?.averageQuality 
                        ? `${(insights.currentSession.averageQuality * 100).toFixed(1)}%`
                        : 'N/A'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Device</p>
                    <Badge variant="outline" className="mt-1">
                      {insights.currentSession?.deviceType || 'Unknown'}
                    </Badge>
                  </div>
                </div>
                
                {insights.currentSession?.features && insights.currentSession.features.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Features Used</p>
                    <div className="flex flex-wrap gap-1">
                      {insights.currentSession.features.map((feature: string) => (
                        <Badge key={feature} variant="secondary" className="text-xs">
                          {feature.replace('quality_', '').replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="quality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Quality Distribution</CardTitle>
              <CardDescription>
                How your generated artworks score across quality ranges
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(charts.qualityDistribution).map(([range, count]: [string, any]) => {
                  const total = Object.values(charts.qualityDistribution).reduce((a: any, b: any) => a + b, 0);
                  const percentage = total > 0 ? (count / total) * 100 : 0;
                  
                  const rangeLabels: Record<string, string> = {
                    low: 'Low (< 60%)',
                    medium: 'Medium (60-80%)',
                    high: 'High (80-90%)',
                    premium: 'Premium (90%+)'
                  };
                  
                  const rangeColors: Record<string, string> = {
                    low: 'bg-red-500',
                    medium: 'bg-yellow-500',
                    high: 'bg-blue-500',
                    premium: 'bg-purple-500'
                  };
                  
                  return (
                    <div key={range} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded ${rangeColors[range]}`}></div>
                          <span className="text-sm font-medium">{rangeLabels[range]}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{count} artworks</span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {Object.entries(charts.timeRanges).map(([range, data]: [string, any]) => {
              const rangeLabels: Record<string, string> = {
                last24h: 'Last 24 Hours',
                last7d: 'Last 7 Days',
                last30d: 'Last 30 Days'
              };
              
              return (
                <Card key={range}>
                  <CardHeader>
                    <CardTitle className="text-lg">{rangeLabels[range]}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Generations</p>
                      <p className="text-xl font-bold">{data.count}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Quality</p>
                      <p className="text-xl font-bold">{(data.avgQuality * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Mint Rate</p>
                      <p className="text-xl font-bold">{(data.mintRate * 100).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Avg Processing</p>
                      <p className="text-xl font-bold">{(data.avgProcessingTime / 1000).toFixed(1)}s</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Popular Words */}
            <Card>
              <CardHeader>
                <CardTitle>Popular Prompt Words</CardTitle>
                <CardDescription>
                  Most frequently used words in your prompts
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {insights.popularWords.map(([word, count]: [string, number], index: number) => (
                    <div key={word} className="flex items-center justify-between">
                      <span className="text-sm font-medium">#{index + 1} {word}</span>
                      <Badge variant="outline">{count} uses</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Popular Styles */}
            <Card>
              <CardHeader>
                <CardTitle>Popular Art Styles</CardTitle>
                <CardDescription>
                  Most requested artistic styles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {insights.popularStyles.length > 0 ? (
                    insights.popularStyles.map(([style, count]: [string, number], index: number) => (
                      <div key={style} className="flex items-center justify-between">
                        <span className="text-sm font-medium">#{index + 1} {style}</span>
                        <Badge variant="outline">{count} uses</Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No specific styles detected yet. Try using style keywords like "hyperrealistic", "cartoon", or "digital art" in your prompts.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
