/**
 * Project Lifecycle Store
 * 
 * Manages project state, phases, and progression through the SDLC.
 */

import { create } from 'zustand';

// =============================================================================
// TYPES
// =============================================================================

export type ProjectPhase =
    | 'ideation'      // Initial idea, brainstorming
    | 'discovery'     // Research, problem definition
    | 'planning'      // PRD, requirements
    | 'architecture'  // Technical design
    | 'development'   // Active coding
    | 'testing'       // QA, validation
    | 'deployment'    // Shipping
    | 'maintenance';  // Post-launch

export type ProjectComplexity = 'simple' | 'moderate' | 'complex' | 'enterprise';

export type ArtifactType =
    | 'product-brief'
    | 'prd'
    | 'architecture'
    | 'epic'
    | 'story'
    | 'spec'
    | 'code-review'
    | 'sprint-plan'
    | 'retrospective';

export interface Artifact {
    id: string;
    type: ArtifactType;
    name: string;
    path: string;
    content: string;
    version: number;
    createdAt: number;
    updatedAt: number;
    status: 'draft' | 'review' | 'approved' | 'archived';
    metadata?: Record<string, unknown>;
}

export interface ProjectState {
    id: string;
    name: string;
    description: string;
    phase: ProjectPhase;
    complexity: ProjectComplexity;
    createdAt: number;
    updatedAt: number;
    artifacts: Map<string, Artifact>;
    settings: ProjectSettings;
}

export interface ProjectSettings {
    sprintDuration: number; // days
    storyPointScale: number[];
    velocityTarget?: number;
    teamSize?: number;
}

export interface ProjectLifecycleState {
    projects: Map<string, ProjectState>;
    activeProjectId: string | null;

    // Project management
    createProject: (name: string, description: string, complexity?: ProjectComplexity) => string;
    getProject: (id: string) => ProjectState | undefined;
    getActiveProject: () => ProjectState | undefined;
    setActiveProject: (id: string) => void;
    updateProject: (id: string, updates: Partial<ProjectState>) => void;

    // Phase management
    advancePhase: (projectId: string) => void;
    setPhase: (projectId: string, phase: ProjectPhase) => void;
    getRecommendedNextPhase: (projectId: string) => ProjectPhase | null;

