
'use server';

import nodemailer from 'nodemailer';
import type { User } from '@/ai/schemas/workspace-users';
import type { Roles } from './role-service';
import type { NotificationConfig } from './notification-service';

const GMAIL_SENDER_EMAIL = process.env.GMAIL_SENDER_EMAIL;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

const getTransporter = () => {
    if (!GMAIL_SENDER_EMAIL) {
        console.error("GMAIL_SENDER_EMAIL is not set in environment variables.");
        throw new Error("Email service is not configured. Missing sender email address.");
    }
    if (!GMAIL_APP_PASSWORD) {
        console.error("GMAIL_APP_PASSWORD is not set in environment variables.");
        throw new Error("Email service is not configured. Missing App Password.");
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: GMAIL_SENDER_EMAIL,
            pass: GMAIL_APP_PASSWORD, 
        },
    });

    return transporter;
};

const generateCsv = (data: User[]): string => {
    if (data.length === 0) {
        return '';
    }
    const headers = ['Name', 'Email', 'Designation', 'Manager', 'Department', 'Modifier', 'Reason'];
    const rows = data.map(user => {
        const modifierName = user.modifier?.name || '';
        const escapeCsvField = (field: string | undefined) => `"${(field || '').replace(/"/g, '""')}"`;
        
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

    return [headers.join(','), ...rows].join('\n');
};

const parseRecipients = async (
    config: NotificationConfig,
    currentLob: string,
    roleBasedUsers: { groupHead?: User; delegates: User[]; admins: User[] },
    allRoles: Record<string, Roles>,
    allUsers: User[]
): Promise<{ to: string[], cc: string[], bcc: string[] }> => {
    const { groupHead, delegates, admins } = roleBasedUsers;
    
    const resolveKeywords = (recipientList: string[]): string[] => {
        const resolved: string[] = [];
        
        recipientList.forEach(recipient => {
             if (recipient.startsWith('GH:')) {
                const lobName = recipient.substring(3).trim();
                const lobRoles = allRoles[lobName];
                if (lobRoles?.groupHead) {
                    const otherGroupHead = allUsers.find(u => u.id === lobRoles.groupHead);
                    if (otherGroupHead?.email) {
                        resolved.push(otherGroupHead.email);
                    }
                }
            } else {
                switch (recipient) {
                    case '<GROUP_HEAD>':
                        if (groupHead?.email) resolved.push(groupHead.email);
                        break;
                    case '<DELEGATES>':
                        delegates.forEach(d => {
                            if(d.email) resolved.push(d.email)
                        });
                        break;
                    case '<ADMINS>':
                        admins.forEach(a => {
                            if(a.email) resolved.push(a.email)
                        });
                        break;
                    default:
                        if (recipient.includes('@')) { // Basic check for an email address
                            resolved.push(recipient);
                        }
                        break;
                }
            }
        });
        return resolved;
    };
    
    const toEmails = resolveKeywords(config.to);
    const ccEmails = resolveKeywords(config.cc);
    const bccEmails = resolveKeywords(config.bcc);
    
    return {
        to: toEmails,
        cc: ccEmails,
        bcc: bccEmails,
    };
};


interface SendLockNotificationParams {
    lob: string;
    allUsers: User[];
    allRoles: Record<string, Roles>;
    admins: User[];
    actor: { name: string; email: string; roles: string[] };
    notificationConfig: NotificationConfig;
}

export const sendLockNotification = async ({
    lob,
    allUsers,
    allRoles,
    admins,
    actor,
    notificationConfig
}: SendLockNotificationParams) => {
    
    const lobRoles = allRoles[lob] || { groupHead: null, delegates: [] };
    const groupHeadUser = allUsers.find(u => u.id === lobRoles.groupHead);
    const delegateUsers = lobRoles.delegates.map(id => allUsers.find(u => u.id === id)).filter((u): u is User => !!u);
    
    const roleBasedUsers = {
        groupHead: groupHeadUser,
        delegates: delegateUsers,
        admins
    };
    
    const { to: toEmails, cc: ccEmails, bcc: bccEmails } = await parseRecipients(notificationConfig, lob, roleBasedUsers, allRoles, allUsers);
    
    if (toEmails.length === 0 && ccEmails.length === 0 && bccEmails.length === 0) {
        console.warn(`No recipients configured or found for LOB lock notification: ${lob}. Skipping email.`);
        throw new Error("Email notification failed: No recipients are configured.");
    }
    
    const formatRecipient = (email: string) => {
        const user = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (user && user.name) {
            return `"${user.name}" <${email}>`;
        }
        return email;
    };

    const formattedToRecipients = toEmails.map(formatRecipient);
    const formattedCcRecipients = ccEmails.map(formatRecipient);
    const formattedBccRecipients = bccEmails.map(formatRecipient);

    const lobUsers = allUsers.filter(u => u.lineOfBusiness === lob);
    const selectedUsers = lobUsers.filter(u => u.reason && u.reason !== 'NOT_SELECTED');
    const grandTotalSelectedCount = allUsers.filter(u => u.reason && u.reason !== 'NOT_SELECTED').length;

    const departmentCounts = selectedUsers.reduce((acc, user) => {
        acc[user.department] = (acc[user.department] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const departmentBreakdown = Object.entries(departmentCounts)
        .map(([dept, count]) => `<li>${dept}: ${count} licenses</li>`)
        .join('');

    const emailBody = `
        <p>Hello,</p>
        <p>This is an automated notification to confirm that the <strong>Microsoft License</strong> allocation roster for the <strong>${lob}</strong> Line of Business has been locked and submitted for final approval.</p>
        <strong>Submission Details:</strong>
        <ul>
            <li><strong>Locked By:</strong> ${actor.name} (${actor.email})</li>
            <li><strong>Timestamp:</strong> ${new Date().toUTCString()}</li>
            <li><strong>Total Licenses Requested (${lob}):</strong> ${selectedUsers.length}</li>
            <li><strong>Grand Total Selections (All LOBs):</strong> ${grandTotalSelectedCount} / 300</li>
        </ul>
        <strong>Department Breakdown for ${lob}:</strong>
        <ul>
            ${departmentBreakdown || '<li>No selections made.</li>'}
        </ul>
        <p>The detailed list of selected employees for this LOB is attached to this email as a CSV file.</p>
        <p><em>This is an automated message from The 300 application. Please do not reply.</em></p>
    `;

    const csvData = generateCsv(selectedUsers);
    
    const mailOptions: nodemailer.SendMailOptions = {
        from: GMAIL_SENDER_EMAIL ? `"The 300" <${GMAIL_SENDER_EMAIL}>` : undefined,
    };
    
    if (formattedToRecipients.length > 0) mailOptions.to = formattedToRecipients;
    if (formattedCcRecipients.length > 0) mailOptions.cc = formattedCcRecipients;
    if (formattedBccRecipients.length > 0) mailOptions.bcc = formattedBccRecipients;

    mailOptions.subject = `Microsoft License Roster Locked for ${lob}`;
    mailOptions.html = emailBody;
    mailOptions.attachments = [
        {
            filename: `${lob}_Allocation_Report.csv`,
            content: csvData,
            contentType: 'text/csv',
        },
    ];

    try {
        const transporter = getTransporter();
        const info = await transporter.sendMail(mailOptions);
        console.log(`Successfully sent lock notification email for LOB: ${lob}. Message ID: ${info.messageId}`);
    } catch (error) {
        console.error(`Error sending email for LOB ${lob}:`, error);
        if ((error as any).code === 'EAUTH') {
             throw new Error('Email sending failed: Authentication error. Please check the sender email and App Password.');
        }
        throw new Error('Failed to send notification email. Please check server logs.');
    }
};
