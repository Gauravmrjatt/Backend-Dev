const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

/**
 * Gets the hash of a file's content to compare if files are identical
 * @param {string} filePath - Path to the file
 * @returns {Promise<string>} - Hash of the file content
 */
async function getFileHash(filePath) {
  try {
    const content = await fs.readFile(filePath);
    return crypto.createHash('md5').update(content).digest('hex');
  } catch (error) {
    throw new Error(`Could not read file ${filePath}: ${error.message}`);
  }
}

/**
 * Gets file stats (size, modification time) for comparison
 * @param {string} filePath - Path to the file
 * @returns {Promise<Object>} - File stats object
 */
async function getFileStats(filePath) {
  try {
    const stats = await fs.stat(filePath);
    // Return the stats object as-is so we can call .isFile() and .isDirectory() methods
    return stats;
  } catch (error) {
    throw new Error(`Could not get stats for ${filePath}: ${error.message}`);
  }
}

/**
 * Recursively gets all files in a directory
 * @param {string} dirPath - Directory path to scan
 * @returns {Promise<Array>} - Array of file paths relative to the directory
 */
async function getFilesRecursive(dirPath) {
  const files = [];
  
  try {
    const items = await fs.readdir(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stats = await getFileStats(fullPath);
      
      if (stats.isDirectory()) {
        const subDirFiles = await getFilesRecursive(fullPath);
        files.push(...subDirFiles.map(file => path.join(item, file)));
      } else if (stats.isFile()) {
        files.push(item);
      }
    }
  } catch (error) {
    throw new Error(`Could not read directory ${dirPath}: ${error.message}`);
  }
  
  return files;
}

/**
 * Compares two directories and identifies differences
 * @param {string} sourceDir - Source directory path
 * @param {string} targetDir - Target directory path
 * @returns {Promise<Object>} - Comparison results
 */
async function compareDirectories(sourceDir, targetDir) {
  const result = {
    filesToAdd: [],      // Files in source but not in target
    filesToUpdate: [],   // Files in both but with different content
    filesToDelete: [],   // Files in target but not in source
    identicalFiles: []   // Files in both with same content
  };
  
  try {
    // Get all files in both directories
    const sourceFiles = await getFilesRecursive(sourceDir);
    const targetFiles = await getFilesRecursive(targetDir);
    
    // Convert to sets for faster lookup
    const sourceSet = new Set(sourceFiles);
    const targetSet = new Set(targetFiles);
    
    // Find files to add (in source but not in target)
    for (const file of sourceFiles) {
      if (!targetSet.has(file)) {
        result.filesToAdd.push(file);
      }
    }
    
    // Find files to delete (in target but not in source)
    for (const file of targetFiles) {
      if (!sourceSet.has(file)) {
        result.filesToDelete.push(file);
      }
    }
    
    // Compare files that exist in both directories
    for (const file of sourceFiles) {
      if (targetSet.has(file)) {
        const sourceFilePath = path.join(sourceDir, file);
        const targetFilePath = path.join(targetDir, file);
        
        try {
          const sourceHash = await getFileHash(sourceFilePath);
          const targetHash = await getFileHash(targetFilePath);
          
          if (sourceHash === targetHash) {
            result.identicalFiles.push(file);
          } else {
            result.filesToUpdate.push(file);
          }
        } catch (error) {
          // If we can't compare hashes, mark as update needed
          result.filesToUpdate.push(file);
          console.warn(`Could not compare file ${file}: ${error.message}`);
        }
      }
    }
    
    return result;
  } catch (error) {
    throw new Error(`Error comparing directories: ${error.message}`);
  }
}

/**
 * Creates a directory and any necessary parent directories
 * @param {string} dirPath - Directory path to create
 */
async function ensureDirectoryExists(dirPath) {
  try {
    await fs.mkdir(dirPath, { recursive: true });
  } catch (error) {
    throw new Error(`Could not create directory ${dirPath}: ${error.message}`);
  }
}

/**
 * Copies a file from source to target
 * @param {string} sourcePath - Source file path
 * @param {string} targetPath - Target file path
 */
async function copyFile(sourcePath, targetPath) {
  try {
    // Ensure target directory exists
    const targetDir = path.dirname(targetPath);
    await ensureDirectoryExists(targetDir);
    
    await fs.copyFile(sourcePath, targetPath);
  } catch (error) {
    throw new Error(`Could not copy file from ${sourcePath} to ${targetPath}: ${error.message}`);
  }
}

/**
 * Deletes a file
 * @param {string} filePath - Path to file to delete
 */
async function deleteFile(filePath) {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    throw new Error(`Could not delete file ${filePath}: ${error.message}`);
  }
}

/**
 * Synchronizes two directories
 * @param {string} sourceDir - Source directory path
 * @param {string} targetDir - Target directory path
 * @param {Object} options - Sync options
 * @returns {Promise<Object>} - Sync results
 */
