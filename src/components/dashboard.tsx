
"use client";

import React, { useState, useMemo, useEffect, useRef, type FC, type ForwardedRef } from 'react';
import Link from "next/link";
import { format } from 'date-fns';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Users, Briefcase, CheckCircle, Settings, Globe, LogOut, ChevronsUpDown, ChevronDown, ChevronRight, Search, ListTree, Building, Lock, Unlock, Group, Target, Eye, ArrowUp, ArrowDown, FileText, Loader2, Share, Printer, Download, ShieldAlert, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { updateUserAction, saveLockStatusAction, getDashboardDataAction } from "@/app/actions";
import type { User } from "@/ai/schemas/workspace-users";
import { ThemeToggle } from "@/components/theme-toggle";
import { Logo } from "@/components/logo";
import { useAuth } from "./auth-provider";
import type { Roles } from "@/lib/local-storage";
import { Badge } from "./ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { TimedConfirmationDialog } from './timed-confirmation-dialog';

type StatCardProps = {
  title: string;
  value: React.ReactNode;
  icon: React.ReactNode;
  onClick?: () => void;
  isActive?: boolean;
  className?: string;
};

type UserRole = "ADMIN" | "GROUP_HEAD" | "DELEGATE" | "READ_ONLY";

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(({
  title,
  value,
  icon,
  onClick,
  isActive,
  className,
}, ref) => (
  <Card
    ref={ref}
    className={cn(
      "transition-all duration-300",
      onClick && "cursor-pointer hover:border-primary",
      isActive && "border-primary ring-2 ring-primary",
      className
    )}
    onClick={onClick}
  >
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">
        {value}
      </div>
    </CardContent>
  </Card>
));
StatCard.displayName = "StatCard";

const FloatingStatCard: FC<Pick<StatCardProps, 'title' | 'value' | 'onClick' | 'isActive'>> = ({ title, value, onClick, isActive }) => (
    <Card
        className={cn(
            "transition-all duration-300 w-auto min-w-56 shadow-lg",
            onClick && "cursor-pointer hover:border-primary",
            isActive && "border-primary ring-2 ring-primary"
        )}
        onClick={onClick}
    >
        <CardContent className="p-3">
            <div className="flex justify-between items-center gap-4">
                <p className="text-xs font-medium text-muted-foreground whitespace-nowrap">{title}</p>
                <p className="text-lg font-bold whitespace-nowrap">{value}</p>
            </div>
        </CardContent>
    </Card>
);

const PrintHeader = () => {
    const [printDate, setPrintDate] = useState('');

    useEffect(() => {
        const now = new Date();
        setPrintDate(now.toLocaleString());
    }, []);

    return (
        <div id="print-header" className="hidden print-visible">
            <div className="flex justify-between items-center mb-4 border-b-2 border-black pb-2">
                <Logo forceTheme="light" />
                <div className="text-center">
                    <h1 className="text-lg font-bold">The 300: Microsoft License Allocation</h1>
                </div>
                <div className="text-right text-xs">
                    <p>Printed on:</p>
                    <p>{printDate}</p>
                </div>
            </div>
            <h2 className="text-base font-semibold mb-2">LOB Allocation Summary</h2>
        </div>
    );
};

