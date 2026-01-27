const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify the question function for easier async/await usage
const question = (query) => new Promise(resolve => rl.question(query, resolve));

/**
 * Reads content from a file
 * @param {string} filePath - Path to the file to read
 */
async function readFile(filePath) {
  try {
    const content = await fs.readFile(path.resolve(filePath), 'utf8');
    console.log(`Content of ${filePath}:`);
    console.log(content);
    return content;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    throw error;
  }
}

/**
 * Writes content to a file
 * @param {string} filePath - Path to the file to write
 * @param {string} content - Content to write to the file
 */
async function writeFile(filePath, content) {
  try {
    await fs.writeFile(path.resolve(filePath), content, 'utf8');
    console.log(`Successfully wrote to ${filePath}`);
  } catch (error) {
    console.error(`Error writing to file ${filePath}:`, error.message);
    throw error;
  }
}

/**
 * Copies a file from source to destination
 * @param {string} sourcePath - Source file path
 * @param {string} destPath - Destination file path
 */
async function copyFile(sourcePath, destPath) {
  try {
    await fs.copyFile(path.resolve(sourcePath), path.resolve(destPath));
    console.log(`Successfully copied ${sourcePath} to ${destPath}`);
  } catch (error) {
    console.error(`Error copying file from ${sourcePath} to ${destPath}:`, error.message);
    throw error;
  }
}

/**
 * Deletes a file
 * @param {string} filePath - Path to the file to delete
 */
async function deleteFile(filePath) {
  try {
    await fs.unlink(path.resolve(filePath));
    console.log(`Successfully deleted ${filePath}`);
  } catch (error) {
    console.error(`Error deleting file ${filePath}:`, error.message);
    throw error;
  }
}

/**
 * Lists directory contents
 * @param {string} dirPath - Path to the directory to list
 */
async function listDirectory(dirPath = '.') {
  try {
    const items = await fs.readdir(path.resolve(dirPath), { withFileTypes: true });
    
    console.log(`Contents of directory ${path.resolve(dirPath)}:`);
    items.forEach(item => {
      const type = item.isDirectory() ? '[DIR]' : '[FILE]';
      console.log(`${type} ${item.name}`);
    });
    
    return items;
  } catch (error) {
    console.error(`Error listing directory ${dirPath}:`, error.message);
    throw error;
  }
}

/**
 * Main menu function to handle user input
 */
async function showMenu() {
  console.log('\n=== File Manager Application ===');
  console.log('1. Read file');
  console.log('2. Write file');
  console.log('3. Copy file');
  console.log('4. Delete file');
  console.log('5. List directory contents');
  console.log('6. Exit');
  
  const choice = await question('Enter your choice (1-6): ');
  
  switch (choice) {
    case '1':
      const readPath = await question('Enter file path to read: ');
      try {
        await readFile(readPath);
      } catch (error) {
        // Error already logged in readFile function
      }
      break;
      
    case '2':
      const writePath = await question('Enter file path to write: ');
      const content = await question('Enter content to write: ');
      try {
        await writeFile(writePath, content);
      } catch (error) {
        // Error already logged in writeFile function
      }
      break;
      
    case '3':
      const sourcePath = await question('Enter source file path: ');
      const destPath = await question('Enter destination file path: ');
      try {
        await copyFile(sourcePath, destPath);
      } catch (error) {
        // Error already logged in copyFile function
      }
      break;
      
    case '4':
      const deletePath = await question('Enter file path to delete: ');
      try {
        await deleteFile(deletePath);
      } catch (error) {
        // Error already logged in deleteFile function
      }
      break;
      
    case '5':
      const dirPath = await question('Enter directory path to list (press Enter for current directory): ') || '.';
      try {
        await listDirectory(dirPath);
      } catch (error) {
        // Error already logged in listDirectory function
      }
      break;
      
    case '6':
      console.log('Exiting File Manager Application...');
      rl.close();
      return;
      
    default:
      console.log('Invalid choice. Please enter a number between 1-6.');
  }
  
  // Show menu again after operation
  await showMenu();
}

/**
 * Initialize the application
 */
async function init() {
  console.log('Welcome to the File Manager Application!');
  console.log('This application allows you to perform basic file operations.');
  
  try {
    await showMenu();
  } catch (error) {
    console.error('An unexpected error occurred:', error);
    rl.close();
  }
}

// Handle exit gracefully
process.on('SIGINT', () => {
  console.log('\nReceived SIGINT. Exiting gracefully...');
  rl.close();
  process.exit(0);
});

// Start the application
init();

module.exports = {
  readFile,
  writeFile,
  copyFile,
  deleteFile,
  listDirectory
};