"use client";

import { useState, useEffect, useCallback } from "react";

interface useProctoringProps {
    onViolation: (count: number) => void;
    onTerminate: () => void;
}

export const useProctoring = ({ onViolation, onTerminate }: useProctoringProps) => {
    const [violationCount, setViolationCount] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [proctoringEnabled, setProctoringEnabled] = useState(false);

    const triggerViolation = useCallback(() => {
        // Only trigger violations if proctoring is enabled (after grace period)
        if (!proctoringEnabled) {
            console.log('Proctoring not yet enabled, ignoring potential violation');
            return;
        }

        const newCount = violationCount + 1;
        setViolationCount(newCount);
        onViolation(newCount);

        if (newCount > 3) {
            onTerminate();
        }
    }, [violationCount, onViolation, onTerminate, proctoringEnabled]);

    const enterFullscreen = useCallback(async () => {
        try {
            if (document.documentElement.requestFullscreen) {
                await document.documentElement.requestFullscreen();
                setIsFullscreen(true);
            }
        } catch (err) {
            console.error("Fullscreen invalid:", err);
        }
    }, []);

    const startProctoring = useCallback((gracePeriodMs: number = 5000) => {
        console.log(`Starting proctoring with ${gracePeriodMs}ms grace period...`);
        setTimeout(() => {
            setProctoringEnabled(true);
            console.log('Proctoring enabled - violations will now be tracked');
        }, gracePeriodMs);
    }, []);

    // Stop proctoring - call this when interview ends
    const stopProctoring = useCallback(() => {
        console.log('Stopping proctoring');
        setProctoringEnabled(false);
        setViolationCount(0);
    }, []);

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.hidden) {
                triggerViolation();
            }
        };

        const handleBlur = () => {
            triggerViolation();
        };

        // Violation Logic: If the user switches tabs or exits full screen...
        // document.hidden covers tab switch.
        // window.onblur covers clicking outside (alt-tab).
        // Note: Violations only trigger if proctoringEnabled is true (after grace period)

        document.addEventListener("visibilitychange", handleVisibilityChange);
        window.addEventListener("blur", handleBlur);

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            window.removeEventListener("blur", handleBlur);
        };
    }, [triggerViolation]);

    // Disable copy/paste helper
    const preventCopyPaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        // Optional: Toast "Copy/Paste is disabled during the interview."
    };

    return {
        violationCount,
        enterFullscreen,
        startProctoring,
        stopProctoring,
        preventCopyPaste,
        isFullscreen
    };
};
