"use client";

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseInterviewOptions {
    sessionId: string | null;
    persona?: string;
    interviewType?: string;
    difficulty?: string;
    duration?: number;
    onAiMessage?: (text: string) => void;
    onAiSpeaking?: (isSpeaking: boolean) => void;
    onError?: (error: string) => void;
}

interface UseInterviewReturn {
    isConnected: boolean;
    aiMessage: string;
    isAiSpeaking: boolean;
    connect: () => void;
    disconnect: () => void;
    sendTranscript: (text: string) => void;
    sendCode: (code: string, language: string) => void;
}

export const useInterview = ({
    sessionId,
    persona = 'balanced',
    interviewType = 'mixed',
    difficulty = 'mid',
    duration = 15,
    onAiMessage,
    onAiSpeaking,
    onError
}: UseInterviewOptions): UseInterviewReturn => {
    const [isConnected, setIsConnected] = useState(false);
    const [aiMessage, setAiMessage] = useState('');
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);

    const wsRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioQueueRef = useRef<ArrayBuffer[]>([]);
    const isPlayingRef = useRef(false);
    const pingIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const shouldReconnectRef = useRef(false);
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Get backend URL from environment or default
    // For production: Uses NEXT_PUBLIC_BACKEND_URL and converts to WebSocket protocol
    const getBackendUrl = useCallback(() => {
        // Use environment variable if set (for production deployment)
        if (process.env.NEXT_PUBLIC_BACKEND_URL) {
            // Convert http(s) to ws(s) for WebSocket
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
            return backendUrl.replace('https://', 'wss://').replace('http://', 'ws://');
        }
        // For Render/production: use the deployed backend URL
        const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
            return 'wss://ai-interviewer-1-tll5.onrender.com';
        }
        // Fallback to localhost for development
        return `ws://${hostname}:8000`;
    }, []);

    // Initialize Audio Context
    const initAudioContext = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
        return audioContextRef.current;
    }, []);

    // Play audio from ArrayBuffer
    const playAudio = useCallback(async (audioData: ArrayBuffer) => {
        try {
            const audioContext = initAudioContext();

            // Resume context if suspended (required for autoplay policies)
            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }

            setIsAiSpeaking(true);
            onAiSpeaking?.(true);

            const audioBuffer = await audioContext.decodeAudioData(audioData.slice(0));
            const source = audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioContext.destination);

            source.onended = () => {
                setIsAiSpeaking(false);
                onAiSpeaking?.(false);

                // Play next in queue if available
                if (audioQueueRef.current.length > 0) {
                    const nextAudio = audioQueueRef.current.shift();
                    if (nextAudio) {
                        playAudio(nextAudio);
                    }
                } else {
                    isPlayingRef.current = false;
                }
            };

            source.start(0);
        } catch (error) {
            console.error('Error playing audio:', error);
            setIsAiSpeaking(false);
            onAiSpeaking?.(false);
            isPlayingRef.current = false;
        }
    }, [initAudioContext, onAiSpeaking]);

    // Queue audio for playback
    const queueAudio = useCallback((audioData: ArrayBuffer) => {
        if (!isPlayingRef.current) {
            isPlayingRef.current = true;
            playAudio(audioData);
        } else {
            audioQueueRef.current.push(audioData);
        }
    }, [playAudio]);

    // Connect to WebSocket
    const connect = useCallback(() => {
        if (!sessionId) {
            console.error('No session ID provided');
            onError?.('No session ID provided');
            return;
        }

        if (wsRef.current?.readyState === WebSocket.OPEN) {
            console.log('Already connected');
            return;
        }

        const backendUrl = getBackendUrl();
        const wsUrl = `${backendUrl}/ws/interview/${sessionId}?persona=${persona}&type=${interviewType}&difficulty=${difficulty}&duration=${duration}`;

        console.log('Connecting to WebSocket:', wsUrl);

        try {
            const ws = new WebSocket(wsUrl);

            ws.onopen = () => {
                console.log('WebSocket connected');
                setIsConnected(true);
                shouldReconnectRef.current = true;

                // Start ping interval to keep connection alive
                if (pingIntervalRef.current) {
                    clearInterval(pingIntervalRef.current);
                }
                pingIntervalRef.current = setInterval(() => {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(JSON.stringify({ type: 'ping' }));
                    }
                }, 25000); // Ping every 25 seconds
            };

            ws.onmessage = async (event) => {
                if (event.data instanceof Blob) {
                    // Binary data = audio
                    const arrayBuffer = await event.data.arrayBuffer();
                    queueAudio(arrayBuffer);
                } else {
                    // Text data = JSON message
                    try {
                        const data = JSON.parse(event.data);
                        if (data.type === 'text') {
                            setAiMessage(data.content);
                            onAiMessage?.(data.content);
                        }
                    } catch (e) {
                        console.error('Error parsing message:', e);
                    }
                }
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                onError?.('WebSocket connection error');
            };

            ws.onclose = (event) => {
                console.log('WebSocket closed:', event.code, event.reason);
                setIsConnected(false);

                // Clear ping interval
                if (pingIntervalRef.current) {
                    clearInterval(pingIntervalRef.current);
                    pingIntervalRef.current = null;
                }

                // Auto-reconnect if unexpected close and we should still be connected
                if (shouldReconnectRef.current && event.code !== 1000) {
                    console.log('Attempting to reconnect in 2 seconds...');
                    reconnectTimeoutRef.current = setTimeout(() => {
                        if (shouldReconnectRef.current) {
                            connect();
                        }
                    }, 2000);
                }
            };

            wsRef.current = ws;
        } catch (error) {
            console.error('Failed to create WebSocket:', error);
            onError?.('Failed to connect to interview server');
        }
    }, [sessionId, getBackendUrl, onAiMessage, onError, queueAudio]);

    // Disconnect WebSocket
    const disconnect = useCallback(() => {
        shouldReconnectRef.current = false;

        // Clear intervals and timeouts
        if (pingIntervalRef.current) {
            clearInterval(pingIntervalRef.current);
            pingIntervalRef.current = null;
        }
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        if (wsRef.current) {
            wsRef.current.close(1000, 'User disconnected');
            wsRef.current = null;
        }
        setIsConnected(false);
    }, []);

    // Send transcript to backend
    const sendTranscript = useCallback((text: string) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'transcript',
                content: text
            }));
        } else {
            console.warn('WebSocket not connected, cannot send transcript');
        }
    }, []);

    // Send code submission to backend
    const sendCode = useCallback((code: string, language: string) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'code_submission',
                code: code,
                language: language
            }));
            console.log('Code submitted:', language);
        } else {
            console.warn('WebSocket not connected, cannot send code');
        }
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            disconnect();
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, [disconnect]);

    return {
        isConnected,
        aiMessage,
        isAiSpeaking,
        connect,
        disconnect,
        sendTranscript,
        sendCode
    };
};
