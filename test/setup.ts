import { startChopsticks } from './utils/chopsticks';

module.exports = async () => {
  console.log('\nStarting Chopsticks for integration tests...\n');
  
  try {
    await startChopsticks();
    
    console.log('\nChopsticks setup complete\n');
  } catch (error) {
    console.error('\nFailed to start Chopsticks:', error);
    throw error;
  }
};


