import { createContext, useContext, useState, useEffect } from 'react';
import OnboardingTour from '../components/OnboardingTour';
import { useAuth } from './AuthContext';

interface TourContextType {
  openTour: () => void;
  closeTour: () => void;
  isTourOpen: boolean;
}

const TourContext = createContext<TourContextType | undefined>(undefined);

export function TourProvider({ children }: { children: React.ReactNode }) {
  const [isTourOpen, setIsTourOpen] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) {
      const isCompleted = localStorage.getItem('priorify_tour_completed');
      if (!isCompleted) {
        setIsTourOpen(true);
      }
    }
  }, [user, loading]);

  const openTour = () => setIsTourOpen(true);
  
  const closeTour = () => {
    setIsTourOpen(false);
    localStorage.setItem('priorify_tour_completed', 'true');
  };

  return (
    <TourContext.Provider value={{ openTour, closeTour, isTourOpen }}>
      {children}
      {isTourOpen && <OnboardingTour />}
    </TourContext.Provider>
  );
}

export function useTour() {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
}
