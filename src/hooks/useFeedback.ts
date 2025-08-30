import { useState } from 'react';

export function useFeedback() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const reset = () => {
    setError(null);
    setSuccess(null);
  };

  return {
    loading,
    setLoading,
    error,
    setError,
    success,
    setSuccess,
    reset,
  };
}
