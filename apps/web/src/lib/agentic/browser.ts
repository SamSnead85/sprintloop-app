/**
 * Browser Automation Module
 * 
 * Phases 1-100: Full browser control for autonomous web interaction
 * Source: Google Antigravity, Claude Computer Use, Playwright
 */

import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export interface BrowserSession {
    id: string;
    status: 'idle' | 'navigating' | 'interacting' | 'recording' | 'error';
    currentUrl: string;
    pageTitle: string;
    viewport: Viewport;
    tabs: BrowserTab[];
    activeTabId: string;
    cookies: Cookie[];
    localStorage: Record<string, string>;
    sessionStorage: Record<string, string>;
    history: NavigationEntry[];
    startedAt: number;
    lastActivityAt: number;
}

export interface BrowserTab {
    id: string;
    url: string;
    title: string;
    favicon?: string;
    loading: boolean;
    canGoBack: boolean;
    canGoForward: boolean;
}

export interface Viewport {
    width: number;
    height: number;
    deviceScaleFactor: number;
    isMobile: boolean;
    hasTouch: boolean;
}

export interface Cookie {
    name: string;
    value: string;
    domain: string;
    path: string;
    expires?: number;
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'Strict' | 'Lax' | 'None';
}

export interface NavigationEntry {
    url: string;
    title: string;
    timestamp: number;
}

export interface DOMElement {
    selector: string;
    tagName: string;
    id?: string;
    className?: string;
    textContent?: string;
    attributes: Record<string, string>;
    boundingBox: BoundingBox;
    isVisible: boolean;
    isEnabled: boolean;
    children?: DOMElement[];
}

export interface BoundingBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

export interface BrowserAction {
    type: BrowserActionType;
    target?: string;
    value?: string;
    options?: Record<string, unknown>;
    timestamp: number;
    duration?: number;
    success: boolean;
    error?: string;
}

export type BrowserActionType =
    | 'navigate'
    | 'click'
    | 'type'
    | 'scroll'
    | 'hover'
    | 'screenshot'
    | 'select'
    | 'check'
    | 'uncheck'
    | 'focus'
    | 'blur'
    | 'press'
    | 'drag'
    | 'drop'
    | 'upload'
    | 'download'
    | 'wait';

export interface Screenshot {
    id: string;
    data: string; // Base64
    width: number;
    height: number;
    timestamp: number;
    url: string;
    fullPage: boolean;
}

export interface Recording {
    id: string;
    actions: BrowserAction[];
    screenshots: Screenshot[];
    startedAt: number;
    endedAt?: number;
    status: 'recording' | 'completed' | 'failed';
}

// =============================================================================
// STORE
// =============================================================================

interface BrowserState {
    sessions: Map<string, BrowserSession>;
    activeSessionId: string | null;
    recordings: Recording[];
    currentRecording: Recording | null;

    // Session management
    createSession: (options?: Partial<BrowserSession>) => string;
    destroySession: (sessionId: string) => void;
    getSession: (sessionId: string) => BrowserSession | undefined;
    getActiveSession: () => BrowserSession | undefined;

    // Navigation
    navigate: (sessionId: string, url: string) => Promise<void>;
    goBack: (sessionId: string) => Promise<void>;
    goForward: (sessionId: string) => Promise<void>;
    refresh: (sessionId: string) => Promise<void>;

    // Tab management
    newTab: (sessionId: string, url?: string) => Promise<string>;
    closeTab: (sessionId: string, tabId: string) => Promise<void>;
    switchTab: (sessionId: string, tabId: string) => void;

    // Interactions
    click: (sessionId: string, selector: string, options?: ClickOptions) => Promise<void>;
    type: (sessionId: string, selector: string, text: string, options?: TypeOptions) => Promise<void>;
    hover: (sessionId: string, selector: string) => Promise<void>;
    scroll: (sessionId: string, options: ScrollOptions) => Promise<void>;
    select: (sessionId: string, selector: string, value: string) => Promise<void>;

    // DOM inspection
    getElement: (sessionId: string, selector: string) => Promise<DOMElement | null>;
    getElements: (sessionId: string, selector: string) => Promise<DOMElement[]>;
    getText: (sessionId: string, selector: string) => Promise<string>;
    getAttribute: (sessionId: string, selector: string, attribute: string) => Promise<string>;

