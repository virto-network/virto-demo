import { startChopsticks } from './utils/chopsticks';
import { readFileSync } from 'fs';

module.exports = async () => {
  console.log('\nStarting Chopsticks for integration tests...\n');
  
  try {
    await startChopsticks();
    
    console.log('\nChopsticks setup complete\n');
  } catch (error) {
    console.error('\nFailed to start Chopsticks:', error);
    
    // Try to read and display chopsticks logs for debugging
    try {
      const logs = readFileSync('./chopsticks.log', 'utf-8');
      console.error('\nChopsticks stdout log:');
      console.error(logs);
    } catch (e) {
      console.error('Could not read chopsticks.log');
    }
    
    try {
      const errLogs = readFileSync('./chopsticks_err.log', 'utf-8');
      console.error('\nChopsticks stderr log:');
      console.error(errLogs);
    } catch (e) {
      console.error('Could not read chopsticks_err.log');
    }
    
    throw error;
  }
};


