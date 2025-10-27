import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { BarChart3, Settings } from 'lucide-react';
import { User } from '@supabase/supabase-js';
import { supabase } from './lib/supabase';
import NPSEditor from './components/NPSEditor';
import Analytics from './components/Analytics';
import Dashboard from './components/Dashboard';
import SurveyPage from './components/SurveyPage';
import DemoWebsite from './components/DemoWebsite';
import Toast from './components/Toast';
import Auth from './components/Auth';

interface SurveySettings {
  [key: string]: unknown;
}

interface Survey {
  id: string;
  name: string;
  created_at: string;
  status: 'draft' | 'published';
  settings?: SurveySettings;
  responses?: number;
  score?: number;
}

interface ToastMessage {
  type: 'success' | 'error' | 'info';
  message: string;
}

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<'dashboard' | 'editor' | 'analytics'>('dashboard');
  const [currentSurvey, setCurrentSurvey] = useState<Survey | null>(null);
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load surveys from Supabase when user logs in
  useEffect(() => {
    const loadSurveys = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('surveys')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          showToast('error', 'Failed to load surveys');
          return;
        }

        setSurveys(data || []);
      }
    };

    loadSurveys();
  }, [user]);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => {
    setToast({ type, message });
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  const handleCreateSurvey = async (name: string) => {
    if (!user) return;
    
    const newSurvey = {
      user_id: user.id,
      name,
      status: 'draft',
      created_at: new Date().toISOString(),
      responses: 0,
      score: 0
    };

    const { data, error } = await supabase
      .from('surveys')
      .insert(newSurvey)
      .select()
      .single();

    if (error) {
      showToast('error', 'Failed to create survey');
      return;
    }

    setCurrentSurvey(data);
    setSurveys(prev => [data, ...prev]);
    setActiveSection('editor');
  };

  const handleSaveDraft = async (settings: SurveySettings) => {
    if (!currentSurvey) return;

    const { data, error } = await supabase
      .from('surveys')
      .update({ 
        settings,
        status: 'draft'
      })
      .eq('id', currentSurvey.id)
      .select()
      .single();

    if (error) {
      showToast('error', 'Failed to save draft');
      return;
    }

    const updatedSurvey = { ...data, settings, status: 'draft' as const };
    setSurveys(prev => prev.map(s => s.id === currentSurvey.id ? updatedSurvey : s));
    setCurrentSurvey(updatedSurvey);
    showToast('success', 'Survey draft saved successfully!');
    setActiveSection('dashboard');
  };

  const handlePublish = async (settings: SurveySettings) => {
    if (!currentSurvey) return;

    const { data, error } = await supabase
      .from('surveys')
      .update({ 
        settings,
        status: 'published'
      })
      .eq('id', currentSurvey.id)
      .select()
      .single();

    if (error) {
      showToast('error', 'Failed to publish survey');
      return;
    }

    const updatedSurvey = { ...data, settings, status: 'published' as const };
    setSurveys(prev => prev.map(s => s.id === currentSurvey.id ? updatedSurvey : s));
    showToast('success', 'Survey published successfully!');
    setCurrentSurvey(null);
    setActiveSection('dashboard');
  };

  const handleDeleteSurvey = async (surveyId: string) => {
    const { error } = await supabase
      .from('surveys')
      .delete()
      .eq('id', surveyId);

    if (error) {
      showToast('error', 'Failed to delete survey');
      return;
    }

    setSurveys(prev => prev.filter(s => s.id !== surveyId));
    showToast('info', 'Survey deleted successfully');
    
    if (currentSurvey && currentSurvey.id === surveyId) {
      setCurrentSurvey(null);
      setActiveSection('dashboard');
    }
  };


  const handleViewResults = (surveyId: string) => {
    const survey = surveys.find(s => s.id === surveyId);
    if (survey) {
      setCurrentSurvey(survey);
      setActiveSection('analytics');
    }
  };

  const handleBackToDashboard = () => {
    setCurrentSurvey(null);
    setActiveSection('dashboard');
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4F46E5]"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/auth" element={!user ? <Auth /> : <Navigate to="/" replace />} />
      <Route path="/s/:surveyId" element={<SurveyPage />} />
      <Route path="/demo" element={<DemoWebsite surveys={surveys} />} />
      <Route path="/" element={
        user ? (
          <div className="flex h-screen bg-gray-50 relative">
            {/* Toast Notification */}
            {toast && <Toast type={toast.type} message={toast.message} />}
            
            {/* Sidebar - Only show when not in editor */}
            {activeSection !== 'editor' && (
              <div className="w-64 bg-white border-r">
                <div className="p-6">
                  <h1 className="text-xl font-semibold text-gray-900">NPS Survey</h1>
                  <div className="mt-4">
                    <button
                      onClick={handleSignOut}
                      className="text-sm text-gray-600 hover:text-gray-900"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
                <nav className="px-4">
                  <button
                    onClick={() => setActiveSection('dashboard')}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                      activeSection === 'dashboard'
                        ? 'bg-[#F5F3FF] text-[#4F46E5]'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Settings size={18} />
                    Dashboard
                  </button>
                  <button
                    onClick={() => setActiveSection('analytics')}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
                      activeSection === 'analytics'
                        ? 'bg-[#F5F3FF] text-[#4F46E5]'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <BarChart3 size={18} />
                    Analytics
                  </button>
                </nav>
              </div>
            )}

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
              {activeSection === 'dashboard' && (
                <Dashboard 
                  surveys={surveys} 
                  onCreateNew={handleCreateSurvey}
                  onEdit={(survey) => {
                    setCurrentSurvey(survey);
                    setActiveSection('editor');
                  }}
                  onViewResults={handleViewResults}
                  onDeleteSurvey={handleDeleteSurvey}
                />
              )}
              {activeSection === 'editor' && (
                <NPSEditor
                  survey={currentSurvey}
                  onSaveDraft={handleSaveDraft}
                  onPublish={handlePublish}
                  onBackToDashboard={handleBackToDashboard}
                />
              )}
              {activeSection === 'analytics' && <Analytics survey={currentSurvey} />}
            </div>

          </div>
        ) : (
          <Navigate to="/auth" replace />
        )} />
    </Routes>
  );
}

export default App;