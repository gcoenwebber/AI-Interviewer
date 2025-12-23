"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ReactWebcam from 'react-webcam';
import { useProctoring } from '@/hooks/useProctoring';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useInterview } from '@/hooks/useInterview';
import { useFaceDetection } from '@/hooks/useFaceDetection';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, Mic, MicOff, Volume2, VolumeX, Upload, Square, FileText, Download, Home, Clock, Briefcase, GraduationCap, ToggleLeft, ToggleRight, Users } from 'lucide-react';
import { saveInterview, downloadInterview, SavedInterview, InterviewStats } from '@/lib/interviewStorage';
import CodeEditor from '@/components/CodeEditor';

// Configuration options
const DURATION_OPTIONS = [5, 10, 15, 20, 30, 45, 60];
const INTERVIEW_TYPES = [
    { id: 'technical', label: 'Technical', icon: '💻', desc: 'Coding & system design' },
    { id: 'behavioral', label: 'Behavioral', icon: '🗣️', desc: 'STAR method questions' },
    { id: 'mixed', label: 'Mixed', icon: '🎯', desc: 'Both technical & behavioral' }
];
const DIFFICULTY_LEVELS = [
    { id: 'junior', label: 'Junior', color: 'from-green-500 to-emerald-600' },
    { id: 'mid', label: 'Mid-Level', color: 'from-blue-500 to-indigo-600' },
    { id: 'senior', label: 'Senior', color: 'from-purple-500 to-violet-600' },
    { id: 'lead', label: 'Lead/Staff', color: 'from-orange-500 to-red-600' }
];
const FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'literally', 'so', 'well'];
const INTERVIEWER_PERSONAS = [
    { id: 'friendly', label: 'Friendly', icon: '😊', desc: 'Supportive & encouraging', color: 'from-green-500 to-emerald-600' },
    { id: 'balanced', label: 'Balanced', icon: '🎯', desc: 'Professional & fair', color: 'from-blue-500 to-indigo-600' },
    { id: 'strict', label: 'Strict', icon: '👔', desc: 'Challenging & rigorous', color: 'from-red-500 to-orange-600' }
];

