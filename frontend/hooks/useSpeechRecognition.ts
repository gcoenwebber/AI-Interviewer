"use client";

import { useState, useEffect, useRef, useCallback } from 'react';

// Extend window interface for Web Speech API
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

interface UseSpeechRecognitionReturn {
    transcript: string;
    isListening: boolean;
    startListening: () => void;
    stopListening: () => void;
    resetTranscript: () => void;
}

export const useSpeechRecognition = (): UseSpeechRecognitionReturn => {
    const [transcript, setTranscript] = useState('');
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);
    const shouldListenRef = useRef(false); // Track intended listening state

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = 'en-US';

                recognition.onresult = (event: any) => {
                    let currentTranscript = '';
                    for (let i = event.resultIndex; i < event.results.length; i++) {
                        const transcriptPart = event.results[i][0].transcript;
                        if (event.results[i].isFinal) {
                            setTranscript((prev) => prev + transcriptPart + ' ');
                        } else {
                            currentTranscript += transcriptPart;
                        }
                    }
                    // Note: For pure streaming, we might want to handle final vs interim differently.
                    // This simple implementation appends final results.
                };

                recognition.onstart = () => {
                    console.log('Speech recognition started');
                    setIsListening(true);
                };

                recognition.onend = () => {
                    console.log('Speech recognition ended');
                    setIsListening(false);

                    // Auto-restart if we should still be listening
                    if (shouldListenRef.current) {
                        console.log('Auto-restarting speech recognition...');
                        setTimeout(() => {
                            if (shouldListenRef.current && recognitionRef.current) {
                                try {
                                    recognitionRef.current.start();
                                } catch (e) {
                                    console.error('Failed to auto-restart recognition:', e);
                                }
                            }
                        }, 100);
                    }
                };

                recognition.onerror = (event: any) => {
                    // Handle specific errors - some are not really errors
                    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                        console.error('Microphone permission denied');
                        shouldListenRef.current = false;
                        setIsListening(false);
                    } else if (event.error === 'no-speech') {
                        // This is normal - happens when there's silence. Auto-restart handles it.
                        // Suppress this log to reduce console noise
                    } else if (event.error === 'aborted') {
                        // Normal when stopping, no need to log
                    } else if (event.error === 'audio-capture') {
                        console.error('Microphone not available');
                    } else {
                        // Log other unexpected errors
                        console.warn("Speech recognition issue:", event.error);
                    }
                };

                recognitionRef.current = recognition;
            } else {
                console.error('Speech Recognition API not supported in this browser');
            }
        }

        // Cleanup on unmount
        return () => {
            if (recognitionRef.current) {
                shouldListenRef.current = false;
                try {
                    recognitionRef.current.stop();
                } catch (e) {
                    // Ignore errors on cleanup
                }
            }
        };
    }, []);

    const startListening = useCallback(() => {
        if (!recognitionRef.current) {
            console.error('Speech recognition not initialized');
            return;
        }

        shouldListenRef.current = true;

        try {
            recognitionRef.current.start();
            console.log('Starting speech recognition...');
        } catch (e: any) {
            // If already started, that's okay
            if (e.message && e.message.includes('already started')) {
                console.log('Speech recognition already running');
                setIsListening(true);
            } else {
                console.error('Error starting speech recognition:', e);
            }
        }
    }, []);

    const stopListening = useCallback(() => {
        shouldListenRef.current = false;

        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
                console.log('Stopping speech recognition...');
            } catch (e) {
                console.error('Error stopping speech recognition:', e);
            }
        }
    }, []);

    const resetTranscript = useCallback(() => {
        setTranscript('');
    }, []);

    return { transcript, isListening, startListening, stopListening, resetTranscript };
};
