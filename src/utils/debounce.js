/**
 * Debounce and throttle utilities for optimizing API calls and event handlers.
 */

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 * 
 * @param {Function} func - The function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @param {Object} options - Options object
 * @param {boolean} options.leading - Invoke on the leading edge of the timeout
 * @param {boolean} options.trailing - Invoke on the trailing edge of the timeout (default: true)
 * @returns {Function} The debounced function with cancel method
 */
export const debounce = (func, wait, { leading = false, trailing = true } = {}) => {
    let timeout;
    let lastArgs;
    let lastThis;
    let result;
    let lastCallTime;
    let lastInvokeTime = 0;

    const invokeFunc = (time) => {
        const args = lastArgs;
        const thisArg = lastThis;

        lastArgs = lastThis = undefined;
        lastInvokeTime = time;
        result = func.apply(thisArg, args);
        return result;
    };

    const shouldInvoke = (time) => {
        const timeSinceLastCall = time - (lastCallTime || 0);
        const timeSinceLastInvoke = time - lastInvokeTime;

        return (
            lastCallTime === undefined ||
            timeSinceLastCall >= wait ||
            timeSinceLastCall < 0 ||
            timeSinceLastInvoke >= wait
        );
    };

    const trailingEdge = (time) => {
        timeout = undefined;

        if (trailing && lastArgs) {
            return invokeFunc(time);
        }
        lastArgs = lastThis = undefined;
        return result;
    };

    const timerExpired = () => {
        const time = Date.now();
        if (shouldInvoke(time)) {
            return trailingEdge(time);
        }
        // Restart the timer
        const timeSinceLastCall = time - (lastCallTime || 0);
        const timeWaiting = wait - timeSinceLastCall;
        timeout = setTimeout(timerExpired, timeWaiting);
    };

    const leadingEdge = (time) => {
        lastInvokeTime = time;
        timeout = setTimeout(timerExpired, wait);
        return leading ? invokeFunc(time) : result;
    };

    const debounced = function (...args) {
        const time = Date.now();
        const isInvoking = shouldInvoke(time);

        lastArgs = args;
        lastThis = this;
        lastCallTime = time;

        if (isInvoking) {
            if (timeout === undefined) {
                return leadingEdge(lastCallTime);
            }
        }

        if (timeout === undefined) {
            timeout = setTimeout(timerExpired, wait);
        }
        return result;
    };

    debounced.cancel = () => {
        if (timeout !== undefined) {
            clearTimeout(timeout);
        }
        lastInvokeTime = 0;
        lastArgs = lastCallTime = lastThis = timeout = undefined;
    };

    debounced.flush = () => {
        return timeout === undefined ? result : trailingEdge(Date.now());
    };

    debounced.pending = () => {
        return timeout !== undefined;
    };

    return debounced;
};

/**
 * Creates a throttled function that only invokes func at most once per every wait milliseconds.
 * 
 * @param {Function} func - The function to throttle
 * @param {number} wait - The number of milliseconds to throttle invocations to
 * @param {Object} options - Options object
 * @param {boolean} options.leading - Invoke on the leading edge (default: true)
 * @param {boolean} options.trailing - Invoke on the trailing edge (default: true)
 * @returns {Function} The throttled function with cancel method
 */
export const throttle = (func, wait, { leading = true, trailing = true } = {}) => {
    return debounce(func, wait, { leading, trailing, maxWait: wait });
};

/**
 * Creates an async debounced function that cancels previous pending promises.
 * Useful for API calls where you only want the latest result.
 * 
 * @param {Function} asyncFunc - The async function to debounce
 * @param {number} wait - The number of milliseconds to delay
 * @returns {Function} The debounced async function
 */
export const debounceAsync = (asyncFunc, wait) => {
    let currentPromise = null;
    let abortController = null;

    const debounced = debounce(async (...args) => {
        // Cancel previous request
        if (abortController) {
            abortController.abort();
        }

        abortController = new AbortController();

        try {
            currentPromise = asyncFunc(...args, { signal: abortController.signal });
            const result = await currentPromise;
            return result;
        } catch (error) {
            if (error.name === 'AbortError') {
                // Request was cancelled, this is expected
                return { cancelled: true };
            }
            throw error;
        }
    }, wait);

    debounced.cancel = () => {
        if (abortController) {
            abortController.abort();
        }
        debounced.cancel();
    };

    return debounced;
};
