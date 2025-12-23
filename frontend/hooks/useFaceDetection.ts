"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import * as faceapi from 'face-api.js';

interface UseFaceDetectionProps {
    videoRef: React.RefObject<HTMLVideoElement | null>;
    enabled: boolean;
    onMultipleFacesDetected: () => void;
    onMultipleFacesPersist: () => void; // Called when multiple faces persist for too long
    onNoFaceDetected?: () => void; // Called when no face is detected (first occurrence)
    onNoFacePersist?: () => void; // Called when no face persists for too long
}

interface UseFaceDetectionReturn {
    isModelLoaded: boolean;
    faceCount: number;
    multiplePersonWarning: boolean;
    noFaceWarning: boolean;
    loadModels: () => Promise<void>;
}

export const useFaceDetection = ({
    videoRef,
    enabled,
    onMultipleFacesDetected,
    onMultipleFacesPersist,
    onNoFaceDetected,
    onNoFacePersist
}: UseFaceDetectionProps): UseFaceDetectionReturn => {
    const [isModelLoaded, setIsModelLoaded] = useState(false);
    const [faceCount, setFaceCount] = useState(0);
    const [multiplePersonWarning, setMultiplePersonWarning] = useState(false);
    const [noFaceWarning, setNoFaceWarning] = useState(false);

    const multipleFacesStartTime = useRef<number | null>(null);
    const noFaceStartTime = useRef<number | null>(null);
    const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const warningTriggeredRef = useRef(false);
    const noFaceWarningTriggeredRef = useRef(false);

    const PERSIST_THRESHOLD_MS = 5000; // 5 seconds before termination
    const DETECTION_INTERVAL_MS = 1000; // Check every 1 second

    const loadModels = useCallback(async () => {
        try {
            console.log('Loading face detection models...');
            await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
            setIsModelLoaded(true);
            console.log('Face detection models loaded successfully');
        } catch (error) {
            console.error('Failed to load face detection models:', error);
            // Fallback: set as loaded to prevent blocking the interview
            // Face detection will just be disabled
            setIsModelLoaded(true);
        }
    }, []);

    const detectFaces = useCallback(async () => {
        if (!videoRef.current || !isModelLoaded || !enabled) return;

        try {
            const video = videoRef.current;

            // Ensure video is ready
            if (video.readyState !== 4) return;

            const detections = await faceapi.detectAllFaces(
                video,
                new faceapi.TinyFaceDetectorOptions({
                    inputSize: 224,
                    scoreThreshold: 0.5
                })
            );

            const count = detections.length;
            setFaceCount(count);

            if (count > 1) {
                // Multiple faces detected - reset no face timer
                noFaceStartTime.current = null;
                setNoFaceWarning(false);
                noFaceWarningTriggeredRef.current = false;

                if (!multipleFacesStartTime.current) {
                    // First detection of multiple faces
                    multipleFacesStartTime.current = Date.now();
                    setMultiplePersonWarning(true);

                    if (!warningTriggeredRef.current) {
                        warningTriggeredRef.current = true;
                        onMultipleFacesDetected();
                    }
                } else {
                    // Check if multiple faces have persisted
                    const elapsed = Date.now() - multipleFacesStartTime.current;
                    if (elapsed >= PERSIST_THRESHOLD_MS) {
                        // Multiple faces persisted too long - terminate
                        onMultipleFacesPersist();
                    }
                }
            } else if (count === 0) {
                // No face detected - reset multiple faces timer
                multipleFacesStartTime.current = null;
                setMultiplePersonWarning(false);
                warningTriggeredRef.current = false;

                if (!noFaceStartTime.current) {
                    // First detection of no face
                    noFaceStartTime.current = Date.now();
                    setNoFaceWarning(true);

                    if (!noFaceWarningTriggeredRef.current && onNoFaceDetected) {
                        noFaceWarningTriggeredRef.current = true;
                        onNoFaceDetected();
                    }
                } else {
                    // Check if no face has persisted
                    const elapsed = Date.now() - noFaceStartTime.current;
                    if (elapsed >= PERSIST_THRESHOLD_MS && onNoFacePersist) {
                        // No face persisted too long - terminate
                        onNoFacePersist();
                    }
                }
            } else {
                // Single face detected - reset both timers
                if (multipleFacesStartTime.current) {
                    multipleFacesStartTime.current = null;
                    setMultiplePersonWarning(false);
                    warningTriggeredRef.current = false;
                }
                if (noFaceStartTime.current) {
                    noFaceStartTime.current = null;
                    setNoFaceWarning(false);
                    noFaceWarningTriggeredRef.current = false;
                }
            }
        } catch (error) {
            console.error('Face detection error:', error);
        }
    }, [videoRef, isModelLoaded, enabled, onMultipleFacesDetected, onMultipleFacesPersist, onNoFaceDetected, onNoFacePersist]);

    // Start/stop detection based on enabled state
    useEffect(() => {
        if (enabled && isModelLoaded) {
            console.log('Starting face detection...');
            detectionIntervalRef.current = setInterval(detectFaces, DETECTION_INTERVAL_MS);
        } else {
            if (detectionIntervalRef.current) {
                clearInterval(detectionIntervalRef.current);
                detectionIntervalRef.current = null;
            }
        }

        return () => {
            if (detectionIntervalRef.current) {
                clearInterval(detectionIntervalRef.current);
            }
        };
    }, [enabled, isModelLoaded, detectFaces]);

    return {
        isModelLoaded,
        faceCount,
        multiplePersonWarning,
        noFaceWarning,
        loadModels
    };
};