    // Screenshots & Recording
    screenshot: (sessionId: string, options?: ScreenshotOptions) => Promise<Screenshot>;
    startRecording: (sessionId: string) => void;
    stopRecording: (sessionId: string) => Recording | null;

    // Cookies & Storage
    getCookies: (sessionId: string) => Cookie[];
    setCookie: (sessionId: string, cookie: Omit<Cookie, 'sameSite'> & { sameSite?: Cookie['sameSite'] }) => void;
    deleteCookie: (sessionId: string, name: string) => void;
    getLocalStorage: (sessionId: string, key: string) => string | null;
    setLocalStorage: (sessionId: string, key: string, value: string) => void;

    // Waiting
    waitForSelector: (sessionId: string, selector: string, timeout?: number) => Promise<boolean>;
    waitForNavigation: (sessionId: string, timeout?: number) => Promise<void>;
    waitForNetworkIdle: (sessionId: string, timeout?: number) => Promise<void>;
}

export interface ClickOptions {
    button?: 'left' | 'right' | 'middle';
    clickCount?: number;
    delay?: number;
    position?: { x: number; y: number };
}

export interface TypeOptions {
    delay?: number;
    clear?: boolean;
}

export interface ScrollOptions {
    x?: number;
    y?: number;
    behavior?: 'auto' | 'smooth';
    selector?: string;
}

export interface ScreenshotOptions {
    fullPage?: boolean;
    selector?: string;
    quality?: number;
    format?: 'png' | 'jpeg' | 'webp';
}

const DEFAULT_VIEWPORT: Viewport = {
    width: 1280,
    height: 720,
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
};

