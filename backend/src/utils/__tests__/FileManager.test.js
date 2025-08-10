const fs = require('fs').promises;
const path = require('path');
const FileManager = require('../FileManager');

// Mock fs module
jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    mkdir: jest.fn(),
    copyFile: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
    rename: jest.fn(),
    unlink: jest.fn(),
    stat: jest.fn()
  }
}));

describe('FileManager', () => {
  let fileManager;
  const testDataPath = '/test/data';

  beforeEach(() => {
    fileManager = new FileManager(testDataPath);
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize with correct data path', () => {
      expect(fileManager.dataPath).toBe(path.resolve(__dirname, testDataPath));
    });

    it('should initialize with empty locks map', () => {
      expect(fileManager.locks.size).toBe(0);
    });
  });

  describe('acquireLock and releaseLock', () => {
    it('should acquire and release lock successfully', async () => {
      const lockId = await fileManager.acquireLock('test.json');
      
      expect(typeof lockId).toBe('string');
      expect(fileManager.locks.has('test.json_lock')).toBe(true);
      
      fileManager.releaseLock('test.json', lockId);
      expect(fileManager.locks.has('test.json_lock')).toBe(false);
    });

    it('should not release lock with wrong lockId', async () => {
      const lockId = await fileManager.acquireLock('test.json');
      const wrongLockId = 'wrong-id';
      
      fileManager.releaseLock('test.json', wrongLockId);
      expect(fileManager.locks.has('test.json_lock')).toBe(true);
      
      // Clean up
      fileManager.releaseLock('test.json', lockId);
    });
  });

  describe('getFilePath', () => {
    it('should return correct file path', () => {
      const filename = 'test.json';
      const expectedPath = path.join(fileManager.dataPath, filename);
      
      expect(fileManager.getFilePath(filename)).toBe(expectedPath);
    });
  });

  describe('ensureDataDirectory', () => {
    it('should not create directory if it exists', async () => {
      fs.access.mockResolvedValue();
      
      await fileManager.ensureDataDirectory();
      
      expect(fs.access).toHaveBeenCalledWith(fileManager.dataPath);
      expect(fs.mkdir).not.toHaveBeenCalled();
    });

    it('should create directory if it does not exist', async () => {
      const error = new Error('Directory not found');
      error.code = 'ENOENT';
      fs.access.mockRejectedValue(error);
      fs.mkdir.mockResolvedValue();
      
      await fileManager.ensureDataDirectory();
      
      expect(fs.mkdir).toHaveBeenCalledWith(fileManager.dataPath, { recursive: true });
    });

    it('should throw error if access fails for other reasons', async () => {
      const error = new Error('Permission denied');
      error.code = 'EACCES';
      fs.access.mockRejectedValue(error);
      
      await expect(fileManager.ensureDataDirectory()).rejects.toThrow('Permission denied');
    });
  });

  describe('validateJSON', () => {
    it('should validate correct JSON array', () => {
      const jsonString = '[{"id": 1, "name": "test"}]';
      const result = fileManager.validateJSON(jsonString);
      
      expect(result).toEqual([{"id": 1, "name": "test"}]);
    });

    it('should validate correct JSON object', () => {
      const jsonString = '{"id": 1, "name": "test"}';
      const result = fileManager.validateJSON(jsonString);
      
      expect(result).toEqual({"id": 1, "name": "test"});
    });

    it('should throw error for invalid JSON', () => {
      const invalidJson = '{"id": 1, "name": "test"';
      
      expect(() => fileManager.validateJSON(invalidJson)).toThrow('JSON validation failed');
    });

    it('should throw error for primitive values', () => {
      const primitiveJson = '"just a string"';
      
      expect(() => fileManager.validateJSON(primitiveJson)).toThrow('Invalid JSON structure');
    });
  });

  describe('readJSON', () => {
    it('should read and parse JSON file successfully', async () => {
      const testData = [{"id": 1, "name": "test"}];
      const jsonContent = JSON.stringify(testData);
      
      fs.access.mockResolvedValue();
      fs.readFile.mockResolvedValue(jsonContent);
      
      const result = await fileManager.readJSON('test.json');
      
      expect(result).toEqual(testData);
      expect(fs.readFile).toHaveBeenCalledWith(
        fileManager.getFilePath('test.json'),
        'utf8'
      );
    });

    it('should return empty array for empty file', async () => {
      fs.access.mockResolvedValue();
      fs.readFile.mockResolvedValue('');
      
      const result = await fileManager.readJSON('test.json');
      
      expect(result).toEqual([]);
    });

    it('should create new file if file does not exist', async () => {
      fs.access.mockResolvedValue();
      const error = new Error('File not found');
      error.code = 'ENOENT';
      fs.readFile.mockRejectedValue(error);
      fs.writeFile.mockResolvedValue();
      fs.rename.mockResolvedValue();
      
      const result = await fileManager.readJSON('test.json');
      
      expect(result).toEqual([]);
      expect(fs.writeFile).toHaveBeenCalled();
    });

    it('should attempt recovery from backup on corrupted JSON', async () => {
      fs.access.mockResolvedValue();
      fs.readFile
        .mockRejectedValueOnce(new Error('JSON validation failed: Unexpected token'))
        .mockResolvedValueOnce('[{"id": 1}]'); // backup content
      fs.copyFile.mockResolvedValue();
      
      const result = await fileManager.readJSON('test.json');
      
      expect(result).toEqual([{"id": 1}]);
      expect(fs.copyFile).toHaveBeenCalled();
    });
  });

  describe('writeJSON', () => {
    it('should write JSON data successfully', async () => {
      const testData = [{"id": 1, "name": "test"}];
      
      fs.access.mockResolvedValue();
      fs.copyFile.mockResolvedValue(); // backup
      fs.writeFile.mockResolvedValue();
      fs.readFile.mockResolvedValue(JSON.stringify(testData)); // verification
      fs.rename.mockResolvedValue();
      
      await fileManager.writeJSON('test.json', testData);
      
      expect(fs.writeFile).toHaveBeenCalled();
      expect(fs.rename).toHaveBeenCalled();
    });

    it('should create backup before writing', async () => {
      const testData = [{"id": 1}];
      
      fs.access.mockResolvedValue();
      fs.copyFile.mockResolvedValue();
      fs.writeFile.mockResolvedValue();
      fs.readFile.mockResolvedValue(JSON.stringify(testData));
      fs.rename.mockResolvedValue();
      
      await fileManager.writeJSON('test.json', testData);
      
      expect(fs.copyFile).toHaveBeenCalled();
    });

    it('should clean up temp file on error', async () => {
      const testData = [{"id": 1}];
      
      fs.access.mockResolvedValue();
      fs.copyFile.mockResolvedValue();
      fs.writeFile.mockRejectedValue(new Error('Write failed'));
      fs.unlink.mockResolvedValue();
      
      await expect(fileManager.writeJSON('test.json', testData)).rejects.toThrow('Write failed');
      expect(fs.unlink).toHaveBeenCalled();
    });
  });

  describe('fileExists', () => {
    it('should return true if file exists', async () => {
      fs.access.mockResolvedValue();
      
      const exists = await fileManager.fileExists('test.json');
      
      expect(exists).toBe(true);
    });

    it('should return false if file does not exist', async () => {
      fs.access.mockRejectedValue(new Error('File not found'));
      
      const exists = await fileManager.fileExists('test.json');
      
      expect(exists).toBe(false);
    });
  });

  describe('getFileStats', () => {
    it('should return file stats', async () => {
      const mockStats = { size: 1024, mtime: new Date() };
      fs.stat.mockResolvedValue(mockStats);
      
      const stats = await fileManager.getFileStats('test.json');
      
      expect(stats).toBe(mockStats);
      expect(fs.stat).toHaveBeenCalledWith(fileManager.getFilePath('test.json'));
    });
  });
});