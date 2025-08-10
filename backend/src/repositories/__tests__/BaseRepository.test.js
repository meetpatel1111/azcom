const BaseRepository = require('../BaseRepository');
const FileManager = require('../../utils/FileManager');

// Mock FileManager
jest.mock('../../utils/FileManager');

describe('BaseRepository', () => {
  let repository;
  let mockFileManager;

  beforeEach(() => {
    mockFileManager = {
      readJSON: jest.fn(),
      writeJSON: jest.fn(),
      fileExists: jest.fn(),
      getFileStats: jest.fn()
    };
    
    FileManager.mockImplementation(() => mockFileManager);
    repository = new BaseRepository('test.json');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return all records', async () => {
      const testData = [{ id: '1', name: 'Test' }];
      mockFileManager.readJSON.mockResolvedValue(testData);

      const result = await repository.findAll();

      expect(result).toEqual(testData);
      expect(mockFileManager.readJSON).toHaveBeenCalledWith('test.json');
    });

    it('should use cache when available and valid', async () => {
      const testData = [{ id: '1', name: 'Test' }];
      mockFileManager.readJSON.mockResolvedValue(testData);

      // First call - should read from file
      await repository.findAll();
      expect(mockFileManager.readJSON).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      const result = await repository.findAll();
      expect(mockFileManager.readJSON).toHaveBeenCalledTimes(1);
      expect(result).toEqual(testData);
    });
  });

  describe('findById', () => {
    it('should find record by ID', async () => {
      const testData = [
        { id: '1', name: 'Test1' },
        { id: '2', name: 'Test2' }
      ];
      mockFileManager.readJSON.mockResolvedValue(testData);

      const result = await repository.findById('2');

      expect(result).toEqual({ id: '2', name: 'Test2' });
    });

    it('should return null if record not found', async () => {
      mockFileManager.readJSON.mockResolvedValue([]);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('findWhere', () => {
    it('should find records matching predicate', async () => {
      const testData = [
        { id: '1', name: 'Test1', active: true },
        { id: '2', name: 'Test2', active: false },
        { id: '3', name: 'Test3', active: true }
      ];
      mockFileManager.readJSON.mockResolvedValue(testData);

      const result = await repository.findWhere(record => record.active);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('3');
    });
  });

  describe('findOne', () => {
    it('should find first record matching predicate', async () => {
      const testData = [
        { id: '1', name: 'Test1', active: true },
        { id: '2', name: 'Test2', active: true }
      ];
      mockFileManager.readJSON.mockResolvedValue(testData);

      const result = await repository.findOne(record => record.active);

      expect(result).toEqual({ id: '1', name: 'Test1', active: true });
    });

    it('should return null if no record matches', async () => {
      mockFileManager.readJSON.mockResolvedValue([]);

      const result = await repository.findOne(record => record.active);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create new record with ID and timestamps', async () => {
      const existingData = [];
      const newData = { name: 'New Test' };
      
      mockFileManager.readJSON.mockResolvedValue(existingData);
      mockFileManager.writeJSON.mockResolvedValue();

      const result = await repository.create(newData);

      expect(result).toMatchObject({
        name: 'New Test',
        id: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });
      expect(mockFileManager.writeJSON).toHaveBeenCalledWith('test.json', [result]);
    });
  });

  describe('update', () => {
    it('should update existing record', async () => {
      const existingData = [
        { id: '1', name: 'Test1', createdAt: '2023-01-01T00:00:00.000Z' }
      ];
      const updateData = { name: 'Updated Test' };
      
      mockFileManager.readJSON.mockResolvedValue(existingData);
      mockFileManager.writeJSON.mockResolvedValue();

      const result = await repository.update('1', updateData);

      expect(result).toMatchObject({
        id: '1',
        name: 'Updated Test',
        createdAt: '2023-01-01T00:00:00.000Z',
        updatedAt: expect.any(String)
      });
    });

    it('should return null if record not found', async () => {
      mockFileManager.readJSON.mockResolvedValue([]);

      const result = await repository.update('nonexistent', { name: 'Test' });

      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete existing record', async () => {
      const existingData = [
        { id: '1', name: 'Test1' },
        { id: '2', name: 'Test2' }
      ];
      
      mockFileManager.readJSON.mockResolvedValue(existingData);
      mockFileManager.writeJSON.mockResolvedValue();

      const result = await repository.delete('1');

      expect(result).toBe(true);
      expect(mockFileManager.writeJSON).toHaveBeenCalledWith('test.json', [
        { id: '2', name: 'Test2' }
      ]);
    });

    it('should return false if record not found', async () => {
      mockFileManager.readJSON.mockResolvedValue([]);

      const result = await repository.delete('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('count', () => {
    it('should return total count of records', async () => {
      const testData = [{ id: '1' }, { id: '2' }, { id: '3' }];
      mockFileManager.readJSON.mockResolvedValue(testData);

      const result = await repository.count();

      expect(result).toBe(3);
    });
  });

  describe('exists', () => {
    it('should return true if record exists', async () => {
      const testData = [{ id: '1', name: 'Test' }];
      mockFileManager.readJSON.mockResolvedValue(testData);

      const result = await repository.exists('1');

      expect(result).toBe(true);
    });

    it('should return false if record does not exist', async () => {
      mockFileManager.readJSON.mockResolvedValue([]);

      const result = await repository.exists('nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all records', async () => {
      mockFileManager.writeJSON.mockResolvedValue();

      await repository.clear();

      expect(mockFileManager.writeJSON).toHaveBeenCalledWith('test.json', []);
    });
  });

  describe('cache management', () => {
    it('should update cache after operations', async () => {
      const testData = [{ id: '1', name: 'Test' }];
      mockFileManager.readJSON.mockResolvedValue(testData);
      mockFileManager.writeJSON.mockResolvedValue();

      // Load data and cache it
      await repository.findAll();
      expect(repository.cache).toEqual(testData);

      // Create new record should update cache
      const newRecord = await repository.create({ name: 'New' });
      expect(repository.cache).toHaveLength(2);
    });

    it('should clear cache when requested', async () => {
      const testData = [{ id: '1', name: 'Test' }];
      mockFileManager.readJSON.mockResolvedValue(testData);

      await repository.findAll();
      expect(repository.cache).toEqual(testData);

      repository.clearCache();
      expect(repository.cache).toBeNull();
    });
  });
});