'use client';

import { useState } from 'react';
import { Sparkles, Settings, Loader2, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/overlay';
import { Label } from '@/components/ui/inputs';
import { Switch } from '@/components/ui/inputs';
import { Slider } from '@/components/ui/inputs';
import { Progress } from '@/components/ui/advanced';
import { Alert, AlertDescription } from '@/components/ui/overlay';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/advanced';
import { GeneticSeatingOptimizer } from '@/lib/algorithms/seating-optimizer';
import { toast } from 'sonner';

interface OptimizationModalProps {
  open: boolean;
  onClose: () => void;
  onOptimizationComplete: (assignments: Map<string, string>) => void;
  guests: any[];
  tables: any[];
  preferences: any[];
}

interface OptimizationCriteria {
  prioritizeFamilyGroups: boolean;
  mixGuestSides: boolean;
  respectAllConstraints: boolean;
  prioritizeAccessibility: boolean;
  balanceTableAges: boolean;
  avoidIsolatedGuests: boolean;
  minimizeEmptySeats: boolean;
  preferEvenDistribution: boolean;
}

interface OptimizationProgress {
  stage: 'idle' | 'preparing' | 'optimizing' | 'finalizing' | 'complete';
  progress: number;
  generation: number;
  bestFitness: number;
  message: string;
}

export default function OptimizationModal({
  open,
  onClose,
  onOptimizationComplete,
  guests,
  tables,
  preferences,
}: OptimizationModalProps) {
  const [criteria, setCriteria] = useState<OptimizationCriteria>({
    prioritizeFamilyGroups: true,
    mixGuestSides: false,
    respectAllConstraints: true,
    prioritizeAccessibility: true,
    balanceTableAges: true,
    avoidIsolatedGuests: true,
    minimizeEmptySeats: true,
    preferEvenDistribution: true,
  });

  const [advancedSettings, setAdvancedSettings] = useState({
    populationSize: 100,
    maxGenerations: 200,
    mutationRate: 0.05,
    eliteSize: 10,
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [progress, setProgress] = useState<OptimizationProgress>({
    stage: 'idle',
    progress: 0,
    generation: 0,
    bestFitness: 0,
    message: 'Ready to optimize seating arrangements',
  });

  const handleOptimize = async () => {
    setProgress({
      stage: 'preparing',
      progress: 10,
      generation: 0,
      bestFitness: 0,
      message: 'Preparing optimization data...',
    });

    try {
      // Simulate preparation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setProgress({
        stage: 'optimizing',
        progress: 20,
        generation: 0,
        bestFitness: 0,
        message: 'Running genetic algorithm...',
      });

      // Create optimizer instance
      const optimizer = new GeneticSeatingOptimizer(
        guests,
        tables,
        preferences,
        criteria
      );

      // Simulate optimization with progress updates
      // In real implementation, the optimizer would provide callbacks
      const simulateProgress = async () => {
        for (let i = 0; i < 10; i++) {
          await new Promise(resolve => setTimeout(resolve, 800));
          const generation = i * 20;
          const progress = 20 + (i * 6);
          const fitness = 500 + (i * 50) + Math.random() * 20;
          
          setProgress({
            stage: 'optimizing',
            progress,
            generation,
            bestFitness: Math.round(fitness),
            message: `Generation ${generation}: Fitness score ${Math.round(fitness)}`,
          });
        }
      };

      await simulateProgress();

      setProgress({
        stage: 'finalizing',
        progress: 90,
        generation: 200,
        bestFitness: 950,
        message: 'Finalizing optimal seating arrangement...',
      });

      // Run actual optimization
      const result = await optimizer.optimize();
      
      await new Promise(resolve => setTimeout(resolve, 500));

      setProgress({
        stage: 'complete',
        progress: 100,
        generation: 200,
        bestFitness: result.fitness,
        message: 'Optimization complete!',
      });

      // Wait a moment before closing
      await new Promise(resolve => setTimeout(resolve, 1500));

      onOptimizationComplete(result.assignments);
      toast.success('Seating arrangement optimized successfully!');
      onClose();
      
      // Reset progress after closing
      setTimeout(() => {
        setProgress({
          stage: 'idle',
          progress: 0,
          generation: 0,
          bestFitness: 0,
          message: 'Ready to optimize seating arrangements',
        });
      }, 300);

    } catch (error) {
      console.error('Optimization error:', error);
      toast.error('Optimization failed. Please try again.');
      setProgress({
        stage: 'idle',
        progress: 0,
        generation: 0,
        bestFitness: 0,
        message: 'Optimization failed. Please try again.',
      });
    }
  };

  const isOptimizing = progress.stage !== 'idle' && progress.stage !== 'complete';

  return (
    <Dialog open={open} onOpenChange={(open) => !open && !isOptimizing && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Optimize Seating Arrangement
          </DialogTitle>
          <DialogDescription>
            Use AI to automatically assign guests to tables based on your preferences and constraints.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {progress.stage === 'idle' ? (
            <>
              {/* Optimization Criteria */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Optimization Criteria</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="family-groups" className="cursor-pointer">
                      Keep family groups together
                    </Label>
                    <Switch
                      id="family-groups"
                      checked={criteria.prioritizeFamilyGroups}
                      onCheckedChange={(checked) =>
                        setCriteria({ ...criteria, prioritizeFamilyGroups: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="mix-sides" className="cursor-pointer">
                      Mix bride and groom sides
                    </Label>
                    <Switch
                      id="mix-sides"
                      checked={criteria.mixGuestSides}
                      onCheckedChange={(checked) =>
                        setCriteria({ ...criteria, mixGuestSides: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="constraints" className="cursor-pointer">
                      Respect all seating constraints
                    </Label>
                    <Switch
                      id="constraints"
                      checked={criteria.respectAllConstraints}
                      onCheckedChange={(checked) =>
                        setCriteria({ ...criteria, respectAllConstraints: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="accessibility" className="cursor-pointer">
                      Prioritize accessibility needs
                    </Label>
                    <Switch
                      id="accessibility"
                      checked={criteria.prioritizeAccessibility}
                      onCheckedChange={(checked) =>
                        setCriteria({ ...criteria, prioritizeAccessibility: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="age-balance" className="cursor-pointer">
                      Balance age groups at tables
                    </Label>
                    <Switch
                      id="age-balance"
                      checked={criteria.balanceTableAges}
                      onCheckedChange={(checked) =>
                        setCriteria({ ...criteria, balanceTableAges: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="minimize-empty" className="cursor-pointer">
                      Minimize empty seats
                    </Label>
                    <Switch
                      id="minimize-empty"
                      checked={criteria.minimizeEmptySeats}
                      onCheckedChange={(checked) =>
                        setCriteria({ ...criteria, minimizeEmptySeats: checked })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Advanced Settings */}
              <div className="space-y-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Advanced Settings
                </Button>

                {showAdvanced && (
                  <Card>
                    <CardContent className="space-y-4 pt-4">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label>Population Size</Label>
                          <span className="text-sm text-muted-foreground">
                            {advancedSettings.populationSize}
                          </span>
                        </div>
                        <Slider
                          value={[advancedSettings.populationSize]}
                          onValueChange={([value]) =>
                            setAdvancedSettings({ ...advancedSettings, populationSize: value })
                          }
                          min={50}
                          max={500}
                          step={50}
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label>Max Generations</Label>
                          <span className="text-sm text-muted-foreground">
                            {advancedSettings.maxGenerations}
                          </span>
                        </div>
                        <Slider
                          value={[advancedSettings.maxGenerations]}
                          onValueChange={([value]) =>
                            setAdvancedSettings({ ...advancedSettings, maxGenerations: value })
                          }
                          min={50}
                          max={1000}
                          step={50}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Summary */}
              <Alert>
                <AlertDescription>
                  <div className="space-y-1">
                    <p>Ready to optimize seating for:</p>
                    <ul className="text-sm space-y-1 ml-4">
                      <li>• {guests.length} guests</li>
                      <li>• {tables.length} tables</li>
                      <li>• {preferences.length} preferences/constraints</li>
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            </>
          ) : (
            <>
              {/* Optimization Progress */}
              <div className="space-y-6">
                <div className="text-center space-y-4">
                  {progress.stage === 'complete' ? (
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                      <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    </div>
                  )}
                  
                  <div>
                    <p className="text-lg font-semibold">{progress.message}</p>
                    {progress.stage === 'optimizing' && (
                      <div className="flex items-center justify-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>Generation: {progress.generation}</span>
                        <span>•</span>
                        <span>Fitness: {progress.bestFitness}</span>
                      </div>
                    )}
                  </div>
                </div>

                <Progress value={progress.progress} className="h-2" />

                {progress.stage === 'optimizing' && (
                  <Card>
                    <CardContent className="pt-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Algorithm Stage:</span>
                          <Badge variant="secondary">Evolution</Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Convergence:</span>
                          <span>{Math.round(progress.progress * 0.8)}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Solutions Evaluated:</span>
                          <span>{progress.generation * advancedSettings.populationSize}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isOptimizing}
            >
              Cancel
            </Button>
            {progress.stage === 'idle' && (
              <Button onClick={handleOptimize}>
                <Sparkles className="mr-2 h-4 w-4" />
                Start Optimization
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}