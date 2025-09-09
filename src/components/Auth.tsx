import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Mail, Lock, ArrowRight, AlertCircle, RefreshCw, Info } from 'lucide-react';

const Auth: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Check for error parameters in URL
  useEffect(() => {
    const errorCode = searchParams.get('error_code');
    const errorDescription = searchParams.get('error_description');

    if (errorCode === 'otp_expired') {
      setError('The confirmation link has expired. Please request a new one.');
      setIsSignUp(true);
    } else if (errorDescription) {
      setError(errorDescription);
    }
  }, [searchParams]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
          },
        });
        
        if (error) throw error;
        
        setMessage('Registration successful! Check your email for the confirmation link.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
      }
    } catch (err: any) {
      // Enhanced error handling for invalid credentials
      if (err.message?.includes('Invalid login credentials') || err.code === 'invalid_credentials') {
        setError('The email or password you entered is incorrect. Please check your credentials and try again.');
      } else {
        setError(err.message || 'An error occurred during authentication');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (error) throw error;
      setMessage('A new confirmation link has been sent to your email.');
    } catch (err: any) {
      setError(err.message || 'Failed to resend confirmation email');
    } finally {
      setLoading(false);
    }
  };

  const isInvalidCredentialsError = error?.includes('email or password you entered is incorrect');

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-2">NPS Survey</h1>
          <p className="text-gray-600">
            {isSignUp ? 'Create your account to get started' : 'Sign in to your account'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 text-red-800 px-4 py-3 rounded-xl mb-6">
              <div className="flex items-center mb-2">
                <AlertCircle size={20} className="mr-2 flex-shrink-0" />
                <p className="text-sm font-medium">{error}</p>
              </div>
              {error.includes('confirmation link has expired') && (
                <button
                  onClick={handleResendConfirmation}
                  className="flex items-center text-sm text-red-700 hover:text-red-800 mt-2"
                >
                  <RefreshCw size={16} className="mr-1" />
                  Resend confirmation email
                </button>
              )}
              {isInvalidCredentialsError && !isSignUp && (
                <div className="mt-3 pt-3 border-t border-red-200">
                  <div className="flex items-start">
                    <Info size={16} className="mr-2 flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium mb-1">Need help?</p>
                      <p className="mb-2">• Double-check your email and password for typos</p>
                      <p className="mb-2">• Make sure your account is confirmed (check your email)</p>
                      <button
                        type="button"
                        onClick={() => setIsSignUp(true)}
                        className="text-red-700 hover:text-red-800 underline"
                      >
                        Don't have an account? Sign up here
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Success Message */}
          {message && (
            <div className="bg-green-50 text-green-800 px-4 py-3 rounded-xl mb-6">
              <p className="text-sm">{message}</p>
            </div>
          )}

          <form onSubmit={handleAuth}>
            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={20} className="text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 input-field"
                />
              </div>
            </div>

            <div className="mb-8">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock size={20} className="text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder={isSignUp ? "Create a password" : "Enter your password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="pl-10 input-field"
                />
              </div>
              {!isSignUp && (
                <div className="mt-2 text-right">
                  <button type="button" className="text-sm text-indigo-600 hover:text-indigo-800">
                    Forgot password?
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary justify-center py-3"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Processing...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  {isSignUp ? 'Create Account' : 'Sign In'}
                  <ArrowRight size={18} className="ml-2" />
                </span>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              <button
                type="button"
                onClick={() => setIsSignUp(!isSignUp)}
                className="ml-1 font-medium text-indigo-600 hover:text-indigo-800"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;