const useEmployeeData = (authUser: any) => {
  const [allEmployees, setAllEmployees] = useState<User[]>([]);
  const [roles, setRoles] = useState<Record<string, Roles>>({});
  const [admins, setAdmins] = useState<string[]>([]);
  const [reasons, setReasons] = useState<string[]>([]);
  const [lobLocks, setLobLocks] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const [summaryViewLobs, setSummaryViewLobs] = useState<string[]>([]);
  const [summaryViewDelegateLobs, setSummaryViewDelegateLobs] = useState<string[]>([]);
  const [consolidatedViewUsers, setConsolidatedViewUsers] = useState<string[]>([]);

  useEffect(() => {
    if (!authUser) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await getDashboardDataAction();
        
        const fetchedUsers = data.users || [];
        const uniqueUsersMap = new Map<string, User>();
        fetchedUsers.forEach(user => {
          if (user.id) {
            uniqueUsersMap.set(user.id, user);
          }
        });
        const uniqueUsers = Array.from(uniqueUsersMap.values());
        setAllEmployees(uniqueUsers);

        setRoles(data.roles || {});
        setAdmins(data.admins || []);
        setReasons(data.reasons || []);
        setSummaryViewLobs(data.summaryViewLobs || []);
        setSummaryViewDelegateLobs(data.summaryViewDelegateLobs || []);
        setConsolidatedViewUsers(data.consolidatedViewUsers || []);
        setLobLocks(data.lobLocks || {});

      } catch (error: any) {
        console.error("Failed to fetch initial data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load application data. Please refresh.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [authUser, toast]);

  return { allEmployees, roles, admins, reasons, lobLocks, summaryViewLobs, summaryViewDelegateLobs, consolidatedViewUsers, isLoading, setAllEmployees, setLobLocks };
};

const MainContent = React.forwardRef<HTMLDivElement, MainContentProps>(({
  canSelect,
  searchQuery,
  setSearchQuery,
  allHodDepartments,
  handleHodToggleExpand,
  isHodAccordionExpanded,
  isLoading,
  lobEmployees,
  filteredEmployees,
  showOnlySelected,
  hodAccordionValue,
  setHodAccordionValue,
  groupedByDepartment,
  isLocked,
  reasons,
  handleSelectEmployee,
  handleReasonChange,
  handleItAccessChange,
  expandedRowId,
  setExpandedRowId,
  getModifierDisplay,
  userRoles,
  adminLobSelection,
  setAdminLobSelection,
  initialLob,
  linesOfBusiness,
}, ref) => (
    <Card ref={ref}>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>Employees</CardTitle>
            <CardDescription>
              {canSelect
                ? "Select employees from different departments."
                : "You are viewing in read-only mode."}
            </CardDescription>
          </div>
          <div className="flex flex-1 items-center justify-end gap-2">
            {userRoles.includes('ADMIN') && (
                <Select value={adminLobSelection} onValueChange={setAdminLobSelection}>
                    <SelectTrigger className="w-auto min-w-[250px] justify-start gap-2">
                        <SelectValue placeholder="Select Line of Business" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="user_lob">My Line of Business ({initialLob})</SelectItem>
                        <SelectItem value="all">All Lines of Business</SelectItem>
                        {linesOfBusiness.map(lob => (
                            lob !== initialLob && <SelectItem key={lob} value={lob}>{lob}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by name..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
             {allHodDepartments.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleHodToggleExpand}>
                <ChevronsUpDown className="mr-2 h-4 w-4" />
                {isHodAccordionExpanded ? "Collapse All" : "Expand All"}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pl-0">
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 py-2">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))}
          </div>
        ) : lobEmployees.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No employees found for your Line of Business. Try importing users in
            the Admin Panel.
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            {showOnlySelected
              ? "No employees have been selected."
              : "No employees found for your search query."}
          </div>
        ) : (
          <div className="overflow-auto rounded-lg border">
            <Accordion
              type="multiple"
              value={hodAccordionValue}
              onValueChange={setHodAccordionValue}
              className="w-full"
            >
              {Object.entries(groupedByDepartment).map(
                ([department, deptEmployees]) => (
                  <AccordionItem value={department} key={department}>
                    <AccordionTrigger className="px-4 py-2 hover:no-underline bg-muted/50">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-base">
                          {department}
                        </h3>
                        <span className="text-sm text-muted-foreground">
                          ({deptEmployees.length} employees)
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-12 px-4"></TableHead>
                            <TableHead className="w-10"></TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Designation</TableHead>
                            <TableHead>Manager</TableHead>
                            <TableHead>Location</TableHead>
                            <TableHead>Modifier</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {deptEmployees.map((employee) => (
                            <React.Fragment key={employee.id}>
                              <TableRow
                                data-state={!!employee.modifier && employee.reason ? "selected" : ""}
                                className={cn(canSelect && "cursor-pointer")}
                                onClick={(e) => {
                                  if (
                                    (e.target as HTMLElement).closest("[data-radix-collection-item]") ||
                                    (e.target as HTMLElement).closest('[type="checkbox"]') ||
                                    (e.target as HTMLElement).closest("button") ||
                                    (e.target as HTMLElement).closest("input") ||
                                    (e.target as HTMLElement).closest("[role='combobox']")
                                  ) {
                                    return;
                                  }
                                  setExpandedRowId(expandedRowId === employee.id ? null : employee.id);
                                }}
                              >
                                <TableCell className="px-4 w-12" onClick={(e) => e.stopPropagation()}>
                                  <Checkbox
                                    checked={!!employee.reason}
                                    onCheckedChange={() => handleSelectEmployee(employee)}
                                    aria-label={`Select ${employee.name}`}
                                    disabled={isLocked || !canSelect}
                                  />
                                </TableCell>
                                <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    className="p-1 rounded hover:bg-muted"
                                    aria-label={expandedRowId === employee.id ? "Collapse" : "Expand"}
                                    onClick={() => setExpandedRowId(expandedRowId === employee.id ? null : employee.id)}
                                  >
                                    {expandedRowId === employee.id ? (
                                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </button>
                                </TableCell>
                                <TableCell>
                                  <div className="font-medium">{employee.name}</div>
                                  <div className="text-xs text-muted-foreground">{employee.email}</div>
                                </TableCell>
                                <TableCell>{employee.designation}</TableCell>
                                <TableCell>{employee.manager}</TableCell>
                                <TableCell>
                                  <div>{employee.location}</div>
                                  <div className="text-xs text-muted-foreground">{employee.city}</div>
                                </TableCell>
                                <TableCell>
                                  {getModifierDisplay(employee.modifier, employee.modifiedAt)}
                                </TableCell>
                              </TableRow>
                              {expandedRowId === employee.id && (
                                <TableRow className="bg-muted/30 hover:bg-muted/30">
                                  <TableCell colSpan={7} className="p-4">
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 space-y-2" onClick={(e) => e.stopPropagation()}>
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                          <Checkbox
                                            id={`${employee.id}-internet`}
                                            checked={!!employee.internetAccess}
                                            onCheckedChange={(checked) => handleItAccessChange(employee, { internetAccess: !!checked })}
                                            disabled={isLocked || !canSelect}
                                          />
                                          <span className="text-sm font-medium">Internet access</span>
                                        </div>
                                        {employee.internetAccess && (
                                          <Input
                                            placeholder="Sites to unblock (optional)"
                                            value={employee.requestedSitesToUnblock ?? ""}
                                            onChange={(e) => handleItAccessChange(employee, { requestedSitesToUnblock: e.target.value })}
                                            className="text-sm"
                                            disabled={isLocked || !canSelect}
                                          />
                                        )}
                                      </div>
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                          <Checkbox
                                            id={`${employee.id}-external-email`}
                                            checked={!!employee.externalEmailSending}
                                            onCheckedChange={(checked) => handleItAccessChange(employee, { externalEmailSending: !!checked })}
                                            disabled={isLocked || !canSelect}
                                          />
                                          <span className="text-sm font-medium">External email sending</span>
                                        </div>
                                        {employee.externalEmailSending && (
                                          <Input
                                            placeholder="Requested email recipients"
                                            value={employee.externalEmailRecipients ?? ""}
                                            onChange={(e) => handleItAccessChange(employee, { externalEmailRecipients: e.target.value })}
                                            className="text-sm"
                                            disabled={isLocked || !canSelect}
                                          />
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <Checkbox
                                          id={`${employee.id}-work-email-mobile`}
                                          checked={!!employee.workEmailMobile}
                                          onCheckedChange={(checked) => handleItAccessChange(employee, { workEmailMobile: !!checked })}
                                          disabled={isLocked || !canSelect}
                                        />
                                        <span className="text-sm font-medium">Work Email Setup on Mobile</span>
                                      </div>
                                      <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                          <Checkbox
                                            id={`${employee.id}-vpn`}
                                            checked={!!employee.vpnAccess}
                                            onCheckedChange={(checked) => handleItAccessChange(employee, { vpnAccess: !!checked, vpnType: checked ? employee.vpnType ?? "internal" : undefined })}
                                            disabled={isLocked || !canSelect}
                                          />
                                          <span className="text-sm font-medium">VPN Access</span>
                                        </div>
                                        {employee.vpnAccess && (
                                          <Select
                                            value={employee.vpnType ?? "internal"}
                                            onValueChange={(value: "internal" | "external") => handleItAccessChange(employee, { vpnType: value })}
                                            disabled={isLocked || !canSelect}
                                          >
                                            <SelectTrigger className="w-full text-sm">
                                              <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="internal">Internal</SelectItem>
                                              <SelectItem value="external">External</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        )}
                                      </div>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )}
                            </React.Fragment>
                          ))}
                        </TableBody>
                      </Table>
                    </AccordionContent>
                  </AccordionItem>
                )
              )}
            </Accordion>
          </div>
        )}
      </CardContent>
    </Card>
));
MainContent.displayName = 'MainContent';

type MainContentProps = {
  canSelect: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  allHodDepartments: string[];
  handleHodToggleExpand: () => void;
  isHodAccordionExpanded: boolean;
  isLoading: boolean;
  lobEmployees: User[];
  filteredEmployees: User[];
  showOnlySelected: boolean;
  hodAccordionValue: string[];
  setHodAccordionValue: (value: string[]) => void;
  groupedByDepartment: Record<string, User[]>;
  isLocked: boolean;
  reasons: string[];
  handleSelectEmployee: (employee: User) => void;
  handleReasonChange: (employee: User, reason: string) => void;
  handleItAccessChange: (employee: User, updates: Partial<Pick<User, "internetAccess" | "requestedSitesToUnblock" | "externalEmailSending" | "externalEmailRecipients" | "workEmailMobile" | "vpnAccess" | "vpnType">>) => void;
  expandedRowId: string | null;
  setExpandedRowId: (id: string | null) => void;
  getModifierDisplay: (modifier?: { name: string; email: string; }, modifiedAt?: string) => React.ReactNode;
  userRoles: UserRole[];
  adminLobSelection: string;
  setAdminLobSelection: (value: string) => void;
  initialLob: string | null;
  linesOfBusiness: string[];
};

export function Dashboard() {
  const { user: authUser } = useAuth();
  const { toast } = useToast();
  
  const { allEmployees, roles, admins, reasons, lobLocks, summaryViewLobs, summaryViewDelegateLobs, consolidatedViewUsers, isLoading, setAllEmployees, setLobLocks } = useEmployeeData(authUser);
  
  const [isLocked, setIsLocked] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [hodAccordionValue, setHodAccordionValue] = useState<string[]>([]);
  const [groupHeadAccordionValue, setGroupHeadAccordionValue] = useState<string[]>([]);
  const [consolidatedAccordionValue, setConsolidatedAccordionValue] = useState<string[]>([]);
  
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [activeTab, setActiveTab] = useState("allocation");
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  
  const [adminLobSelection, setAdminLobSelection] = useState<string>("user_lob");
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  const [showFloatingHodCard, setShowFloatingHodCard] = useState(false);
  const mainContentRef = useRef<HTMLDivElement>(null);
  
  type LobSummaryItem = ReturnType<typeof useLobSummary>['lobSummary'][0];
  const [sortConfig, setSortConfig] = useState<{ key: keyof LobSummaryItem | null; direction: 'ascending' | 'descending' }>({ key: 'lob', direction: 'ascending' });
  const [lobToManage, setLobToManage] = useState<{ lob: string, action: 'lock' | 'unlock' } | null>(null);

  const [dialogState, setDialogState] = useState<{
    open: boolean;
    type: 'lock' | 'unlock' | null;
  }>({ open: false, type: null });

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
         setShowFloatingHodCard(!entry.isIntersecting && entry.boundingClientRect.top < 0);
      },
      { rootMargin: "0px", threshold: 0 }
    );
  
    const currentRef = mainContentRef.current;
    if (currentRef && activeTab === 'allocation') {
      observer.observe(currentRef);
    }
    
    return () => {
        if(currentRef) {
          observer.unobserve(currentRef);
        }
        observer.disconnect();
    }
  }, [activeTab]);


  // Refs for debouncing updates
  const pendingUpdates = useRef<Map<string, User>>(new Map());
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const { currentUserProfile, initialLob } = useMemo(() => {
    if (!authUser || !allEmployees.length) {
      return { currentUserProfile: null, initialLob: null };
    }
    const profile = allEmployees.find(e => e.email.toLowerCase() === authUser.email!.toLowerCase());
    return { currentUserProfile: profile, initialLob: profile?.lineOfBusiness || null };
  }, [authUser, allEmployees]);
  
  const currentLob = useMemo(() => {
    if (userRoles.includes('ADMIN')) {
        if (adminLobSelection === 'all' || adminLobSelection === 'user_lob') {
            return initialLob;
        }
        return adminLobSelection;
    }
    return initialLob;
  }, [userRoles, adminLobSelection, initialLob]);

  useEffect(() => {
    if (!currentLob) return;
    setIsLocked(lobLocks[currentLob] || false);
  }, [currentLob, lobLocks]);

  useEffect(() => {
    if (!authUser || !admins.length) {
        return;
    }

    const determinedRoles: UserRole[] = [];
    const lowerCaseAdminEmails = admins.map(email => email.toLowerCase());
    const isUserAdmin = lowerCaseAdminEmails.includes(authUser.email!.toLowerCase());
    
    if (isUserAdmin) {
        determinedRoles.push("ADMIN");
    }
    
    // For non-admins, we need currentUserProfile and roles to determine GROUP_HEAD or DELEGATE
    if (currentUserProfile && Object.keys(roles).length > 0 && initialLob) {
        const lobRoles: Roles = roles[initialLob] || { groupHead: null, delegates: [] };
        const userProfileId = currentUserProfile.id;
        if (lobRoles.groupHead === userProfileId) {
            determinedRoles.push("GROUP_HEAD");
        }
        if (lobRoles.delegates.includes(userProfileId)) {
            determinedRoles.push("DELEGATE");
        }
    }
    
    if (determinedRoles.length === 0) {
        setUserRoles(["READ_ONLY"]);
    } else {
        setUserRoles(determinedRoles);
    }
  }, [authUser, currentUserProfile, roles, admins, initialLob]);

  const linesOfBusiness = useMemo(() => {
    return Array.from(new Set(allEmployees.map(e => e.lineOfBusiness))).sort();
  }, [allEmployees]);
  

  const lobEmployees = useMemo(() => {
    if (userRoles.includes('ADMIN')) {
        if (adminLobSelection === 'all') {
            return allEmployees;
        }
        const lobToFilter = adminLobSelection === 'user_lob' ? initialLob : adminLobSelection;
        return allEmployees.filter(e => e.lineOfBusiness === lobToFilter);
    } else if (initialLob) {
      return allEmployees.filter(e => e.lineOfBusiness === initialLob);
    }
    return [];
  }, [allEmployees, initialLob, userRoles, adminLobSelection]);
  
  const hodAccordionInitialized = useRef(false);
  useEffect(() => {
    if (isLoading || hodAccordionInitialized.current) return;
    
    if (lobEmployees.length > 0) {
      const deptKeys = Array.from(new Set(lobEmployees.map(e => e.department)));
      setHodAccordionValue(deptKeys);
      hodAccordionInitialized.current = true;
    } else {
      setHodAccordionValue([]);
    }
  }, [lobEmployees, isLoading]);
  
  // Effect to reset accordion when LOB changes
  useEffect(() => {
    hodAccordionInitialized.current = false;
  }, [currentLob]);


  const canSeeSummary = useMemo(() => {
    if (userRoles.includes("ADMIN")) return true;
    if (!currentUserProfile) return false;

    if (userRoles.includes("GROUP_HEAD")) {
        const userProfileId = currentUserProfile.id;
        const isGhForSummaryLob = Object.entries(roles).some(([lob, roleData]) => 
            roleData.groupHead === userProfileId && summaryViewLobs.includes(lob)
        );
        if (isGhForSummaryLob) return true;
    }
    if (userRoles.includes("DELEGATE")) {
        const userProfileId = currentUserProfile.id;
        const isDelegateForSummaryLob = Object.entries(roles).some(([lob, roleData]) => 
            roleData.delegates.includes(userProfileId) && summaryViewDelegateLobs.includes(lob)
        );
        if (isDelegateForSummaryLob) return true;
    }

    return false;
  }, [userRoles, currentUserProfile, roles, summaryViewLobs, summaryViewDelegateLobs]);

 const canSeeConsolidated = useMemo(() => {
    if (userRoles.includes("ADMIN")) return true;
    if (!authUser || !authUser.email) return false;
    return consolidatedViewUsers.includes(authUser.email.toLowerCase());
  }, [userRoles, authUser, consolidatedViewUsers]);

 useEffect(() => {
    if (isLoading) return;
    
    const availableTabs = [
        canSeeConsolidated && 'consolidated',
        canSeeSummary && 'summary',
        (userRoles.includes('GROUP_HEAD') || userRoles.includes('ADMIN')) && 'group-head',
        'allocation'
    ].filter(Boolean);

    if (availableTabs.length > 0) {
        setActiveTab(availableTabs[0] as string);
    }

  }, [canSeeSummary, canSeeConsolidated, userRoles, isLoading]);

  const canSelect = useMemo(() => {
    return userRoles.includes("GROUP_HEAD") || userRoles.includes("DELEGATE") || userRoles.includes("ADMIN");
  }, [userRoles]);


  const filteredEmployees = useMemo(() => {
    let baseList = lobEmployees;
    if (showOnlySelected) {
      baseList = baseList.filter(employee => !!employee.reason);
    }
    if (!searchQuery) return baseList;
    return baseList.filter(employee => 
      employee.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [lobEmployees, searchQuery, showOnlySelected]);

  const groupedByDepartment = useMemo(() => {
    return filteredEmployees.reduce((acc, employee) => {
      const { department } = employee;
      if (!acc[department]) {
        acc[department] = [];
      }
      acc[department].push(employee);
      return acc;
    }, {} as Record<string, User[]>);
  }, [filteredEmployees]);

  const selectedEmployeeList = useMemo(() => {
     const selected = lobEmployees.filter(e => !!e.reason);
     if (!searchQuery) return selected;
     return selected.filter(employee => 
      employee.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [lobEmployees, searchQuery]);

  const hasPendingReasons = useMemo(() => {
    return selectedEmployeeList.some(e => e.reason === "NOT_SELECTED");
  }, [selectedEmployeeList]);

  const selectedGroupedByDepartment = useMemo(() => {
    return selectedEmployeeList.reduce((acc, employee) => {
      const { department } = employee;
      if (!acc[department]) {
        acc[department] = [];
      }
      acc[department].push(employee);
      return acc;
    }, {} as Record<string, User[]>);
  }, [selectedEmployeeList]);
  
  useEffect(() => {
      const selectedDeptKeys = Object.keys(selectedGroupedByDepartment);
      setGroupHeadAccordionValue(selectedDeptKeys);
  }, [selectedGroupedByDepartment]);

  const lockedSelections = useMemo(() => {
    const lockedLobs = Object.entries(lobLocks)
        .filter(([_, isLocked]) => isLocked)
        .map(([lob]) => lob);
    
    let baseList = allEmployees.filter(
        e => e.reason && lockedLobs.includes(e.lineOfBusiness)
    );

    if (!searchQuery) return baseList;
    return baseList.filter(e => 
        e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.lineOfBusiness.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.department.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allEmployees, lobLocks, searchQuery]);

  const groupedLockedSelections = useMemo(() => {
    return lockedSelections.reduce((acc, employee) => {
      const { lineOfBusiness, department } = employee;
      if (!acc[lineOfBusiness]) {
        acc[lineOfBusiness] = {};
      }
      if (!acc[lineOfBusiness][department]) {
        acc[lineOfBusiness][department] = [];
      }
      acc[lineOfBusiness][department].push(employee);
      return acc;
    }, {} as Record<string, Record<string, User[]>>);
  }, [lockedSelections]);

  const grandTotalLockedSelections = useMemo(() => {
      return lockedSelections.length;
  }, [lockedSelections]);

  useEffect(() => {
      const allLobs = Object.keys(groupedLockedSelections);
      setConsolidatedAccordionValue(allLobs);
  }, [groupedLockedSelections]);

  const getActor = () => {
    return {
      name: authUser?.displayName || 'Unknown',
      email: authUser?.email || 'Unknown',
      roles: userRoles,
    };
  };

  const processPendingUpdates = async () => {
    const updatesToProcess = new Map(pendingUpdates.current);
    pendingUpdates.current.clear();

    if (updatesToProcess.size === 0) return;

    try {
        const actor = getActor();
        await Promise.all(
            Array.from(updatesToProcess.values()).map(user => updateUserAction(user, actor))
        );
    } catch(e) {
        console.error("Debounced update failed", e);
        toast({
            variant: "destructive",
            title: "Sync Error",
            description: `Failed to save some of your recent changes. Please try again.`,
        });
    }
  };

  const queueUpdate = (userToUpdate: User) => {
    setAllEmployees(currentEmployees =>
        currentEmployees.map(emp =>
            emp.id === userToUpdate.id ? userToUpdate : emp
        )
    );
    
    pendingUpdates.current.set(userToUpdate.id, userToUpdate);

    if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
    }
    
    debounceTimer.current = setTimeout(processPendingUpdates, 3000);
  };
  
  const handleSelectEmployee = (employeeToUpdate: User) => {
    if (isLocked || !canSelect) return;
  
    const isCurrentlySelected = !!employeeToUpdate.reason;
    const actor = {
        name: authUser?.displayName || "Unknown User",
        email: authUser?.email?.toLowerCase() || "unknown@example.com",
    };
  
    let updatedUser: User;
    
    if (isCurrentlySelected) {
      const { reason, modifier, modifiedAt, ...restOfUser } = employeeToUpdate;
      updatedUser = { 
        ...restOfUser, 
      };
    } else {
      updatedUser = { 
        ...employeeToUpdate, 
        modifier: actor, 
        reason: "NOT_SELECTED", 
        modifiedAt: new Date().toISOString() 
      };
    }
  
    queueUpdate(updatedUser);
  };
  
  const handleReasonChange = (employeeToUpdate: User, reason: string) => {
    if (isLocked || !canSelect || !employeeToUpdate.modifier) return;
    
    const updatedUser: User = { ...employeeToUpdate, reason: reason, modifiedAt: new Date().toISOString() };
    
    queueUpdate(updatedUser);
  };

  const buildItAccessReasonSummary = (u: User): string | undefined => {
    const parts: string[] = [];
    if (u.internetAccess) parts.push("Internet access");
    if (u.externalEmailSending) parts.push("External email sending");
    if (u.workEmailMobile) parts.push("Work email on mobile");
    if (u.vpnAccess) parts.push(u.vpnType ? `VPN (${u.vpnType})` : "VPN");
    return parts.length > 0 ? parts.join("; ") : undefined;
  };

  const handleItAccessChange = (employeeToUpdate: User, updates: Partial<Pick<User, "internetAccess" | "requestedSitesToUnblock" | "externalEmailSending" | "externalEmailRecipients" | "workEmailMobile" | "vpnAccess" | "vpnType">>) => {
    if (isLocked || !canSelect) return;
    const updatedUser: User = {
      ...employeeToUpdate,
      ...updates,
      modifier: employeeToUpdate.modifier || getActor(),
      modifiedAt: new Date().toISOString(),
    };
    const summary = buildItAccessReasonSummary(updatedUser);
    if (summary) updatedUser.reason = summary;
    queueUpdate(updatedUser);
  };
  
  const handleLockToggle = async (lobToLock?: string) => {
    const lob = lobToLock || currentLob;
    if (!lob) return;

    const canPerformLock = userRoles.includes('GROUP_HEAD') || userRoles.includes('ADMIN');

    if (!canPerformLock) {
        toast({
            variant: "destructive",
            title: "Permission Denied",
            description: "You do not have the required permissions to lock or unlock this roster.",
        });
        return;
    }

    const newLockState = !lobLocks[lob];
    setIsSendingEmail(true);
    try {
        await saveLockStatusAction(lob, newLockState, getActor());
        setIsLocked(newLockState);
        setLobLocks(prev => ({ ...prev, [lob]: newLockState }));
        toast({
            title: "Success",
            description: `Selections for ${lob} have been ${newLockState ? 'locked and submitted' : 'unlocked'}.`,
        });
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Error",
            description: error.message || "Failed to update lock status.",
        });
    } finally {
        setIsSendingEmail(false);
        setLobToManage(null); // Close dialog
    }
  };
  
  const totalSelectedCount = useMemo(() => {
    return lobEmployees.filter(e => e.reason).length;
  }, [lobEmployees]);

  const totalEmployeeCount = useMemo(() => {
    return lobEmployees.length;
  }, [lobEmployees]);
  
  const grandTotalSelectedCount = useMemo(() => {
    return allEmployees.filter(e => e.reason).length;
  }, [allEmployees]);
  
  const reasonCounts = useMemo(() => {
    return lobEmployees.reduce((acc, employee) => {
      if (employee.modifier && employee.reason && employee.reason !== "NOT_SELECTED") {
        acc[employee.reason] = (acc[employee.reason] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);
  }, [lobEmployees]);

  const handleSignOut = async () => {
    try {
        localStorage.removeItem('localAuthUser');
        window.location.reload();
    } catch (error) {
        console.error("Error signing out: ", error);
    }
  };

  const allHodDepartments = Object.keys(groupedByDepartment);
  const isHodAccordionExpanded = hodAccordionValue.length === allHodDepartments.length && allHodDepartments.length > 0;
  
  const handleHodToggleExpand = () => {
    if (isHodAccordionExpanded) {
        setHodAccordionValue([]);
    } else {
        setHodAccordionValue(allHodDepartments);
    }
  };
  
  const allGroupHeadDepartments = Object.keys(selectedGroupedByDepartment);
  const isGroupHeadAccordionExpanded = groupHeadAccordionValue.length === allGroupHeadDepartments.length && allGroupHeadDepartments.length > 0;

  const handleGroupHeadToggleExpand = () => {
    if (isGroupHeadAccordionExpanded) {
        setGroupHeadAccordionValue([]);
    } else {
        setGroupHeadAccordionValue(allGroupHeadDepartments);
    }
  };
  
  const allConsolidatedLobs = Object.keys(groupedLockedSelections);
  const isConsolidatedAccordionExpanded = consolidatedAccordionValue.length === allConsolidatedLobs.length && allConsolidatedLobs.length > 0;

  const handleConsolidatedToggleExpand = () => {
    if (isConsolidatedAccordionExpanded) {
      setConsolidatedAccordionValue([]);
    } else {
      setConsolidatedAccordionValue(allConsolidatedLobs);
    }
  };

  const getModifierDisplay = (modifier?: { name: string; email: string; }, modifiedAt?: string) => {
    if (!modifier) return null;
    let formattedDate = '';
    if (modifiedAt) {
      try {
        const date = new Date(modifiedAt);
        if (!isNaN(date.getTime())) {
          formattedDate = format(date, 'dd MMM yyyy, hh:mm a');
        }
      } catch (e) {
        // Ignore if date is invalid
      }
    }

    return (
        <div className="flex flex-col text-left">
            <p className="font-medium text-sm">{modifier.name}</p>
            <p className="text-xs text-muted-foreground">{modifier.email}</p>
            {formattedDate && <p className="text-xs text-muted-foreground">{formattedDate}</p>}
        </div>
    );
  }

  const currentLobName = useMemo(() => {
    if (!userRoles.includes('ADMIN')) return initialLob;
    if (adminLobSelection === 'all') return 'All Lines of Business';
    if (adminLobSelection === 'user_lob') return initialLob;
    return adminLobSelection;
  }, [userRoles, adminLobSelection, initialLob]);
  
  const useLobSummary = () => {
    const lobSummary = useMemo(() => {
      return linesOfBusiness.map(lob => {
          const lobUsers = allEmployees.filter(u => u.lineOfBusiness === lob);
          const activeSelections = lobUsers.filter(u => !!u.modifier).length;
          
          const lobRolesData = roles[lob] || { groupHead: null, delegates: [] };
          
          const groupHeadUser = allEmployees.find(u => u.id === lobRolesData.groupHead);
          const delegateUsers = lobRolesData.delegates.map(id => allEmployees.find(u => u.id === id)).filter(Boolean) as User[];
          
          const reasonCounts = lobUsers.reduce((acc, user) => {
              if (user.modifier) {
                  if (user.reason && user.reason !== "NOT_SELECTED") {
                      acc[user.reason] = (acc[user.reason] || 0) + 1;
                  } else {
                      acc["Not Specified"] = (acc["Not Specified"] || 0) + 1;
                  }
              }
              return acc;
          }, {} as Record<string, number>);

          return {
              lob,
              groupHead: groupHeadUser,
              delegates: delegateUsers,
              delegatesCount: delegateUsers.length,
              activeSelections,
              lobStrength: lobUsers.length,
              reasonCounts,
              isLocked: lobLocks[lob] || false,
          };
      });
    }, [allEmployees, roles, linesOfBusiness, lobLocks]);

    const sortedLobSummary = useMemo(() => {
      let sortableItems = [...lobSummary];
      if (sortConfig.key !== null) {
          sortableItems.sort((a, b) => {
              const aValue = a[sortConfig.key!];
              const bValue = b[sortConfig.key!];

              if (typeof aValue === 'number' && typeof bValue === 'number') {
                  if (aValue < bValue) {
                      return sortConfig.direction === 'ascending' ? -1 : 1;
                  }
                  if (aValue > bValue) {
                      return sortConfig.direction === 'ascending' ? 1 : -1;
                  }
              } else if (typeof aValue === 'string' && typeof bValue === 'string') {
                  if (aValue.toLowerCase() < bValue.toLowerCase()) {
                      return sortConfig.direction === 'ascending' ? -1 : 1;
                  }
                  if (aValue.toLowerCase() > bValue.toLowerCase()) {
                      return sortConfig.direction === 'ascending' ? 1 : -1;
                  }
              }
              return 0;
          });
      }
      return sortableItems;
    }, [lobSummary, sortConfig]);

    const requestSort = (key: keyof LobSummaryItem) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };
    
    return { lobSummary: sortedLobSummary, requestSort, sortConfig };
  };

  const { lobSummary, requestSort, sortConfig: currentSortConfig } = useLobSummary();

  const getSortIcon = (key: keyof LobSummaryItem) => {
      if (currentSortConfig.key !== key) {
          return null;
      }
      if (currentSortConfig.direction === 'ascending') {
          return <ArrowUp className="h-4 w-4" />;
      }
      return <ArrowDown className="h-4 w-4" />;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadSummaryCsv = () => {
    const headers = ["Line of Business", "Group Head", "Delegates", "Reasons", "Office Users", "LOB Strength", "Status"];
    
    const csvRows = [headers.join(",")];

    lobSummary.forEach(summary => {
      const row = [
        `"${summary.lob}"`,
        `"${summary.groupHead?.name || 'Not Assigned'}"`,
        `"${summary.delegates.map(d => d.name).join(', ') || 'None'}"`,
        `"${Object.entries(summary.reasonCounts).map(([reason, count]) => `${reason} (${count})`).join('; ') || 'None'}"`,
        summary.activeSelections,
        summary.lobStrength,
        summary.isLocked ? "Locked" : ""
      ];
      csvRows.push(row.join(","));
    });

    const csvString = csvRows.join("\n");
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "lob_allocation_summary.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const generateAndDownloadLobReport = (lob: string) => {
    const lobUsers = allEmployees.filter(u => u.lineOfBusiness === lob);
    const selectedUsers = lobUsers.filter(u => u.reason && u.reason !== 'NOT_SELECTED');

    if (selectedUsers.length === 0) {
        toast({
            variant: "destructive",
            title: "No Selections",
            description: `There are no selected employees to report for ${lob}.`,
        });
        return;
    }

    const headers = ['Name', 'Email', 'Designation', 'Manager', 'Department', 'Modifier', 'Reason'];
    const escapeCsvField = (field: string | undefined) => `"${(field || '').replace(/"/g, '""')}"`;
    
    const rows = selectedUsers.map(user => {
        const modifierName = user.modifier?.name || '';
        return [
            escapeCsvField(user.name),
            escapeCsvField(user.email),
            escapeCsvField(user.designation),
            escapeCsvField(user.manager),
            escapeCsvField(user.department),
            escapeCsvField(modifierName),
            escapeCsvField(user.reason),
        ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${lob}_Allocation_Report.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleDownloadConsolidatedCsv = () => {
    if (lockedSelections.length === 0) {
        toast({ title: "No Data", description: "There is no locked data to export." });
        return;
    }
    const headers = ['Line of Business', 'Department', 'Name', 'Email', 'Designation', 'Manager', 'Location', 'Modifier', 'Reason'];
    const escapeCsvField = (field: string | undefined) => `"${(field || '').replace(/"/g, '""')}"`;

    const rows = lockedSelections.map(user => {
        return [
            escapeCsvField(user.lineOfBusiness),
            escapeCsvField(user.department),
            escapeCsvField(user.name),
            escapeCsvField(user.email),
            escapeCsvField(user.designation),
            escapeCsvField(user.manager),
            escapeCsvField(user.location),
            escapeCsvField(user.modifier?.name),
            escapeCsvField(user.reason),
        ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "consolidated_report.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  if (isLoading) {
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
              <div className="animate-pulse">
                  <Logo />
              </div>
              <p className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Loading application data...
              </p>
          </div>
        </div>
      );
  }

  const renderTabsList = () => {
    const availableTabs = [
        canSeeConsolidated && { value: 'consolidated', label: 'Consolidated View' },
        canSeeSummary && { value: 'summary', label: 'Summary' },
        (userRoles.includes('GROUP_HEAD') || userRoles.includes('ADMIN')) && { value: 'group-head', label: 'Group Head View' },
        { value: 'allocation', label: 'Allocation View' },
    ].filter(Boolean) as { value: string, label: string }[];
    
    if (availableTabs.length <= 1) return null;
    
    let gridClass: string;
    switch (availableTabs.length) {
        case 2: gridClass = 'grid-cols-2'; break;
        case 3: gridClass = 'grid-cols-3'; break;
        case 4: gridClass = 'grid-cols-4'; break;
        default: gridClass = 'grid-cols-1'; break;
    }

    return (
      <TabsList className={cn("grid w-full", gridClass)}>
        {availableTabs.map(tab => (
          <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
        ))}
      </TabsList>
    );
  };

  const tabsContent = () => {
    const showSummary = canSeeSummary;
    const showGroupHead = userRoles.includes('GROUP_HEAD') || userRoles.includes('ADMIN');
    const showConsolidated = canSeeConsolidated;

    return (
      <>
            {showConsolidated && (
                <TabsContent value="consolidated">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between gap-4">
                                <div>
                                    <CardTitle className="flex items-center gap-2"><FileText /> Consolidated Report</CardTitle>
                                    <CardDescription>A complete report of all approved and locked selections across the organization.</CardDescription>
                                </div>
                                <div className="flex flex-1 items-center justify-end gap-2">
                                    <div className="relative w-full max-w-sm">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="search"
                                            placeholder="Search report..."
                                            className="pl-8"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                        />
                                    </div>
                                    {allConsolidatedLobs.length > 0 && (
                                        <Button variant="outline" size="sm" onClick={handleConsolidatedToggleExpand}>
                                            <ChevronsUpDown className="mr-2 h-4 w-4" />
                                            {isConsolidatedAccordionExpanded ? "Collapse All" : "Expand All"}
                                        </Button>
                                    )}
                                    {userRoles.includes('ADMIN') && (
                                     <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="outline"><Share className="mr-2 h-4 w-4" /> Share</Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem onClick={handleDownloadConsolidatedCsv}><Download className="mr-2 h-4 w-4" />Download as CSV</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                    )}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {lockedSelections.length === 0 ? (
                                <div className="p-8 text-center text-muted-foreground">
                                    {searchQuery ? "No matching records found." : "There are no locked selections to display."}
                                </div>
                            ) : (
                                <div className="overflow-auto rounded-lg border">
                                    <Accordion type="multiple" value={consolidatedAccordionValue} onValueChange={setConsolidatedAccordionValue} className="w-full">
                                        {Object.entries(groupedLockedSelections).map(([lob, departments]) => (
                                            <AccordionItem value={lob} key={lob}>
                                                <AccordionTrigger className="px-4 py-3 text-lg font-semibold bg-primary/5 hover:no-underline">
                                                    {lob}
                                                </AccordionTrigger>
                                                <AccordionContent className="p-0">
                                                    <Accordion type="multiple" defaultValue={Object.keys(departments)} className="w-full">
                                                        {Object.entries(departments).map(([department, deptEmployees]) => (
                                                            <AccordionItem value={department} key={department}>
                                                                <AccordionTrigger className="px-4 py-2 hover:no-underline bg-muted/50">
                                                                    <div className="flex items-center gap-3">
                                                                        <h3 className="font-semibold text-base">{department}</h3>
                                                                        <span className="text-sm text-muted-foreground">({deptEmployees.length} employees)</span>
                                                                    </div>
                                                                </AccordionTrigger>
                                                                <AccordionContent className="p-0">
                                                                    <Table>
                                                                        <TableHeader>
                                                                            <TableRow>
                                                                                <TableHead>Name</TableHead>
                                                                                <TableHead>Designation</TableHead>
                                                                                <TableHead>Manager</TableHead>
                                                                                <TableHead>Location</TableHead>
                                                                                <TableHead>Modifier</TableHead>
                                                                                <TableHead>Reason</TableHead>
                                                                            </TableRow>
                                                                        </TableHeader>
                                                                        <TableBody>
                                                                            {deptEmployees.map((employee) => (
                                                                                <TableRow key={employee.id}>
                                                                                    <TableCell>
                                                                                        <div className="font-medium">{employee.name}</div>
                                                                                        <div className="text-xs text-muted-foreground">{employee.email}</div>
                                                                                    </TableCell>
                                                                                    <TableCell>{employee.designation}</TableCell>
                                                                                    <TableCell>{employee.manager}</TableCell>
                                                                                    <TableCell>
                                                                                        <div>{employee.location}</div>
                                                                                        <div className="text-xs text-muted-foreground">{employee.city}</div>
                                                                                    </TableCell>
                                                                                    <TableCell>{getModifierDisplay(employee.modifier, employee.modifiedAt)}</TableCell>
                                                                                    <TableCell>{employee.reason}</TableCell>
                                                                                </TableRow>
                                                                            ))}
                                                                        </TableBody>
                                                                    </Table>
                                                                </AccordionContent>
                                                            </AccordionItem>
                                                        ))}
                                                    </Accordion>
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            )}
            {showSummary && (
                <TabsContent value="summary">
                    <div id="summary-view" className="space-y-4">
                        <PrintHeader />
                        <Card className="lg:col-span-2">
                            <CardHeader className="flex flex-row items-center justify-between print-hidden">
                                <div>
                                    <CardTitle className="flex items-center gap-2"><Group />LOB Allocation Summary</CardTitle>
                                    <CardDescription>An overview of role assignments and selection status for each Line of Business.</CardDescription>
                                </div>
                                {userRoles.includes('ADMIN') && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline"><Share className="mr-2 h-4 w-4" /> Share</Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem onClick={handlePrint}><Printer className="mr-2 h-4 w-4" />Print</DropdownMenuItem>
                                        <DropdownMenuItem onClick={handleDownloadSummaryCsv}><Download className="mr-2 h-4 w-4" />Download as CSV</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                                )}
                            </CardHeader>
                            <CardContent>
                            <div className="overflow-x-auto rounded-lg border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-left">
                                                <Button variant="ghost" onClick={() => requestSort('lob')}>
                                                    Line of Business <span className="print-hidden">{getSortIcon('lob')}</span>
                                                </Button>
                                            </TableHead>
                                            <TableHead className="text-left">
                                                <Button variant="ghost" onClick={() => requestSort('groupHead')}>
                                                    Group Head <span className="print-hidden">{getSortIcon('groupHead')}</span>
                                                </Button>
                                            </TableHead>
                                            <TableHead className="text-left">
                                                <Button variant="ghost" onClick={() => requestSort('delegatesCount')}>
                                                    Delegates <span className="print-hidden">{getSortIcon('delegatesCount')}</span>
                                                </Button>
                                            </TableHead>
                                            <TableHead className="text-left">Reasons</TableHead>
                                            <TableHead className="text-left">
                                                <Button variant="ghost" onClick={() => requestSort('activeSelections')}>
                                                    Office Users <span className="print-hidden">{getSortIcon('activeSelections')}</span>
                                                </Button>
                                            </TableHead>
                                            <TableHead className="text-left">
                                                <Button variant="ghost" onClick={() => requestSort('lobStrength')}>
                                                    LOB Strength <span className="print-hidden">{getSortIcon('lobStrength')}</span>
                                                </Button>
                                            </TableHead>
                                            <TableHead className="text-left">Status</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            [...Array(3)].map((_, i) => (
                                                <TableRow key={i}>
                                                    <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                                                    <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                                                    <TableCell><Skeleton className="h-5 w-1/4" /></TableCell>
                                                    <TableCell><Skeleton className="h-5 w-3/4" /></TableCell>
                                                    <TableCell><Skeleton className="h-5 w-1/4" /></TableCell>
                                                    <TableCell><Skeleton className="h-5 w-1/4" /></TableCell>
                                                    <TableCell className="text-left"><Skeleton className="h-5 w-10" /></TableCell>
                                                </TableRow>
                                            ))
                                        ) : lobSummary.length > 0 ? (
                                            lobSummary.map(summary => (
                                                <TableRow key={summary.lob}>
                                                    <TableCell className="font-medium text-left">{summary.lob}</TableCell>
                                                    <TableCell className="text-left">
                                                        {summary.groupHead ? (
                                                            getModifierDisplay(summary.groupHead)
                                                        ) : (
                                                            <span className="text-muted-foreground">Not Assigned</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-left">
                                                        {summary.delegates.length > 0 ? (
                                                            <Popover>
                                                                <PopoverTrigger asChild>
                                                                    <Badge variant="secondary" className="cursor-pointer hover:bg-muted gap-2">
                                                                        <span>Delegates</span>
                                                                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-background text-foreground">{summary.delegates.length}</span>
                                                                    </Badge>
                                                                </PopoverTrigger>
                                                                <PopoverContent className="w-auto p-2">
                                                                    <div className="flex flex-col gap-2">
                                                                        {summary.delegates.map(d => (
                                                                            <Badge key={d.id} variant="secondary">{d.name}</Badge>
                                                                        ))}
                                                                    </div>
                                                                </PopoverContent>
                                                            </Popover>
                                                        ) : (
                                                            <span className="text-muted-foreground">None</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-left">
                                                        {Object.keys(summary.reasonCounts).length > 0 ? (
                                                            <div className="flex flex-wrap gap-2">
                                                                {Object.entries(summary.reasonCounts).map(([reason, count]) => (
                                                                    <Badge key={reason} variant={reason === 'Not Specified' ? 'destructive' : 'outline'} className="gap-2">
                                                                        <span>{reason}</span>
                                                                        <span className={cn(
                                                                            "flex h-5 w-5 items-center justify-center rounded-full",
                                                                            reason === 'Not Specified' ? "bg-destructive-foreground/20 text-destructive-foreground" : "bg-muted text-muted-foreground"
                                                                        )}>{count}</span>
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-muted-foreground">None</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-left">
                                                        <div className="flex items-center gap-2">
                                                            <span>{summary.activeSelections}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-left">
                                                        <div className="flex items-center gap-2">
                                                            <span>{summary.lobStrength}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-left">
                                                        <div className="flex items-center justify-start">
                                                            {userRoles.includes('ADMIN') ? (
                                                                <div className="flex items-center gap-1">
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        title={summary.isLocked ? `Unlock ${summary.lob}` : `Lock ${summary.lob}`}
                                                                        onClick={() => setLobToManage({ lob: summary.lob, action: summary.isLocked ? 'unlock' : 'lock'})}
                                                                        disabled={isSendingEmail}
                                                                    >
                                                                        {summary.isLocked ? <Unlock className="h-4 w-4 text-primary" /> : <Lock className="h-4 w-4 text-muted-foreground" />}
                                                                    </Button>
                                                                    {summary.isLocked && (
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            title={`Download Report for ${summary.lob}`}
                                                                            onClick={() => generateAndDownloadLobReport(summary.lob)}
                                                                        >
                                                                            <Download className="h-4 w-4 text-primary" />
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                summary.isLocked && <Lock className="h-4 w-4 text-primary" />
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                                    No Lines of Business found. Import user data to get started.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            )}
            <TabsContent value="allocation">
              <div className="grid gap-4 md:hidden transition-all duration-300">
                  <StatCard
                      ref={mainContentRef}
                      title={currentLobName || "Current LOB"}
                      value={`${totalSelectedCount} / ${totalEmployeeCount}`}
                      icon={<Users className="h-4 w-4 text-muted-foreground" />}
                      onClick={() => setShowOnlySelected(!showOnlySelected)}
                      isActive={showOnlySelected}
                  />
              </div>
              <MainContent
                ref={mainContentRef}
                key="allocation-view"
                canSelect={canSelect}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                allHodDepartments={allHodDepartments}
                handleHodToggleExpand={handleHodToggleExpand}
                isHodAccordionExpanded={isHodAccordionExpanded}
                isLoading={isLoading}
                lobEmployees={lobEmployees}
                filteredEmployees={filteredEmployees}
                showOnlySelected={showOnlySelected}
                hodAccordionValue={hodAccordionValue}
                setHodAccordionValue={setHodAccordionValue}
                groupedByDepartment={groupedByDepartment}
                isLocked={isLocked}
                reasons={reasons}
                handleSelectEmployee={handleSelectEmployee}
                handleReasonChange={handleReasonChange}
                handleItAccessChange={handleItAccessChange}
                expandedRowId={expandedRowId}
                setExpandedRowId={setExpandedRowId}
                getModifierDisplay={getModifierDisplay}
                userRoles={userRoles}
                adminLobSelection={adminLobSelection}
                setAdminLobSelection={setAdminLobSelection}
                initialLob={initialLob}
                linesOfBusiness={linesOfBusiness}
              />
            </TabsContent>
            {showGroupHead && (
                <TabsContent value="group-head">
                  <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3 md:gap-8 transition-all duration-300 mb-4">
                      <StatCard
                          title={currentLobName || "Current LOB"}
                          value={`${totalSelectedCount} / ${totalEmployeeCount}`}
                          icon={<Briefcase className="h-4 w-4 text-muted-foreground" />}
                      />
                      <StatCard
                          title="Grand Selection"
                          value={`${grandTotalSelectedCount} / 300`}
                          icon={<Globe className="h-4 w-4 text-muted-foreground" />}
                      />
                      <StatCard
                        title="Selections Status"
                        value={isLocked ? "Locked" : "Unlocked"}
                        icon={isLocked ? <Lock className="h-4 w-4 text-muted-foreground" /> : <Unlock className="h-4 w-4 text-muted-foreground" />}
                      />
                  </div>
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between gap-4">
                          <div>
                              <CardTitle>Selected Employees for Approval</CardTitle>
                              <CardDescription>
                                  Review the selections and approve to lock them.
                              </CardDescription>
                          </div>
                          <div className="flex flex-1 items-center justify-end gap-2">
                              <div className="relative w-full max-w-sm">
                                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                  <Input 
                                      type="search" 
                                      placeholder="Search by name..." 
                                      className="pl-8" 
                                      value={searchQuery}
                                      onChange={(e) => setSearchQuery(e.target.value)}
                                  />
                              </div>
                              {allGroupHeadDepartments.length > 0 && (
                                  <Button variant="outline" size="sm" onClick={handleGroupHeadToggleExpand}>
                                      <ChevronsUpDown className="mr-2 h-4 w-4" />
                                      {isGroupHeadAccordionExpanded ? 'Collapse All' : 'Expand All'}
                                  </Button>
                              )}
                              <Button 
                                onClick={() => setDialogState({ open: true, type: isLocked ? 'unlock' : 'lock' })}
                                disabled={
                                  isSendingEmail || 
                                  !userRoles.some(r => ['GROUP_HEAD', 'ADMIN'].includes(r)) ||
                                  (!isLocked && (selectedEmployeeList.length === 0 || hasPendingReasons))
                                }
                              >
                                  {isSendingEmail && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                  {isLocked ? <Unlock className="mr-2 h-4 w-4" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                                  {isLocked ? "Unlock Selections" : (isSendingEmail ? "Locking & Sending..." : "Approve & Lock Selections")}
                              </Button>
                              <TimedConfirmationDialog 
                                  open={dialogState.open}
                                  onOpenChange={(open) => setDialogState({ open, type: null })}
                                  onConfirm={() => handleLockToggle()}
                                  countdownSeconds={5}
                                  title={dialogState.type === 'lock' ? 'Confirm Selections Lock' : 'Are you sure?'}
                                  description={
                                      dialogState.type === 'lock' 
                                      ? "This will lock and submit your current selections to the COO/CEO's office. You can unlock the roster to make further changes and resubmit if needed before the final deadline. Do you wish to continue?"
                                      : "A report has already been sent to the COO/CEO's Office for final approval. Unlocking this will require resubmission of the report."
                                  }
                                  confirmButtonText={dialogState.type === 'lock' ? 'Confirm Lock' : 'Yes, Unlock'}
                                  icon={dialogState.type === 'lock' ? <ShieldAlert className="text-primary"/> : <AlertTriangle className="text-destructive"/>}
                              />
                          </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {selectedEmployeeList.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                          {searchQuery ? "No matching employees in your selection." : "No employees selected. Go to the Allocation view to make selections."}
                        </div>
                      ) : (
                        <div className="overflow-auto rounded-lg border">
                          <Accordion type="multiple" value={groupHeadAccordionValue} onValueChange={setGroupHeadAccordionValue} className="w-full">
                              {Object.entries(selectedGroupedByDepartment).map(([department, deptEmployees]) => (
                              <AccordionItem value={department} key={department}>
                                  <AccordionTrigger className="px-4 py-2 hover:no-underline bg-muted/50">
                                    <div className="flex items-center gap-3">
                                      <h3 className="font-semibold text-base">{department}</h3>
                                      <span className="text-sm text-muted-foreground">({deptEmployees.length} employees)</span>
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent>
                                      <Table>
                                          <TableHeader>
                                              <TableRow>
                                                  <TableHead>Name</TableHead>
                                                  <TableHead>Designation</TableHead>
                                                  <TableHead>Manager</TableHead>
                                                  <TableHead>Location</TableHead>
                                                  <TableHead>Modifier</TableHead>
                                                  <TableHead>Reason</TableHead>
                                              </TableRow>
                                          </TableHeader>
                                          <TableBody>
                                              {deptEmployees.map((employee) => (
                                              <TableRow key={employee.id}>
                                                  <TableCell>
                                                    <div className="font-medium">{employee.name}</div>
                                                    <div className="text-xs text-muted-foreground">{employee.email}</div>
                                                  </TableCell>
                                                  <TableCell>{employee.designation}</TableCell>
                                                  <TableCell>{employee.manager}</TableCell>
                                                  <TableCell>
                                                  <div>{employee.location}</div>
                                                  <div className="text-xs text-muted-foreground">{employee.city}</div>
                                                  </TableCell>
                                                  <TableCell>{getModifierDisplay(employee.modifier, employee.modifiedAt)}</TableCell>
                                                  <TableCell>{employee.reason === "NOT_SELECTED" ? <span className="text-destructive">Required</span> : employee.reason || 'N/A'}</TableCell>
                                              </TableRow>
                                              ))}
                                          </TableBody>
                                      </Table>
                                  </AccordionContent>
                              </AccordionItem>
                              ))}
                          </Accordion>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
            )}
      </>
    )
  };

  const renderDashboardContent = () => {
    const availableTabs = [
      canSeeConsolidated && { value: 'consolidated', label: 'Consolidated View' },
      canSeeSummary && { value: 'summary', label: 'Summary' },
      (userRoles.includes('GROUP_HEAD') || userRoles.includes('ADMIN')) && { value: 'group-head', label: 'Group Head View' },
      { value: 'allocation', label: 'Allocation View' },
    ].filter(Boolean) as { value: string, label: string }[];

    if (availableTabs.length <= 1) {
      return (
        <div>
          <MainContent
            ref={mainContentRef}
            key="delegate-view"
            canSelect={canSelect}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            allHodDepartments={allHodDepartments}
            handleHodToggleExpand={handleHodToggleExpand}
            isHodAccordionExpanded={isHodAccordionExpanded}
            isLoading={isLoading}
            lobEmployees={lobEmployees}
            filteredEmployees={filteredEmployees}
            showOnlySelected={showOnlySelected}
            hodAccordionValue={hodAccordionValue}
            setHodAccordionValue={setHodAccordionValue}
            groupedByDepartment={groupedByDepartment}
            isLocked={isLocked}
            reasons={reasons}
            handleSelectEmployee={handleSelectEmployee}
            handleReasonChange={handleReasonChange}
            handleItAccessChange={handleItAccessChange}
            expandedRowId={expandedRowId}
            setExpandedRowId={setExpandedRowId}
            getModifierDisplay={getModifierDisplay}
            userRoles={userRoles}
            adminLobSelection={adminLobSelection}
            setAdminLobSelection={setAdminLobSelection}
            initialLob={initialLob}
            linesOfBusiness={linesOfBusiness}
          />
        </div>
      );
    }
    
    return (
      <Tabs value={activeTab} onValueChange={(tab) => { setActiveTab(tab); setSearchQuery(''); setShowOnlySelected(false); }}>
        <div className="mb-4 print-hidden">
          {renderTabsList()}
        </div>
        {tabsContent()}
      </Tabs>
    );
  };


  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40" id="main-container">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8" id="main-content">
        <div className="flex items-center justify-between print-hidden" id="main-header">
            <div className="flex items-center gap-4">
                <Logo />
                <div className="flex flex-col">
                    <h1 className="text-2xl font-bold tracking-tight">The 300</h1>
                    <p className="text-sm text-muted-foreground">Strategic License Allocation</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <div className="hidden items-center gap-2 md:flex">
                     {activeTab === 'allocation' && (
                        <Card 
                            className={cn(
                                "p-2 w-auto transition-all duration-300",
                                "cursor-pointer hover:border-primary",
                                showOnlySelected && "border-primary ring-2 ring-primary"
                            )}
                            onClick={() => setShowOnlySelected(!showOnlySelected)}
                        >
                           <div className="flex items-center gap-3">
                                <Users className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">{currentLobName || "Current LOB"}</p>
                                    <p className="text-lg font-bold">{totalSelectedCount} / {totalEmployeeCount}</p>
                                </div>
                            </div>
                        </Card>
                    )}
                     {activeTab === 'consolidated' && (
                        <Card className="p-2 w-auto">
                            <div className="flex items-center gap-3">
                                <Target className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Grand Selection</p>
                                    <p className="text-lg font-bold">{grandTotalLockedSelections} / 300</p>
                                </div>
                            </div>
                        </Card>
                    )}
                    {activeTab === 'summary' && (
                        <Card className="p-2 w-auto">
                            <div className="flex items-center gap-3">
                                <Target className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">Total Selections</p>
                                    <p className="text-lg font-bold">{grandTotalSelectedCount} / 300</p>
                                </div>
                            </div>
                        </Card>
                    )}
                </div>
                <ThemeToggle />
                {(userRoles.includes('ADMIN') || userRoles.includes('GROUP_HEAD')) && (
                  <Button variant="outline" size="icon" asChild>
                      <Link href="/admin">
                          <Settings className="h-4 w-4" />
                      </Link>
                  </Button>
                )}
                <Button variant="outline" size="icon" onClick={handleSignOut}>
                    <LogOut className="h-4 w-4" />
                </Button>
            </div>
        </div>
        
        <AlertDialog open={!!lobToManage} onOpenChange={(open) => !open && setLobToManage(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                       This will {lobToManage?.action} the roster for <span className="font-semibold">{lobToManage?.lob}</span>.
                       {lobToManage?.action === 'unlock' && " The Group Head and Delegates will be able to modify selections again."}
                       {lobToManage?.action === 'lock' && " No further changes can be made until it is unlocked."}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setLobToManage(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleLockToggle(lobToManage?.lob)}>Continue</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

        {showFloatingHodCard && activeTab === 'allocation' && (
            <div 
              data-state={showFloatingHodCard ? 'open' : 'closed'}
              className="fixed top-8 right-8 z-50 hidden md:block data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right-4 data-[state=open]:slide-in-from-right-4 duration-1000"
            >
                 <FloatingStatCard
                    title={currentLobName || "Current LOB"}
                    value={`${totalSelectedCount} / ${totalEmployeeCount}`}
                    onClick={() => setShowOnlySelected(!showOnlySelected)}
                    isActive={showOnlySelected}
                />
            </div>
        )}

        {renderDashboardContent()}
      </main>
    </div>
  );
}
