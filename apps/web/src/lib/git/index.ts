/**
 * Git Module - Barrel Export
 */

export {
    getStatus,
    stageFiles,
    stageAll,
    commit,
    getBranches,
    createBranch,
    switchBranch,
    push,
    pull,
    getLog,
    getDiff,
    type GitStatus,
    type GitCommit,
    type GitBranch,
} from './git-client';
