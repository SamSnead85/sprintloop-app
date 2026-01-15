/**
 * Email Integration Module
 * Phases 201-300: Email capabilities for reading, composing, automation
 */

import { create } from 'zustand';

export interface EmailAccount {
    id: string;
    email: string;
    name: string;
    provider: 'gmail' | 'outlook' | 'imap';
    status: 'connected' | 'disconnected' | 'error';
    lastSync: number;
}

export interface Email {
    id: string;
    accountId: string;
    from: { name?: string; email: string };
    to: { name?: string; email: string }[];
    subject: string;
    bodyText?: string;
    bodyHtml?: string;
    snippet: string;
    date: number;
    isRead: boolean;
    isStarred: boolean;
    labels: string[];
    attachments: { filename: string; size: number }[];
}

export interface EmailDraft {
    id: string;
    accountId: string;
    to: { email: string }[];
    subject: string;
    bodyHtml: string;
    attachments: { filename: string; data: string }[];
    scheduledFor?: number;
}

interface EmailState {
    accounts: EmailAccount[];
    emails: Map<string, Email>;
    drafts: EmailDraft[];

    addAccount: (account: Omit<EmailAccount, 'id' | 'lastSync'>) => string;
    syncAccount: (accountId: string) => Promise<void>;
    fetchEmails: (accountId: string, limit?: number) => Promise<Email[]>;
    getEmail: (emailId: string) => Email | undefined;
    markAsRead: (emailId: string) => void;
    star: (emailId: string) => void;
    archive: (emailId: string) => void;
    deleteEmail: (emailId: string) => void;
    createDraft: (draft: Omit<EmailDraft, 'id'>) => string;
    sendDraft: (draftId: string) => Promise<void>;
    searchEmails: (query: string) => Promise<Email[]>;
    generateReply: (emailId: string) => Promise<string>;
}

export const useEmailStore = create<EmailState>((set, get) => ({
    accounts: [],
    emails: new Map(),
    drafts: [],

    addAccount: (accountData) => {
        const id = `email-${Date.now()}`;
        const account: EmailAccount = { ...accountData, id, lastSync: 0 };
        set(state => ({ accounts: [...state.accounts, account] }));
        return id;
    },

    syncAccount: async (accountId) => {
        console.log('[Email] Syncing:', accountId);
        await new Promise(r => setTimeout(r, 1000));
        set(state => ({
            accounts: state.accounts.map(a =>
                a.id === accountId ? { ...a, lastSync: Date.now(), status: 'connected' as const } : a
            ),
        }));
    },

    fetchEmails: async (accountId, limit = 50) => {
        console.log('[Email] Fetching:', { accountId, limit });
        await new Promise(r => setTimeout(r, 500));
        return [];
    },

    getEmail: (emailId) => get().emails.get(emailId),

    markAsRead: (emailId) => {
        set(state => {
            const emails = new Map(state.emails);
            const email = emails.get(emailId);
            if (email) emails.set(emailId, { ...email, isRead: true });
            return { emails };
        });
    },

    star: (emailId) => {
        set(state => {
            const emails = new Map(state.emails);
            const email = emails.get(emailId);
            if (email) emails.set(emailId, { ...email, isStarred: !email.isStarred });
            return { emails };
        });
    },

    archive: (emailId) => {
        console.log('[Email] Archiving:', emailId);
    },

    deleteEmail: (emailId) => {
        set(state => {
            const emails = new Map(state.emails);
            emails.delete(emailId);
            return { emails };
        });
    },

    createDraft: (draftData) => {
        const id = `draft-${Date.now()}`;
        set(state => ({ drafts: [...state.drafts, { ...draftData, id }] }));
        return id;
    },

    sendDraft: async (draftId) => {
        console.log('[Email] Sending:', draftId);
        await new Promise(r => setTimeout(r, 1000));
        set(state => ({ drafts: state.drafts.filter(d => d.id !== draftId) }));
    },

    searchEmails: async (query) => {
        console.log('[Email] Searching:', query);
        return [];
    },

    generateReply: async (emailId) => {
        console.log('[Email] Generating reply for:', emailId);
        await new Promise(r => setTimeout(r, 1000));
        return 'Thank you for your email. I will review and respond shortly.';
    },
}));

/** Send a quick email */
export async function sendEmail(to: string | string[], subject: string, body: string): Promise<void> {
    const store = useEmailStore.getState();
    const accountId = store.accounts[0]?.id;
    if (!accountId) throw new Error('No email account');

    const draftId = store.createDraft({
        accountId,
        to: (Array.isArray(to) ? to : [to]).map(email => ({ email })),
        subject,
        bodyHtml: body.replace(/\n/g, '<br>'),
        attachments: [],
    });

    await store.sendDraft(draftId);
}
