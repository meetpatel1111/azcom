const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class FileManager {
  constructor(dataPath = '../data') {
    this.dataPath = path.resolve(__dirname, dataPath);
    this.locks = new Map(); // Simple in-memory lock tracking
  }

  /**
   * Acquire a lock for a file to prevent concurrent access
   * @param {string} filename - Name of the file to lock
   * @returns {string} Lock ID
   */
  async acquireLock(filename) {
    const lockId = uuidv4();
    const lockKey = `${filename}_lock`;
    
    // Wait for existing lock to be released
    while (this.locks.has(lockKey)) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    this.locks.set(lockKey, lockId);
    return lockId;
  }

  /**
   * Release a file lock
   * @param {string} filename - Name of the file to unlock
   * @param {string} lockId - Lock ID to verify ownership
   */
  releaseLock(filename, lockId) {
    const lockKey = `${filename}_lock`;
    const currentLockId = this.locks.get(lockKey);
    
    if (currentLockId === lockId) {
      this.locks.delete(lockKey);
    }
  }

  /**
   * Get the full path for a data file
   * @param {string} filename - Name of the file
   * @returns {string} Full file path
   */
  getFilePath(filename) {
    return path.join(this.dataPath, filename);
  }

  /**
   * Ensure data directory exists
   */
  async ensureDataDirectory() {
    try {
      await fs.access(this.dataPath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        await fs.mkdir(this.dataPath, { recursive: true });
      } else {
        throw error;
      }
    }
  }

  /**
   * Create a backup of a file
   * @param {string} filename - Name of the file to backup
   */
  async createBackup(filename) {
    const filePath = this.getFilePath(filename);
    const backupPath = this.getFilePath(`${filename}.backup`);
    
    try {
      await fs.access(filePath);
      await fs.copyFile(filePath, backupPath);
    } catch (error) {
      // File doesn't exist, no backup needed
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  /**
   * Restore from backup if main file is corrupted
   * @param {string} filename - Name of the file to restore
   */
  async restoreFromBackup(filename) {
    const filePath = this.getFilePath(filename);
    const backupPath = this.getFilePath(`${filename}.backup`);
    
    try {
      await fs.access(backupPath);
      await fs.copyFile(backupPath, filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate JSON content
   * @param {string} content - JSON string to validate
   * @returns {Object} Parsed JSON object
   */
  validateJSON(content) {
    try {
      const parsed = JSON.parse(content);
      
      // Ensure it's an array for our data files
      if (!Array.isArray(parsed) && typeof parsed !== 'object') {
        throw new Error('Invalid JSON structure: must be array or object');
      }
      
      return parsed;
    } catch (error) {
      throw new Error(`JSON validation failed: ${error.message}`);
    }
  }

  /**
   * Read JSON data from file with error handling and recovery
   * @param {string} filename - Name of the JSON file
   * @returns {Promise<Array|Object>} Parsed JSON data
   */
  async readJSON(filename) {
    const lockId = await this.acquireLock(filename);
    
    try {
      await this.ensureDataDirectory();
      const filePath = this.getFilePath(filename);
      
      try {
        const content = await fs.readFile(filePath, 'utf8');
        
        if (!content.trim()) {
          // Empty file, return empty array
          return [];
        }
        
        return this.validateJSON(content);
        
      } catch (error) {
        if (error.code === 'ENOENT') {
          // File doesn't exist, create with empty array
          await this.writeJSON(filename, []);
          return [];
        }
        
        // Try to recover from backup if JSON is corrupted
        if (error.message.includes('JSON validation failed')) {
          console.warn(`Corrupted JSON detected in ${filename}, attempting recovery...`);
          
          const restored = await this.restoreFromBackup(filename);
          if (restored) {
            console.log(`Successfully restored ${filename} from backup`);
            const content = await fs.readFile(filePath, 'utf8');
            return this.validateJSON(content);
          } else {
            console.error(`No backup available for ${filename}, creating new empty file`);
            await this.writeJSON(filename, []);
            return [];
          }
        }
        
        throw error;
      }
    } finally {
      this.releaseLock(filename, lockId);
    }
  }

  /**
   * Write JSON data to file with backup and atomic operations
   * @param {string} filename - Name of the JSON file
   * @param {Array|Object} data - Data to write
   */
  async writeJSON(filename, data) {
    const lockId = await this.acquireLock(filename);
    
    try {
      await this.ensureDataDirectory();
      
      // Create backup before writing
      await this.createBackup(filename);
      
      const filePath = this.getFilePath(filename);
      const tempPath = `${filePath}.tmp`;
      
      // Write to temporary file first (atomic operation)
      const jsonContent = JSON.stringify(data, null, 2);
      await fs.writeFile(tempPath, jsonContent, 'utf8');
      
      // Verify the written content
      const verifyContent = await fs.readFile(tempPath, 'utf8');
      this.validateJSON(verifyContent);
      
      // Move temp file to final location
      await fs.rename(tempPath, filePath);
      
    } catch (error) {
      // Clean up temp file if it exists
      const tempPath = `${this.getFilePath(filename)}.tmp`;
      try {
        await fs.unlink(tempPath);
      } catch (cleanupError) {
        // Ignore cleanup errors
      }
      
      throw error;
    } finally {
      this.releaseLock(filename, lockId);
    }
  }

  /**
   * Check if a file exists
   * @param {string} filename - Name of the file
   * @returns {Promise<boolean>} True if file exists
   */
  async fileExists(filename) {
    try {
      const filePath = this.getFilePath(filename);
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get file stats
   * @param {string} filename - Name of the file
   * @returns {Promise<Object>} File stats
   */
  async getFileStats(filename) {
    const filePath = this.getFilePath(filename);
    return await fs.stat(filePath);
  }
}

module.exports = FileManager;