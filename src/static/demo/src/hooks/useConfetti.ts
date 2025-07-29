import { useState, useCallback } from 'react';

export const useConfetti = () => {
  const [isConfettiVisible, setIsConfettiVisible] = useState(false);

  const showConfetti = useCallback(() => {
    setIsConfettiVisible(true);
  }, []);

  const hideConfetti = useCallback(() => {
    setIsConfettiVisible(false);
  }, []);

  return {
    isConfettiVisible,
    showConfetti,
    hideConfetti
  };
}; 