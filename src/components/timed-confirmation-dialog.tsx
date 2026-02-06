
"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

interface TimedConfirmationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    countdownSeconds: number;
    title: string;
    description: string;
    confirmButtonText: string;
    icon?: ReactNode;
}

export function TimedConfirmationDialog({
    open,
    onOpenChange,
    onConfirm,
    countdownSeconds,
    title,
    description,
    confirmButtonText,
    icon = <AlertTriangle className="text-destructive"/>
}: TimedConfirmationDialogProps) {
    const [countdown, setCountdown] = useState(countdownSeconds);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (open) {
            setCountdown(countdownSeconds);
            timerRef.current = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current!);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [open, countdownSeconds]);

    const handleAction = () => {
        onConfirm();
        onOpenChange(false);
    }
    
    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        {icon}
                        {title}
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleAction} disabled={countdown > 0}>
                        {countdown > 0 ? `${confirmButtonText} (${countdown})` : confirmButtonText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

    