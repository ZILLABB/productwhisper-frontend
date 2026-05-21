import { useState, useEffect, useCallback, useRef } from 'react';

const apiCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000;

interface UseApiOptions<T> {
  initialData?: T;
  cacheKey?: string;
  cacheDuration?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
  dependencies?: any[];
  skipInitialCall?: boolean;
}

function useApi<T>(
  apiCall: (...args: any[]) => Promise<T>,
  options: UseApiOptions<T> = {}
) {
  const {
    initialData,
    cacheKey,
    cacheDuration = CACHE_DURATION,
    dependencies = [],
    skipInitialCall = false
  } = options;

  const [data, setData] = useState<T | undefined>(initialData);
  const [loading, setLoading] = useState(!skipInitialCall);
  const [error, setError] = useState<Error | null>(null);
  const isMounted = useRef(true);
  const apiCallRef = useRef(apiCall);
  const onSuccessRef = useRef(options.onSuccess);
  const onErrorRef = useRef(options.onError);

  apiCallRef.current = apiCall;
  onSuccessRef.current = options.onSuccess;
  onErrorRef.current = options.onError;

  const fetchData = useCallback(
    async (...args: any[]) => {
      setLoading(true);
      setError(null);

      try {
        if (cacheKey) {
          const cachedData = apiCache.get(cacheKey);
          const now = Date.now();

          if (cachedData && now - cachedData.timestamp < cacheDuration) {
            setData(cachedData.data);
            setLoading(false);
            onSuccessRef.current?.(cachedData.data);
            return cachedData.data;
          }
        }

        const result = await apiCallRef.current(...args);

        if (isMounted.current) {
          setData(result);
          setLoading(false);

          if (cacheKey) {
            apiCache.set(cacheKey, { data: result, timestamp: Date.now() });
          }

          onSuccessRef.current?.(result);
        }

        return result;
      } catch (err) {
        if (isMounted.current) {
          const error = err instanceof Error ? err : new Error(String(err));
          setError(error);
          setLoading(false);
          onErrorRef.current?.(error);
        }
        throw err;
      }
    },
    [cacheKey, cacheDuration]
  );

  useEffect(() => {
    isMounted.current = true;
    if (!skipInitialCall) {
      fetchData();
    }

    return () => {
      isMounted.current = false;
    };
  }, [fetchData, skipInitialCall, ...dependencies]);

  const clearCache = useCallback((key?: string) => {
    if (key) {
      apiCache.delete(key);
    } else if (cacheKey) {
      apiCache.delete(cacheKey);
    }
  }, [cacheKey]);

  return { data, loading, error, refetch: fetchData, clearCache };
}

export default useApi;
