"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea"; // Need to ensure Textarea is added
import { useState } from "react";

export function ReportErrorModal() {
    const [isOpen, setIsOpen] = useState(false);

    const handleSubmit = () => {
        // Mock submission
        alert("Report submitted. Thank you.");
        setIsOpen(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" className="text-neutral-400 hover:text-white">Report Error</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-neutral-800 text-white border-neutral-700">
                <DialogHeader>
                    <DialogTitle>Report an Issue</DialogTitle>
                    <DialogDescription className="text-neutral-400">
                        Encountered a bug or problem? Let us know.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Textarea
                        placeholder="Describe the issue..."
                        className="bg-neutral-900 border-neutral-700 text-white"
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)} className="text-black">Cancel</Button>
                    <Button onClick={handleSubmit} className="bg-red-600 hover:bg-red-700">Submit Report</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
