import React from 'react';

/**
 * A button that fires `onTrigger` immediately on press,
 * then rapidly repeats while held down (after a 400ms delay).
 * Supports both mouse and touch events.
 */
function LongPressBtn({ onTrigger, className, children }) {
    const timerRef = React.useRef(null);
    const intervalRef = React.useRef(null);

    const startPress = (e) => {
        e.preventDefault();
        onTrigger();
        timerRef.current = setTimeout(() => {
            intervalRef.current = setInterval(() => {
                onTrigger();
            }, 50);
        }, 400);
    };

    const stopPress = () => {
        clearTimeout(timerRef.current);
        clearInterval(intervalRef.current);
    };

    React.useEffect(() => {
        return () => {
            clearTimeout(timerRef.current);
            clearInterval(intervalRef.current);
        };
    }, []);

    return (
        <button
            className={className}
            onMouseDown={startPress}
            onMouseUp={stopPress}
            onMouseLeave={stopPress}
            onTouchStart={startPress}
            onTouchEnd={stopPress}
        >
            {children}
        </button>
    );
}

export default LongPressBtn;
