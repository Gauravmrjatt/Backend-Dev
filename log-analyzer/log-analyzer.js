const fs = require('fs');
const readline = require('readline');
const path = require('path');

/**
 * Analyzes a log file and generates a summary report
 * @param {string} logFilePath - Path to the log file to analyze
 */
async function analyzeLogFile(logFilePath) {
  const resolvedPath = path.resolve(logFilePath);
  
  // Check if file exists
  try {
    await fs.promises.access(resolvedPath, fs.constants.F_OK);
  } catch (error) {
    console.error(`Log file does not exist: ${resolvedPath}`);
    throw new Error(`Log file does not exist: ${resolvedPath}`);
  }

  // Initialize statistics
  const stats = {
    totalLines: 0,
    errorCount: 0,
    warningCount: 0,
    infoCount: 0,
    debugCount: 0,
    errorTypes: {},
    timestamps: {
      first: null,
      last: null
    }
  };

  // Create readline interface to read the file line by line (using streams)
  const fileStream = fs.createReadStream(resolvedPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  // Process each line as it's read
  for await (const line of rl) {
    stats.totalLines++;
    
    // Parse the line to extract log level and other information
    const parsedLine = parseLogLine(line);
    
    if (parsedLine.level) {
      // Count log levels
      switch (parsedLine.level.toUpperCase()) {
        case 'ERROR':
          stats.errorCount++;
          break;
        case 'WARN':
        case 'WARNING':
          stats.warningCount++;
          break;
        case 'INFO':
          stats.infoCount++;
          break;
        case 'DEBUG':
          stats.debugCount++;
          break;
      }
      
      // Track specific error types
      if (parsedLine.level.toUpperCase() === 'ERROR' && parsedLine.message) {
        const errorType = extractErrorType(parsedLine.message);
        stats.errorTypes[errorType] = (stats.errorTypes[errorType] || 0) + 1;
      }
    }
    
    // Track timestamps
    if (parsedLine.timestamp) {
      if (!stats.timestamps.first) {
        stats.timestamps.first = parsedLine.timestamp;
      }
      stats.timestamps.last = parsedLine.timestamp;
    }
  }

  return stats;
}

/**
 * Parses a log line to extract log level, timestamp, and message
 * @param {string} line - A single line from the log file
 * @returns {Object} - Object containing level, timestamp, and message
 */
function parseLogLine(line) {
  // Common log formats regex patterns
  // Format 1: [TIMESTAMP] LEVEL: MESSAGE
  // Format 2: TIMESTAMP LEVEL MESSAGE
  // Format 3: ISO timestamp followed by level
  
  const patterns = [
    /\[(.*?)\].*?(INFO|WARN|WARNING|ERROR|DEBUG):?\s*(.*)/i,  // [TIMESTAMP] LEVEL: MESSAGE
    /(.*?)\s+(INFO|WARN|WARNING|ERROR|DEBUG)\s+(.*)/i,       // TIMESTAMP LEVEL MESSAGE
    /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d+Z?)\s+(INFO|WARN|WARNING|ERROR|DEBUG):\s+(.*)/i, // ISO timestamp
    /(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2})\s+(INFO|WARN|WARNING|ERROR|DEBUG):\s+(.*)/i, // YYYY-MM-DD HH:MM:SS
  ];
  
  for (const pattern of patterns) {
    const match = line.match(pattern);
    if (match) {
      return {
        timestamp: match[1],
        level: match[2],
        message: match[3]
      };
    }
  }
  
  // If no pattern matches, return the whole line as message with unknown level
  return {
    timestamp: null,
    level: null,
    message: line
  };
}

/**
 * Extracts error type from error message
 * @param {string} message - Error message
 * @returns {string} - Error type
 */
function extractErrorType(message) {
  // Look for common error patterns
  if (message.includes('TypeError')) return 'TypeError';
  if (message.includes('ReferenceError')) return 'ReferenceError';
  if (message.includes('SyntaxError')) return 'SyntaxError';
  if (message.includes('NetworkError')) return 'NetworkError';
  if (message.includes('ConnectionError')) return 'ConnectionError';
  if (message.includes('TimeoutError')) return 'TimeoutError';
  if (message.includes('PermissionDenied')) return 'PermissionDenied';
  if (message.includes('FileNotFound')) return 'FileNotFound';
  
  // Return generic error if no specific type found
  return 'GenericError';
}

/**
 * Generates a formatted summary report
 * @param {Object} stats - Statistics object from analyzeLogFile
 * @param {string} logFilePath - Path to the analyzed log file
 */
function generateReport(stats, logFilePath) {
  console.log('\n========== LOG ANALYSIS REPORT ==========');
  console.log(`Log File: ${logFilePath}`);
  console.log(`Analysis Time: ${new Date().toISOString()}`);
  console.log('========================================\n');
  
  console.log('SUMMARY STATISTICS:');
  console.log(`Total Lines Processed: ${stats.totalLines}`);
  console.log(`Error Count: ${stats.errorCount}`);
  console.log(`Warning Count: ${stats.warningCount}`);
  console.log(`Info Count: ${stats.infoCount}`);
  console.log(`Debug Count: ${stats.debugCount}`);
  
  console.log('\nTIME FRAME:');
  console.log(`First Entry: ${stats.timestamps.first || 'N/A'}`);
  console.log(`Last Entry: ${stats.timestamps.last || 'N/A'}`);
  
  if (Object.keys(stats.errorTypes).length > 0) {
    console.log('\nERROR TYPES BREAKDOWN:');
    for (const [errorType, count] of Object.entries(stats.errorTypes)) {
      console.log(`  ${errorType}: ${count}`);
    }
  }
  
  console.log('\n========================================');
  
  // Calculate error rate
  const errorRate = stats.totalLines > 0 ? ((stats.errorCount / stats.totalLines) * 100).toFixed(2) : 0;
  console.log(`Error Rate: ${errorRate}%`);
  
  if (errorRate > 10) {
    console.log('⚠️  High error rate detected! (>10%)');
  } else if (errorRate > 5) {
    console.log('⚠️  Moderate error rate detected! (>5%)');
  } else {
    console.log('✅  Acceptable error rate (<5%)');
  }
  
  console.log('========================================\n');
}

/**
 * Main function to run the log analyzer
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('Usage: node log-analyzer.js <path-to-log-file>');
    console.log('Example: node log-analyzer.js ./application.log');
    process.exit(1);
  }
  
  const logFilePath = args[0];
  
  try {
    console.log(`Analyzing log file: ${logFilePath}`);
    console.log('Processing... This may take a moment for large files.\n');
    
    const startTime = Date.now();
    const stats = await analyzeLogFile(logFilePath);
    const endTime = Date.now();
    
    generateReport(stats, logFilePath);
    console.log(`Analysis completed in ${(endTime - startTime) / 1000} seconds.`);
    
  } catch (error) {
    console.error('Error analyzing log file:', error.message);
    process.exit(1);
  }
}

// Export functions for testing purposes
module.exports = {
  analyzeLogFile,
  parseLogLine,
  extractErrorType,
  generateReport
};

// Run main function if this file is executed directly
if (require.main === module) {
  main();
}