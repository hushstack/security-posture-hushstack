'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Step {
  id: number;
  title: string;
  description: string;
  target: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const steps: Step[] = [
  {
    id: 1,
    title: 'Welcome! 👋',
    description: 'This tool analyzes domain security with passive reconnaissance. No intrusive scanning - 100% legal!',
    target: 'logo',
    position: 'bottom',
  },
  {
    id: 2,
    title: 'Choose Scan Mode',
    description: 'Pick Security, Performance, or Pentest scan.',
    target: 'scan-modes',
    position: 'bottom',
  },
  {
    id: 3,
    title: 'Enter Domain',
    description: 'Type any domain (e.g., example.com) and click Scan.',
    target: 'search-form',
    position: 'bottom',
  },
  {
    id: 4,
    title: 'View Results',
    description: 'See your security grade, score, and detailed findings.',
    target: 'features',
    position: 'top',
  },
];

export function OnboardingGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const seen = localStorage.getItem('security-posture-guide-seen');
    if (!seen) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem('security-posture-guide-seen', 'true');
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleClose();
  };

  const currentStepData = steps[currentStep];

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Dark backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-40"
            onClick={handleClose}
          />

          {/* Spotlight highlight with tooltip at element location */}
          <SpotlightTooltip
            step={currentStepData}
            currentStep={currentStep}
            totalSteps={steps.length}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSkip={handleSkip}
            onClose={handleClose}
          />
        </>
      )}
    </AnimatePresence>
  );
}

interface SpotlightTooltipProps {
  step: Step;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onClose: () => void;
}

