import React, { useState, useRef } from 'react';
import { Copy, X, Check, Mail, Upload, Plus, Trash2, Download } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface SurveyLinkModalProps {
  surveyLink: string;
  surveyName: string;
  onClose: () => void;
}

interface EmailRecipient {
  id: string;
  name: string;
  email: string;
}

const SurveyLinkModal: React.FC<SurveyLinkModalProps> = ({ surveyLink, surveyName, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'link' | 'single' | 'bulk' | 'csv'>('link');
  const [singleEmail, setSingleEmail] = useState('');
  const [recipients, setRecipients] = useState<EmailRecipient[]>([
    { id: '1', name: '', email: '' }
  ]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvRecipients, setCsvRecipients] = useState<EmailRecipient[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(surveyLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addRecipient = () => {
    const newRecipient: EmailRecipient = {
      id: Date.now().toString(),
      name: '',
      email: ''
    };
    setRecipients([...recipients, newRecipient]);
  };

  const removeRecipient = (id: string) => {
    if (recipients.length > 1) {
      setRecipients(recipients.filter(r => r.id !== id));
    }
  };

  const updateRecipient = (id: string, field: 'name' | 'email', value: string) => {
    setRecipients(recipients.map(r => 
      r.id === id ? { ...r, [field]: value } : r
    ));
  };

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      
      // Skip header row if it exists
      const dataLines = lines.slice(1);
      
      const parsedRecipients: EmailRecipient[] = dataLines.map((line, index) => {
        const [name, email] = line.split(',').map(item => item.trim().replace(/"/g, ''));
        return {
          id: `csv-${index}`,
          name: name || '',
          email: email || ''
        };
      }).filter(r => r.email); // Only include rows with email addresses

      setCsvRecipients(parsedRecipients);
      setError(null);
    };

    reader.onerror = () => {
      setError('Failed to read CSV file');
    };

    reader.readAsText(file);
  };

  const downloadCsvTemplate = () => {
    const csvContent = 'Name,Email\nJohn Doe,john@example.com\nJane Smith,jane@example.com';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'survey-recipients-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleSendEmails = async (emailList: EmailRecipient[]) => {
    if (emailList.length === 0) {
      setError('Please add at least one recipient');
      return;
    }

    const validEmails = emailList.filter(r => r.email.trim());
    if (validEmails.length === 0) {
      setError('Please enter valid email addresses');
      return;
    }

    setSending(true);
    setError(null);
    setSuccess(null);

    try {
      const surveyId = surveyLink.split('/').pop();
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-bulk-survey`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          surveyId,
          recipients: validEmails,
          surveyName
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send emails');
      }

      setSuccess(`Survey invitations sent successfully to ${validEmails.length} recipients!`);
      
      // Reset forms
      if (activeTab === 'single') {
        setSingleEmail('');
      } else if (activeTab === 'bulk') {
        setRecipients([{ id: '1', name: '', email: '' }]);
      } else if (activeTab === 'csv') {
        setCsvFile(null);
        setCsvRecipients([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (err) {
      setError('Failed to send emails. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleSingleEmail = () => {
    if (!singleEmail.trim()) {
      setError('Please enter an email address');
      return;
    }
    
    const emailList = [{ id: '1', name: '', email: singleEmail.trim() }];
    handleSendEmails(emailList);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto scale-in relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={20} />
        </button>

        <div className="text-center mb-8">
          <div className="bg-green-100 text-green-800 rounded-full px-4 py-1.5 text-sm font-medium inline-flex items-center mb-4">
            <Check size={16} className="mr-1.5" />
            Survey Published
          </div>
          <h2 className="text-2xl font-semibold mb-2">Share your survey</h2>
          <p className="text-gray-600">Choose how you'd like to share your survey</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('link')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'link'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Direct Link
          </button>
          <button
            onClick={() => setActiveTab('single')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'single'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Single Email
          </button>
          <button
            onClick={() => setActiveTab('bulk')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'bulk'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Bulk Email
          </button>
          <button
            onClick={() => setActiveTab('csv')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'csv'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            CSV Import
          </button>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="bg-red-50 text-red-800 px-4 py-3 rounded-xl mb-6">
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        {success && (
          <div className="bg-green-50 text-green-800 px-4 py-3 rounded-xl mb-6">
            <p className="text-sm">{success}</p>
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'link' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Survey Link
            </label>
            <div className="flex">
              <input 
                type="text"
                value={surveyLink}
                readOnly
                className="input-field rounded-r-none flex-1"
              />
              <button
                onClick={handleCopy}
                className="px-4 bg-indigo-50 border border-l-0 border-gray-200 text-indigo-600 hover:bg-indigo-100 transition-colors rounded-r-xl flex items-center"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Copy this link and share it directly with your recipients
            </p>
          </div>
        )}

        {activeTab === 'single' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipient Email
            </label>
            <input
              type="email"
              value={singleEmail}
              onChange={(e) => setSingleEmail(e.target.value)}
              placeholder="Enter recipient's email"
              className="input-field mb-4"
            />
            <button
              onClick={handleSingleEmail}
              disabled={sending}
              className="btn-primary w-full justify-center"
            >
              {sending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Mail size={18} />
                  Send Survey
                </>
              )}
            </button>
          </div>
        )}

        {activeTab === 'bulk' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Recipients
              </label>
              <button
                onClick={addRecipient}
                className="btn-secondary text-sm"
              >
                <Plus size={16} />
                Add Recipient
              </button>
            </div>
            
            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
              {recipients.map((recipient, index) => (
                <div key={recipient.id} className="flex gap-3 items-center">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={recipient.name}
                      onChange={(e) => updateRecipient(recipient.id, 'name', e.target.value)}
                      placeholder="Name (optional)"
                      className="input-field mb-2"
                    />
                    <input
                      type="email"
                      value={recipient.email}
                      onChange={(e) => updateRecipient(recipient.id, 'email', e.target.value)}
                      placeholder="Email address"
                      className="input-field"
                      required
                    />
                  </div>
                  {recipients.length > 1 && (
                    <button
                      onClick={() => removeRecipient(recipient.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => handleSendEmails(recipients)}
              disabled={sending}
              className="btn-primary w-full justify-center"
            >
              {sending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Mail size={18} />
                  Send to All Recipients
                </>
              )}
            </button>
          </div>
        )}

        {activeTab === 'csv' && (
          <div>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Upload CSV File
                </label>
                <button
                  onClick={downloadCsvTemplate}
                  className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <Download size={16} />
                  Download Template
                </button>
              </div>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleCsvUpload}
                  className="hidden"
                  id="csv-upload"
                />
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600 mb-1">
                    Click to upload CSV file or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    CSV format: Name, Email (one recipient per row)
                  </p>
                </label>
              </div>
            </div>

            {csvFile && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>File:</strong> {csvFile.name}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Recipients found:</strong> {csvRecipients.length}
                </p>
              </div>
            )}

            {csvRecipients.length > 0 && (
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Preview Recipients</h4>
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left">Name</th>
                        <th className="px-3 py-2 text-left">Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvRecipients.slice(0, 10).map((recipient, index) => (
                        <tr key={index} className="border-t border-gray-100">
                          <td className="px-3 py-2">{recipient.name || '-'}</td>
                          <td className="px-3 py-2">{recipient.email}</td>
                        </tr>
                      ))}
                      {csvRecipients.length > 10 && (
                        <tr className="border-t border-gray-100">
                          <td colSpan={2} className="px-3 py-2 text-center text-gray-500">
                            ... and {csvRecipients.length - 10} more recipients
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <button
              onClick={() => handleSendEmails(csvRecipients)}
              disabled={sending || csvRecipients.length === 0}
              className="btn-primary w-full justify-center"
            >
              {sending ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Mail size={18} />
                  Send to {csvRecipients.length} Recipients
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SurveyLinkModal;