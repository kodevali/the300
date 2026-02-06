
"use client";

import { useState, useMemo, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Trash2, UserPlus, Shield, ChevronsUpDown, Download, Upload, Save, Check, X, Plus, Edit, ListChecks, ShieldAlert, Group, Target, Lock, Unlock, Eye, RefreshCcw, FileText, AlertTriangle, Loader2, Mail, Users, ChevronRight, Building, History, Users2, UserCog, Bot, DatabaseBackup, Wifi, Globe, Smartphone, Network } from "lucide-react";
import type { User } from "@/ai/schemas/workspace-users";
import { removeAllUsersAction, importUsersAction, getWorkspaceUsersAction, getRolesAction, saveRolesAction, getAdminsAction, saveAdminsAction, getReasonsAction, saveReasonsAction, getLockStatusAction, saveLockStatusAction, removeUserAction, getSummaryViewLobsAction, saveSummaryViewLobsAction, updateUserAction, getSummaryViewDelegateLobsAction, saveSummaryViewDelegateLobsAction, getConsolidatedViewUsersAction, saveConsolidatedViewUsersAction, resetForGoLiveAction, getAdminPageDataAction, getNotificationConfigAction, saveNotificationConfigAction, getITAccessFeaturesAction, saveITAccessFeaturesAction, getOfficeRequestsAction, createOfficeRequestAction, updateOfficeRequestAction, deleteOfficeRequestAction } from "@/app/actions";
import type { ITAccessFeature, OfficeRequest } from "@/lib/local-storage";
import type { NotificationConfig } from "@/services/notification-service";
import { Progress } from "@/components/ui/progress";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth-provider";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { TimedConfirmationDialog } from "@/components/timed-confirmation-dialog";
import { Label } from "@/components/ui/label";

export type Roles = {
  groupHead: string | null;
  delegates: string[];
};

type AuthStatus = 'loading' | 'admin' | 'groupHead' | 'unauthorized';
type UserRole = "ADMIN" | "GROUP_HEAD" | "DELEGATE" | "READ_ONLY";

const SUPER_USER_ACCESS_KEY = "f3a9b5c1-8d7e-4f6a-9c2b-1a0d9e8c7b6a-f3a9b5c1-8d7e-4f6a-9c2b-1a0d9e8c7b6a";

const getUserDisplay = (user: User) => {
    return (
        <div className="flex flex-col text-left overflow-hidden">
            <p className="font-medium text-sm truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
    )
}

type RecipientInputProps = {
    title: string;
    fieldKey: 'to' | 'cc' | 'bcc';
    recipients: string[];
    availableUsers: User[];
    onRecipientsChange: (newRecipients: string[]) => void;
    allLobs: string[];
};

