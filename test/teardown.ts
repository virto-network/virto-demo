import { stopChopsticks } from './utils/chopsticks';

module.exports = async () => {
  console.log('\nStopping Chopsticks...\n');
  
  try {
    setTimeout(() => {
      stopChopsticks();
      console.log('\nChopsticks stopped successfully\n');
    }, 60000);
  } catch (error) {
    console.error('\nError stopping Chopsticks:', error);
  }
};
