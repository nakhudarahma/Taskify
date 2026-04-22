import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import PersonalitySelection from '@/components/PersonalitySelection';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading, profile, refreshProfile } = useAuth();
  const location = useLocation();
  const [personalityJustSelected, setPersonalityJustSelected] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 mx-auto border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Force personality selection if not chosen yet (check backend profile OR local storage flag)
  const personality = profile?.ai_personality || localStorage.getItem('has_personality');
  if (profile && !personality && !personalityJustSelected) {
    return (
      <PersonalitySelection
        onSelected={() => {
          setPersonalityJustSelected(true);
          refreshProfile();
        }}
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