async function syncDirectories(sourceDir, targetDir, options = {}) {
  const { 
    dryRun = false,           // If true, only show what would be done
    deleteExtra = true,       // If true, delete extra files in target
    overwrite = true         // If true, overwrite existing files in target
  } = options;
  
  const results = {
    added: [],
    updated: [],
    deleted: [],
    skipped: [],
    errors: []
  };
  
  try {
    console.log(`Synchronizing from: ${path.resolve(sourceDir)}`);
    console.log(`Synchronizing to: ${path.resolve(targetDir)}`);
    if (dryRun) console.log('(DRY RUN - no actual changes will be made)');
    console.log('');
    
    // Compare directories
    const comparison = await compareDirectories(sourceDir, targetDir);
    
    console.log('Comparison Results:');
    console.log(`Files to add: ${comparison.filesToAdd.length}`);
    console.log(`Files to update: ${comparison.filesToUpdate.length}`);
    console.log(`Files to delete: ${comparison.filesToDelete.length}`);
    console.log(`Identical files: ${comparison.identicalFiles.length}`);
    console.log('');
    
    // Add new files
    for (const file of comparison.filesToAdd) {
      const sourcePath = path.join(sourceDir, file);
      const targetPath = path.join(targetDir, file);
      
      try {
        if (!dryRun) {
          await copyFile(sourcePath, targetPath);
        }
        results.added.push(file);
        console.log(`${dryRun ? '[DRY RUN] ' : ''}Added: ${file}`);
      } catch (error) {
        results.errors.push({ file, operation: 'add', error: error.message });
        console.error(`Error adding ${file}: ${error.message}`);
      }
    }
    
    // Update existing files
    for (const file of comparison.filesToUpdate) {
      if (overwrite) {
        const sourcePath = path.join(sourceDir, file);
        const targetPath = path.join(targetDir, file);
        
        try {
          if (!dryRun) {
            await copyFile(sourcePath, targetPath);
          }
          results.updated.push(file);
          console.log(`${dryRun ? '[DRY RUN] ' : ''}Updated: ${file}`);
        } catch (error) {
          results.errors.push({ file, operation: 'update', error: error.message });
          console.error(`Error updating ${file}: ${error.message}`);
        }
      } else {
        results.skipped.push(file);
        console.log(`Skipped (no overwrite): ${file}`);
      }
    }
    
    // Delete extra files in target directory
    if (deleteExtra) {
      for (const file of comparison.filesToDelete) {
        const targetPath = path.join(targetDir, file);
        
        try {
          if (!dryRun) {
            await deleteFile(targetPath);
          }
          results.deleted.push(file);
          console.log(`${dryRun ? '[DRY RUN] ' : ''}Deleted: ${file}`);
        } catch (error) {
          results.errors.push({ file, operation: 'delete', error: error.message });
          console.error(`Error deleting ${file}: ${error.message}`);
        }
      }
    } else {
      console.log('Delete extra files option disabled - skipping deletion of extra files');
    }
    
    // Summary
    console.log('\nSync Summary:');
    console.log(`Added: ${results.added.length} files`);
    console.log(`Updated: ${results.updated.length} files`);
    console.log(`Deleted: ${results.deleted.length} files`);
    console.log(`Skipped: ${results.skipped.length} files`);
    console.log(`Errors: ${results.errors.length} operations`);
    
    if (results.errors.length > 0) {
      console.log('\nErrors encountered:');
      results.errors.forEach(error => {
        console.log(`  ${error.operation} ${error.file}: ${error.error}`);
      });
    }
    
    return results;
  } catch (error) {
    throw new Error(`Synchronization failed: ${error.message}`);
  }
}

/**
 * Main function to run the file synchronization tool
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node file-sync.js <source-directory> <target-directory> [options]');
    console.log('Options:');
    console.log('  --dry-run     Show what would be done without making changes');
    console.log('  --no-delete   Do not delete extra files in target directory');
    console.log('  --no-overwrite  Do not overwrite existing files in target directory');
    console.log('');
    console.log('Example: node file-sync.js ./source ./target --dry-run');
    process.exit(1);
  }
  
  const sourceDir = args[0];
  const targetDir = args[1];
  const options = {};
  
  // Parse options
  for (const arg of args.slice(2)) {
    switch (arg) {
      case '--dry-run':
        options.dryRun = true;
        break;
      case '--no-delete':
        options.deleteExtra = false;
        break;
      case '--no-overwrite':
        options.overwrite = false;
        break;
      default:
        console.log(`Unknown option: ${arg}`);
        process.exit(1);
    }
  }
  
  try {
    await syncDirectories(sourceDir, targetDir, options);
  } catch (error) {
    console.error('Synchronization failed:', error.message);
    process.exit(1);
  }
}

// Export functions for testing purposes
module.exports = {
  compareDirectories,
  syncDirectories,
  getFileHash,
  getFileStats,
  getFilesRecursive
};

// Run main function if this file is executed directly
if (require.main === module) {
  main();
}