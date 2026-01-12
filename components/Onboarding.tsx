'use client';

/**
 * Interactive Onboarding
 * =====================
 * 
 * Step-by-step guided tour for new users.
 * Introduces key features and helps users get started.
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, ArrowRight, X } from 'lucide-react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target?: string;
  action?: () => void;
}

export function Onboarding() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem('onboarding_completed');
    if (!completed) {
      setIsOpen(true);
    } else {
      setHasCompleted(true);
    }
  }, []);

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to OCEAN! 🌊',
      description: "Let's get you started with AI-powered development. OCEAN helps you build features 10x faster with intelligent AI agents.",
      action: () => setCurrentStep(1)
    },
    {
      id: 'create-project',
      title: 'Create Your First Project',
      description: 'Start by creating a new project. Our AI agents will help you design the architecture and build features.',
      target: '#create-project-button',
      action: () => setCurrentStep(2)
    },
    {
      id: 'meet-agents',
      title: 'Meet Your AI Agents 🤖',
      description: 'You have 4 specialized agents: Architect (system design), Developer (coding), QA (testing), and DevOps (deployment).',
      target: '#agents-panel',
      action: () => setCurrentStep(3)
    },
    {
      id: 'kanban-board',
      title: 'Collaborative Kanban Board',
      description: 'Manage features with drag-and-drop. See live presence indicators showing who\'s working on what.',
      target: '#kanban-board',
      action: () => setCurrentStep(4)
    },
    {
      id: 'patterns',
      title: 'Pattern Marketplace 📚',
      description: 'Browse and install proven development patterns. Share your own patterns with the community.',
      target: '#patterns-link',
      action: () => setCurrentStep(5)
    },
    {
      id: 'achievements',
      title: 'Unlock Achievements 🏆',
      description: 'Complete challenges to unlock advanced features and MCPs. Track your progress and level up!',
      target: '#achievements-link',
      action: () => setCurrentStep(6)
    },
    {
      id: 'complete',
      title: "You're All Set! 🚀",
      description: "You're ready to build something amazing. Remember: describe what you want, and AI agents will build it for you.",
      action: () => completeOnboarding()
    }
  ];

  const completeOnboarding = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setHasCompleted(true);
    setIsOpen(false);
  };

  const skipOnboarding = () => {
    completeOnboarding();
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeOnboarding();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;
  const step = steps[currentStep];

  if (hasCompleted) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">{step.title}</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={skipOnboarding}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress */}
          <div>
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>Step {currentStep + 1} of {steps.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>

          {/* Content */}
          <div className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              {step.description}
            </p>

            {currentStep === steps.length - 1 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium text-green-900">Quick Tips</div>
                    <ul className="text-sm text-green-700 mt-2 space-y-1">
                      <li>• Start with a clear feature description</li>
                      <li>• Let AI agents handle the implementation</li>
                      <li>• Review and iterate on the results</li>
                      <li>• Share successful patterns with your team</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              Previous
            </Button>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={skipOnboarding}
              >
                Skip Tour
              </Button>
              <Button onClick={nextStep}>
                {currentStep === steps.length - 1 ? (
                  <>
                    Get Started
                    <CheckCircle className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default Onboarding;