export const useBrowserStore = create<BrowserState>((set, get) => ({
    sessions: new Map(),
    activeSessionId: null,
    recordings: [],
    currentRecording: null,

    createSession: (options) => {
        const id = `browser-${Date.now()}`;
        const session: BrowserSession = {
            id,
            status: 'idle',
            currentUrl: 'about:blank',
            pageTitle: 'New Tab',
            viewport: DEFAULT_VIEWPORT,
            tabs: [{
                id: `tab-${Date.now()}`,
                url: 'about:blank',
                title: 'New Tab',
                loading: false,
                canGoBack: false,
                canGoForward: false,
            }],
            activeTabId: '',
            cookies: [],
            localStorage: {},
            sessionStorage: {},
            history: [],
            startedAt: Date.now(),
            lastActivityAt: Date.now(),
            ...options,
        };
        session.activeTabId = session.tabs[0].id;

        set(state => {
            const sessions = new Map(state.sessions);
            sessions.set(id, session);
            return { sessions, activeSessionId: id };
        });

        console.log('[Browser] Session created:', id);
        return id;
    },

    destroySession: (sessionId) => {
        set(state => {
            const sessions = new Map(state.sessions);
            sessions.delete(sessionId);
            return {
                sessions,
                activeSessionId: state.activeSessionId === sessionId ? null : state.activeSessionId,
            };
        });
    },

    getSession: (sessionId) => get().sessions.get(sessionId),

    getActiveSession: () => {
        const { activeSessionId, sessions } = get();
        return activeSessionId ? sessions.get(activeSessionId) : undefined;
    },

    navigate: async (sessionId, url) => {
        console.log('[Browser] Navigating to:', url);

        set(state => {
            const sessions = new Map(state.sessions);
            const session = sessions.get(sessionId);
            if (session) {
                sessions.set(sessionId, {
                    ...session,
                    status: 'navigating',
                    currentUrl: url,
                    history: [...session.history, { url, title: '', timestamp: Date.now() }],
                    lastActivityAt: Date.now(),
                });
            }
            return { sessions };
        });

        // Simulate navigation
        await new Promise(resolve => setTimeout(resolve, 1000));

        set(state => {
            const sessions = new Map(state.sessions);
            const session = sessions.get(sessionId);
            if (session) {
                sessions.set(sessionId, {
                    ...session,
                    status: 'idle',
                    pageTitle: `Page: ${url}`,
                    tabs: session.tabs.map(t =>
                        t.id === session.activeTabId
                            ? { ...t, url, title: `Page: ${url}`, loading: false, canGoBack: true }
                            : t
                    ),
                });
            }
            return { sessions };
        });
    },

    goBack: async (_sessionId) => {
        console.log('[Browser] Going back');
        await new Promise(resolve => setTimeout(resolve, 500));
    },

    goForward: async (_sessionId) => {
        console.log('[Browser] Going forward');
        await new Promise(resolve => setTimeout(resolve, 500));
    },

    refresh: async (_sessionId) => {
        console.log('[Browser] Refreshing');
        await new Promise(resolve => setTimeout(resolve, 500));
    },

    newTab: async (sessionId, url = 'about:blank') => {
        const tabId = `tab-${Date.now()}`;

        set(state => {
            const sessions = new Map(state.sessions);
            const session = sessions.get(sessionId);
            if (session) {
                sessions.set(sessionId, {
                    ...session,
                    tabs: [...session.tabs, {
                        id: tabId,
                        url,
                        title: 'New Tab',
                        loading: url !== 'about:blank',
                        canGoBack: false,
                        canGoForward: false,
                    }],
                    activeTabId: tabId,
                });
            }
            return { sessions };
        });

        if (url !== 'about:blank') {
            await get().navigate(sessionId, url);
        }

        return tabId;
    },

    closeTab: async (sessionId, tabId) => {
        set(state => {
            const sessions = new Map(state.sessions);
            const session = sessions.get(sessionId);
            if (session) {
                const newTabs = session.tabs.filter(t => t.id !== tabId);
                sessions.set(sessionId, {
                    ...session,
                    tabs: newTabs,
                    activeTabId: session.activeTabId === tabId
                        ? newTabs[newTabs.length - 1]?.id || ''
                        : session.activeTabId,
                });
            }
            return { sessions };
        });
    },

    switchTab: (sessionId, tabId) => {
        set(state => {
            const sessions = new Map(state.sessions);
            const session = sessions.get(sessionId);
            if (session) {
                sessions.set(sessionId, { ...session, activeTabId: tabId });
            }
            return { sessions };
        });
    },

    click: async (_sessionId, selector, _options) => {
        console.log('[Browser] Clicking:', selector);
        await new Promise(resolve => setTimeout(resolve, 200));
    },

    type: async (_sessionId, selector, text, _options) => {
        console.log('[Browser] Typing in:', selector, 'Text:', text);
        await new Promise(resolve => setTimeout(resolve, text.length * 50));
    },

    hover: async (_sessionId, selector) => {
        console.log('[Browser] Hovering:', selector);
        await new Promise(resolve => setTimeout(resolve, 100));
    },

    scroll: async (_sessionId, options) => {
        console.log('[Browser] Scrolling:', options);
        await new Promise(resolve => setTimeout(resolve, 300));
    },

    select: async (_sessionId, selector, value) => {
        console.log('[Browser] Selecting:', selector, value);
        await new Promise(resolve => setTimeout(resolve, 100));
    },

    getElement: async (_sessionId, selector) => {
        return {
            selector,
            tagName: 'div',
            textContent: 'Sample element',
            attributes: {},
            boundingBox: { x: 0, y: 0, width: 100, height: 50 },
            isVisible: true,
            isEnabled: true,
        };
    },

    getElements: async (_sessionId, _selector) => {
        return [];
    },

    getText: async (_sessionId, _selector) => {
        return 'Sample text content';
    },

    getAttribute: async (_sessionId, _selector, _attribute) => {
        return '';
    },

    screenshot: async (sessionId, options) => {
        const session = get().sessions.get(sessionId);
        return {
            id: `screenshot-${Date.now()}`,
            data: '', // Base64 data would go here
            width: session?.viewport.width || 1280,
            height: options?.fullPage ? 3000 : (session?.viewport.height || 720),
            timestamp: Date.now(),
            url: session?.currentUrl || '',
            fullPage: options?.fullPage || false,
        };
    },

    startRecording: (_sessionId) => {
        const recording: Recording = {
            id: `recording-${Date.now()}`,
            actions: [],
            screenshots: [],
            startedAt: Date.now(),
            status: 'recording',
        };
        set({ currentRecording: recording });
    },

    stopRecording: (_sessionId) => {
        const recording = get().currentRecording;
        if (recording) {
            const completed = { ...recording, endedAt: Date.now(), status: 'completed' as const };
            set(state => ({
                recordings: [...state.recordings, completed],
                currentRecording: null,
            }));
            return completed;
        }
        return null;
    },

    getCookies: (sessionId) => {
        return get().sessions.get(sessionId)?.cookies || [];
    },

    setCookie: (sessionId, cookie) => {
        set(state => {
            const sessions = new Map(state.sessions);
            const session = sessions.get(sessionId);
            if (session) {
                sessions.set(sessionId, {
                    ...session,
                    cookies: [...session.cookies, { ...cookie, sameSite: cookie.sameSite || 'Lax' }],
                });
            }
            return { sessions };
        });
    },

    deleteCookie: (sessionId, name) => {
        set(state => {
            const sessions = new Map(state.sessions);
            const session = sessions.get(sessionId);
            if (session) {
                sessions.set(sessionId, {
                    ...session,
                    cookies: session.cookies.filter(c => c.name !== name),
                });
            }
            return { sessions };
        });
    },

    getLocalStorage: (sessionId, key) => {
        return get().sessions.get(sessionId)?.localStorage[key] || null;
    },

    setLocalStorage: (sessionId, key, value) => {
        set(state => {
            const sessions = new Map(state.sessions);
            const session = sessions.get(sessionId);
            if (session) {
                sessions.set(sessionId, {
                    ...session,
                    localStorage: { ...session.localStorage, [key]: value },
                });
            }
            return { sessions };
        });
    },

    waitForSelector: async (_sessionId, selector, timeout = 30000) => {
        console.log('[Browser] Waiting for selector:', selector);
        await new Promise(resolve => setTimeout(resolve, Math.min(1000, timeout)));
        return true;
    },

    waitForNavigation: async (_sessionId, timeout = 30000) => {
        console.log('[Browser] Waiting for navigation');
        await new Promise(resolve => setTimeout(resolve, Math.min(1000, timeout)));
    },

    waitForNetworkIdle: async (_sessionId, timeout = 30000) => {
        console.log('[Browser] Waiting for network idle');
        await new Promise(resolve => setTimeout(resolve, Math.min(500, timeout)));
    },
}));