function RecipientInput({
    title,
    fieldKey,
    recipients,
    availableUsers,
    onRecipientsChange,
    allLobs
}: RecipientInputProps) {
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const keywordMap: Record<string, string> = {
      "<GROUP_HEAD>": "Group Head",
      "<DELEGATES>": "Delegates",
      "<ADMINS>": "Administrators",
    };
    
    const specialKeywords = {
        groupHead: "<GROUP_HEAD>",
        delegates: "<DELEGATES>",
        admins: "<ADMINS>"
    };

    const handleAddRecipient = (recipient: string) => {
        if (recipient && !recipients.includes(recipient)) {
            onRecipientsChange([...recipients, recipient]);
        }
        setSearchQuery("");
        setPopoverOpen(false);
    };

    const handleRemoveRecipient = (recipient: string) => {
        onRecipientsChange(recipients.filter((r) => r !== recipient));
    };
    
    const keywordExists = (keyword: string) => {
        const displayName = keywordMap[keyword];
        return recipients.includes(keyword) || (displayName && recipients.includes(displayName));
    };

    const filteredUsers = availableUsers.filter(user => 
        `${user.name} ${user.email}`.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const isEmail = (query: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(query);
    const showAddEmailOption = isEmail(searchQuery) && !recipients.includes(searchQuery) && !filteredUsers.some(u => u.email === searchQuery);

    return (
        <div className="space-y-2">
            <Label>{title}</Label>
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                <PopoverTrigger asChild>
                    <div className="flex flex-wrap gap-2 p-2 min-h-10 w-full rounded-md border border-input items-center cursor-text">
                        {recipients.map((recipient) => (
                            <Badge key={recipient} variant="secondary" className="gap-1.5">
                                {keywordMap[recipient] || recipient}
                                <button onClick={(e) => { e.stopPropagation(); handleRemoveRecipient(recipient); }} className="rounded-full hover:bg-background/50">
                                    <X className="h-3 w-3"/>
                                </button>
                            </Badge>
                        ))}
                        <span className="text-sm text-muted-foreground">{recipients.length === 0 ? `+ Add recipients` : ''}</span>
                    </div>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                        <CommandInput 
                            placeholder="Search user or enter email..." 
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                        />
                        <CommandList>
                            <CommandEmpty>{showAddEmailOption ? `Add "${searchQuery}"` : "No results found."}</CommandEmpty>
                             <CommandGroup heading="Roles">
                                {fieldKey === 'to' && !keywordExists(specialKeywords.groupHead) && (
                                    <CommandItem onSelect={() => handleAddRecipient(specialKeywords.groupHead)} value={keywordMap[specialKeywords.groupHead]}>
                                        <UserCog className="mr-2 h-4 w-4" /> {keywordMap[specialKeywords.groupHead]}
                                    </CommandItem>
                                )}
                                {!keywordExists(specialKeywords.delegates) && (
                                    <CommandItem onSelect={() => handleAddRecipient(specialKeywords.delegates)} value={keywordMap[specialKeywords.delegates]}>
                                        <Users2 className="mr-2 h-4 w-4" /> {keywordMap[specialKeywords.delegates]}
                                    </CommandItem>
                                )}
                                {!keywordExists(specialKeywords.admins) && (
                                    <CommandItem onSelect={() => handleAddRecipient(specialKeywords.admins)} value={keywordMap[specialKeywords.admins]}>
                                        <Shield className="mr-2 h-4 w-4" /> {keywordMap[specialKeywords.admins]}
                                    </CommandItem>
                                )}
                            </CommandGroup>
                            <CommandSeparator />
                            <CommandGroup heading="Other Group Heads">
                                {allLobs.map(lob => (
                                    <CommandItem key={lob} onSelect={() => handleAddRecipient(`GH:${lob}`)} value={`Group Head of ${lob}`}>
                                        <UserPlus className="mr-2 h-4 w-4"/>
                                        <span>Group Head of {lob}</span>
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                            <CommandSeparator />
                            <CommandGroup heading="Users">
                                {filteredUsers.map(user => (
                                    <CommandItem key={user.id} onSelect={() => handleAddRecipient(user.email)} value={`${user.name} ${user.email}`}>
                                        {getUserDisplay(user)}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                            {showAddEmailOption && (
                                <CommandGroup>
                                    <CommandItem onSelect={() => handleAddRecipient(searchQuery)}>
                                        Add "{searchQuery}"
                                    </CommandItem>
                                </CommandGroup>
                            )}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}

function AdminPageComponent() {
  const { user: authUser } = useAuth();
  const searchParams = useSearchParams()
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupFileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const [isSaving, setIsSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  
  const [importProgress, setImportProgress] = useState(0);
  const [importedCount, setImportedCount] = useState(0);
  const [totalToImport, setTotalToImport] = useState(0);
  
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading');
  const [userLobs, setUserLobs] = useState<string[]>([]);


  const [roles, setRoles] = useState<Record<string, Roles>>({});
  const [admins, setAdmins] = useState<User[]>([]);
  
  const [lobPopoverOpen, setLobPopoverOpen] = useState(false);
  const [delegatePopovers, setDelegatePopovers] = useState<Record<string, boolean>>({});
  const [groupHeadPopovers, setGroupHeadPopovers] = useState<Record<string, boolean>>({});
  
  const [lobSearch, setLobSearch] = useState("");
  
  const [reasons, setReasons] = useState<string[]>([]);
  const [newReason, setNewReason] = useState("");
  const [editingReason, setEditingReason] = useState<{ index: number; value: string } | null>(null);

  const [lobLocks, setLobLocks] = useState<Record<string, boolean>>({});
  
  const [showImportConfirm, setShowImportConfirm] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [selectedBackupFile, setSelectedBackupFile] = useState<File | null>(null);
  
  const [summaryViewLobs, setSummaryViewLobs] = useState<string[]>([]);
  const [summaryViewDelegateLobs, setSummaryViewDelegateLobs] = useState<string[]>([]);

  const [consolidatedViewUsers, setConsolidatedViewUsers] = useState<User[]>([]);

  const [notificationConfig, setNotificationConfig] = useState<NotificationConfig>({ to: [], cc: [], bcc: [] });

  const [showGoLiveConfirm, setShowGoLiveConfirm] = useState(false);

  // IT Access Features / Office Requests state
  const [itAccessFeatures, setItAccessFeatures] = useState<ITAccessFeature[]>([]);
  const [officeRequests, setOfficeRequests] = useState<OfficeRequest[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string>("");
  const [selectedRequestLob, setSelectedRequestLob] = useState<string>("");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [hrTemplateFile, setHrTemplateFile] = useState<File | null>(null);
  const hrTemplateInputRef = useRef<HTMLInputElement>(null);
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  const currentUserProfile = useMemo(() => {
    if (!authUser || !authUser.email) return null;
    return users.find(u => u.email && u.email.toLowerCase() === authUser.email!.toLowerCase());
  }, [authUser, users]);

  const userRoles = useMemo((): UserRole[] => {
    if (!authUser || !currentUserProfile || !Object.keys(roles).length || !admins.length) {
        return [];
    }

    const determinedRoles: UserRole[] = [];
    const lowerCaseAdminEmails = admins.map(a => a.email.toLowerCase());
    const isUserAdmin = lowerCaseAdminEmails.includes(authUser.email!.toLowerCase());
    
    if (isUserAdmin) {
        determinedRoles.push("ADMIN");
    }
    
    const initialLob = currentUserProfile.lineOfBusiness;
    if (initialLob) {
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
        return ["READ_ONLY"];
    }
    return determinedRoles;
  }, [authUser, currentUserProfile, roles, admins]);

  useEffect(() => {
    const checkAuth = async () => {
      if (!authUser || !authUser.email) {
        setAuthStatus('unauthorized');
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
          return;
        }

        const allRoles = await getRolesAction();
        const { users: allUsers } = await getWorkspaceUsersAction();
        
        const uniqueUsersMap = new Map<string, User>();
        allUsers.forEach(user => {
            if(user.id) {
                uniqueUsersMap.set(user.id, user);
            }
        });
        const uniqueUsers = Array.from(uniqueUsersMap.values());

        const userProfile = uniqueUsers.find(u => u.email.toLowerCase() === authUser.email!.toLowerCase());
        
        if (userProfile && userProfile.id) {
          const lobsAsGroupHead = Object.entries(allRoles)
            .filter(([_, role]) => role.groupHead === userProfile.id)
            .map(([lob]) => lob);

          if (lobsAsGroupHead.length > 0) {
            setUserLobs(lobsAsGroupHead);
            setAuthStatus('groupHead');
            return;
          }
        }
        
        setAuthStatus('unauthorized');
      } catch (error) {
        console.error("Failed to check authorization:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not verify your access level.",
        });
        setAuthStatus('unauthorized');
      }
    };
    checkAuth();
  }, [authUser, toast, searchParams]);

  useEffect(() => {
    if (authStatus === 'loading' || authStatus === 'unauthorized') return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const data = await getAdminPageDataAction(userLobs, authStatus as 'admin' | 'groupHead');
        
        setUsers(data.users || []);
        setReasons(data.reasons || []);
        setSummaryViewLobs(data.summaryViewLobs || []);
        setSummaryViewDelegateLobs(data.summaryViewDelegateLobs || []);
        setLobLocks(data.lobLocks || {});

        if (authStatus === 'admin') {
          if (data.consolidatedViewUsers) {
            const consolidatedUserEmails = (data.consolidatedViewUsers || []).map((e: string) => e.toLowerCase());
            const consolidatedUsersList = data.users.filter(u => u.email && consolidatedUserEmails.includes(u.email.toLowerCase()));
            setConsolidatedViewUsers(consolidatedUsersList);
          }
          setNotificationConfig(data.notificationConfig);

          try {
            const [features, requests] = await Promise.all([
              getITAccessFeaturesAction(),
              getOfficeRequestsAction(),
            ]);
            setItAccessFeatures(features || []);
            setOfficeRequests(requests || []);
          } catch (error) {
            console.error("Failed to load IT access features or office requests:", error);
          }
        }

        const fetchedRoles = data.roles || {};
        const lobsForRoles = authStatus === 'admin'
          ? Array.from(new Set(data.users.map(u => u.lineOfBusiness)))
          : userLobs;

        const initialRoles: Record<string, Roles> = {};
        lobsForRoles.forEach(lob => {
            initialRoles[lob] = fetchedRoles[lob] || { groupHead: null, delegates: [] };
        });
        setRoles(initialRoles);
        
        const adminEmails = (data.admins || []).map((e: string) => e.toLowerCase());
        const adminUsers = data.users.filter(u => u.email && u.email.toLowerCase() && adminEmails.includes(u.email.toLowerCase()));
        setAdmins(adminUsers);

      } catch (error: any) {
        console.error("Failed to fetch initial data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to load initial data: ${error.message}`,
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [authStatus, userLobs, toast]);
  
  const handleAddReason = () => {
    if (newReason.trim() && !reasons.includes(newReason.trim())) {
      setReasons([...reasons, newReason.trim()]);
      setNewReason("");
    }
  };

  const handleUpdateReason = () => {
    if (editingReason) {
      const updatedReasons = [...reasons];
      updatedReasons[editingReason.index] = editingReason.value.trim();
      setReasons(updatedReasons);
      setEditingReason(null);
    }
  };

  const handleRemoveReason = (index: number) => {
    setReasons(reasons.filter((_, i) => i !== index));
  };


  const linesOfBusiness = useMemo(() => {
    if (authStatus === 'admin') {
      return Array.from(new Set(users.map((e) => e.lineOfBusiness))).sort();
    }
    return userLobs;
  }, [users, authStatus, userLobs]);
  
  const filteredLobs = useMemo(() => {
    if (!lobSearch) return linesOfBusiness;
    return linesOfBusiness.filter(lob => lob.toLowerCase().includes(lobSearch.toLowerCase()));
  }, [linesOfBusiness, lobSearch]);

  const departments = useMemo(() => {
    return Array.from(
      new Set(users.map(u => u.department).filter((d): d is string => !!d))
    ).sort();
  }, [users]);

  const [selectedLob, setSelectedLob] = useState<string | null>(null);

  useEffect(() => {
    if (linesOfBusiness.length > 0 && !selectedLob) {
        const userLob = currentUserProfile?.lineOfBusiness;
        if (userLob && linesOfBusiness.includes(userLob)) {
            setSelectedLob(userLob);
        } else {
            setSelectedLob(linesOfBusiness[0]);
        }
    }
  }, [linesOfBusiness, selectedLob, currentUserProfile]);

  useEffect(() => {
    if (!lobPopoverOpen) {
      setLobSearch("");
    }
  }, [lobPopoverOpen]);

  const handleLobSelect = (lob: string) => {
    setSelectedLob(lob);
    setLobPopoverOpen(false);
    setLobSearch("");
  }

  const handleRoleChange = (lob: string, type: 'groupHead' | 'delegates', value: any) => {
    setRoles(prevRoles => {
        const newLobRoles = { ...prevRoles[lob], [type]: value };
        if (type === 'groupHead' && value && newLobRoles.delegates.includes(value)) {
            newLobRoles.delegates = newLobRoles.delegates.filter(d => d !== value);
        }
        return {
            ...prevRoles,
            [lob]: newLobRoles
        };
    });
  };

  const handleDelegateToggle = (lob: string, userId: string) => {
    const currentDelegates = roles[lob]?.delegates || [];
    const newDelegates = currentDelegates.includes(userId)
      ? currentDelegates.filter(id => id !== userId)
      : [...currentDelegates, userId];
    handleRoleChange(lob, 'delegates', newDelegates);
  };
  
  const handleClearDelegates = (lob: string) => {
    handleRoleChange(lob, 'delegates', []);
  };
  
  const getActor = () => {
    return {
      name: authUser?.displayName || 'Unknown',
      email: authUser?.email || 'Unknown',
      roles: userRoles,
    };
  };

  // IT Access Features handlers
  const handleFeatureToggle = (featureId: string) => {
    setSelectedFeatures(prev =>
      prev.includes(featureId)
        ? prev.filter(id => id !== featureId)
        : [...prev, featureId]
    );
  };

  const handleHrTemplateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setHrTemplateFile(file);
    }
  };

  const handleSubmitOfficeRequest = async () => {
    if (!selectedDepartment || !selectedRequestLob || selectedFeatures.length === 0) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please select department, line of business, and at least one IT access feature.",
      });
      return;
    }

    setIsSubmittingRequest(true);
    try {
      const hrTemplateData = hrTemplateFile
        ? {
            fileName: hrTemplateFile.name,
            uploadedAt: new Date().toISOString(),
            fileSize: hrTemplateFile.size,
          }
        : undefined;

      const newRequest = await createOfficeRequestAction(
        {
          department: selectedDepartment,
          lineOfBusiness: selectedRequestLob,
          requestedBy: {
            name: authUser?.displayName || "Unknown",
            email: authUser?.email || "Unknown",
          },
          itAccessFeatures: selectedFeatures,
          hrTemplateFile: hrTemplateData,
        },
        getActor()
      );

      setOfficeRequests(prev => [...prev, newRequest]);
      setSelectedDepartment("");
      setSelectedRequestLob("");
      setSelectedFeatures([]);
      setHrTemplateFile(null);
      if (hrTemplateInputRef.current) {
        hrTemplateInputRef.current.value = "";
      }

      toast({
        title: "Success",
        description: "Office request submitted successfully.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to submit office request.",
      });
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  const handleUpdateRequestStatus = async (
    requestId: string,
    status: "approved" | "rejected"
  ) => {
    try {
      await updateOfficeRequestAction(
        requestId,
        {
          status,
          approvedBy: {
            name: authUser?.displayName || "Unknown",
            email: authUser?.email || "Unknown",
          },
          approvedAt: new Date().toISOString(),
        },
        getActor()
      );

      setOfficeRequests(prev =>
        prev.map(r =>
          r.id === requestId ? { ...r, status, approvedBy: { name: authUser?.displayName || "Unknown", email: authUser?.email || "Unknown" }, approvedAt: new Date().toISOString() } : r
        )
      );

      toast({
        title: "Success",
        description: `Request ${status} successfully.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error?.message || "Failed to update request status.",
      });
    }
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
        const actor = getActor();
        const actionsToRun = [saveRolesAction(roles, actor)];
        if (authStatus === 'admin') {
            const adminEmails = admins.map(a => a.email.toLowerCase());
            const consolidatedEmails = consolidatedViewUsers.map(u => u.email.toLowerCase());

            actionsToRun.push(saveAdminsAction(adminEmails, actor));
            actionsToRun.push(saveReasonsAction(reasons, actor));
            actionsToRun.push(saveSummaryViewLobsAction(summaryViewLobs, actor));
            actionsToRun.push(saveSummaryViewDelegateLobsAction(summaryViewDelegateLobs, actor));
            actionsToRun.push(saveConsolidatedViewUsersAction(consolidatedEmails, actor));
            actionsToRun.push(saveNotificationConfigAction(notificationConfig, actor));
        }
        await Promise.all(actionsToRun);

        toast({
            title: "Success",
            description: "Your configurations have been saved.",
        });
    } catch(e) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to save configurations.",
        });
    } finally {
        setIsSaving(false);
    }
  }

  const handleAddAdmin = (user: User | null) => {
    if (user && !admins.some(admin => admin.id === user.id)) {
        setAdmins(prevAdmins => [...prevAdmins, user]);
    }
  };
  
  const handleRemoveAdmin = (userId: string) => {
    setAdmins(prevAdmins => prevAdmins.filter(admin => admin.id !== userId));
  }
  
  const handleRemoveAllUsers = async () => {
    setIsRemoving(true);
    try {
      await removeAllUsersAction(getActor());
      setUsers([]);
      toast({
          title: "Success",
          description: "All users have been removed.",
      });
    } catch (error) {
       toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to remove users.",
      });
    } finally {
        setIsRemoving(false);
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click();
  }
  
  const parseCSV = (text: string): { headers: string[], rows: string[][] } => {
    text = text.replace(/\r/g, '');
    const lines = text.trim().split('\n');
    const headers = lines.shift()?.trim().split(',') || [];
    
    const rows = lines.map(line => {
      const row: string[] = [];
      let currentField = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            currentField += '"';
            i++; 
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          row.push(currentField.trim());
          currentField = '';
        } else {
          currentField += char;
        }
      }
      row.push(currentField.trim());
      return row;
    });

    return { headers, rows };
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setShowImportConfirm(true);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleConfirmImport = async () => {
      if (!selectedFile) return;
      await processCsvFile(selectedFile, 'import');
      setSelectedFile(null);
  };
  
  const handleBackupFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        setSelectedBackupFile(file);
        setShowRestoreConfirm(true);
    }
    if (backupFileInputRef.current) {
        backupFileInputRef.current.value = "";
    }
  };
  
  const handleConfirmRestore = async () => {
      if (!selectedBackupFile) return;
      await processCsvFile(selectedBackupFile, 'restore');
      setSelectedBackupFile(null);
  };
  
  const handleRestoreClick = () => {
      backupFileInputRef.current?.click();
  };

  const processCsvFile = async (file: File, mode: 'import' | 'restore') => {
    const reader = new FileReader();
    reader.onload = async (e) => {
        const text = e.target?.result;
        if (typeof text !== 'string') return;
        
        setIsImporting(true);
        setImportProgress(0);
        setImportedCount(0);

        try {
            if (mode === 'restore') {
                await removeAllUsersAction(getActor());
            }

            const { headers, rows } = parseCSV(text);

            if (headers.length === 0) {
                throw new Error("CSV file is empty or has no header.");
            }

            const baseHeaders = ['id', 'name', 'email', 'designation', 'manager', 'department', 'lineOfBusiness', 'location', 'city'];
            const restoreHeaders = ['modifierName', 'modifierEmail', 'reason', 'modifiedAt'];
            const requiredHeaders = mode === 'restore' ? [...baseHeaders, ...restoreHeaders] : baseHeaders;

            const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
            if (missingHeaders.length > 0) {
                  throw new Error(`Invalid CSV header. Missing columns: ${missingHeaders.join(', ')}.`);
            }

            const headerMap = headers.reduce((acc, h, i) => {
                acc[h.trim()] = i;
                return acc;
            }, {} as Record<string, number>);
            
            const newUsers: User[] = rows.map((values, index) => {
                try {
                    if (values.length > headers.length) {
                        console.warn(`Row ${index + 2} has more columns than headers. Truncating extra values.`);
                        values = values.slice(0, headers.length);
                    }
                    while (values.length < headers.length) {
                        values.push(""); // Pad missing cells with empty strings
                    }

                    const email = values[headerMap['email']];
                    if (!email) throw new Error(`Row ${index + 2} is missing the required 'email' field.`);
                    const id = values[headerMap['id']];
                    if (!id) throw new Error(`Row ${index + 2} is missing the required 'id' field.`);

                    const user: User = {
                        id: id,
                        name: values[headerMap['name']],
                        email: email,
                        designation: values[headerMap['designation']],
                        manager: values[headerMap['manager']],
                        department: values[headerMap['department']],
                        lineOfBusiness: values[headerMap['lineOfBusiness']],
                        location: values[headerMap['location']],
                        city: values[headerMap['city']],
                    };

                    if (mode === 'restore') {
                        const modifierName = values[headerMap['modifierName']];
                        const modifierEmail = values[headerMap['modifierEmail']];
                        const reason = values[headerMap['reason']];
                        const modifiedAt = values[headerMap['modifiedAt']];

                        if (modifierName && modifierEmail) {
                            user.modifier = { name: modifierName, email: modifierEmail };
                        }
                        if (reason) {
                            user.reason = reason;
                        }
                        if (modifiedAt) {
                           user.modifiedAt = modifiedAt;
                        }
                    }
                    return user;
                } catch (parseError: any) {
                    throw new Error(`Error parsing row ${index + 2}: ${parseError.message}.`);
                }
            });

            setTotalToImport(newUsers.length);
            
            const CHUNK_SIZE = 50;
            for (let i = 0; i < newUsers.length; i += CHUNK_SIZE) {
                const chunk = newUsers.slice(i, i + CHUNK_SIZE);
                await importUsersAction(chunk, getActor());
                const newImportedCount = i + chunk.length;
                setImportedCount(newImportedCount);
                setImportProgress((newImportedCount / newUsers.length) * 100);
            }
            
            const { users: allUsers } = await getWorkspaceUsersAction();
            const uniqueUsersMap = new Map<string, User>();
            allUsers.forEach(user => {
                if(user.id) {
                    uniqueUsersMap.set(user.id, user);
                }
            });
            const uniqueUsers = Array.from(uniqueUsersMap.values());
            setUsers(uniqueUsers || []);
            
            const successMessage = mode === 'restore'
                ? `${newUsers.length} records have been restored.`
                : `${newUsers.length} users have been imported/updated.`;
            toast({ title: "Success", description: successMessage });

        } catch (error: any) {
            setUsers([]); 
            toast({
                variant: "destructive",
                title: "Operation Failed",
                description: error.message || "An unexpected error occurred.",
            });
        } finally {
            setIsImporting(false);
        }
    };
    reader.readAsText(file);
  }

  const handleDownloadTemplate = () => {
    const header = "id,name,email,designation,manager,department,lineOfBusiness,location,city\n";
    const example = "51,Jane Doe,jane.doe@example.com,Project Manager,David Lee,Engineering,Centralized Operations,FTC,Karachi\n";
    const blob = new Blob([header, example], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "user_template.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const handleDownloadBackup = () => {
      if (users.length === 0) {
          toast({ variant: "destructive", title: "No Data", description: "There is no user data to back up." });
          return;
      }
      
      const headers = ['id', 'name', 'email', 'designation', 'manager', 'department', 'lineOfBusiness', 'location', 'city', 'modifierName', 'modifierEmail', 'reason', 'modifiedAt'];
      
      const escapeCsvField = (field: any): string => {
          if (field === null || typeof field === 'undefined') return '';
          const stringField = String(field);
          if (stringField.includes('"') || stringField.includes(',') || stringField.includes('\n')) {
              return `"${stringField.replace(/"/g, '""')}"`;
          }
          return stringField;
      };

      const rows = users.map(user => {
          return [
              escapeCsvField(user.id),
              escapeCsvField(user.name),
              escapeCsvField(user.email),
              escapeCsvField(user.designation),
              escapeCsvField(user.manager),
              escapeCsvField(user.department),
              escapeCsvField(user.lineOfBusiness),
              escapeCsvField(user.location),
              escapeCsvField(user.city),
              escapeCsvField(user.modifier?.name),
              escapeCsvField(user.modifier?.email),
              escapeCsvField(user.reason),
              escapeCsvField(user.modifiedAt),
          ].join(',');
      });

      const csvContent = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.setAttribute("download", `the300_backup_${timestamp}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const availableUsersForAdmin = useMemo(() => {
    const adminIds = new Set(admins.map(a => a.id));
    return users.filter(user => !adminIds.has(user.id));
  }, [users, admins]);

  const filteredUsersForGroupHead = (lob: string): User[] => {
    if (!lob) return [];
    
    // Get all users in the selected LOB
    const lobMembers = users.filter(u => u.lineOfBusiness === lob);
    
    // Get all admins
    const nonMemberAdmins = admins.filter(admin => !lobMembers.some(member => member.id === admin.id));

    // Combine LOB members and non-member admins
    const combinedList = [...lobMembers, ...nonMemberAdmins];

    // Remove duplicates using a Map, keyed by user ID
    const uniqueUsersMap = new Map<string, User>();
    combinedList.forEach(user => {
      if (user.id) {
        uniqueUsersMap.set(user.id, user);
      }
    });

    // Convert the Map back to an array and sort
    return Array.from(uniqueUsersMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  };
  
  const sortedDelegates = (lob: string): User[] => {
    if (!lob || !roles[lob]) return [];
    
    const groupHeadId = roles[lob].groupHead;
    const lobMembers = users.filter(u => u.lineOfBusiness === lob && u.id !== groupHeadId);
    
    const selectedDelegateIds = new Set(roles[lob].delegates);
    
    return lobMembers.sort((a, b) => {
        const aIsSelected = selectedDelegateIds.has(a.id);
        const bIsSelected = selectedDelegateIds.has(b.id);
        
        if (aIsSelected && !bIsSelected) return -1;
        if (!aIsSelected && bIsSelected) return 1;
        
        return a.name.localeCompare(b.name);
    });
};
  
  const availableUsersForConsolidatedView = useMemo(() => {
    const consolidatedUserIds = new Set(consolidatedViewUsers.map(u => u.id));
    return users.filter(user => !consolidatedUserIds.has(user.id));
  }, [users, consolidatedViewUsers]);
  
  const handleLockToggle = async (lob: string) => {
    if (authStatus !== 'admin' || !lobLocks[lob]) return; 

    const newLockState = false; 
    try {
      await saveLockStatusAction(lob, newLockState, getActor());
      setLobLocks(prev => ({ ...prev, [lob]: newLockState }));
      toast({
        title: "Success",
        description: `Roster for ${lob} has been unlocked.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update lock status.",
      });
    }
  };
  
  const handleSummaryViewLobToggle = (lob: string) => {
    const isCurrentlyEnabled = summaryViewLobs.includes(lob);
    if (isCurrentlyEnabled) {
      setSummaryViewLobs(prev => prev.filter(l => l !== lob));
      setSummaryViewDelegateLobs(prev => prev.filter(l => l !== lob));
    } else {
      setSummaryViewLobs(prev => [...prev, lob]);
    }
  };

  const handleSummaryViewDelegateLobToggle = (lob: string) => {
    setSummaryViewDelegateLobs(prev =>
      prev.includes(lob) ? prev.filter(l => l !== lob) : [...prev, lob]
    );
  };


  const lobSummary = useMemo(() => {
    return linesOfBusiness.map(lob => {
        const lobUsers = users.filter(u => u.lineOfBusiness === lob);
        const activeSelections = lobUsers.filter(u => !!u.modifier).length;
        
        const lobRoles = roles[lob] || { groupHead: null, delegates: [] };
        
        const groupHeadUser = users.find(u => u.id === lobRoles.groupHead);
        const delegateUsers = lobRoles.delegates.map(id => users.find(u => u.id === id)).filter(Boolean) as User[];
        
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
            activeSelections,
            reasonCounts,
            isLocked: lobLocks[lob] || false,
        };
    });
  }, [users, roles, linesOfBusiness, lobLocks]);

  const totalActiveSelections = useMemo(() => {
      return users.filter(u => !!u.modifier).length;
  }, [users]);

  const handleAddConsolidatedUser = (user: User | null) => {
    if (user && !consolidatedViewUsers.some(u => u.id === user.id)) {
        setConsolidatedViewUsers(prev => [...prev, user]);
    }
  };

  const handleRemoveConsolidatedUser = (userId: string) => {
      setConsolidatedViewUsers(prev => prev.filter(u => u.id !== userId));
  };
  
  const handleResetForGoLive = async () => {
    setIsResetting(true);
    try {
        await resetForGoLiveAction(getActor());
        setUsers(prevUsers => prevUsers.map(u => {
            const { reason, modifier, modifiedAt, ...rest } = u;
            return rest;
        }));
        const newLobLocks: Record<string, boolean> = {};
        Object.keys(lobLocks).forEach(lob => {
            newLobLocks[lob] = false;
        });
        setLobLocks(newLobLocks);
        toast({
            title: "Application Reset Successful",
            description: "All selections have been cleared and all rosters are unlocked.",
        });
    } catch (error) {
        toast({
            variant: "destructive",
            title: "Reset Failed",
            description: "An error occurred while resetting the application.",
        });
    } finally {
        setIsResetting(false);
    }
  }

    if (authStatus === 'loading') {
        return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <p>Verifying access...</p>
        </div>
        );
    }

    if (authStatus === 'unauthorized') {
        return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background text-center">
            <div className="flex flex-col items-center gap-4">
                <ShieldAlert className="h-16 w-16 text-destructive" />
                <h1 className="text-3xl font-bold">Access Denied</h1>
                <p className="text-muted-foreground">
                    You do not have permission to view this page.
                </p>
                <Button asChild>
                    <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Go to Dashboard
                    </Link>
                </Button>
            </div>
        </div>
        );
    }

  const renderLoadingState = () => (
    <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
            <div className="animate-pulse">
                <Logo />
            </div>
            <p className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading Admin Panel...
            </p>
        </div>
    </div>
  );
  
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" asChild>
                  <Link href="/">
                  <ArrowLeft className="h-4 w-4" />
                  </Link>
              </Button>
              <div className="flex items-center gap-4">
                  <Logo />
                  <div className="flex flex-col">
                      <h1 className="text-2xl font-bold tracking-tight">The 300</h1>
                      <p className="text-sm text-muted-foreground">Strategic License Allocation</p>
                  </div>
              </div>
          </div>
          <div className="flex items-center gap-2">
              <ThemeToggle />
              {(authStatus === 'admin' || (userRoles.includes("ADMIN") && searchParams.get('super_user_access_key') !== SUPER_USER_ACCESS_KEY)) && (
                <Button asChild variant="outline">
                    <Link href={`/changelog${searchParams.get('super_user_access_key') ? `?super_user_access_key=${SUPER_USER_ACCESS_KEY}` : ''}`}>
                        <History className="mr-2 h-4 w-4" />
                        Change Log
                    </Link>
                </Button>
              )}
              <Button onClick={handleSaveChanges} disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  {isSaving ? "Saving..." : "Save Changes"}
              </Button>
          </div>
        </div>

        {isLoading ? renderLoadingState() : (
        <>
            {authStatus === 'groupHead' && (
            <Card>
                <CardHeader>
                    <CardTitle>Role Management</CardTitle>
                    <CardDescription>
                        Assign Delegates for your Line of Business.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                {userLobs.map(lob => (
                <div key={lob} className="space-y-4 p-4 border rounded-lg">
                    <h3 className="font-semibold text-lg">{lob}</h3>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Delegates</label>
                        <Popover open={delegatePopovers[lob] || false} onOpenChange={(isOpen) => setDelegatePopovers(prev => ({...prev, [lob]: isOpen}))}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-between text-left" >
                                    <div className="flex flex-col items-start">
                                    <span className="truncate">
                                        {roles[lob]?.delegates?.length > 0
                                        ? `${roles[lob]?.delegates?.length} delegate(s) selected`
                                        : 'No delegates selected'}
                                    </span>
                                    <span className="text-xs text-muted-foreground">Click to select delegates</span>
                                    </div>
                                    <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput placeholder="Search delegates..." />
                                    <CommandList>
                                        <CommandEmpty>No users found.</CommandEmpty>
                                        <CommandGroup>
                                            {sortedDelegates(lob).map((user) => (
                                                <CommandItem
                                                    key={user.id}
                                                    value={`${user.name} ${user.email}`}
                                                    onSelect={() => handleDelegateToggle(lob, user.id)}
                                                >
                                                    <Check
                                                        className={cn(
                                                        "mr-2 h-4 w-4",
                                                        roles[lob]?.delegates.includes(user.id) ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    {getUserDisplay(user)}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                    {(roles[lob]?.delegates?.length || 0) > 0 && (
                                        <>
                                            <DropdownMenuSeparator />
                                            <Command>
                                                <CommandGroup>
                                                    <CommandItem onSelect={() => handleClearDelegates(lob)} className="text-destructive justify-center aria-selected:text-destructive-foreground focus:text-destructive-foreground focus:bg-destructive/10">
                                                        Clear all selections
                                                    </CommandItem>
                                                </CommandGroup>
                                            </Command>
                                        </>
                                    )}
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
                ))}
                </CardContent>
            </Card>
            )}

            {authStatus === 'admin' && (
            <>
                <div className="grid gap-8 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Role Management</CardTitle>
                            <CardDescription>
                            Assign Group Heads and Delegates for each Line of Business.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Select Line of Business</label>
                                <Popover open={lobPopoverOpen} onOpenChange={setLobPopoverOpen}>
                                    <PopoverTrigger asChild>
                                        <Button variant="outline" role="combobox" className="w-full justify-between">
                                            {selectedLob || "Select an LOB"}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                        <Command>
                                            <CommandInput 
                                            placeholder="Search LOB..."
                                            value={lobSearch}
                                            onValueChange={setLobSearch}
                                            />
                                            <CommandEmpty>No LOB found.</CommandEmpty>
                                            <CommandList>
                                                <CommandGroup>
                                                {filteredLobs.map((lob) => (
                                                    <CommandItem key={lob} value={lob} onSelect={() => handleLobSelect(lob)}>
                                                        <Check className={cn("mr-2 h-4 w-4", selectedLob === lob ? "opacity-100" : "opacity-0")} />
                                                        {lob}
                                                    </CommandItem>
                                                ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {selectedLob && roles[selectedLob] && (
                                <div key={selectedLob} className="space-y-4 p-4 border rounded-lg">
                                    <h3 className="font-semibold text-lg">{selectedLob}</h3>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Group Head</label>
                                            <Popover open={groupHeadPopovers[selectedLob] || false} onOpenChange={(isOpen) => setGroupHeadPopovers(prev => ({...prev, [selectedLob]: isOpen}))}>
                                                <PopoverTrigger asChild>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className="w-full justify-start text-left h-auto"
                                                    >
                                                        <div className="flex items-center text-left overflow-hidden">
                                                            {roles[selectedLob].groupHead && users.find(u => u.id === roles[selectedLob].groupHead) ? getUserDisplay(users.find(u => u.id === roles[selectedLob].groupHead)!) : <span className="text-muted-foreground font-normal">Select a Group Head</span>}
                                                        </div>
                                                        <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                                    <Command>
                                                        <CommandInput placeholder="Search user..." />
                                                        <CommandList>
                                                            <CommandEmpty>No user found.</CommandEmpty>
                                                            <CommandGroup>
                                                                {filteredUsersForGroupHead(selectedLob).map((user) => (
                                                                    <CommandItem
                                                                        key={user.id}
                                                                        value={`${user.name} ${user.email}`}
                                                                        onSelect={() => {
                                                                            handleRoleChange(selectedLob, 'groupHead', user.id);
                                                                            setGroupHeadPopovers(prev => ({...prev, [selectedLob]: false}));
                                                                        }}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                                "mr-2 h-4 w-4",
                                                                                roles[selectedLob].groupHead === user.id ? "opacity-100" : "opacity-0"
                                                                            )}
                                                                        />
                                                                        {getUserDisplay(user)}
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                            {roles[selectedLob].groupHead && (
                                                                <>
                                                                    <DropdownMenuSeparator />
                                                                    <Command>
                                                                        <CommandGroup>
                                                                            <CommandItem
                                                                                onSelect={() => {
                                                                                    handleRoleChange(selectedLob, 'groupHead', null);
                                                                                    setGroupHeadPopovers(prev => ({...prev, [selectedLob]: false}));
                                                                                }}
                                                                                className="text-destructive justify-center aria-selected:text-destructive-foreground focus:text-destructive-foreground focus:bg-destructive/10"
                                                                            >
                                                                                Clear selection
                                                                            </CommandItem>
                                                                        </CommandGroup>
                                                                    </Command>
                                                                </>
                                                            )}
                                                        </CommandList>
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-medium">Delegates</label>
                                            <Popover open={delegatePopovers[selectedLob] || false} onOpenChange={(isOpen) => setDelegatePopovers(prev => ({...prev, [selectedLob]: isOpen}))}>
                                                <PopoverTrigger asChild>
                                                    <Button variant="outline" className="w-full justify-start text-left" >
                                                        <span className="truncate">
                                                            {(roles[selectedLob]?.delegates?.length || 0) > 0
                                                            ? `${roles[selectedLob]?.delegates?.length} selected`
                                                            : 'Select Delegates'}
                                                        </span>
                                                        <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                                    <Command>
                                                        <CommandInput placeholder="Search delegates..." />
                                                        <CommandList>
                                                            <CommandEmpty>No users found.</CommandEmpty>
                                                            <CommandGroup>
                                                                {sortedDelegates(selectedLob).map((user) => (
                                                                    <CommandItem
                                                                        key={user.id}
                                                                        value={`${user.name} ${user.email}`}
                                                                        onSelect={() => handleDelegateToggle(selectedLob, user.id)}
                                                                    >
                                                                        <Check
                                                                            className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            roles[selectedLob]?.delegates.includes(user.id) ? "opacity-100" : "opacity-0"
                                                                            )}
                                                                        />
                                                                        {getUserDisplay(user)}
                                                                    </CommandItem>
                                                                ))}
                                                            </CommandGroup>
                                                        </CommandList>
                                                        {(roles[selectedLob]?.delegates?.length || 0) > 0 && (
                                                            <>
                                                                <DropdownMenuSeparator />
                                                                <Command>
                                                                    <CommandGroup>
                                                                        <CommandItem onSelect={() => handleClearDelegates(selectedLob)} className="text-destructive justify-center aria-selected:text-destructive-foreground focus:text-destructive-foreground focus:bg-destructive/10">
                                                                            Clear all selections
                                                                        </CommandItem>
                                                                    </CommandGroup>
                                                                </Command>
                                                            </>
                                                        )}
                                                    </Command>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Administrator Access</CardTitle>
                            <CardDescription>Manage users who have admin privileges.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full">
                                        <UserPlus className="mr-2 h-4 w-4" /> Add New Admin
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search user..." />
                                        <CommandList>
                                            <CommandEmpty>No user found.</CommandEmpty>
                                            <CommandGroup>
                                                {availableUsersForAdmin.map((user) => (
                                                    <CommandItem
                                                        key={user.id}
                                                        value={`${user.name} ${user.email}`}
                                                        onSelect={() => handleAddAdmin(user)}
                                                    >
                                                        {getUserDisplay(user)}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            
                            <div className="space-y-4">
                                <h3 className="font-semibold text-lg flex items-center gap-2"><Shield /> Current Admins</h3>
                                {admins.length > 0 ? (
                                    <ul className="space-y-2">
                                    {admins.map(admin => (
                                        <li key={admin.id} className="flex items-center justify-between p-2 border rounded-lg">
                                            {getUserDisplay(admin)}
                                            <Button variant="ghost" size="icon" onClick={() => handleRemoveAdmin(admin.id)}>
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </li>
                                    ))}
                                    </ul>
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">No admins assigned.</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="grid gap-8 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>User Data Management</CardTitle>
                        <CardDescription>Manage the employee data for the application. The data is currently stored locally.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {isLoading && !isImporting ? (
                                    <p className="text-sm text-muted-foreground animate-pulse">
                                    Current user count in local store: Loading...
                                    </p>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        Current user count in local store: <span className="font-semibold">{users.length}</span>
                                    </p>
                                )}
                                {isImporting && (
                                    <div className="space-y-2">
                                        <Progress value={importProgress} />
                                        <p className="text-sm text-muted-foreground">Processing {importedCount} of {totalToImport} records...</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-wrap gap-2">
                            <Button onClick={handleImportClick} disabled={isImporting}>
                                <Upload className="mr-2 h-4 w-4" /> Import Roster
                            </Button>
                            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".csv" />
                             <Button onClick={handleDownloadTemplate} variant="outline">
                                <Download className="mr-2 h-4 w-4"/> Download Template
                            </Button>
                            <div className="flex-grow" />
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" disabled={isRemoving}>
                                        {isRemoving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                                        {isRemoving ? "Removing..." : "Remove All Users"}
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete all
                                        user data from the database.
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleRemoveAllUsers}>Continue</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                            <AlertDialog open={showImportConfirm} onOpenChange={setShowImportConfirm}>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                    <AlertDialogTitle>Confirm User Import</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        You have selected the file: <span className="font-semibold">{selectedFile?.name}</span>.
                                        Importing will overwrite existing user data based on email. This action cannot be undone. Are you sure you want to continue?
                                    </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setSelectedFile(null)}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleConfirmImport}>Continue Import</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </CardFooter>
                         <CardFooter className="flex flex-wrap gap-2 border-t pt-4">
                            <Button onClick={handleRestoreClick} disabled={isImporting}>
                                <DatabaseBackup className="mr-2 h-4 w-4" /> {isImporting ? "Restoring..." : "Restore from Backup"}
                            </Button>
                            <input type="file" ref={backupFileInputRef} onChange={handleBackupFileChange} className="hidden" accept=".csv" />

                            <Button onClick={handleDownloadBackup} variant="outline">
                                <Download className="mr-2 h-4 w-4"/> Download Backup
                            </Button>
                            <div className="flex-grow" />
                            <Button variant="destructive" onClick={() => setShowGoLiveConfirm(true)} disabled={isResetting}>
                                {isResetting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                                {isResetting ? "Resetting..." : "Reset for Go-Live"}
                            </Button>
                            <TimedConfirmationDialog 
                                open={showGoLiveConfirm} 
                                onOpenChange={setShowGoLiveConfirm} 
                                onConfirm={handleResetForGoLive}
                                countdownSeconds={10}
                                title="Are you absolutely sure?"
                                description="This is a critical, irreversible action that will **clear all current license selections** and **unlock all rosters**. This is intended for a full application reset before a go-live event."
                                confirmButtonText="Confirm Reset"
                            />
                             <AlertDialog open={showRestoreConfirm} onOpenChange={setShowRestoreConfirm}>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Confirm State Restore</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            You are about to restore the application state from the file: <span className="font-semibold">{selectedBackupFile?.name}</span>.
                                            This will overwrite all existing selections and user data. This action is irreversible.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel onClick={() => setSelectedBackupFile(null)}>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleConfirmRestore}>Yes, Restore</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </CardFooter>
                    </Card>
                    <Card>
                    <CardHeader>
                        <CardTitle>Reason Management</CardTitle>
                        <CardDescription>
                        Configure the predefined reasons for license allocation.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                        <Input
                            type="text"
                            placeholder="Enter a new reason"
                            value={newReason}
                            onChange={(e) => setNewReason(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddReason()}
                        />
                        <Button onClick={handleAddReason}><Plus className="mr-2 h-4 w-4" /> Add</Button>
                        </div>
                        <div className="space-y-2">
                        <h3 className="font-semibold flex items-center gap-2">
                            <ListChecks /> Current Reasons
                        </h3>
                        {reasons.length > 0 ? (
                            <ul className="space-y-2">
                            {reasons.map((reason, index) => (
                                <li
                                key={index}
                                className="flex items-center justify-between gap-2 p-2 border rounded-lg"
                                >
                                {editingReason?.index === index ? (
                                    <>
                                    <Input
                                        type="text"
                                        value={editingReason.value}
                                        onChange={(e) =>
                                        setEditingReason({ ...editingReason, value: e.target.value })
                                        }
                                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateReason()}
                                        autoFocus
                                    />
                                    <Button size="icon" onClick={handleUpdateReason}>
                                        <Check className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setEditingReason(null)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                    </>
                                ) : (
                                    <>
                                    <span className="truncate">{reason}</span>
                                    <div className="flex gap-1">
                                        <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setEditingReason({ index: reasons.indexOf(reason), value: reason })}
                                        >
                                        <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemoveReason(reasons.indexOf(reason))}
                                        >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                    </>
                                )}
                                </li>
                            ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                            No reasons configured.
                            </p>
                        )}
                        </div>
                    </CardContent>
                    </Card>
                </div>
                <div className="grid gap-8 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                        <CardTitle>Summary View Management</CardTitle>
                        <CardDescription>Select which roles can see the Summary view.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                        <div className="flex items-center justify-between border-b pb-2">
                            <h3 className="font-semibold flex items-center gap-2"><Eye /> Line of Business</h3>
                            <div className="flex items-center gap-4">
                            <h3 className="font-semibold text-sm">Group Head</h3>
                            <h3 className="font-semibold text-sm">Delegates</h3>
                            </div>
                        </div>
                        <div className="max-h-60 overflow-y-auto space-y-2 p-1">
                            {linesOfBusiness.length > 0 ? (
                            linesOfBusiness.map((lob) => (
                                <div key={lob} className="flex items-center justify-between space-x-2 p-2 rounded-md hover:bg-muted/50">
                                <label htmlFor={`summary-lob-gh-${lob}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{lob}</label>
                                <div className="flex items-center gap-12">
                                    <Checkbox id={`summary-lob-gh-${lob}`} checked={summaryViewLobs.includes(lob)} onCheckedChange={() => handleSummaryViewLobToggle(lob)} />
                                    <Checkbox id={`summary-lob-del-${lob}`} checked={summaryViewDelegateLobs.includes(lob)} onCheckedChange={() => handleSummaryViewDelegateLobToggle(lob)} disabled={!summaryViewLobs.includes(lob)} />
                                </div>
                                </div>
                            ))
                            ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">No Lines of Business found.</p>
                            )}
                        </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                        <CardTitle>Consolidated View Management</CardTitle>
                        <CardDescription>Grant specific users access to the Consolidated View, which shows all locked selections.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                        <div>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full">
                                        <UserPlus className="mr-2 h-4 w-4" /> Grant Access to User
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                    <Command>
                                        <CommandInput placeholder="Search user..." />
                                        <CommandList>
                                            <CommandEmpty>No user found.</CommandEmpty>
                                            <CommandGroup>
                                                {availableUsersForConsolidatedView.map((user) => (
                                                    <CommandItem
                                                        key={user.id}
                                                        value={`${user.name} ${user.email}`}
                                                        onSelect={() => handleAddConsolidatedUser(user)}
                                                    >
                                                        {getUserDisplay(user)}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg flex items-center gap-2"><FileText /> Users with Access</h3>
                            {consolidatedViewUsers.length > 0 ? (
                            <ul className="space-y-2">
                                {consolidatedViewUsers.map(user => (
                                <li key={user.id} className="flex items-center justify-between p-2 border rounded-lg">
                                    {getUserDisplay(user)}
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveConsolidatedUser(user.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </li>
                                ))}
                            </ul>
                            ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">No users have access to this view.</p>
                            )}
                        </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="grid gap-8 lg:grid-cols-1">
                 <Card>
                    <CardHeader>
                        <CardTitle>Email Notification Settings</CardTitle>
                        <CardDescription>
                           Configure recipients for the LOB lock notification email. Use the popovers to add keywords or specific users.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <RecipientInput
                            title="To"
                            fieldKey="to"
                            recipients={notificationConfig.to}
                            availableUsers={users}
                            onRecipientsChange={(newRecipients) => setNotificationConfig(prev => ({ ...prev, to: newRecipients }))}
                            allLobs={linesOfBusiness}
                        />
                        <RecipientInput
                            title="CC"
                            fieldKey="cc"
                            recipients={notificationConfig.cc}
                            availableUsers={users}
                            onRecipientsChange={(newRecipients) => setNotificationConfig(prev => ({ ...prev, cc: newRecipients }))}
                             allLobs={linesOfBusiness}
                        />
                        <RecipientInput
                            title="BCC"
                            fieldKey="bcc"
                            recipients={notificationConfig.bcc}
                            availableUsers={users}
                            onRecipientsChange={(newRecipients) => setNotificationConfig(prev => ({ ...prev, bcc: newRecipients }))}
                             allLobs={linesOfBusiness}
                        />
                    </CardContent>
                </Card>
                </div>
            </>
            )}
        </>
        )}
      </main>
    </div>
  );
}


export default function AdminPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminPageComponent />
    </Suspense>
  )
}

    