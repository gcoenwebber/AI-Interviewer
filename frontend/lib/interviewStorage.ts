// Interview storage with Supabase (primary) and localStorage (fallback)

import { getSupabaseClient } from './supabaseClient';

export interface InterviewStats {
    confidenceScore: number | null;
    fillerWordCount: number;
    totalWordCount: number;
    avgResponseTime: number | null;
    responseCount: number;
}

export interface SavedInterview {
    id: string;
    name: string;
    date: string;
    report: string;
    analysis: string;
    transcript: string;
    stats?: InterviewStats;
}

const STORAGE_KEY = 'talentscout_interviews';
const TABLE_NAME = 'interviews';

// ==================== LOCAL STORAGE FUNCTIONS ====================

function getLocalInterviews(): SavedInterview[] {
    if (typeof window === 'undefined') return [];
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        return [];
    }
}

function saveLocalInterview(interview: SavedInterview): void {
    const interviews = getLocalInterviews();
    interviews.unshift(interview);
    const trimmed = interviews.slice(0, 20);
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

function updateLocalInterview(id: string, updates: Partial<SavedInterview>): boolean {
    const interviews = getLocalInterviews();
    const index = interviews.findIndex(i => i.id === id);
    if (index === -1) return false;

    interviews[index] = { ...interviews[index], ...updates };
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(interviews));
        return true;
    } catch {
        return false;
    }
}

function deleteLocalInterview(id: string): boolean {
    const interviews = getLocalInterviews();
    const filtered = interviews.filter(i => i.id !== id);
    if (filtered.length === interviews.length) return false;

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        return true;
    } catch {
        return false;
    }
}

// ==================== SUPABASE FUNCTIONS ====================

async function getSupabaseInterviews(): Promise<SavedInterview[] | null> {
    const supabase = getSupabaseClient();
    if (!supabase) return null;

    try {
        const { data, error } = await supabase
            .from(TABLE_NAME)
            .select('*')
            .order('date', { ascending: false })
            .limit(20);

        if (error) throw error;
        return data as SavedInterview[];
    } catch (error) {
        console.error('Supabase getInterviews error:', error);
        return null;
    }
}

async function saveSupabaseInterview(interview: SavedInterview): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    try {
        const { error } = await supabase
            .from(TABLE_NAME)
            .insert([interview]);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Supabase saveInterview error:', error);
        return false;
    }
}

async function updateSupabaseInterview(id: string, updates: Partial<SavedInterview>): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    try {
        const { error } = await supabase
            .from(TABLE_NAME)
            .update(updates)
            .eq('id', id);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Supabase updateInterview error:', error);
        return false;
    }
}

async function deleteSupabaseInterview(id: string): Promise<boolean> {
    const supabase = getSupabaseClient();
    if (!supabase) return false;

    try {
        const { error } = await supabase
            .from(TABLE_NAME)
            .delete()
            .eq('id', id);

        if (error) throw error;
        return true;
    } catch (error) {
        console.error('Supabase deleteInterview error:', error);
        return false;
    }
}

// ==================== HYBRID API (Supabase first, localStorage fallback) ====================

// Get all saved interviews
export async function getInterviews(): Promise<SavedInterview[]> {
    // Try Supabase first
    const supabaseData = await getSupabaseInterviews();
    if (supabaseData !== null) {
        console.log('Loaded interviews from Supabase');
        return supabaseData;
    }

    // Fallback to localStorage
    console.log('Using localStorage fallback');
    return getLocalInterviews();
}

// Synchronous version for initial render
export function getInterviewsSync(): SavedInterview[] {
    return getLocalInterviews();
}

// Save a new interview
export async function saveInterview(
    report: string,
    analysis: string,
    transcript: string,
    stats?: InterviewStats
): Promise<SavedInterview> {
    const now = new Date();
    const id = `interview_${now.getTime()}`;
    const name = now.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    const newInterview: SavedInterview = {
        id,
        name,
        date: now.toISOString(),
        report,
        analysis,
        transcript,
        stats
    };

    // Always save to localStorage for immediate access
    saveLocalInterview(newInterview);

    // Try to save to Supabase
    const supabaseSuccess = await saveSupabaseInterview(newInterview);
    if (supabaseSuccess) {
        console.log('Interview saved to Supabase');
    } else {
        console.log('Interview saved to localStorage only');
    }

    return newInterview;
}

// Rename an interview
export async function renameInterview(id: string, newName: string): Promise<boolean> {
    // Update localStorage
    updateLocalInterview(id, { name: newName });

    // Try Supabase
    const supabaseSuccess = await updateSupabaseInterview(id, { name: newName });
    return supabaseSuccess || updateLocalInterview(id, { name: newName });
}

