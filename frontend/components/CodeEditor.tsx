"use client";

import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Code, ChevronDown } from 'lucide-react';

const LANGUAGES = [
    { id: 'javascript', label: 'JavaScript', icon: '🟨' },
    { id: 'typescript', label: 'TypeScript', icon: '🔷' },
    { id: 'python', label: 'Python', icon: '🐍' },
    { id: 'java', label: 'Java', icon: '☕' },
    { id: 'cpp', label: 'C++', icon: '⚙️' },
    { id: 'csharp', label: 'C#', icon: '💜' },
    { id: 'go', label: 'Go', icon: '🔵' },
    { id: 'rust', label: 'Rust', icon: '🦀' },
    { id: 'sql', label: 'SQL', icon: '🗃️' },
];

const DEFAULT_CODE: Record<string, string> = {
    javascript: '// Write your JavaScript solution here\nfunction solution() {\n    \n}\n',
    typescript: '// Write your TypeScript solution here\nfunction solution(): void {\n    \n}\n',
    python: '# Write your Python solution here\ndef solution():\n    pass\n',
    java: '// Write your Java solution here\npublic class Solution {\n    public static void main(String[] args) {\n        \n    }\n}\n',
    cpp: '// Write your C++ solution here\n#include <iostream>\n\nint main() {\n    \n    return 0;\n}\n',
    csharp: '// Write your C# solution here\nusing System;\n\npublic class Solution {\n    public static void Main() {\n        \n    }\n}\n',
    go: '// Write your Go solution here\npackage main\n\nfunc main() {\n    \n}\n',
    rust: '// Write your Rust solution here\nfn main() {\n    \n}\n',
    sql: '-- Write your SQL query here\nSELECT * FROM table_name;\n',
};

interface CodeEditorProps {
    onCodeChange?: (code: string, language: string) => void;
    preventPaste?: boolean;
}

export default function CodeEditor({ onCodeChange, preventPaste = true }: CodeEditorProps) {
    const [language, setLanguage] = useState('javascript');
    const [code, setCode] = useState(DEFAULT_CODE.javascript);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const handleLanguageChange = (newLang: string) => {
        setLanguage(newLang);
        setCode(DEFAULT_CODE[newLang] || '// Write your code here');
        setIsDropdownOpen(false);
    };

    const handleEditorChange = (value: string | undefined) => {
        const newCode = value || '';
        setCode(newCode);
        onCodeChange?.(newCode, language);
    };

    const handleEditorMount = (editor: any) => {
        if (preventPaste) {
            // Disable paste in the editor
            editor.onKeyDown((e: any) => {
                if ((e.ctrlKey || e.metaKey) && e.keyCode === 52) { // 52 is 'V'
                    e.preventDefault();
                    e.stopPropagation();
                }
            });
        }
    };

    const currentLang = LANGUAGES.find(l => l.id === language);

    return (
        <div className="flex flex-col h-full bg-neutral-900 rounded-xl overflow-hidden border border-neutral-700">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 bg-neutral-800 border-b border-neutral-700">
                <div className="flex items-center gap-2 text-sm text-neutral-300">
                    <Code className="w-4 h-4 text-purple-400" />
                    <span>Code Editor</span>
                </div>

                {/* Language Selector */}
                <div className="relative">
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-neutral-700 hover:bg-neutral-600 rounded-lg text-sm transition-colors"
                    >
                        <span>{currentLang?.icon}</span>
                        <span className="text-white">{currentLang?.label}</span>
                        <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isDropdownOpen && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl z-50 overflow-hidden">
                            {LANGUAGES.map((lang) => (
                                <button
                                    key={lang.id}
                                    onClick={() => handleLanguageChange(lang.id)}
                                    className={`w-full flex items-center gap-3 px-4 py-2 text-left text-sm hover:bg-neutral-700 transition-colors ${language === lang.id ? 'bg-purple-600/30 text-purple-200' : 'text-neutral-300'
                                        }`}
                                >
                                    <span>{lang.icon}</span>
                                    <span>{lang.label}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Editor */}
            <div className="flex-1">
                <Editor
                    height="100%"
                    language={language}
                    value={code}
                    onChange={handleEditorChange}
                    onMount={handleEditorMount}
                    theme="vs-dark"
                    options={{
                        fontSize: 14,
                        fontFamily: "'Fira Code', 'Cascadia Code', monospace",
                        minimap: { enabled: false },
                        lineNumbers: 'on',
                        roundedSelection: true,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 4,
                        wordWrap: 'on',
                        padding: { top: 10 },
                    }}
                />
            </div>

            {/* Footer hint */}
            {preventPaste && (
                <div className="px-4 py-1.5 bg-neutral-800 border-t border-neutral-700 text-xs text-neutral-500">
                    💡 Paste is disabled to simulate real coding interviews
                </div>
            )}
        </div>
    );
}