    // Artifact management
    addArtifact: (projectId: string, artifact: Omit<Artifact, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => string;
    updateArtifact: (projectId: string, artifactId: string, updates: Partial<Artifact>) => void;
    getArtifacts: (projectId: string, type?: ArtifactType) => Artifact[];
    getArtifact: (projectId: string, artifactId: string) => Artifact | undefined;

    // Helpers
    getPhaseProgress: (projectId: string) => PhaseProgress;
    determineComplexity: (description: string) => ProjectComplexity;
}

export interface PhaseProgress {
    currentPhase: ProjectPhase;
    completedPhases: ProjectPhase[];
    nextPhases: ProjectPhase[];
    requiredArtifacts: ArtifactType[];
    completedArtifacts: ArtifactType[];
    progress: number; // 0-100
}

// =============================================================================
// PHASE CONFIGURATION
// =============================================================================

const PHASE_ORDER: ProjectPhase[] = [
    'ideation',
    'discovery',
    'planning',
    'architecture',
    'development',
    'testing',
    'deployment',
    'maintenance',
];

const PHASE_ARTIFACTS: Record<ProjectPhase, ArtifactType[]> = {
    ideation: [],
    discovery: ['product-brief'],
    planning: ['prd'],
    architecture: ['architecture'],
    development: ['epic', 'story', 'sprint-plan'],
    testing: ['code-review'],
    deployment: [],
    maintenance: ['retrospective'],
};

const COMPLEXITY_PHASES: Record<ProjectComplexity, ProjectPhase[]> = {
    simple: ['ideation', 'development', 'testing', 'deployment'],
    moderate: ['ideation', 'discovery', 'development', 'testing', 'deployment'],
    complex: ['ideation', 'discovery', 'planning', 'architecture', 'development', 'testing', 'deployment'],
    enterprise: PHASE_ORDER,
};

// =============================================================================
// PROJECT LIFECYCLE STORE
// =============================================================================

export const useProjectLifecycle = create<ProjectLifecycleState>((set, get) => ({
    projects: new Map(),
    activeProjectId: null,

    createProject: (name: string, description: string, complexity?: ProjectComplexity): string => {
        const id = `proj-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const determinedComplexity = complexity || get().determineComplexity(description);

        const project: ProjectState = {
            id,
            name,
            description,
            phase: 'ideation',
            complexity: determinedComplexity,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            artifacts: new Map(),
            settings: {
                sprintDuration: 14,
                storyPointScale: [1, 2, 3, 5, 8, 13],
            },
        };

        set(state => ({
            projects: new Map(state.projects).set(id, project),
            activeProjectId: id,
        }));

        console.log(`[ProjectLifecycle] Created project ${name} (${determinedComplexity})`);
        return id;
    },

    getProject: (id: string) => get().projects.get(id),

    getActiveProject: () => {
        const { activeProjectId, projects } = get();
        return activeProjectId ? projects.get(activeProjectId) : undefined;
    },

    setActiveProject: (id: string) => {
        if (get().projects.has(id)) {
            set({ activeProjectId: id });
        }
    },

    updateProject: (id: string, updates: Partial<ProjectState>) => {
        set(state => {
            const projects = new Map(state.projects);
            const project = projects.get(id);
            if (project) {
                projects.set(id, { ...project, ...updates, updatedAt: Date.now() });
            }
            return { projects };
        });
    },

    advancePhase: (projectId: string) => {
        const project = get().projects.get(projectId);
        if (!project) return;

        const applicablePhases = COMPLEXITY_PHASES[project.complexity];
        const currentIndex = applicablePhases.indexOf(project.phase);

        if (currentIndex < applicablePhases.length - 1) {
            const nextPhase = applicablePhases[currentIndex + 1];
            get().setPhase(projectId, nextPhase);
        }
    },

    setPhase: (projectId: string, phase: ProjectPhase) => {
        get().updateProject(projectId, { phase });
        console.log(`[ProjectLifecycle] Project ${projectId} moved to phase: ${phase}`);
    },

    getRecommendedNextPhase: (projectId: string): ProjectPhase | null => {
        const project = get().projects.get(projectId);
        if (!project) return null;

        const applicablePhases = COMPLEXITY_PHASES[project.complexity];
        const currentIndex = applicablePhases.indexOf(project.phase);

        return currentIndex < applicablePhases.length - 1
            ? applicablePhases[currentIndex + 1]
            : null;
    },

    addArtifact: (projectId: string, artifact: Omit<Artifact, 'id' | 'createdAt' | 'updatedAt' | 'version'>): string => {
        const id = `art-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        const fullArtifact: Artifact = {
            ...artifact,
            id,
            version: 1,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        set(state => {
            const projects = new Map(state.projects);
            const project = projects.get(projectId);
            if (project) {
                const artifacts = new Map(project.artifacts);
                artifacts.set(id, fullArtifact);
                projects.set(projectId, { ...project, artifacts, updatedAt: Date.now() });
            }
            return { projects };
        });

        return id;
    },

    updateArtifact: (projectId: string, artifactId: string, updates: Partial<Artifact>) => {
        set(state => {
            const projects = new Map(state.projects);
            const project = projects.get(projectId);
            if (project) {
                const artifacts = new Map(project.artifacts);
                const artifact = artifacts.get(artifactId);
                if (artifact) {
                    artifacts.set(artifactId, {
                        ...artifact,
                        ...updates,
                        version: artifact.version + 1,
                        updatedAt: Date.now(),
                    });
                    projects.set(projectId, { ...project, artifacts, updatedAt: Date.now() });
                }
            }
            return { projects };
        });
    },

    getArtifacts: (projectId: string, type?: ArtifactType): Artifact[] => {
        const project = get().projects.get(projectId);
        if (!project) return [];

        const artifacts = Array.from(project.artifacts.values());
        return type ? artifacts.filter(a => a.type === type) : artifacts;
    },

    getArtifact: (projectId: string, artifactId: string): Artifact | undefined => {
        return get().projects.get(projectId)?.artifacts.get(artifactId);
    },

    getPhaseProgress: (projectId: string): PhaseProgress => {
        const project = get().projects.get(projectId);
        if (!project) {
            return {
                currentPhase: 'ideation',
                completedPhases: [],
                nextPhases: PHASE_ORDER.slice(1),
                requiredArtifacts: [],
                completedArtifacts: [],
                progress: 0,
            };
        }

        const applicablePhases = COMPLEXITY_PHASES[project.complexity];
        const currentIndex = applicablePhases.indexOf(project.phase);

        const completedPhases = applicablePhases.slice(0, currentIndex);
        const nextPhases = applicablePhases.slice(currentIndex + 1);

        const requiredArtifacts = PHASE_ARTIFACTS[project.phase];
        const existingTypes = Array.from(project.artifacts.values()).map(a => a.type);
        const completedArtifacts = requiredArtifacts.filter(t => existingTypes.includes(t));

        const progress = Math.round((currentIndex / (applicablePhases.length - 1)) * 100);

        return {
            currentPhase: project.phase,
            completedPhases,
            nextPhases,
            requiredArtifacts,
            completedArtifacts,
            progress,
        };
    },

    determineComplexity: (description: string): ProjectComplexity => {
        const lower = description.toLowerCase();

        // Enterprise indicators
        const enterpriseKeywords = ['enterprise', 'compliance', 'multi-tenant', 'audit', 'soc2', 'hipaa', 'gdpr'];
        if (enterpriseKeywords.some(k => lower.includes(k))) return 'enterprise';

        // Complex indicators
        const complexKeywords = ['saas', 'platform', 'marketplace', 'integration', 'api', 'microservice'];
        if (complexKeywords.some(k => lower.includes(k))) return 'complex';

        // Moderate indicators
        const moderateKeywords = ['app', 'dashboard', 'portal', 'system'];
        if (moderateKeywords.some(k => lower.includes(k))) return 'moderate';

        // Simple by default
        return 'simple';
    },
}));

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Get phase display info
 */
export function getPhaseInfo(phase: ProjectPhase): { emoji: string; name: string; description: string } {
    const info: Record<ProjectPhase, { emoji: string; name: string; description: string }> = {
        ideation: { emoji: '💡', name: 'Ideation', description: 'Brainstorming and initial idea' },
        discovery: { emoji: '🔍', name: 'Discovery', description: 'Research and problem definition' },
        planning: { emoji: '📋', name: 'Planning', description: 'Requirements and PRD' },
        architecture: { emoji: '🏗️', name: 'Architecture', description: 'Technical design' },
        development: { emoji: '💻', name: 'Development', description: 'Active coding' },
        testing: { emoji: '🧪', name: 'Testing', description: 'Quality assurance' },
        deployment: { emoji: '🚀', name: 'Deployment', description: 'Shipping to production' },
        maintenance: { emoji: '🔧', name: 'Maintenance', description: 'Post-launch support' },
    };
    return info[phase];
}

/**
 * Get recommended command for current phase
 */
export function getPhaseCommand(phase: ProjectPhase): string {
    const commands: Record<ProjectPhase, string> = {
        ideation: '/product-brief',
        discovery: '/quick-spec',
        planning: '/create-prd',
        architecture: '/create-architecture',
        development: '/dev-story',
        testing: '/code-review',
        deployment: '/deploy',
        maintenance: '/standup',
    };
    return commands[phase];
}
