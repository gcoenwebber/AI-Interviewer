"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    getInterviews,
    getInterviewsSync,
    renameInterview,
    deleteInterview,
    downloadInterview,
    SavedInterview
} from "@/lib/interviewStorage";
import { FileText, Download, Trash2, Edit2, Check, X, Home, Plus, Loader2 } from "lucide-react";

export default function ResultsDashboard() {
    const router = useRouter();
    const [interviews, setInterviews] = useState<SavedInterview[]>(getInterviewsSync());
    const [selectedInterview, setSelectedInterview] = useState<SavedInterview | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [isLoading, setIsLoading] = useState(true);

    // Load interviews on mount (async to try Supabase first)
    useEffect(() => {
        async function loadInterviews() {
            setIsLoading(true);
            const data = await getInterviews();
            setInterviews(data);
            setIsLoading(false);
        }
        loadInterviews();
    }, []);

    // Start editing name
    const startEditing = (interview: SavedInterview) => {
        setEditingId(interview.id);
        setEditName(interview.name);
    };

    // Save edited name
    const saveEditing = async () => {
        if (editingId && editName.trim()) {
            await renameInterview(editingId, editName.trim());
            const data = await getInterviews();
            setInterviews(data);
            setEditingId(null);
            setEditName("");
        }
    };

    // Cancel editing
    const cancelEditing = () => {
        setEditingId(null);
        setEditName("");
    };

    // Delete interview
    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this interview?")) {
            await deleteInterview(id);
            const data = await getInterviews();
            setInterviews(data);
            if (selectedInterview?.id === id) {
                setSelectedInterview(null);
            }
        }
    };

    // List view - no interview selected
    if (!selectedInterview) {
        return (
            <div className="p-8 gradient-bg min-h-screen text-white">
                <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-4xl font-bold gradient-text">Interview History</h1>
                            <p className="text-purple-300/60 mt-1">Review your past interviews and performance</p>
                        </div>
                        <Button
                            onClick={() => router.push('/interview')}
                            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 flex items-center gap-2 px-6 py-3 rounded-xl shadow-lg shadow-purple-900/50"
                        >
                            <Plus className="w-5 h-5" />
                            New Interview
                        </Button>
                    </div>

                    {interviews.length === 0 ? (
                        <Card className="glass-card border-purple-500/20 glow-border">
                            <CardContent className="p-16 text-center">
                                <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 flex items-center justify-center">
                                    <FileText className="w-10 h-10 text-purple-400" />
                                </div>
                                <h2 className="text-2xl font-semibold text-white mb-3">No interviews yet</h2>
                                <p className="text-purple-200/60 mb-8 max-w-sm mx-auto">Complete an interview to see your results, transcripts, and AI feedback here.</p>
                                <Button
                                    onClick={() => router.push('/interview')}
                                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 px-8 py-4 rounded-xl text-lg shadow-lg shadow-purple-900/50"
                                >
                                    Start Your First Interview
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {interviews.map((interview) => (
                                <Card
                                    key={interview.id}
                                    className="bg-neutral-800 border-neutral-700 hover:border-purple-600 transition-colors cursor-pointer"
                                >
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div
                                            className="flex-1"
                                            onClick={() => setSelectedInterview(interview)}
                                        >
                                            {editingId === interview.id ? (
                                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                    <Input
                                                        value={editName}
                                                        onChange={(e) => setEditName(e.target.value)}
                                                        className="bg-neutral-700 border-neutral-600 text-white w-64"
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') saveEditing();
                                                            if (e.key === 'Escape') cancelEditing();
                                                        }}
                                                        autoFocus
                                                    />
                                                    <Button size="sm" onClick={saveEditing} className="bg-green-600 hover:bg-green-700 p-2">
                                                        <Check className="w-4 h-4" />
                                                    </Button>
                                                    <Button size="sm" onClick={cancelEditing} variant="outline" className="p-2">
                                                        <X className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            ) : (
                                                <>
                                                    <h3 className="text-lg font-semibold text-white">{interview.name}</h3>
                                                    <p className="text-sm text-neutral-400">
                                                        {new Date(interview.date).toLocaleDateString('en-US', {
                                                            weekday: 'long',
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => startEditing(interview)}
                                                className="border-neutral-600 text-neutral-300 hover:bg-neutral-700"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => downloadInterview(interview)}
                                                className="border-neutral-600 text-neutral-300 hover:bg-neutral-700"
                                            >
                                                <Download className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleDelete(interview.id)}
                                                className="border-red-600 text-red-400 hover:bg-red-900/30"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}

                    <div className="mt-8">
                        <Button
                            onClick={() => router.push('/')}
                            variant="outline"
                            className="border-neutral-600 text-neutral-300 hover:bg-neutral-700 flex items-center gap-2"
                        >
                            <Home className="w-4 h-4" />
                            Back to Home
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // Detail view - interview selected
    return (
        <div className="p-8 bg-neutral-900 min-h-screen text-white">
            <div className="max-w-4xl mx-auto">
                <Button
                    onClick={() => setSelectedInterview(null)}
                    variant="outline"
                    className="mb-6 border-neutral-600 text-neutral-300 hover:bg-neutral-700"
                >
                    ← Back to Interview List
                </Button>

                <Card className="bg-neutral-800 border-neutral-700 mb-6">
                    <CardHeader>
                        <CardTitle className="text-white text-2xl">{selectedInterview.name}</CardTitle>
                        <p className="text-neutral-400">
                            {new Date(selectedInterview.date).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}
                        </p>
                    </CardHeader>
                </Card>

                <Card className="bg-neutral-800 border-neutral-700 mb-6">
                    <CardHeader>
                        <CardTitle className="text-white">Report</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="whitespace-pre-wrap text-sm text-neutral-200 font-mono bg-neutral-900 p-4 rounded-lg max-h-96 overflow-y-auto">
                            {selectedInterview.report}
                        </pre>
                    </CardContent>
                </Card>

                {selectedInterview.transcript && (
                    <Card className="bg-neutral-800 border-neutral-700 mb-6">
                        <CardHeader>
                            <CardTitle className="text-white">Conversation Transcript</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <pre className="whitespace-pre-wrap text-sm text-neutral-200 font-mono bg-neutral-900 p-4 rounded-lg max-h-96 overflow-y-auto">
                                {selectedInterview.transcript}
                            </pre>
                        </CardContent>
                    </Card>
                )}

                <div className="flex gap-3">
                    <Button
                        onClick={() => downloadInterview(selectedInterview)}
                        className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Download Report
                    </Button>
                    <Button
                        onClick={() => router.push('/interview')}
                        className="bg-purple-600 hover:bg-purple-700"
                    >
                        Start New Interview
                    </Button>
                </div>
            </div>
        </div>
    );
}
