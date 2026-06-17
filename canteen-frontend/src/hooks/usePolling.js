import { useEffect, useRef } from 'react';

/**
 * Executes `callback` immediately on mount, then repeatedly every `intervalMs`.
 * Cleans up the interval on unmount or when dependencies change.
 *
 * @param {Function} callback - The function to call on each tick
 * @param {number} intervalMs - Polling interval in milliseconds
 */
function usePolling(callback, intervalMs) {
    const savedCallback = useRef(callback);

    // Keep the ref up to date without restarting the interval
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    useEffect(() => {
        savedCallback.current(); // immediate first call
        const id = setInterval(() => savedCallback.current(), intervalMs);
        return () => clearInterval(id);
    }, [intervalMs]);
}

export default usePolling;
