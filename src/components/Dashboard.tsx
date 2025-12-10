import React, { useState } from 'react';
import { Copy, ExternalLink, Pencil, BarChart, Trash2, Plus, Key, Code, Eye, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Survey {
  id: string;
  name: string;
  created_at: string;
  status: 'draft' | 'published';
  settings?: any;
  responses?: number;
  score?: number;
}

interface DashboardProps {
  surveys: Survey[];
  onCreateNew: (name: string) => void;
  onEdit: (survey: Survey) => void;
  onViewResults: (surveyId: string) => void;
  onDeleteSurvey: (surveyId: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({
  surveys,
  onCreateNew,
  onEdit,
  onViewResults,
  onDeleteSurvey,
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSurveyName, setNewSurveyName] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKeyCopied, setApiKeyCopied] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [loadingApiKey, setLoadingApiKey] = useState(true);

  React.useEffect(() => {
    loadApiKey();
  }, []);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSurveyName.trim()) {
      onCreateNew(newSurveyName.trim());
      setNewSurveyName('');
      setShowCreateModal(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }).format(date);
    } catch (error) {
      return 'N/A';
    }
  };

  const confirmDelete = (surveyId: string) => {
    setShowDeleteConfirm(surveyId);
  };

  const handleDeleteConfirm = (surveyId: string) => {
    onDeleteSurvey(surveyId);
    setShowDeleteConfirm(null);
  };

  const loadApiKey = async () => {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const { data, error } = await supabase.rpc('get_or_create_api_key', {
        p_user_id: user.user.id
      });

      if (error) throw error;

      setApiKey(data);
      return data;
    } catch (error) {
      console.error('Error loading API key:', error);
      return 'Error loading API key';
    } finally {
      setLoadingApiKey(false);
    }
  };

  const handleCopyApiKey = async () => {
    const key = await loadApiKey();
    if (key && !key.includes('Error')) {
      navigator.clipboard.writeText(key);
      setApiKeyCopied(true);
      setTimeout(() => setApiKeyCopied(false), 2000);
    }
  };

  const handleShowApiKey = () => {
    setShowApiKey(!showApiKey);
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1>Survey Dashboard</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary"
        >
          <Plus size={18} />
          Create New Survey
        </button>
      </div>

      {/* API Key Section */}
      <div className="card mb-8 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-100 rounded-xl">
              <Key size={24} className="text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-indigo-900">API Key for Widget Integration</h3>
              <p className="text-indigo-700 text-sm">Use this key to integrate NPS widgets on your website</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleShowApiKey}
              className="btn-secondary"
            >
              <Eye size={18} />
              {showApiKey ? 'Hide' : 'Show'} API Key
            </button>
            <button
              onClick={handleCopyApiKey}
              className="btn-primary"
            >
              {apiKeyCopied ? (
                <Check size={18} />
              ) : (
                <Copy size={18} />
              )}
              {apiKeyCopied ? 'Copied!' : 'Copy API Key'}
            </button>
          </div>
        </div>
        
        {showApiKey && (
          <div className="mt-6 p-4 bg-white rounded-xl">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Your API Key:</label>
              <div className="bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-sm">
                {apiKey || 'Loading...'}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Integration Example:</label>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                <pre>{`<!-- NPS Widget SDK -->
<script src="https://melodic-melba-d65cd6.netlify.app/sdk/nps-widget-sdk.js"></script>
<script>
  new NPSWidget({
    apiKey: '${apiKey || 'your_api_key_here'}',
    position: 'bottom-right',
    primaryColor: '#4F46E5',
    delay: 5000,
    onResponse: function(data) {
      console.log('NPS Response:', data);
    }
  });
</script>`}</pre>
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              <p className="mb-2"><strong>Features:</strong></p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Automatic CORS and CSP handling</li>
                <li>7 different widget positions</li>
                <li>URL targeting and SPA support</li>
                <li>Customizable colors and timing</li>
                <li>Response callbacks for analytics</li>
              </ul>
            </div>
          </div>
        )}
      </div>
      {surveys.length === 0 ? (
        <div className="card text-center py-16">
          <h2 className="text-gray-500 mb-4">No surveys yet</h2>
          <p className="text-gray-400 mb-8">Create your first NPS survey to get started</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary mx-auto"
          >
            <Plus size={18} />
            Create Survey
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {surveys.map((survey) => (
            <div key={survey.id} className="card fade-in">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{survey.name}</h2>
                  <p className="text-sm text-gray-500 mt-1">Created on {formatDate(survey.created_at)}</p>
                </div>
                <div className={`px-2 py-1 rounded-lg text-xs font-medium ${
                  survey.status === 'published' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {survey.status === 'published' ? 'Published' : 'Draft'}
                </div>
              </div>

              {survey.status === 'published' && (
                <div className="flex gap-6 mb-6">
                  <div className="stats-card flex-1">
                    <div className="stats-icon">
                      <BarChart size={18} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">NPS Score</p>
                      <p className="text-xl font-bold text-gray-900">{survey.score || 0}</p>
                    </div>
                  </div>
                  <div className="stats-card flex-1">
                    <div className="stats-icon">
                      <ExternalLink size={18} />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Responses</p>
                      <p className="text-xl font-bold text-gray-900">{survey.responses || 0}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 mt-4">
                <button
                  onClick={() => onEdit(survey)}
                  className="btn-primary flex-1"
                >
                  <Pencil size={16} />
                  Edit
                </button>
                {survey.status === 'published' && (
                  <>
                    <button
                      onClick={() => onViewResults(survey.id)}
                      className="btn-secondary flex-1"
                    >
                      <BarChart size={16} />
                      Results
                    </button>
                  </>
                )}
                <button
                  onClick={() => confirmDelete(survey.id)}
                  className="p-2 text-gray-500 hover:text-red-500 transition-colors rounded-lg hover:bg-red-50"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {showDeleteConfirm === survey.id && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-700 mb-2">Are you sure you want to delete this survey?</p>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setShowDeleteConfirm(null)}
                      className="px-3 py-1 text-xs text-gray-700 bg-gray-200 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleDeleteConfirm(survey.id)}
                      className="px-3 py-1 text-xs text-white bg-red-600 rounded-lg"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create New Survey Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md scale-in">
            <h2 className="text-2xl font-semibold mb-6">Create New Survey</h2>
            <form onSubmit={handleCreateSubmit}>
              <div className="mb-6">
                <label htmlFor="surveyName" className="block text-sm font-medium text-gray-700 mb-2">
                  Survey Name
                </label>
                <input
                  id="surveyName"
                  type="text"
                  value={newSurveyName}
                  onChange={(e) => setNewSurveyName(e.target.value)}
                  className="input-field"
                  placeholder="E.g., Website Feedback, Product Experience"
                  autoFocus
                  required
                />
              </div>
              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={!newSurveyName.trim()}
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;