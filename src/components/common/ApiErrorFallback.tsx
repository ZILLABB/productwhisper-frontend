import React from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';

interface ApiErrorFallbackProps {
  error?: Error | string;
  resetErrorBoundary?: () => void;
  message?: string;
  retry?: () => void;
}

const ApiErrorFallback: React.FC<ApiErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
  message = 'We encountered an error while fetching data.',
  retry
}) => {
  const handleRetry = () => {
    if (retry) {
      retry();
    } else if (resetErrorBoundary) {
      resetErrorBoundary();
    }
  };

  return (
    <Alert variant="destructive" className="text-center">
      <AlertTriangle className="h-5 w-5" />
      <AlertTitle className="text-lg font-semibold">Data Loading Error</AlertTitle>
      <AlertDescription>
        <p className="mb-4">{message}</p>

        {error && import.meta.env.DEV && (
          <div className="mb-4 p-3 bg-red-100/50 rounded-lg text-left">
            <p className="text-red-700 text-sm font-mono break-all">
              {typeof error === 'string' ? error : error.message}
            </p>
          </div>
        )}

        {(retry || resetErrorBoundary) && (
          <button
            onClick={handleRetry}
            className="inline-flex items-center px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800 transition-colors"
          >
            <RotateCw className="h-4 w-4 mr-2" />
            Try Again
          </button>
        )}
      </AlertDescription>
    </Alert>
  );
};

export default ApiErrorFallback;
