
"use client";

import { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from "next/navigation";
import { useAuth } from '@/components/auth-provider';
import { getChangeLogsAction, getAdminsAction } from '@/app/actions';
import { type LogEntry } from '@/services/log-service';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { ArrowLeft, Loader2, ShieldAlert, History, Search, Download, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { format } from 'date-fns';

type ProcessedLogEntry = Omit<LogEntry, 'timestamp' | 'id'> & { timestamp: string };

const downloadAsCSV = (logs: ProcessedLogEntry[], filename: string) => {
    if (logs.length === 0) return;
    
    const headers = ['Timestamp', 'User Name', 'User Email', 'Roles', 'Action'];
    const csvRows = [
        headers.join(','),
        ...logs.map(log => {
            const row = [
                `"${format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss")}"`,
                `"${log.user.name}"`,
                `"${log.user.email}"`,
                `"${log.user.roles.join('; ')}"`,
                `"${log.action.replace(/"/g, '""')}"`
            ];
            return row.join(',');
        })
    ];

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};


function ChangelogPageComponent() {
    const { user: authUser } = useAuth();
    const [logs, setLogs] = useState<ProcessedLogEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [authStatus, setAuthStatus] = useState<'loading' | 'admin' | 'unauthorized'>('loading');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);
    const searchParams = useSearchParams();

    const SUPER_USER_ACCESS_KEY = "f3a9b5c1-8d7e-4f6a-9c2b-1a0d9e8c7b6a-f3a9b5c1-8d7e-4f6a-9c2b-1a0d9e8c7b6a";

    useEffect(() => {
        const checkAdminStatus = async () => {
            if (!authUser?.email) {
                setAuthStatus('unauthorized');
                setIsLoading(false);
                return;
            }
            
            const secretKey = searchParams.get('super_user_access_key');
            if (secretKey === SUPER_USER_ACCESS_KEY) {
                setAuthStatus('admin');
                return;
            }

            try {
                const adminEmails = await getAdminsAction();
                const lowerCaseAdminEmails = adminEmails.map(email => email.toLowerCase());
                if (lowerCaseAdminEmails.includes(authUser.email.toLowerCase())) {
                    setAuthStatus('admin');
                } else {
                    setAuthStatus('unauthorized');
                }
            } catch (error) {
                console.error("Failed to check admin status:", error);
                setAuthStatus('unauthorized');
            }
        };
        checkAdminStatus();
    }, [authUser, searchParams]);

    useEffect(() => {
        if (authStatus === 'admin') {
            setIsLoading(true);
            getChangeLogsAction()
                .then(data => {
                    setLogs(data as ProcessedLogEntry[]);
                })
                .catch(console.error)
                .finally(() => setIsLoading(false));
        } else if (authStatus === 'unauthorized') {
            setIsLoading(false);
        }
    }, [authStatus]);

    const filteredLogs = useMemo(() => {
        if (!searchQuery) return logs;
        const lowercasedQuery = searchQuery.toLowerCase();
        return logs.filter(log =>
            log.user.name.toLowerCase().includes(lowercasedQuery) ||
            log.user.email.toLowerCase().includes(lowercasedQuery) ||
            log.action.toLowerCase().includes(lowercasedQuery) ||
            log.user.roles.some(role => role.toLowerCase().includes(lowercasedQuery))
        );
    }, [searchQuery, logs]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, itemsPerPage]);

    const paginatedLogs = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredLogs, currentPage, itemsPerPage]);

    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-pulse"><Logo /></div>
                    <p className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /> Verifying access and loading logs...</p>
                </div>
            </div>
        );
    }

    if (authStatus !== 'admin') {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-center">
                <div className="flex flex-col items-center gap-4">
                    <ShieldAlert className="h-16 w-16 text-destructive" />
                    <h1 className="text-3xl font-bold">Access Denied</h1>
                    <p className="text-muted-foreground">You must be an administrator to view this page.</p>
                    <Button asChild>
                        <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Go to Dashboard</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
            <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" asChild>
                            <Link href="/admin"><ArrowLeft className="h-4 w-4" /></Link>
                        </Button>
                        <div className="flex items-center gap-4">
                            <Logo />
                            <div className="flex flex-col">
                                <h1 className="text-2xl font-bold tracking-tight">Change Log</h1>
                                <p className="text-sm text-muted-foreground">Audit trail of all user actions</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between gap-4">
                            <div>
                                <CardTitle className="flex items-center gap-2"><History />Activity Feed</CardTitle>
                                <CardDescription>A record of all significant actions taken within the application.</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="relative w-full max-w-sm">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="search"
                                        placeholder="Search logs..."
                                        className="pl-8"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <Button variant="outline" onClick={() => downloadAsCSV(filteredLogs, 'changelog.csv')}>
                                    <Download className="mr-2 h-4 w-4" />
                                    Download CSV
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-auto rounded-lg border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[200px]">Timestamp</TableHead>
                                        <TableHead>User</TableHead>
                                        <TableHead>Roles</TableHead>
                                        <TableHead>Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginatedLogs.length > 0 ? (
                                        paginatedLogs.map((log) => (
                                            <TableRow key={`${log.timestamp}-${log.user.email}`}>
                                                <TableCell>
                                                    {format(new Date(log.timestamp), "dd MMM yyyy, hh:mm:ss a")}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{log.user.name}</div>
                                                    <div className="text-xs text-muted-foreground">{log.user.email}</div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        {log.user.roles.map(role => (
                                                            <Badge key={role} variant="secondary">{role}</Badge>
                                                        ))}
                                                    </div>
                                                </TableCell>
                                                <TableCell>{log.action}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">
                                                {searchQuery ? "No logs found matching your search." : "No activity has been logged yet."}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        <div className="flex items-center justify-between pt-4">
                            <div className="text-sm text-muted-foreground">
                                Showing {paginatedLogs.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to {Math.min(currentPage * itemsPerPage, filteredLogs.length)} of {filteredLogs.length} entries.
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                     <p className="text-sm font-medium">Rows per page</p>
                                     <Select
                                        value={`${itemsPerPage}`}
                                        onValueChange={(value) => setItemsPerPage(Number(value))}
                                     >
                                        <SelectTrigger className="h-8 w-[70px]">
                                            <SelectValue placeholder={itemsPerPage} />
                                        </SelectTrigger>
                                        <SelectContent side="top">
                                            {[10, 25, 50, 100].map(size => (
                                                <SelectItem key={size} value={`${size}`}>{size}</SelectItem>
                                            ))}
                                        </SelectContent>
                                     </Select>
                                </div>
                                <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                                    Page {currentPage} of {totalPages}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}><ChevronsLeft className="h-4 w-4" /></Button>
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button>
                                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}><ChevronsRight className="h-4 w-4" /></Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}

export default function ChangelogPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ChangelogPageComponent />
        </Suspense>
    );
}
