const { v4: uuidv4 } = require('uuid');
const FileManager = require('../utils/FileManager');

class BaseRepository {
  constructor(filename, fileManager = null) {
    this.filename = filename;
    this.fileManager = fileManager || new FileManager();
    this.cache = null;
    this.cacheTimestamp = null;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache timeout
  }

  /**
   * Get all records with optional caching
   * @param {boolean} useCache - Whether to use cached data
   * @returns {Promise<Array>} Array of records
   */
  async findAll(useCache = true) {
    if (useCache && this.isCacheValid()) {
      return [...this.cache]; // Return copy to prevent mutations
    }

    const data = await this.fileManager.readJSON(this.filename);
    this.updateCache(data);
    return [...data];
  }

  /**
   * Find a record by ID
   * @param {string} id - Record ID
   * @returns {Promise<Object|null>} Found record or null
   */
  async findById(id) {
    const data = await this.findAll();
    return data.find(record => record.id === id) || null;
  }

  /**
   * Find records matching criteria
   * @param {Function} predicate - Function to test each record
   * @returns {Promise<Array>} Array of matching records
   */
  async findWhere(predicate) {
    const data = await this.findAll();
    return data.filter(predicate);
  }

  /**
   * Find first record matching criteria
   * @param {Function} predicate - Function to test each record
   * @returns {Promise<Object|null>} First matching record or null
   */
  async findOne(predicate) {
    const data = await this.findAll();
    return data.find(predicate) || null;
  }

  /**
   * Create a new record
   * @param {Object} recordData - Data for the new record
   * @returns {Promise<Object>} Created record with ID
   */
  async create(recordData) {
    const data = await this.findAll(false); // Don't use cache for writes
    
    const newRecord = {
      id: uuidv4(),
      ...recordData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    data.push(newRecord);
    await this.fileManager.writeJSON(this.filename, data);
    this.updateCache(data);
    
    return { ...newRecord };
  }

  /**
   * Update a record by ID
   * @param {string} id - Record ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object|null>} Updated record or null if not found
   */
  async update(id, updateData) {
    const data = await this.findAll(false);
    const index = data.findIndex(record => record.id === id);
    
    if (index === -1) {
      return null;
    }

    const updatedRecord = {
      ...data[index],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    data[index] = updatedRecord;
    await this.fileManager.writeJSON(this.filename, data);
    this.updateCache(data);
    
    return { ...updatedRecord };
  }

  /**
   * Delete a record by ID
   * @param {string} id - Record ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async delete(id) {
    const data = await this.findAll(false);
    const index = data.findIndex(record => record.id === id);
    
    if (index === -1) {
      return false;
    }

    data.splice(index, 1);
    await this.fileManager.writeJSON(this.filename, data);
    this.updateCache(data);
    
    return true;
  }

  /**
   * Count total records
   * @returns {Promise<number>} Total count
   */
  async count() {
    const data = await this.findAll();
    return data.length;
  }

  /**
   * Check if record exists by ID
   * @param {string} id - Record ID
   * @returns {Promise<boolean>} True if exists
   */
  async exists(id) {
    const record = await this.findById(id);
    return record !== null;
  }

  /**
   * Clear all records (use with caution)
   * @returns {Promise<void>}
   */
  async clear() {
    await this.fileManager.writeJSON(this.filename, []);
    this.updateCache([]);
  }

  /**
   * Update cache with new data
   * @param {Array} data - Data to cache
   */
  updateCache(data) {
    this.cache = [...data];
    this.cacheTimestamp = Date.now();
  }

  /**
   * Check if cache is still valid
   * @returns {boolean} True if cache is valid
   */
  isCacheValid() {
    return this.cache !== null && 
           this.cacheTimestamp !== null && 
           (Date.now() - this.cacheTimestamp) < this.cacheTimeout;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache = null;
    this.cacheTimestamp = null;
  }

  /**
   * Get repository statistics
   * @returns {Promise<Object>} Repository stats
   */
  async getStats() {
    const data = await this.findAll();
    const fileExists = await this.fileManager.fileExists(this.filename);
    let fileStats = null;
    
    if (fileExists) {
      fileStats = await this.fileManager.getFileStats(this.filename);
    }

    return {
      totalRecords: data.length,
      cacheStatus: this.isCacheValid() ? 'valid' : 'invalid',
      fileExists,
      fileSize: fileStats ? fileStats.size : 0,
      lastModified: fileStats ? fileStats.mtime : null
    };
  }
}

module.exports = BaseRepository;