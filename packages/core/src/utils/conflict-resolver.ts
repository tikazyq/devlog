/**
 * Conflict resolution strategies for git-based devlog storage
 * Handles merge conflicts when multiple devices edit the same entries
 */

import { DevlogEntry, ConflictResolution } from "@devlog/types";
import * as path from "path";
import * as fs from "fs/promises";

export class ConflictResolver {
  
  async resolveConflicts(strategy: ConflictResolution, repositoryPath: string): Promise<void> {
    const conflictedFiles = await this.getConflictedFiles(repositoryPath);
    
    if (conflictedFiles.length === 0) {
      console.log("No conflicts to resolve");
      return;
    }
    
    console.log(`Resolving ${conflictedFiles.length} conflicts using strategy: ${strategy}`);
    
    for (const file of conflictedFiles) {
      await this.resolveFileConflict(file, strategy, repositoryPath);
    }
  }

  private async getConflictedFiles(repositoryPath: string): Promise<string[]> {
    try {
      // This is a simplified approach - in a real implementation, you'd check git status
      // For now, we'll assume conflicts are in JSON files in the entries directory
      const entriesPath = path.join(repositoryPath, ".devlog", "entries");
      const files = await fs.readdir(entriesPath);
      
      const conflictedFiles: string[] = [];
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(entriesPath, file);
          const content = await fs.readFile(filePath, 'utf-8');
          
          // Check for git conflict markers
          if (content.includes('<<<<<<< HEAD') || content.includes('>>>>>>> ')) {
            conflictedFiles.push(filePath);
          }
        }
      }
      
      return conflictedFiles;
    } catch (error) {
      console.error("Failed to get conflicted files:", error);
      return [];
    }
  }

  private async resolveFileConflict(
    filePath: string, 
    strategy: ConflictResolution,
    repositoryPath: string
  ): Promise<void> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      
      if (!content.includes('<<<<<<< HEAD')) {
        // No conflict markers found
        return;
      }
      
      const resolved = await this.resolveConflictContent(content, strategy);
      await fs.writeFile(filePath, resolved);
      
      console.log(`Resolved conflict in ${path.basename(filePath)} using ${strategy} strategy`);
    } catch (error) {
      console.error(`Failed to resolve conflict in ${filePath}:`, error);
    }
  }

  private async resolveConflictContent(content: string, strategy: ConflictResolution): Promise<string> {
    const lines = content.split('\n');
    const resolvedLines: string[] = [];
    let inConflict = false;
    let localContent: string[] = [];
    let remoteContent: string[] = [];
    let currentSection: 'local' | 'remote' = 'local';
    
    for (const line of lines) {
      if (line.startsWith('<<<<<<< HEAD')) {
        inConflict = true;
        localContent = [];
        remoteContent = [];
        currentSection = 'local';
        continue;
      }
      
      if (line.startsWith('=======')) {
        currentSection = 'remote';
        continue;
      }
      
      if (line.startsWith('>>>>>>> ')) {
        inConflict = false;
        
        // Apply resolution strategy
        const resolvedContent = await this.applyResolutionStrategy(
          localContent.join('\n'),
          remoteContent.join('\n'),
          strategy
        );
        
        resolvedLines.push(resolvedContent);
        continue;
      }
      
      if (inConflict) {
        if (currentSection === 'local') {
          localContent.push(line);
        } else {
          remoteContent.push(line);
        }
      } else {
        resolvedLines.push(line);
      }
    }
    
    return resolvedLines.join('\n');
  }

  private async applyResolutionStrategy(
    localContent: string,
    remoteContent: string,
    strategy: ConflictResolution
  ): Promise<string> {
    switch (strategy) {
      case 'local-wins':
        return localContent;
        
      case 'remote-wins':
        return remoteContent;
        
      case 'timestamp-wins':
        return this.resolveByTimestamp(localContent, remoteContent);
        
      case 'interactive':
        // For now, fallback to timestamp strategy
        // In a real implementation, this would prompt the user
        return this.resolveByTimestamp(localContent, remoteContent);
        
      default:
        return localContent;
    }
  }

  private resolveByTimestamp(localContent: string, remoteContent: string): string {
    try {
      const localEntry = JSON.parse(localContent) as DevlogEntry;
      const remoteEntry = JSON.parse(remoteContent) as DevlogEntry;
      
      // Compare updatedAt timestamps
      if (localEntry.updatedAt > remoteEntry.updatedAt) {
        return localContent;
      } else {
        return remoteContent;
      }
    } catch (error) {
      console.error("Failed to parse JSON for timestamp comparison:", error);
      // Fallback to local content if parsing fails
      return localContent;
    }
  }

  async mergeEntries(local: DevlogEntry, remote: DevlogEntry): Promise<DevlogEntry> {
    // Create a merged entry by combining non-conflicting changes
    const merged: DevlogEntry = { ...local };
    
    // Use the most recent timestamp
    if (remote.updatedAt > local.updatedAt) {
      merged.updatedAt = remote.updatedAt;
    }
    
    // Merge notes (combine both sets)
    const allNotes = [...local.notes, ...remote.notes];
    const uniqueNotes = allNotes.filter((note, index, array) => 
      array.findIndex(n => n.id === note.id) === index
    );
    merged.notes = uniqueNotes.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    // Merge tags (combine unique tags)
    merged.tags = [...new Set([...local.tags, ...remote.tags])];
    
    // Merge files (combine unique files)
    merged.files = [...new Set([...local.files, ...remote.files])];
    
    // For other fields, use the most recently updated version
    if (remote.updatedAt > local.updatedAt) {
      merged.title = remote.title;
      merged.description = remote.description;
      merged.status = remote.status;
      merged.priority = remote.priority;
      merged.context = remote.context;
      merged.aiContext = remote.aiContext;
    }
    
    return merged;
  }
}