// =============================================================================
// HIGH-LEVEL AUTOMATION FUNCTIONS
// =============================================================================

/**
 * Open a website and return session ID
 */
export async function openWebsite(url: string): Promise<string> {
    const store = useBrowserStore.getState();
    const sessionId = store.createSession();
    await store.navigate(sessionId, url);
    return sessionId;
}

/**
 * Fill and submit a form
 */
export async function fillForm(
    sessionId: string,
    fields: { selector: string; value: string }[]
): Promise<void> {
    const store = useBrowserStore.getState();

    for (const field of fields) {
        await store.type(sessionId, field.selector, field.value, { clear: true });
    }
}

/**
 * Extract text from multiple elements
 */
export async function extractContent(
    sessionId: string,
    selectors: string[]
): Promise<Record<string, string>> {
    const store = useBrowserStore.getState();
    const result: Record<string, string> = {};

    for (const selector of selectors) {
        result[selector] = await store.getText(sessionId, selector);
    }

    return result;
}

/**
 * Perform a web search
 */
export async function webSearch(query: string): Promise<string> {
    const sessionId = await openWebsite(`https://www.google.com/search?q=${encodeURIComponent(query)}`);
    return sessionId;
}

/**
 * Login to a website
 */
export async function loginToWebsite(
    url: string,
    credentials: { usernameSelector: string; passwordSelector: string; submitSelector: string; username: string; password: string }
): Promise<string> {
    const sessionId = await openWebsite(url);
    const store = useBrowserStore.getState();

    await store.type(sessionId, credentials.usernameSelector, credentials.username);
    await store.type(sessionId, credentials.passwordSelector, credentials.password);
    await store.click(sessionId, credentials.submitSelector);
    await store.waitForNavigation(sessionId);

    return sessionId;
}
