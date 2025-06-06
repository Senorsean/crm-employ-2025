import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './components/AuthProvider';
import { useAuthContext } from './components/AuthProvider';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import RendezVous from './pages/RendezVous';
import Beneficiaires from './pages/Beneficiaires';
import DetailBeneficiaire from './pages/BeneficiaireDetail';
import Offres from './pages/Offres';
import OffreDetail from './pages/OffreDetail';
import Agences from './pages/Agences';
import Entreprises from './pages/Entreprises';
import Documents from './pages/Documents';
import NewsletterManager from './pages/NewsletterManager';
import UserManagement from './components/UserManagement';
import Monitoring from './pages/Monitoring';
import { LinkedInCallback } from './components/linkedin/LinkedInCallback';
import Evenements from './pages/Evenements';
import MfaSetup from './components/MfaSetup';
import { useThemeStore } from './stores/themeStore';

function RequireAuth({ children }: { children: JSX.Element }) {
  const { user, loading } = useAuthContext();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-anthea-blue"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export default function App() {
  const { darkMode } = useThemeStore();
  
  useEffect(() => {
    // Apply dark mode class to html element
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/linkedin/callback" element={<LinkedInCallback />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="rendez-vous" element={<RendezVous />} />
          <Route path="beneficiaires" element={<Beneficiaires />} />
          <Route path="beneficiaires/:id" element={<DetailBeneficiaire />} />
          <Route path="offres" element={<Offres />} />
          <Route path="offres/:id" element={<OffreDetail />} />
          <Route path="evenements" element={<Evenements />} />
          <Route path="agences" element={<Agences />} />
          <Route path="entreprises" element={<Entreprises />} />
          <Route path="documents" element={<Documents />} />
          <Route path="newsletter" element={<NewsletterManager />} />
          <Route path="utilisateurs" element={<UserManagement />} />
          <Route path="monitoring" element={<Monitoring />} />
          <Route path="securite" element={<MfaSetup />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}