// Delete an interview
export async function deleteInterview(id: string): Promise<boolean> {
    // Delete from localStorage
    deleteLocalInterview(id);

    // Try Supabase
    await deleteSupabaseInterview(id);
    return true;
}

// Get a single interview by ID
export async function getInterviewById(id: string): Promise<SavedInterview | null> {
    const interviews = await getInterviews();
    return interviews.find(i => i.id === id) || null;
}

// Download interview as PDF file
export function downloadInterview(interview: SavedInterview): void {
    // Use jsPDF for PDF generation
    import('jspdf').then(({ jsPDF }) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20;
        const maxWidth = pageWidth - margin * 2;
        let y = 20;

        // Helper to add text with word wrap
        const addText = (text: string, fontSize: number = 11, isBold: boolean = false) => {
            doc.setFontSize(fontSize);
            doc.setFont('helvetica', isBold ? 'bold' : 'normal');
            const lines = doc.splitTextToSize(text, maxWidth);
            lines.forEach((line: string) => {
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
                doc.text(line, margin, y);
                y += fontSize * 0.5;
            });
            y += 3;
        };

        // Helper to add section header
        const addHeader = (text: string) => {
            y += 5;
            doc.setFillColor(103, 58, 183); // Purple
            doc.rect(margin - 5, y - 6, maxWidth + 10, 10, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(text, margin, y);
            doc.setTextColor(0, 0, 0);
            y += 12;
        };

        // Title
        doc.setFillColor(103, 58, 183);
        doc.rect(0, 0, pageWidth, 35, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('INTERVIEW REPORT CARD', pageWidth / 2, 18, { align: 'center' });
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.text(`${interview.name} | ${new Date(interview.date).toLocaleDateString()}`, pageWidth / 2, 28, { align: 'center' });
        doc.setTextColor(0, 0, 0);
        y = 50;

        // Stats Section - Always show with fallback values
        addHeader('INTERVIEW STATISTICS');
        const stats = interview.stats || {
            confidenceScore: null,
            fillerWordCount: 0,
            totalWordCount: 0,
            avgResponseTime: null,
            responseCount: 0
        };
        console.log('PDF Stats:', stats); // Debug
        addText(`1. Confidence Score: ${stats.confidenceScore !== null && stats.confidenceScore !== undefined ? stats.confidenceScore + '%' : 'N/A'}`, 11);
        addText(`2. Filler Words Used: ${stats.fillerWordCount || 0}`, 11);
        addText(`3. Total Words Spoken: ${stats.totalWordCount || 0}`, 11);
        addText(`4. Average Response Time: ${stats.avgResponseTime ? stats.avgResponseTime.toFixed(1) + 's' : 'N/A'}`, 11);
        addText(`5. Number of Responses: ${stats.responseCount || 0}`, 11);
        y += 5;

        // Report Section
        addHeader('AI EVALUATION');
        // Convert bullet points to numbers in report
        const reportWithNumbers = interview.report
            .replace(/^[\-\•]\s*/gm, '')
            .split('\n')
            .filter(line => line.trim())
            .map((line, i) => line.trim().match(/^\d+\./) ? line : line)
            .join('\n');
        addText(reportWithNumbers, 10);

        // Analysis Section
        if (interview.analysis && interview.analysis.trim()) {
            addHeader('RESUME ANALYSIS');
            addText(interview.analysis, 10);
        }

        // Transcript Section (on new page if needed)
        if (interview.transcript && interview.transcript.trim()) {
            doc.addPage();
            y = 20;
            addHeader('CONVERSATION TRANSCRIPT');
            const transcriptLines = interview.transcript.split('\n');
            transcriptLines.forEach((line, idx) => {
                if (line.trim()) {
                    const numberedLine = `${idx + 1}. ${line.trim()}`;
                    addText(numberedLine, 9);
                }
            });
        }

        // Footer on each page
        const pageCount = doc.internal.pages.length - 1;
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);
            doc.text(`Page ${i} of ${pageCount} | AI Dronacharya Interview Platform`, pageWidth / 2, 290, { align: 'center' });
        }

        // Save PDF
        const filename = `${interview.name.replace(/[^a-z0-9]/gi, '_')}_report.pdf`;
        doc.save(filename);
    }).catch(err => {
        console.error('Failed to generate PDF:', err);
        // Fallback to text file
        const content = `INTERVIEW REPORT\n\nName: ${interview.name}\nDate: ${new Date(interview.date).toLocaleString()}\n\n${interview.report}`;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${interview.name.replace(/[^a-z0-9]/gi, '_')}_report.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}