function SpotlightTooltip({
  step,
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onSkip,
  onClose,
}: SpotlightTooltipProps) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const findTarget = () => {
      const element = document.querySelector(`[data-guide="${step.target}"]`);
      if (element) {
        setRect(element.getBoundingClientRect());
      }
    };

    findTarget();
    window.addEventListener('resize', findTarget);
    return () => window.removeEventListener('resize', findTarget);
  }, [step.target]);

  if (!rect) return null;

  const padding = 12;
  const tooltipGap = 16;

  // Calculate tooltip position
  let tooltipStyle: React.CSSProperties = {};
  let arrowStyle: React.CSSProperties = {};

  switch (step.position) {
    case 'bottom':
      tooltipStyle = {
        left: rect.left + rect.width / 2,
        top: rect.bottom + tooltipGap,
        transform: 'translateX(-50%)',
      };
      arrowStyle = {
        left: '50%',
        top: -8,
        transform: 'translateX(-50%) rotate(45deg)',
      };
      break;
    case 'top':
      tooltipStyle = {
        left: rect.left + rect.width / 2,
        top: rect.top - tooltipGap,
        transform: 'translateX(-50%) translateY(-100%)',
      };
      arrowStyle = {
        left: '50%',
        bottom: -8,
        transform: 'translateX(-50%) rotate(45deg)',
      };
      break;
    case 'left':
      tooltipStyle = {
        left: rect.left - tooltipGap,
        top: rect.top + rect.height / 2,
        transform: 'translateX(-100%) translateY(-50%)',
      };
      arrowStyle = {
        right: -8,
        top: '50%',
        transform: 'translateY(-50%) rotate(45deg)',
      };
      break;
    case 'right':
      tooltipStyle = {
        left: rect.right + tooltipGap,
        top: rect.top + rect.height / 2,
        transform: 'translateY(-50%)',
      };
      arrowStyle = {
        left: -8,
        top: '50%',
        transform: 'translateY(-50%) rotate(45deg)',
      };
      break;
  }

  return (
    <>
      {/* Cutout overlay with spotlight effect */}
      <svg className="fixed inset-0 z-50 pointer-events-none" style={{ width: '100%', height: '100%' }}>
        <defs>
          <mask id="spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={rect.left - padding}
              y={rect.top - padding}
              width={rect.width + padding * 2}
              height={rect.height + padding * 2}
              rx="16"
              fill="black"
            />
          </mask>
        </defs>
      </svg>

      {/* Highlight border around target */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed z-50 pointer-events-none"
        style={{
          left: rect.left - padding,
          top: rect.top - padding,
          width: rect.width + padding * 2,
          height: rect.height + padding * 2,
        }}
      >
        <div className="absolute inset-0 rounded-2xl border-2 border-emerald-400 shadow-lg shadow-emerald-500/30">
          <div className="absolute inset-0 rounded-2xl bg-emerald-500/10 animate-pulse" />
        </div>
        {/* Corner accents */}
        <div className="absolute -top-1.5 -left-1.5 w-5 h-5 border-t-3 border-l-3 border-emerald-400 rounded-tl-lg" />
        <div className="absolute -top-1.5 -right-1.5 w-5 h-5 border-t-3 border-r-3 border-emerald-400 rounded-tr-lg" />
        <div className="absolute -bottom-1.5 -left-1.5 w-5 h-5 border-b-3 border-l-3 border-emerald-400 rounded-bl-lg" />
        <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 border-b-3 border-r-3 border-emerald-400 rounded-br-lg" />
      </motion.div>

      {/* Tooltip at element position */}
      <motion.div
        key={currentStep}
        initial={{ opacity: 0, scale: 0.9, y: step.position === 'bottom' ? -10 : step.position === 'top' ? 10 : 0 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className="fixed z-50 w-80"
        style={tooltipStyle}
      >
        <div className="relative bg-zinc-900 border border-zinc-700 rounded-xl p-4 shadow-2xl">
          {/* Arrow */}
          <div
            className="absolute w-4 h-4 bg-zinc-900 border-zinc-700"
            style={{
              ...arrowStyle,
              borderTop: step.position === 'bottom' ? '1px solid rgb(63, 63, 70)' : undefined,
              borderLeft: step.position === 'bottom' || step.position === 'right' ? '1px solid rgb(63, 63, 70)' : undefined,
              borderBottom: step.position === 'top' ? '1px solid rgb(63, 63, 70)' : undefined,
              borderRight: step.position === 'left' ? '1px solid rgb(63, 63, 70)' : undefined,
            }}
          />

          {/* Progress dots */}
          <div className="flex gap-1.5 mb-3">
            {Array.from({ length: totalSteps }).map((_, index) => (
              <div
                key={index}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  index === currentStep
                    ? 'w-6 bg-emerald-500'
                    : index < currentStep
                    ? 'w-1.5 bg-emerald-500/50'
                    : 'w-1.5 bg-zinc-700'
                }`}
              />
            ))}
          </div>

          {/* Step number badge */}
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 text-sm font-bold">
              {step.id}
            </span>
            <h3 className="font-bold text-zinc-100">{step.title}</h3>
          </div>

          {/* Description */}
          <p className="text-sm text-zinc-400 leading-relaxed mb-4">
            {step.description}
          </p>

          {/* Buttons */}
          <div className="flex gap-2">
            {currentStep > 0 ? (
              <button
                onClick={onPrevious}
                className="px-3 py-2 rounded-lg border border-zinc-700 text-zinc-400 text-sm hover:text-zinc-200 hover:border-zinc-600 transition-all cursor-pointer"
              >
                Back
              </button>
            ) : (
              <button
                onClick={onSkip}
                className="px-3 py-2 rounded-lg border border-zinc-700 text-zinc-400 text-sm hover:text-zinc-200 hover:border-zinc-600 transition-all cursor-pointer"
              >
                Skip
              </button>
            )}
            <button
              onClick={onNext}
              className="flex-1 px-3 py-2 rounded-lg bg-emerald-500 text-zinc-950 text-sm font-semibold hover:bg-emerald-400 transition-all cursor-pointer"
            >
              {currentStep === totalSteps - 1 ? 'Finish' : 'Next'}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
}
