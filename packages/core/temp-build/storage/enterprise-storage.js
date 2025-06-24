/**
 * Enterprise storage adapter that handles remote-only storage for enterprise integrations
 */
import { EnterpriseSync } from "../integrations/enterprise-sync.js";
export class EnterpriseStorageAdapter {
    constructor(options) {
        this.cache = new Map();
        this.integrations = options.integrations;
        this.enterpriseSync = new EnterpriseSync(this.integrations);
    }
    async initialize() {
        // No initialization needed for enterprise storage
        // Remote systems handle their own persistence
    }
    async exists(id) {
        // Check cache first
        if (this.cache.has(id)) {
            return true;
        }
        // Try to fetch from remote
        const entry = await this.fetchFromRemote(id);
        return entry !== null;
    }
    async get(id) {
        // Check cache first
        if (this.cache.has(id)) {
            return this.cache.get(id);
        }
        // Fetch from remote
        return await this.fetchFromRemote(id);
    }
    async save(entry) {
        // Sync with all configured enterprise systems
        const updatedEntry = await this.syncWithRemote(entry);
        // Cache the updated entry temporarily
        this.cache.set(entry.id, updatedEntry);
    }
    async delete(id) {
        const entry = await this.get(id);
        if (!entry)
            return;
        // Delete from all external systems
        await this.deleteFromRemoteSystems(entry);
        // Remove from cache
        this.cache.delete(id);
    }
    async list(filter) {
        // For enterprise storage, we need to fetch from remote systems
        // This is more complex as each system has different APIs
        const entries = [];
        // Fetch from each configured system
        if (this.integrations.jira) {
            const jiraEntries = await this.fetchFromJira(filter);
            entries.push(...jiraEntries);
        }
        if (this.integrations.ado) {
            const adoEntries = await this.fetchFromADO(filter);
            entries.push(...adoEntries);
        }
        if (this.integrations.github) {
            const githubEntries = await this.fetchFromGitHub(filter);
            entries.push(...githubEntries);
        }
        // Deduplicate entries by ID
        const uniqueEntries = new Map();
        entries.forEach(entry => {
            uniqueEntries.set(entry.id, entry);
        });
        return Array.from(uniqueEntries.values());
    }
    async search(query) {
        // Search across all configured enterprise systems
        const entries = [];
        if (this.integrations.jira) {
            const jiraEntries = await this.searchJira(query);
            entries.push(...jiraEntries);
        }
        if (this.integrations.ado) {
            const adoEntries = await this.searchADO(query);
            entries.push(...adoEntries);
        }
        if (this.integrations.github) {
            const githubEntries = await this.searchGitHub(query);
            entries.push(...githubEntries);
        }
        // Deduplicate by ID
        const uniqueEntries = new Map();
        entries.forEach(entry => {
            uniqueEntries.set(entry.id, entry);
        });
        return Array.from(uniqueEntries.values());
    }
    async getStats() {
        // Get stats from all configured systems
        const allEntries = await this.list();
        return {
            totalEntries: allEntries.length,
            byStatus: this.calculateStatusStats(allEntries),
            byType: this.calculateTypeStats(allEntries),
            byPriority: this.calculatePriorityStats(allEntries)
        };
    }
    async dispose() {
        this.cache.clear();
    }
    isRemoteStorage() {
        return true;
    }
    async syncWithRemote(entry) {
        const externalReferences = await this.enterpriseSync.syncAll(entry);
        return {
            ...entry,
            externalReferences,
            updatedAt: new Date().toISOString()
        };
    }
    async fetchFromRemote(id) {
        // Try to find the entry in each configured system
        // This assumes the ID might contain system prefixes or we have external references
        if (this.integrations.jira && id.includes('jira')) {
            return await this.fetchFromJiraById(id);
        }
        if (this.integrations.ado && id.includes('ado')) {
            return await this.fetchFromADOById(id);
        }
        if (this.integrations.github && id.includes('github')) {
            return await this.fetchFromGitHubById(id);
        }
        return null;
    }
    shouldStoreLocally(entry) {
        // Enterprise entries are never stored locally
        return false;
    }
    // Private helper methods for each enterprise system
    async fetchFromJira(filter) {
        // Implementation would call Jira API to fetch issues
        // Convert Jira issues to DevlogEntry format
        // This is a placeholder - full implementation would use Jira REST API
        return [];
    }
    async fetchFromADO(filter) {
        // Implementation would call Azure DevOps API to fetch work items
        return [];
    }
    async fetchFromGitHub(filter) {
        // Implementation would call GitHub API to fetch issues
        return [];
    }
    async searchJira(query) {
        // JQL search implementation
        return [];
    }
    async searchADO(query) {
        // WIQL search implementation
        return [];
    }
    async searchGitHub(query) {
        // GitHub search API implementation
        return [];
    }
    async fetchFromJiraById(id) {
        // Fetch specific Jira issue by ID
        return null;
    }
    async fetchFromADOById(id) {
        // Fetch specific ADO work item by ID
        return null;
    }
    async fetchFromGitHubById(id) {
        // Fetch specific GitHub issue by ID
        return null;
    }
    async deleteFromRemoteSystems(entry) {
        // Delete from each system where the entry exists
        if (entry.externalReferences) {
            for (const ref of entry.externalReferences) {
                switch (ref.system) {
                    case "jira":
                        await this.deleteFromJira(ref.id);
                        break;
                    case "ado":
                        await this.deleteFromADO(ref.id);
                        break;
                    case "github":
                        await this.deleteFromGitHub(ref.id);
                        break;
                }
            }
        }
    }
    async deleteFromJira(id) {
        // Implementation to delete Jira issue
    }
    async deleteFromADO(id) {
        // Implementation to delete ADO work item
    }
    async deleteFromGitHub(id) {
        // Implementation to close/delete GitHub issue
    }
    calculateStatusStats(entries) {
        const stats = {};
        entries.forEach(entry => {
            stats[entry.status] = (stats[entry.status] || 0) + 1;
        });
        return stats;
    }
    calculateTypeStats(entries) {
        const stats = {};
        entries.forEach(entry => {
            stats[entry.type] = (stats[entry.type] || 0) + 1;
        });
        return stats;
    }
    calculatePriorityStats(entries) {
        const stats = {};
        entries.forEach(entry => {
            stats[entry.priority] = (stats[entry.priority] || 0) + 1;
        });
        return stats;
    }
}