export default function InterviewRoom() {
    const router = useRouter();
    const [started, setStarted] = useState(false);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [aiText, setAiText] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [interviewEnded, setInterviewEnded] = useState(false);
    const [report, setReport] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [savedInterviewData, setSavedInterviewData] = useState<SavedInterview | null>(null);
    const [isEndingInterview, setIsEndingInterview] = useState(false);
    const [selectedDuration, setSelectedDuration] = useState(15);
    const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
    const [interviewStartTime, setInterviewStartTime] = useState<number | null>(null);
    // New Phase 1 features
    const [interviewType, setInterviewType] = useState('mixed');
    const [difficultyLevel, setDifficultyLevel] = useState('mid');
    const [isPracticeMode, setIsPracticeMode] = useState(false);
    const [fillerWordCount, setFillerWordCount] = useState(0);
    const [interviewerPersona, setInterviewerPersona] = useState('balanced');
    // Phase 2 - Response time tracking
    const [responseTimes, setResponseTimes] = useState<number[]>([]);
    const [avgResponseTime, setAvgResponseTime] = useState<number | null>(null);
    const aiSpeakingEndTime = useRef<number | null>(null);
    // Confidence Score tracking
    const [totalWordCount, setTotalWordCount] = useState(0);
    const [confidenceScore, setConfidenceScore] = useState<number | null>(null);
    const [responseCount, setResponseCount] = useState(0);
    const lastSentTranscript = useRef('');
    const sendTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const conversationHistoryRef = useRef<string[]>([]);
    const hasTimedOut = useRef(false);
    // Code editor tracking
    const [currentCode, setCurrentCode] = useState('');
    const [currentLanguage, setCurrentLanguage] = useState('javascript');
    const [codeSubmissionCount, setCodeSubmissionCount] = useState(0);
    // Cheating detection
    const [cheatingDetected, setCheatingDetected] = useState(false);
    const [cheatingWarningShown, setCheatingWarningShown] = useState(false);
    // Instructions page state
    const [showInstructions, setShowInstructions] = useState(false);
    const webcamRef = useRef<HTMLVideoElement>(null);
    const handleViolation = (count: number) => {
        alert(`Warning: Violation detected! Focus on the interview. Count: ${count}`);
    };

    const handleTerminate = () => {
        alert("Interview terminated due to multiple violations.");
        // In real app, redirect or lock capability
    };

    const handleMultipleFacesDetected = useCallback(() => {
        if (!cheatingWarningShown) {
            setCheatingWarningShown(true);
            // Don't use alert as it's blocking - the UI warning is sufficient
            console.log('WARNING: Multiple persons detected in camera!');
        }
    }, [cheatingWarningShown]);

    const handleCheatingTerminate = useCallback(async () => {
        setCheatingDetected(true);
        // Mark cheating in conversation history for report
        conversationHistoryRef.current.push('⚠️ CHEATING DETECTED: Interview terminated - Multiple persons detected in camera for extended period');
        // Auto-end the interview
        alert('⚠️ CHEATING DETECTED: Another person was detected in the camera. The interview has been terminated.');
        // Trigger interview end
        if (sessionId) {
            endInterview();
        }
    }, [sessionId]);

    const handleNoFaceDetected = useCallback(() => {
        console.log('WARNING: No face detected in camera!');
    }, []);

    const handleNoFaceTerminate = useCallback(async () => {
        // Mark absence in conversation history for report
        conversationHistoryRef.current.push('⚠️ ABSENCE DETECTED: Interview terminated - No face detected in camera for extended period');
        // Auto-end the interview
        alert('⚠️ ABSENCE DETECTED: Your face was not detected in the camera. The interview has been terminated.');
        // Trigger interview end
        if (sessionId) {
            endInterview();
        }
    }, [sessionId]);

    const { enterFullscreen, preventCopyPaste, violationCount, startProctoring, stopProctoring } = useProctoring({
        onViolation: handleViolation,
        onTerminate: handleTerminate
    });

    // Face detection for cheating prevention
    const { isModelLoaded, faceCount, multiplePersonWarning, noFaceWarning, loadModels } = useFaceDetection({
        videoRef: webcamRef,
        enabled: started && !interviewEnded,
        onMultipleFacesDetected: handleMultipleFacesDetected,
        onMultipleFacesPersist: handleCheatingTerminate,
        onNoFaceDetected: handleNoFaceDetected,
        onNoFacePersist: handleNoFaceTerminate
    });

    const { transcript, isListening, startListening, stopListening, resetTranscript } = useSpeechRecognition();

    // Get backend URL - Backend always runs on HTTP (no SSL)
    const getBackendUrl = useCallback(() => {
        const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
        // Backend runs on HTTP even if frontend is HTTPS
        // For localhost, this is fine. For production, backend should also have SSL.
        return `http://${hostname}:8000`;
    }, []);

    // Interview hook
    const {
        isConnected,
        aiMessage,
        isAiSpeaking,
        connect,
        disconnect,
        sendTranscript,
        sendCode
    } = useInterview({
        sessionId,
        persona: interviewerPersona,
        interviewType: interviewType,
        difficulty: difficultyLevel,
        duration: selectedDuration,
        onAiMessage: (text) => {
            setAiText(text);
            // Track AI messages in conversation history
            conversationHistoryRef.current.push(`AI: ${text}`);
        },
        onError: (error) => {
            console.error('Interview error:', error);
        }
    });

    // Update AI text when message changes
    useEffect(() => {
        if (aiMessage) {
            setAiText(aiMessage);
        }
    }, [aiMessage]);

    // Pause speech recognition while AI is speaking to prevent echo/feedback
    useEffect(() => {
        if (!started || interviewEnded) return;

        if (isAiSpeaking) {
            // Stop listening when AI starts speaking to prevent echo
            stopListening();
        } else {
            // Track when AI stopped speaking (for response time calculation)
            aiSpeakingEndTime.current = Date.now();

            // Resume listening after AI stops, with a short delay
            // to let any audio tail from speakers dissipate
            const resumeTimeout = setTimeout(() => {
                if (!interviewEnded) {
                    startListening();
                }
            }, 500); // 500ms delay to prevent catching speaker tail

            return () => clearTimeout(resumeTimeout);
        }
    }, [isAiSpeaking, started, interviewEnded, stopListening, startListening]);

    // Send transcript to backend when user stops speaking (debounced)
    useEffect(() => {
        if (!isConnected || !transcript || isAiSpeaking) return;

        // Only send new content
        const newContent = transcript.slice(lastSentTranscript.current.length).trim();
        if (!newContent) return;

        // Count filler words in the new content
        const lowerContent = newContent.toLowerCase();
        let fillerCount = 0;
        FILLER_WORDS.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi');
            const matches = lowerContent.match(regex);
            if (matches) fillerCount += matches.length;
        });
        if (fillerCount > 0) {
            setFillerWordCount(prev => prev + fillerCount);
        }

        // Debounce sending - wait for pause in speech
        if (sendTimeoutRef.current) {
            clearTimeout(sendTimeoutRef.current);
        }

        sendTimeoutRef.current = setTimeout(() => {
            if (newContent.length > 5) { // Don't send very short fragments
                console.log('Sending transcript:', newContent);

                // Calculate response time (time since AI stopped speaking)
                if (aiSpeakingEndTime.current) {
                    const responseTime = (Date.now() - aiSpeakingEndTime.current) / 1000; // in seconds
                    setResponseTimes(prev => {
                        const newTimes = [...prev, responseTime];
                        // Calculate average
                        const avg = newTimes.reduce((a, b) => a + b, 0) / newTimes.length;
                        setAvgResponseTime(avg);
                        return newTimes;
                    });
                    aiSpeakingEndTime.current = null; // Reset for next question
                }

                // Track word count for confidence calculation
                const wordCount = newContent.split(/\s+/).filter(w => w.length > 0).length;
                setTotalWordCount(prev => prev + wordCount);
                setResponseCount(prev => prev + 1);

                sendTranscript(newContent);
                lastSentTranscript.current = transcript;
                // Track user messages in conversation history
                conversationHistoryRef.current.push(`You: ${newContent}`);
            }
        }, 1500); // Wait 1.5s of silence before sending

        return () => {
            if (sendTimeoutRef.current) {
                clearTimeout(sendTimeoutRef.current);
            }
        };
    }, [transcript, isConnected, isAiSpeaking, sendTranscript]);

    // Calculate confidence score based on speech metrics
    useEffect(() => {
        if (responseCount < 2 || totalWordCount === 0) {
            setConfidenceScore(null);
            return;
        }

        // Factors for confidence score (0-100):
        // 1. Filler word ratio (lower is better) - 30% weight
        const fillerRatio = fillerWordCount / totalWordCount;
        const fillerScore = Math.max(0, 100 - (fillerRatio * 500)); // 0 fillers = 100, 20% fillers = 0

        // 2. Response time (faster is better, but not too fast) - 30% weight
        const avgTime = avgResponseTime || 5;
        let timeScore = 100;
        if (avgTime < 2) timeScore = 70; // Too fast might mean not thinking
        else if (avgTime <= 5) timeScore = 100; // Ideal range
        else if (avgTime <= 10) timeScore = 80;
        else if (avgTime <= 15) timeScore = 50;
        else timeScore = 30; // Very slow

        // 3. Response length (more detailed is better) - 40% weight
        const avgWords = totalWordCount / responseCount;
        let lengthScore = 100;
        if (avgWords < 10) lengthScore = 30; // Too short
        else if (avgWords < 20) lengthScore = 60;
        else if (avgWords <= 60) lengthScore = 100; // Ideal range
        else if (avgWords <= 100) lengthScore = 80;
        else lengthScore = 60; // Too long

        // Composite score
        const score = Math.round(fillerScore * 0.3 + timeScore * 0.3 + lengthScore * 0.4);
        setConfidenceScore(Math.min(100, Math.max(0, score)));
    }, [fillerWordCount, totalWordCount, avgResponseTime, responseCount]);

    // Timer countdown effect
    useEffect(() => {
        if (!started || !interviewStartTime || interviewEnded) return;

        const timer = setInterval(() => {
            const elapsed = Math.floor((Date.now() - interviewStartTime) / 1000);
            const totalSeconds = selectedDuration * 60;
            const remaining = Math.max(0, totalSeconds - elapsed);
            setTimeRemaining(remaining);

            // When time is up, trigger AI to conclude
            if (remaining === 0 && !hasTimedOut.current) {
                hasTimedOut.current = true;
                sendTranscript("TIME_UP: Please conclude the interview now with a brief summary.");
                // Auto-end after 30 seconds to give AI time to respond
                setTimeout(() => {
                    if (!interviewEnded) {
                        endInterview();
                    }
                }, 30000);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [started, interviewStartTime, selectedDuration, interviewEnded, sendTranscript]);

    // Upload resume to get session ID
    const uploadResume = async (file: File) => {
        setIsUploading(true);
        setUploadError(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${getBackendUrl()}/analyze-resume`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to analyze resume');
            }

            const data = await response.json();
            if (data.session_id) {
                setSessionId(data.session_id);
                console.log('Session created:', data.session_id);
                return data.session_id;
            } else if (data.error) {
                throw new Error(data.error);
            }
        } catch (error: any) {
            console.error('Resume upload error:', error);
            setUploadError(error.message || 'Failed to upload resume');
            throw error;
        } finally {
            setIsUploading(false);
        }
    };

    // Handle file selection
    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            try {
                await uploadResume(file);
            } catch (e) {
                // Error already handled
            }
        }
    };

    // End Interview and get report
    const endInterview = async () => {
        if (!sessionId) return;

        setIsEndingInterview(true);

        try {
            // Stop listening, proctoring, and disconnect WebSocket
            stopListening();
            stopProctoring();
            disconnect();

            // Call backend to generate report
            const response = await fetch(`${getBackendUrl()}/end-interview/${sessionId}`, {
                method: 'POST'
            });

            if (!response.ok) {
                throw new Error('Failed to generate report');
            }

            const data = await response.json();
            if (data.report) {
                setReport(data.report);
                setAnalysis(data.analysis || '');
                setInterviewEnded(true);

                // Save interview (unless practice mode)
                if (!isPracticeMode) {
                    const transcript = conversationHistoryRef.current.join('\n');
                    const interviewStats = {
                        confidenceScore,
                        fillerWordCount,
                        totalWordCount,
                        avgResponseTime,
                        responseCount
                    };
                    const saved = await saveInterview(
                        data.report,
                        data.analysis || '',
                        transcript,
                        interviewStats
                    );
                    setSavedInterviewData(saved);
                } else {
                    console.log('Practice mode - not saving');
                }

                // Exit fullscreen
                if (document.fullscreenElement) {
                    document.exitFullscreen();
                }
            } else if (data.error) {
                throw new Error(data.error);
            }
        } catch (error: any) {
            console.error('End interview error:', error);
            alert('Failed to end interview: ' + error.message);
        } finally {
            setIsEndingInterview(false);
        }
    };

    // Webcam constraints
    const videoConstraints = {
        width: 640,
        height: 480,
        facingMode: "user",
        echoCancellation: true
    };

    const startInterview = async () => {
        // Check if we're in a secure context (required for getUserMedia on non-localhost)
        const isSecureContext = window.isSecureContext;
        const isLocalhost = window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1';

        console.log('Security check:', {
            isSecureContext,
            isLocalhost,
            protocol: window.location.protocol,
            hostname: window.location.hostname
        });

        // Warn if not secure context and not localhost
        if (!isSecureContext && !isLocalhost) {
            alert(`Camera/microphone access requires HTTPS when accessing over network.\n\nCurrent URL: ${window.location.href}\n\nPlease either:\n1. Use localhost (http://localhost:3000)\n2. Set up HTTPS (see https-setup.md)`);
            return;
        }

        // Check if getUserMedia is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            alert('Camera/microphone API not available. This may be due to:\n1. Insecure connection (HTTP over network)\n2. Browser not supporting media devices\n3. Permissions policy blocking access');
            return;
        }

        // Request both microphone AND camera permissions
        try {
            console.log('Requesting camera and microphone permissions...');

            // Request both audio and video access
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: { facingMode: "user" }
            });

            console.log('Permissions granted, stream obtained:', stream);

            // Store stream for potential cleanup later
            // (ReactWebcam will also request access, but this ensures permissions are granted upfront)

            resetTranscript();
            lastSentTranscript.current = '';
            hasTimedOut.current = false;
            setInterviewStartTime(Date.now());
            setTimeRemaining(selectedDuration * 60);
            enterFullscreen();
            startListening();
            setStarted(true);

            // Connect to WebSocket for AI interviewer
            connect();

            // Start proctoring with grace period AFTER permissions are granted
            // This prevents false violations during permission dialogs
            startProctoring(5000); // 5 second grace period
        } catch (error: any) {
            console.error('Media permission error:', error);
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);

            // Provide specific error messages based on error type
            if (error.name === 'NotAllowedError') {
                alert('Camera and microphone access denied. Please grant permissions and try again.\n\nTip: Check browser address bar for permission icon.');
            } else if (error.name === 'NotFoundError') {
                alert('No camera or microphone found. Please connect a device and try again.');
            } else if (error.name === 'NotSupportedError' || error.name === 'SecurityError') {
                alert(`Camera/microphone access blocked due to security.\n\nURL: ${window.location.href}\n\nSolution: Use HTTPS for network access or access via localhost.`);
            } else if (error.name === 'TypeError') {
                alert('Camera/microphone API not available. Ensure you are using HTTPS for network access.');
            } else {
                alert(`Camera and microphone access failed.\n\nError: ${error.name} - ${error.message}\n\nPlease check:\n1. Camera/mic connected\n2. Using HTTPS (for network)\n3. Permissions not blocked`);
            }
        }
    };

    return (
        <div className="flex flex-col h-screen gradient-bg text-white p-4">
            {/* Report View - Shown when interview ends */}
            {interviewEnded && report ? (
                <div className="flex flex-col items-center justify-center h-full max-w-4xl mx-auto">
                    <div className="bg-neutral-800 rounded-2xl p-8 w-full border border-neutral-700 shadow-2xl">
                        <div className="flex items-center gap-3 mb-6">
                            <FileText className="w-8 h-8 text-blue-400" />
                            <h1 className="text-3xl font-bold">Interview Report Card</h1>
                        </div>

                        <div className="bg-neutral-900 rounded-xl p-6 mb-6 max-h-[60vh] overflow-y-auto">
                            <pre className="whitespace-pre-wrap text-sm text-neutral-200 font-mono">
                                {report}
                            </pre>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Button
                                onClick={() => {
                                    // Create interview object with current stats for download
                                    const interviewForDownload: SavedInterview = savedInterviewData || {
                                        id: `temp_${Date.now()}`,
                                        name: new Date().toLocaleString('en-US', {
                                            year: 'numeric', month: 'short', day: 'numeric',
                                            hour: '2-digit', minute: '2-digit'
                                        }),
                                        date: new Date().toISOString(),
                                        report: report || '',
                                        analysis: analysis || '',
                                        transcript: conversationHistoryRef.current.join('\n'),
                                        stats: {
                                            confidenceScore,
                                            fillerWordCount,
                                            totalWordCount,
                                            avgResponseTime,
                                            responseCount
                                        }
                                    };
                                    // Ensure stats are included even if savedInterviewData exists but lacks stats
                                    if (!interviewForDownload.stats) {
                                        interviewForDownload.stats = {
                                            confidenceScore,
                                            fillerWordCount,
                                            totalWordCount,
                                            avgResponseTime,
                                            responseCount
                                        };
                                    }
                                    downloadInterview(interviewForDownload);
                                }}
                                className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                            >
                                <Download className="w-4 h-4" />
                                Download Report
                            </Button>
                            <Button
                                onClick={() => {
                                    navigator.clipboard.writeText(report);
                                    alert('Report copied to clipboard!');
                                }}
                                variant="outline"
                                className="border-neutral-600 text-neutral-200 hover:bg-neutral-700"
                            >
                                Copy Report
                            </Button>
                            <Button
                                onClick={() => router.push('/dashboard')}
                                variant="outline"
                                className="border-neutral-600 text-neutral-200 hover:bg-neutral-700 flex items-center gap-2"
                            >
                                <Home className="w-4 h-4" />
                                View All Reports
                            </Button>
                            <Button
                                onClick={() => window.location.reload()}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                Start New Interview
                            </Button>
                            <Button
                                onClick={() => router.push('/')}
                                variant="outline"
                                className="border-purple-500 text-purple-300 hover:bg-purple-900/30 flex items-center gap-2"
                            >
                                <Home className="w-4 h-4" />
                                Back to Home
                            </Button>
                        </div>
                    </div>
                </div>
            ) : !started ? (
                <div className="flex flex-col items-center justify-center h-full space-y-8">
                    <div className="text-center">
                        <h1 className="text-4xl font-bold gradient-text mb-2">AI Dronacharya Interview</h1>
                        <p className="text-purple-300/60">Prepare for your next opportunity</p>
                    </div>
                    {/* Step 1: Upload Resume */}
                    {!sessionId ? (
                        <div className="glass-card p-8 rounded-2xl glow-border flex flex-col items-center space-y-6">
                            <p className="text-purple-200">Upload your resume to get started</p>
                            <label className="cursor-pointer group">
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                    disabled={isUploading}
                                />
                                <div className="flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl transition-all shadow-lg shadow-purple-900/50 group-hover:shadow-purple-700/50 group-hover:scale-105">
                                    <Upload className="w-6 h-6" />
                                    <span className="text-lg font-medium">{isUploading ? 'Analyzing Resume...' : 'Upload Resume (PDF)'}</span>
                                </div>
                            </label>
                            {uploadError && (
                                <p className="text-red-400 text-sm bg-red-900/20 px-4 py-2 rounded-lg">{uploadError}</p>
                            )}
                        </div>
                    ) : !showInstructions ? (
                        /* Step 2: Configure and Start Interview */
                        <div className="glass-card p-8 rounded-2xl glow-border max-w-2xl w-full">
                            <p className="text-green-400 flex items-center justify-center gap-2 mb-6">
                                ✓ Resume analyzed! Configure your interview below.
                            </p>

                            {/* Interview Type Selection */}
                            <div className="mb-6">
                                <label className="text-purple-200 text-sm font-medium mb-3 block">Interview Type</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {INTERVIEW_TYPES.map((type) => (
                                        <button
                                            key={type.id}
                                            onClick={() => setInterviewType(type.id)}
                                            className={`p-4 rounded-xl transition-all text-center ${interviewType === type.id
                                                ? 'bg-purple-600/50 border-2 border-purple-400 shadow-lg shadow-purple-900/30'
                                                : 'bg-neutral-800/50 border border-neutral-700 hover:border-purple-500/50'
                                                }`}
                                        >
                                            <span className="text-2xl block mb-1">{type.icon}</span>
                                            <span className="font-medium text-white">{type.label}</span>
                                            <span className="text-xs text-purple-300/60 block mt-1">{type.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Difficulty Level */}
                            <div className="mb-6">
                                <label className="text-purple-200 text-sm font-medium mb-3 block">Difficulty Level</label>
                                <div className="flex flex-wrap justify-center gap-2">
                                    {DIFFICULTY_LEVELS.map((level) => (
                                        <button
                                            key={level.id}
                                            onClick={() => setDifficultyLevel(level.id)}
                                            className={`px-5 py-2 rounded-lg transition-all font-medium ${difficultyLevel === level.id
                                                ? `bg-gradient-to-r ${level.color} text-white shadow-lg`
                                                : 'bg-neutral-700/50 text-neutral-300 hover:bg-neutral-600'
                                                }`}
                                        >
                                            {level.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Interviewer Persona */}
                            <div className="mb-6">
                                <label className="text-purple-200 text-sm font-medium mb-3 block">Interviewer Style</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {INTERVIEWER_PERSONAS.map((persona) => (
                                        <button
                                            key={persona.id}
                                            onClick={() => setInterviewerPersona(persona.id)}
                                            className={`p-3 rounded-xl transition-all text-center ${interviewerPersona === persona.id
                                                ? `bg-gradient-to-r ${persona.color} text-white shadow-lg`
                                                : 'bg-neutral-800/50 border border-neutral-700 hover:border-purple-500/50'
                                                }`}
                                        >
                                            <span className="text-xl block mb-1">{persona.icon}</span>
                                            <span className="font-medium text-sm">{persona.label}</span>
                                            <span className="text-xs opacity-70 block mt-1">{persona.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Duration Selector */}
                            <div className="mb-6">
                                <label className="text-purple-200 text-sm font-medium mb-3 flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    Duration
                                </label>
                                <div className="flex flex-wrap justify-center gap-2">
                                    {DURATION_OPTIONS.map((mins) => (
                                        <button
                                            key={mins}
                                            onClick={() => setSelectedDuration(mins)}
                                            className={`px-4 py-2 rounded-lg transition-colors ${selectedDuration === mins
                                                ? 'bg-purple-600 text-white'
                                                : 'bg-neutral-700/50 text-neutral-300 hover:bg-neutral-600'
                                                }`}
                                        >
                                            {mins} min
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Practice Mode Toggle */}
                            <div className="mb-8 flex items-center justify-center gap-4">
                                <button
                                    onClick={() => setIsPracticeMode(!isPracticeMode)}
                                    className={`flex items-center gap-3 px-5 py-3 rounded-xl transition-all ${isPracticeMode
                                        ? 'bg-yellow-600/30 border border-yellow-500/50 text-yellow-200'
                                        : 'bg-neutral-700/30 border border-neutral-600 text-neutral-400'
                                        }`}
                                >
                                    {isPracticeMode ? (
                                        <ToggleRight className="w-6 h-6 text-yellow-400" />
                                    ) : (
                                        <ToggleLeft className="w-6 h-6" />
                                    )}
                                    <div className="text-left">
                                        <span className="font-medium block">Practice Mode</span>
                                        <span className="text-xs opacity-70">
                                            {isPracticeMode ? 'Results won\'t be saved' : 'Results will be saved'}
                                        </span>
                                    </div>
                                </button>
                            </div>

                            {/* Start Button */}
                            <div className="text-center">
                                <Button
                                    onClick={() => setShowInstructions(true)}
                                    size="lg"
                                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 px-10 py-6 text-lg rounded-xl shadow-lg shadow-purple-900/50"
                                >
                                    Start {selectedDuration} Min {INTERVIEW_TYPES.find(t => t.id === interviewType)?.label} Interview
                                </Button>
                                <p className="text-sm text-neutral-400 mt-4">Note: This will enter full screen mode.</p>
                            </div>
                        </div>
                    ) : null}

                    {/* Instructions Page - Shown after clicking Start Interview */}
                    {showInstructions && (
                        <div className="glass-card p-8 rounded-2xl glow-border max-w-3xl w-full max-h-[85vh] overflow-y-auto">
                            <div className="text-center mb-6">
                                <h2 className="text-3xl font-bold gradient-text mb-2">📋 Before You Begin</h2>
                                <p className="text-purple-300/60">Read these important instructions carefully</p>
                            </div>

                            {/* How to Use Section */}
                            <div className="mb-8">
                                <h3 className="text-xl font-semibold text-blue-400 mb-4 flex items-center gap-2">
                                    🎯 How to Use
                                </h3>
                                <div className="bg-neutral-800/50 rounded-xl p-5 space-y-3 text-neutral-200">
                                    <div className="flex items-start gap-3">
                                        <span className="text-blue-400 font-bold">1.</span>
                                        <p>The AI interviewer will ask you questions based on your resume and selected interview type.</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="text-blue-400 font-bold">2.</span>
                                        <p>Speak clearly into your microphone. Wait for the AI to finish speaking before responding.</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="text-blue-400 font-bold">3.</span>
                                        <p>Your camera will be monitored for face detection. Ensure your face is always visible.</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="text-blue-400 font-bold">4.</span>
                                        <p>For coding questions, use the code editor that appears. Submit your solution when ready.</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <span className="text-blue-400 font-bold">5.</span>
                                        <p>The interview will end automatically when time runs out, or you can end it early.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Do's and Don'ts Section */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                {/* Do's */}
                                <div>
                                    <h3 className="text-xl font-semibold text-green-400 mb-4 flex items-center gap-2">
                                        ✅ Do's
                                    </h3>
                                    <div className="bg-green-900/20 border border-green-700/30 rounded-xl p-4 space-y-3">
                                        <div className="flex items-center gap-2 text-green-200">
                                            <span>✓</span>
                                            <span>Sit in a quiet, well-lit environment</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-green-200">
                                            <span>✓</span>
                                            <span>Speak clearly and at a moderate pace</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-green-200">
                                            <span>✓</span>
                                            <span>Keep your face visible in the camera</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-green-200">
                                            <span>✓</span>
                                            <span>Take a moment to think before answering</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-green-200">
                                            <span>✓</span>
                                            <span>Use the STAR method for behavioral questions</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-green-200">
                                            <span>✓</span>
                                            <span>Maintain eye contact with the camera</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Don'ts */}
                                <div>
                                    <h3 className="text-xl font-semibold text-red-400 mb-4 flex items-center gap-2">
                                        ❌ Don'ts
                                    </h3>
                                    <div className="bg-red-900/20 border border-red-700/30 rounded-xl p-4 space-y-3">
                                        <div className="flex items-center gap-2 text-red-200">
                                            <span>✗</span>
                                            <span>Don't have other people in the camera view</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-red-200">
                                            <span>✗</span>
                                            <span>Don't leave the camera frame during interview</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-red-200">
                                            <span>✗</span>
                                            <span>Don't switch tabs or leave full screen</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-red-200">
                                            <span>✗</span>
                                            <span>Don't use external help or cheat sheets</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-red-200">
                                            <span>✗</span>
                                            <span>Don't interrupt the AI while it's speaking</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-red-200">
                                            <span>✗</span>
                                            <span>Don't use excessive filler words</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Important Notice */}
                            <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-xl p-4 mb-6">
                                <p className="text-yellow-200 text-sm text-center">
                                    ⚠️ <strong>Important:</strong> The interview will be terminated if no face is detected for 5 seconds,
                                    or if multiple persons are detected in the camera.
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-center gap-4">
                                <Button
                                    onClick={() => setShowInstructions(false)}
                                    variant="outline"
                                    className="border-neutral-600 text-neutral-200 hover:bg-neutral-700 px-6 py-3"
                                >
                                    ← Go Back
                                </Button>
                                <Button
                                    onClick={() => {
                                        setShowInstructions(false);
                                        startInterview();
                                    }}
                                    size="lg"
                                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 px-10 py-3 text-lg rounded-xl shadow-lg shadow-green-900/50"
                                >
                                    I Understand, Start Interview →
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <>
                    <div className="flex flex-1 gap-4">
                        {/* Left Side: User Video */}
                        <div className="flex-1 flex flex-col space-y-4">
                            <Card className="flex-1 bg-black rounded-xl overflow-hidden relative border-neutral-800">
                                <ReactWebcam
                                    audio={true}
                                    muted={true}
                                    className="w-full h-full object-cover"
                                    videoConstraints={videoConstraints}
                                    onUserMedia={() => {
                                        // Get the video element for face detection
                                        const video = document.querySelector('video');
                                        if (video && webcamRef) {
                                            (webcamRef as any).current = video;
                                            // Load face detection models
                                            loadModels();
                                        }
                                    }}
                                />
                                <div className="absolute bottom-4 left-4 bg-black/50 p-2 rounded text-xs">
                                    {isListening ? <div className="flex items-center gap-2"><Mic className="w-4 h-4 text-green-400" /> Listening</div> : <MicOff className="w-4 h-4 text-red-400" />}
                                </div>
                                {/* Face count indicator */}
                                {started && (
                                    <div className={`absolute bottom-4 right-4 px-3 py-1 rounded text-xs flex items-center gap-2 ${faceCount === 0 ? 'bg-orange-600 animate-pulse' :
                                        faceCount > 1 ? 'bg-red-600 animate-pulse' : 'bg-green-600/70'
                                        }`}>
                                        <Users className="w-4 h-4" />
                                        {faceCount} {faceCount === 1 ? 'person' : 'persons'}
                                    </div>
                                )}
                                {/* Multiple person warning overlay */}
                                {multiplePersonWarning && (
                                    <div className="absolute inset-0 bg-red-900/50 flex items-center justify-center">
                                        <div className="bg-red-800 text-white px-6 py-4 rounded-xl text-center animate-pulse">
                                            <AlertCircle className="w-12 h-12 mx-auto mb-2" />
                                            <p className="text-lg font-bold">⚠️ WARNING: Multiple Persons Detected!</p>
                                            <p className="text-sm mt-2">Please ensure only you are visible in the camera.</p>
                                            <p className="text-xs mt-1 text-red-200">Interview will terminate if this continues...</p>
                                        </div>
                                    </div>
                                )}
                                {/* No face warning overlay */}
                                {noFaceWarning && (
                                    <div className="absolute inset-0 bg-orange-900/50 flex items-center justify-center">
                                        <div className="bg-orange-800 text-white px-6 py-4 rounded-xl text-center animate-pulse">
                                            <AlertCircle className="w-12 h-12 mx-auto mb-2" />
                                            <p className="text-lg font-bold">⚠️ WARNING: No Face Detected!</p>
                                            <p className="text-sm mt-2">Please ensure your face is visible in the camera.</p>
                                            <p className="text-xs mt-1 text-orange-200">Interview will terminate if this continues...</p>
                                        </div>
                                    </div>
                                )}
                            </Card>

                            <Card className="h-48 bg-neutral-800 p-4 rounded-xl border-neutral-700 overflow-y-auto">
                                <h3 className="text-sm font-semibold text-neutral-400 mb-2">Live Transcript (You)</h3>
                                <p className="text-neutral-200">{transcript}</p>
                            </Card>
                        </div>

                        {/* Right Side: AI Avatar */}
                        <div className="flex-1 flex flex-col space-y-4">
                            <Card className="flex-1 bg-gradient-to-br from-indigo-900 to-purple-900 rounded-xl flex flex-col items-center justify-center relative border-neutral-700 p-6">
                                {/* Abstract Avatar Visualizer */}
                                <div className={`w-32 h-32 rounded-full ${isAiSpeaking ? 'bg-blue-500/30' : 'bg-white/10'} flex items-center justify-center transition-all duration-300`}>
                                    <div className={`w-24 h-24 rounded-full ${isAiSpeaking ? 'bg-blue-400/40 animate-ping' : 'bg-white/20'}`}></div>
                                </div>
                                <div className="mt-4 text-center w-full px-4">
                                    <p className="text-lg font-medium text-white/90 flex items-center justify-center gap-2">
                                        Shreya (Interviewer)
                                        {isAiSpeaking ? <Volume2 className="w-4 h-4 text-blue-300 animate-pulse" /> : <VolumeX className="w-4 h-4 text-neutral-500" />}
                                    </p>
                                    <p className="text-sm text-indigo-200">
                                        {isConnected ? (isAiSpeaking ? 'Speaking...' : 'Listening...') : 'Connecting...'}
                                    </p>
                                </div>

                                {/* AI Text Display */}
                                {aiText && (
                                    <div className="absolute bottom-4 left-4 right-4 bg-black/50 p-3 rounded-lg max-h-24 overflow-y-auto">
                                        <p className="text-sm text-white/90">{aiText}</p>
                                    </div>
                                )}
                            </Card>

                            {/* Code Editor */}
                            <div className="h-1/2 flex flex-col">
                                <div className="flex-1">
                                    <CodeEditor
                                        preventPaste={true}
                                        onCodeChange={(code, language) => {
                                            setCurrentCode(code);
                                            setCurrentLanguage(language);
                                        }}
                                    />
                                </div>
                                {/* Submit Code Button - Only show for interviews >= 10 min and technical/mixed types */}
                                {selectedDuration >= 10 && (interviewType === 'technical' || interviewType === 'mixed') && (
                                    <div className="mt-2">
                                        <button
                                            onClick={() => {
                                                if (currentCode.trim()) {
                                                    sendCode(currentCode, currentLanguage);
                                                    setCodeSubmissionCount(prev => prev + 1);
                                                    // Track in conversation history
                                                    conversationHistoryRef.current.push(`You submitted code (${currentLanguage}):\n${currentCode}`);
                                                } else {
                                                    alert('Please write some code before submitting.');
                                                }
                                            }}
                                            className="w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white shadow-lg"
                                        >
                                            {codeSubmissionCount > 0 ? (
                                                <>
                                                    📤 Resubmit Code ({codeSubmissionCount} submitted)
                                                </>
                                            ) : (
                                                <>
                                                    📤 Submit Code for Review
                                                </>
                                            )}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* End Interview Button and Timer - Fixed position */}
                    <div className="fixed top-4 left-4 z-50 flex items-center gap-3">
                        {/* Timer Display */}
                        {timeRemaining !== null && (
                            <div className={`px-4 py-2 rounded-lg flex items-center gap-2 ${timeRemaining <= 60
                                ? 'bg-red-600 animate-pulse'
                                : timeRemaining <= 300
                                    ? 'bg-yellow-600'
                                    : 'bg-neutral-700'
                                }`}>
                                <Clock className="w-4 h-4" />
                                <span className="font-mono font-bold">
                                    {Math.floor(timeRemaining / 60).toString().padStart(2, '0')}:
                                    {(timeRemaining % 60).toString().padStart(2, '0')}
                                </span>
                            </div>
                        )}
                        {/* Filler Word Counter */}
                        <div className={`px-3 py-2 rounded-lg flex items-center gap-2 ${fillerWordCount > 10 ? 'bg-orange-600' : 'bg-neutral-700/80'
                            }`}>
                            <span className="text-xs text-white/70">Fillers:</span>
                            <span className="font-bold text-white">{fillerWordCount}</span>
                        </div>
                        {/* Response Time Display */}
                        {avgResponseTime !== null && (
                            <div className={`px-3 py-2 rounded-lg flex items-center gap-2 ${avgResponseTime > 10 ? 'bg-red-600/80' : avgResponseTime > 5 ? 'bg-yellow-600/80' : 'bg-green-600/80'
                                }`}>
                                <span className="text-xs text-white/70">Avg Response:</span>
                                <span className="font-bold text-white">{avgResponseTime.toFixed(1)}s</span>
                            </div>
                        )}
                        {/* Confidence Score Display */}
                        {confidenceScore !== null && (
                            <div className={`px-3 py-2 rounded-lg flex items-center gap-2 ${confidenceScore >= 80 ? 'bg-green-600/80' :
                                confidenceScore >= 60 ? 'bg-blue-600/80' :
                                    confidenceScore >= 40 ? 'bg-yellow-600/80' : 'bg-red-600/80'
                                }`}>
                                <span className="text-xs text-white/70">Confidence:</span>
                                <span className="font-bold text-white">{confidenceScore}%</span>
                            </div>
                        )}
                        {/* Practice Mode Badge */}
                        {isPracticeMode && (
                            <div className="px-3 py-2 rounded-lg bg-yellow-600/30 border border-yellow-500/50 text-yellow-200 text-sm">
                                Practice Mode
                            </div>
                        )}
                        <Button
                            onClick={endInterview}
                            disabled={isEndingInterview}
                            className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                        >
                            <Square className="w-4 h-4" />
                            {isEndingInterview ? 'Ending...' : 'End Interview'}
                        </Button>
                    </div>
                </>
            )}

            {violationCount > 0 && (
                <div className="fixed top-4 right-4 z-50">
                    <Alert variant="destructive" className="w-64 bg-red-900 border-red-700 text-white">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>Warning</AlertTitle>
                        <AlertDescription>
                            Focus violation detection! ({violationCount}/3)
                        </AlertDescription>
                    </Alert>
                </div>
            )}
        </div>
    );
}
