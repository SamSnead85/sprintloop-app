/**
 * Unified Agentic Controller
 * Master controller for all agentic capabilities
 */

import { useBrowserStore, openWebsite, webSearch } from './browser';
import { useEmailStore, sendEmail } from './email';
import { useCalendarStore, scheduleMeeting, getTodaysAgenda } from './calendar';
import { readTextFile, writeTextFile, findFiles } from './filesystem';

export interface AgenticTask {
    id: string;
    type: AgenticTaskType;
    description: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    result?: unknown;
    error?: string;
    startedAt?: number;
    completedAt?: number;
}

export type AgenticTaskType =
    | 'browse_website'
    | 'search_web'
    | 'fill_form'
    | 'login'
    | 'send_email'
    | 'read_emails'
    | 'schedule_meeting'
    | 'check_calendar'
    | 'read_file'
    | 'write_file'
    | 'search_files'
    | 'run_command'
    | 'custom';

export interface AgenticCapabilities {
    browser: boolean;
    email: boolean;
    calendar: boolean;
    filesystem: boolean;
    terminal: boolean;
}

/**
 * Execute an agentic task
 */
export async function executeTask(task: Omit<AgenticTask, 'id' | 'status'>): Promise<AgenticTask> {
    const agenticTask: AgenticTask = {
        ...task,
        id: `task-${Date.now()}`,
        status: 'running',
        startedAt: Date.now(),
    };

    console.log('[Agentic] Executing task:', task.type, task.description);

    try {
        let result: unknown;

        switch (task.type) {
            case 'browse_website':
                result = await openWebsite(task.description);
                break;

            case 'search_web':
                result = await webSearch(task.description);
                break;

            case 'send_email':
                // Parse: "Send email to user@example.com: Subject | Body"
                const emailMatch = task.description.match(/to\s+(\S+):\s*(.+?)\s*\|\s*(.+)/i);
                if (emailMatch) {
                    await sendEmail(emailMatch[1], emailMatch[2], emailMatch[3]);
                    result = 'Email sent';
                }
                break;

            case 'schedule_meeting':
                // Parse: "Schedule 30min meeting with user@example.com: Title"
                const meetingMatch = task.description.match(/(\d+)\s*min.*?with\s+(.+?):\s*(.+)/i);
                if (meetingMatch) {
                    const attendees = meetingMatch[2].split(',').map(s => s.trim());
                    result = await scheduleMeeting(meetingMatch[3], parseInt(meetingMatch[1]), attendees);
                }
                break;

            case 'check_calendar':
                result = getTodaysAgenda();
                break;

            case 'read_file':
                result = await readTextFile(task.description);
                break;

            case 'write_file':
                // Parse: "path/to/file.txt | content"
                const fileMatch = task.description.match(/(.+?)\s*\|\s*(.+)/);
                if (fileMatch) {
                    await writeTextFile(fileMatch[1], fileMatch[2]);
                    result = 'File written';
                }
                break;

            case 'search_files':
                result = await findFiles(task.description);
                break;

            default:
                throw new Error(`Unknown task type: ${task.type}`);
        }

        return {
            ...agenticTask,
            status: 'completed',
            result,
            completedAt: Date.now(),
        };
    } catch (error) {
        return {
            ...agenticTask,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            completedAt: Date.now(),
        };
    }
}

/**
 * Parse natural language into agentic task
 */
export function parseNaturalLanguage(input: string): AgenticTask | null {
    const lower = input.toLowerCase();

    // Browser actions
    if (lower.includes('open') && (lower.includes('website') || lower.includes('url') || lower.includes('page'))) {
        const urlMatch = input.match(/https?:\/\/\S+/);
        return {
            id: '',
            type: 'browse_website',
            description: urlMatch ? urlMatch[0] : 'https://google.com',
            status: 'pending',
        };
    }

    if (lower.includes('search') && (lower.includes('web') || lower.includes('google'))) {
        const query = input.replace(/search\s+(?:the\s+)?(?:web|google)\s+(?:for\s+)?/i, '');
        return {
            id: '',
            type: 'search_web',
            description: query,
            status: 'pending',
        };
    }

    // Email actions
    if (lower.includes('send') && lower.includes('email')) {
        return {
            id: '',
            type: 'send_email',
            description: input,
            status: 'pending',
        };
    }

    if (lower.includes('check') && lower.includes('email')) {
        return {
            id: '',
            type: 'read_emails',
            description: '',
            status: 'pending',
        };
    }

    // Calendar actions
    if (lower.includes('schedule') && (lower.includes('meeting') || lower.includes('event'))) {
        return {
            id: '',
            type: 'schedule_meeting',
            description: input,
            status: 'pending',
        };
    }

    if (lower.includes('calendar') || (lower.includes('what') && lower.includes('today'))) {
        return {
            id: '',
            type: 'check_calendar',
            description: '',
            status: 'pending',
        };
    }

    // File actions
    if (lower.includes('read') && lower.includes('file')) {
        const pathMatch = input.match(/[\/\w.-]+\.\w+/);
        return {
            id: '',
            type: 'read_file',
            description: pathMatch ? pathMatch[0] : '',
            status: 'pending',
        };
    }

    if ((lower.includes('write') || lower.includes('create')) && lower.includes('file')) {
        return {
            id: '',
            type: 'write_file',
            description: input,
            status: 'pending',
        };
    }

    if (lower.includes('find') && lower.includes('file')) {
        return {
            id: '',
            type: 'search_files',
            description: input.replace(/find\s+files?\s+(?:named?\s+)?/i, ''),
            status: 'pending',
        };
    }

    return null;
}

/**
 * Get current agentic capabilities status
 */
export function getCapabilities(): AgenticCapabilities {
    const browserStore = useBrowserStore.getState();
    const emailStore = useEmailStore.getState();
    const calendarStore = useCalendarStore.getState();

    return {
        browser: browserStore.sessions.size > 0 || true, // Always available
        email: emailStore.accounts.length > 0,
        calendar: calendarStore.accounts.length > 0,
        filesystem: true, // Always available in Tauri
        terminal: true, // Always available
    };
}

/**
 * Execute multiple tasks in sequence or parallel
 */
export async function executeTasks(
    tasks: Omit<AgenticTask, 'id' | 'status'>[],
    options?: { parallel?: boolean }
): Promise<AgenticTask[]> {
    if (options?.parallel) {
        return Promise.all(tasks.map(executeTask));
    }

    const results: AgenticTask[] = [];
    for (const task of tasks) {
        results.push(await executeTask(task));
    }
    return results;
}

// Re-export all modules
export * from './browser';
export * from './email';
export * from './calendar';
export * from './filesystem';
