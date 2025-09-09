import React, { useEffect, useState } from 'react';
import { AlertCircle, Check, Info, X } from 'lucide-react';

interface ToastProps {
  type: 'success' | 'error' | 'info';
  message: string;
}

const Toast: React.FC<ToastProps> = ({ type, message }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);
  
  useEffect(() => {
    // Start the progress bar animation
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 30); // 3000ms / 100 = 30ms per 1% reduction
    
    return () => clearInterval(timer);
  }, []);
  
  useEffect(() => {
    if (progress === 0) {
      // Fade out animation before removing
      setTimeout(() => setIsVisible(false), 300);
    }
  }, [progress]);

  // Early return if not visible
  if (!isVisible) return null;

  // Toast styling based on type
  const styles = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: <Check className="text-green-500" size={20} />,
      progress: 'bg-green-500'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: <AlertCircle className="text-red-500" size={20} />,
      progress: 'bg-red-500'
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: <Info className="text-blue-500" size={20} />,
      progress: 'bg-blue-500'
    }
  };

  const { bg, border, text, icon, progress: progressColor } = styles[type];

  return (
    <div className="fixed top-6 right-6 z-50 animate-slideDown max-w-sm w-full">
      <div className={`${bg} ${border} ${text} border rounded-xl shadow-lg p-4 pr-10 relative overflow-hidden`}>
        <div className="flex items-start gap-3">
          {icon}
          <p className="text-sm font-medium">{message}</p>
        </div>
        
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={16} />
        </button>
        
        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 h-1 bg-gray-100 w-full">
          <div 
            className={`h-full ${progressColor} transition-all duration-300 ease-linear`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default Toast;