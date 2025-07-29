import React, { useState, useEffect } from 'react';
import VirtoConnect from '@/components/VirtoConnect';
import type { User } from '@/types/auth.types';
import { Extrinsics } from '@/pages/Extrinsics';
import { Modal } from '@/components/Modal';
import { Binary } from 'polkadot-api';
import TransferForm from './TransferForm';
import MessageForm from './MessageForm';
import BillForm from './BillForm';
import NotificationContainer from '@/components/NotificationContainer';
import { useNotification } from '@/hooks/useNotification';
import Spinner from '@/components/Spinner';
import { useSpinner } from '@/hooks/useSpinner';
import Confetti from '@/components/Confetti';
import { useConfetti } from '@/hooks/useConfetti';

interface DemoTabProps {
  onAuthSuccess: (user: User) => void;
  onAuthError: (error: string) => void;
}

type ActionType = 'transfer-balance' | 'sign-extrinsic' | 'transfer' | null;

interface UserSession {
  username: string;
  address?: string;
  sdk?: any;
}

const DemoTab: React.FC<DemoTabProps> = ({ onAuthSuccess, onAuthError }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentAction, setCurrentAction] = useState<ActionType>(null);
  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [balance, setBalance] = useState<string>('Loading...');
  const [userAddress, setUserAddress] = useState<string>('Not connected');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const [transferRecipient, setTransferRecipient] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [message, setMessage] = useState('Hello, world!');
  const [billPeriod, setBillPeriod] = useState('Jul 2025');
  const [showExtrinsicsModal, setShowExtrinsicsModal] = useState(false);
  const [preConfiguredExtrinsic, setPreConfiguredExtrinsic] = useState<any>(null);

  const { notifications, showSuccessNotification, showErrorNotification, removeNotification } = useNotification();
  const { isSpinnerVisible, spinnerText, showSpinner, hideSpinner } = useSpinner();
  const { isConfettiVisible, showConfetti, hideConfetti } = useConfetti();

  useEffect(() => {
    if (customElements.get('virto-input') && customElements.get('virto-button')) {
      console.log('Web components already loaded');
      return;
    }

    const script = document.createElement('script');
    script.type = 'module';
    script.innerHTML = `
      import("https://cdn.jsdelivr.net/npm/virto-components@0.1.11/dist/virto-components.min.js")
        .then(() => {
          console.log('Virto components loaded successfully');
        })
        .catch(err => {
          console.error('Failed to load virto components:', err);
        });
    `;
    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  useEffect(() => {
    const virtoConnect = document.getElementById('virtoConnect') as any;
    
    if (!virtoConnect) return;

    const handleRegisterStart = () => showSpinner('Registering...');
    const handleLoginStart = () => showSpinner('Logging in...');
    const handleRegisterError = () => hideSpinner();
    const handleLoginError = () => hideSpinner();
    const handleRegisterSuccess = () => hideSpinner();
    const handleLoginSuccess = () => hideSpinner();

    virtoConnect.addEventListener('register-start', handleRegisterStart);
    virtoConnect.addEventListener('login-start', handleLoginStart);
    virtoConnect.addEventListener('register-error', handleRegisterError);
    virtoConnect.addEventListener('login-error', handleLoginError);
    virtoConnect.addEventListener('register-success', handleRegisterSuccess);
    virtoConnect.addEventListener('login-success', handleLoginSuccess);

    return () => {
      virtoConnect.removeEventListener('register-start', handleRegisterStart);
      virtoConnect.removeEventListener('login-start', handleLoginStart);
      virtoConnect.removeEventListener('register-error', handleRegisterError);
      virtoConnect.removeEventListener('login-error', handleLoginError);
      virtoConnect.removeEventListener('register-success', handleRegisterSuccess);
      virtoConnect.removeEventListener('login-success', handleLoginSuccess);
    };
  }, [showSpinner, hideSpinner]);

  const handleAuthSuccess = (event: any) => {
    const username = event.username;
    const address = event.address;

    console.log('Login successful:', { username, address });

    const virtoConnect = document.getElementById('virtoConnect') as any;

    setUserSession({
      username,
      address,
      sdk: virtoConnect?.sdk
    });
    virtoConnect?.close();

    setIsAuthenticated(true);
    setCurrentAction(null);

    if (virtoConnect?.sdk) {
      loadBalance(virtoConnect.sdk);
    }

    showSuccessNotification("Welcome back!", "You're now connected to Virto. Choose an action below to get started.");

    const user = {
      profile: {
        id: username,
        name: username,
        displayName: username
      },
      metadata: {}
    };
    onAuthSuccess(user);
  };

  const handleAuthError = (error: string) => {
    console.error('Authentication error:', error);
    setError(error);
    onAuthError(error);
  };

  const loadBalance = async (sdk: any) => {
    if (!sdk || !userSession) return;

    try {
      setBalance('Loading...');

      const userAddr = sdk.transfer.getAddressFromAuthenticator(sdk.auth.passkeysAuthenticator);
      setUserAddress(userAddr);

      const balanceData = await sdk.transfer.getBalance(userAddr);
      const balanceFormatted = sdk.transfer.formatAmount(balanceData.transferable);
      setBalance(`${balanceFormatted} PAS`);
    } catch (error) {
      console.error('Balance loading failed:', error);
      setBalance('Error loading balance');
      setUserAddress('Error loading');
      showErrorNotification("Balance Error", "Failed to load balance. Please try again.");
    }
  };

  const handleActionClick = (action: ActionType) => {
    setCurrentAction(action);
    setError('');

    if (action === 'transfer-balance') {
      const virtoConnect = document.getElementById('virtoConnect') as any;
      if (virtoConnect?.sdk) {
        loadBalance(virtoConnect.sdk);
      }
    }
  };

  const goBackToShortcuts = () => {
    setCurrentAction(null);
    setError('');
    setTransferRecipient('');
    setTransferAmount('');
    setMessage('Hello, world!');
    setBillPeriod('Jul 2025');
  };

  const handleTransferBalance = async () => {
    console.log("userSession", userSession)
    console.log("transferRecipient", transferRecipient)
    console.log("transferAmount", transferAmount)
    if (!userSession?.sdk || !transferRecipient.trim() || !transferAmount.trim()) {
      setError('Please fill in all fields');
      return;
    }

    const amount = parseFloat(transferAmount);
    if (amount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }

    setIsLoading(true);
    setError('');
    showSpinner('Processing transfer...');

    try {
      const sdk = userSession.sdk;
      let destinationAddress = transferRecipient;

      try {
        const resolvedAddress = await sdk.transfer.resolveUsernameToAddress(transferRecipient);
        if (resolvedAddress) {
          destinationAddress = resolvedAddress;
        }
      } catch (error) {
        console.log(`Could not resolve username "${transferRecipient}", treating as address`);
      }

      if (!sdk.transfer.isValidAddress(destinationAddress)) {
        setError('Invalid destination address format');
        return;
      }

      const amountInPlanck = sdk.transfer.parseAmount(transferAmount);
      const userAddr = sdk.transfer.getAddressFromAuthenticator(sdk.auth.passkeysAuthenticator);
      const balanceData = await sdk.transfer.getBalance(userAddr);

      if (balanceData.transferable < amountInPlanck) {
        setError(`Insufficient balance. You have ${sdk.transfer.formatAmount(balanceData.transferable)} PAS`);
        return;
      }

      console.log('Transfer details:', {
        dest: destinationAddress,
        value: amountInPlanck
      });

      const transferResult = await sdk.transfer.send(
        sdk.auth.sessionSigner,
        {
          dest: destinationAddress,
          value: amountInPlanck,
        }
      );

      if (transferResult.success) {
        console.log('Transfer successful:', transferResult);
        setTransferRecipient('');
        setTransferAmount('');
        loadBalance(sdk);
        goBackToShortcuts();
        showSuccessNotification(
          "Transfer Completed Successfully!", 
          `${transferAmount} PAS has been sent to ${transferRecipient}. Transaction Hash: ${transferResult.hash}`
        );
        showConfetti();
      } else {
        const errorMsg = `Transfer failed: ${transferResult.error}`;
        setError(errorMsg);
        showErrorNotification("Transfer Failed", errorMsg);
      }
    } catch (error: any) {
      console.error('Transfer failed:', error);
      const errorMsg = `Transfer failed: ${error.message || 'Please try again'}`;
      setError(errorMsg);
      showErrorNotification("Transfer Failed", errorMsg);
    } finally {
      setIsLoading(false);
      hideSpinner();
    }
  };

  const handleSaveMessage = async () => {
    if (!userSession?.sdk || !message.trim()) {
      setError('Please enter a message to save');
      return;
    }

    setIsLoading(true);
    setError('');
    showSpinner('Saving message...');

    try {
      const sdk = userSession.sdk;

      const result = await sdk.system.makeRemark(
        sdk.auth.sessionSigner,
        { message: message.trim() }
      );

      if (result.success) {
        console.log('Message saved successfully:', result);
        setMessage('Hello, world!');
        goBackToShortcuts();
        showSuccessNotification(
          "Message Saved Successfully!", 
          `Your message "${message}" has been permanently saved on the blockchain. Transaction Hash: ${result.hash}`
        );
        showConfetti();
      } else {
        const errorMsg = `Failed to save message: ${result.error}`;
        setError(errorMsg);
        showErrorNotification("Save Failed", errorMsg);
      }
    } catch (error: any) {
      console.error('Save message failed:', error);
      const errorMsg = `Failed to save message: ${error.message || 'Please try again'}`;
      setError(errorMsg);
      showErrorNotification("Save Failed", errorMsg);
    } finally {
      setIsLoading(false);
      hideSpinner();
    }
  };

  const handlePayServiceBill = async () => {
    if (!userSession?.sdk || !billPeriod.trim()) {
      setError('Please enter the bill period');
      return;
    }

    setIsLoading(true);
    setError('');
    showSpinner('Processing payment...');

    try {
      const sdk = userSession.sdk;
      const powerCompanyAddress = "5DS4XWXWzAimdj8GR5w1ZepsUZUUPN96YxL8LEaWa3GRUKfC";
      const billAmount = "0.1";
      const amountInPlanck = sdk.transfer.parseAmount(billAmount);

      const transferExtrinsic = await sdk.transfer.createTransferExtrinsic({
        dest: powerCompanyAddress,
        value: amountInPlanck
      });

      const remarkExtrinsic = await sdk.system.createRemarkExtrinsic({
        message: billPeriod.trim()
      });

      const batchResult = await sdk.utility.batchAll(
        sdk.auth.sessionSigner,
        {
          calls: [transferExtrinsic, remarkExtrinsic]
        }
      );

      if (batchResult.success) {
        console.log('Batch payment successful:', batchResult);
        setBillPeriod('Jul 2025');
        goBackToShortcuts();
        showSuccessNotification(
          "Payment Completed Successfully!", 
          `Bill payment of 0.1 PAS to VirtoPower Energy Co. has been processed and recorded for ${billPeriod}. Transaction Hash: ${batchResult.hash}`
        );
        showConfetti();
      } else {
        const errorMsg = `Payment failed: ${batchResult.error}`;
        setError(errorMsg);
        showErrorNotification("Payment Failed", errorMsg);
      }
    } catch (error: any) {
      console.error('Batch payment failed:', error);
      const errorMsg = `Payment failed: ${error.message || 'Please try again'}`;
      setError(errorMsg);
      showErrorNotification("Payment Failed", errorMsg);
    } finally {
      setIsLoading(false);
      hideSpinner();
    }
  };

  const handleShowAdvancedTransfer = () => {
    const sdk = userSession?.sdk;

    if (!sdk) {
      setError('Please connect to Virto first');
      return;
    }
    
    if (!transferRecipient.trim() || !transferAmount.trim()) {
      setError('Please fill in recipient and amount first');
      return;
    }

    const extrinsicConfig = {
      pallet: 'Balances',
      method: 'transfer_keep_alive',
      args: {
        dest: transferRecipient,
        value: sdk.transfer.parseAmount(transferAmount)
      }
    };

    setPreConfiguredExtrinsic(extrinsicConfig);
    setShowExtrinsicsModal(true);
    setError('');
  };

  const handleShowAdvancedRemark = () => {
    if (!message.trim()) {
      setError('Please enter a message first');
      return;
    }
    
    const extrinsicConfig = {
      pallet: 'System',
      method: 'remark',
      args: {
        remark: Binary.fromText(message.trim())
      }
    };

    setPreConfiguredExtrinsic(extrinsicConfig);
    setShowExtrinsicsModal(true);
    setError('');
  };

  const handleShowAdvancedBatch = async () => {
    const sdk = userSession?.sdk;

    if (!sdk) {
      setError('Please connect to Virto first');
      return;
    }

    if (!billPeriod.trim()) {
      setError('Please enter the bill period first');
      return;
    }

    const transferExtrinsic = await sdk.transfer.createTransferExtrinsic({
      dest: '5DS4XWXWzAimdj8GR5w1ZepsUZUUPN96YxL8LEaWa3GRUKfC',
      value: sdk.transfer.parseAmount('0.1')
    });

    const remarkExtrinsic = await sdk.system.createRemarkExtrinsic({
      message: billPeriod.trim()
    });

    const callsData = [
      transferExtrinsic,
      remarkExtrinsic
    ].map(call => {
      if (call && call.decodedCall) {
        console.log("Extracted call:", call.decodedCall);
        return call.decodedCall;
      }
      throw new Error("Invalid call format - missing decodedCall");
    });

    const extrinsicConfig = {
      pallet: 'Utility',
      method: 'batch_all',
      args: {
        calls: callsData
      }
    };

    setPreConfiguredExtrinsic(extrinsicConfig);
    setShowExtrinsicsModal(true);
    setError('');
  };

  const handleExtrinsicChange = (extrinsicData: {
    pallet: string;
    method: string;
    args: Record<string, any>;
  }) => {
    const sdk = userSession?.sdk;
    if (!sdk) {
      setError('Please connect to Virto first');
      return;
    }

    console.log('Extrinsic changed in DemoTab:', extrinsicData);
    
    if (extrinsicData.pallet === 'Balances' && extrinsicData.method === 'transfer_keep_alive') {
      setTransferRecipient(extrinsicData.args.dest || '');
      setTransferAmount(sdk.transfer.formatAmount(extrinsicData.args.value) || '');
    } else if (extrinsicData.pallet === 'System' && extrinsicData.method === 'remark') {
      const remark = extrinsicData.args.remark.asText();
      console.log("remark", remark)
      console.log("typeof remark", typeof remark)
      if (typeof remark === 'string') {
        setMessage(remark);
      } else if (remark && typeof remark === 'object' && 'value' in remark) {
        setMessage(remark.value || '');
      }
    } else if (extrinsicData.pallet === 'Utility' && extrinsicData.method === 'batch_all') {
      console.log('Batch extrinsic changed:', extrinsicData);
      
      if (extrinsicData.args.calls && Array.isArray(extrinsicData.args.calls)) {
        extrinsicData.args.calls.forEach((call: any, index: number) => {
          console.log(`Processing call ${index}:`, call);
          
          if (call.type === 'Balances' && call.value.type === 'transfer_keep_alive') {
            const transferArgs = call.value.value;
            setTransferRecipient(transferArgs.dest?.value || transferArgs.dest || '');
            setTransferAmount(sdk.transfer.formatAmount(transferArgs.value) || '');
            console.log('Updated transfer data from batch:', {
              dest: transferArgs.dest?.value || transferArgs.dest,
              value: transferArgs.value
            });
          }
          
          if (call.type === 'System' && call.value.type === 'remark_with_event') {
            const remarkArgs = call.value.value;
            let remarkText = '';
            
            if (remarkArgs.remark && typeof remarkArgs.remark.asText === 'function') {
              remarkText = remarkArgs.remark.asText();
            } else if (typeof remarkArgs.remark === 'string') {
              remarkText = remarkArgs.remark;
            } else if (remarkArgs.remark && typeof remarkArgs.remark === 'object' && 'value' in remarkArgs.remark) {
              remarkText = remarkArgs.remark.value || '';
            }
            
            setMessage(remarkText);
            setBillPeriod(remarkText);
            console.log('Updated message and billPeriod from batch:', remarkText);
          }
        });
      }
    }
  };

  return (
    <div id="demo-tab" className="tab-content">
      <div className="actions-section-container">
        {!isAuthenticated && (
          <div className="how-it-works">
            <h4 className="section-title">How it works</h4>
            <div className="steps-flow">
              <div className="step-item">
                <div className="step-circle">1</div>
                <div className="step-content">
                  <h5>Connect</h5>
                  <p>Click "Connect to Virto" to register or sign in</p>
                </div>
              </div>
              <div className="step-arrow">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                  strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="M12 5l7 7-7 7" />
                </svg>
              </div>
              <div className="step-item">
                <div className="step-circle">2</div>
                <div className="step-content">
                  <h5>Authenticate</h5>
                  <p>Use your passkey or biometric to sign in securely</p>
                </div>
              </div>
              <div className="step-arrow">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                  strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="M12 5l7 7-7 7" />
                </svg>
              </div>
              <div className="step-item">
                <div className="step-circle">3</div>
                <div className="step-content">
                  <h5>Start Using</h5>
                  <p>Transfer tokens, sign transactions, and more</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!isAuthenticated && (
          <div id="connect-section">
            <p className="connect-instruction">
              Click the button below to open the Virto Connect dialog and start using the available features
            </p>
            <div className="button-wrapper">
            </div>
          </div>
        )}

        <div style={{ display: isAuthenticated ? 'none' : 'block' }}>
          <VirtoConnect
            serverUrl = 'http://localhost:3000/api'
            providerUrl="ws://localhost:21000"
            onAuthSuccess={handleAuthSuccess}
            onAuthError={handleAuthError}
          />
        </div>

        {isAuthenticated && currentAction === null && (
          <div id="extrinsic-section">
            <div className="actions-section-wrapper">
              <div className="actions-header">
                <h4 className="actions-title">What would you like to do?</h4>
                <p className="actions-subtitle">Choose an action to get started</p>
              </div>
              <div id="shortcuts-section" className="shortcuts-container">
                <div className="shortcuts-grid">
                  <div className="shortcut-card" onClick={() => handleActionClick('transfer-balance')}>
                    <div className="shortcut-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round">
                        <path d="M7 17l9.2-9.2M17 17H7v-10" />
                      </svg>
                    </div>
                    <h5>Transfer Balance</h5>
                    <p>Send PAS tokens to another person</p>
                  </div>

                  <div className="shortcut-card" onClick={() => handleActionClick('sign-extrinsic')}>
                    <div className="shortcut-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
                      </svg>
                    </div>
                    <h5>Save Message to Blockchain</h5>
                    <p>Store your custom message on the blockchain</p>
                  </div>

                  <div className="shortcut-card" onClick={() => handleActionClick('transfer')}>
                    <div className="shortcut-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                        strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                        <path d="M8 14h.01" />
                        <path d="M12 14h.01" />
                        <path d="M16 14h.01" />
                      </svg>
                    </div>
                    <h5>Pay Service Bill</h5>
                    <p>Batch payment with blockchain receipt</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {isAuthenticated && currentAction !== null && (
          <div id="form-section" className="form-container">
            <div className="form-header">
              <button className="back-button" onClick={goBackToShortcuts}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                  strokeLinejoin="round">
                  <path d="M19 12H5" />
                  <path d="M12 19l-7-7 7-7" />
                </svg>
                Back
              </button>
              <h4 style={{ color: 'var(--dark-green)', margin: 0 }}>
                {currentAction === 'transfer-balance' && 'Transfer Balance'}
                {currentAction === 'sign-extrinsic' && 'Save Message to Blockchain'}
                {currentAction === 'transfer' && 'Pay Service Bill'}
              </h4>
            </div>

            {error && (
              <div className="error-message" style={{ display: 'block', marginBottom: '15px' }}>
                {error}
              </div>
            )}

            {currentAction === 'transfer-balance' && (
              <TransferForm
                transferRecipient={transferRecipient}
                setTransferRecipient={setTransferRecipient}
                transferAmount={transferAmount}
                setTransferAmount={setTransferAmount}
                balance={balance}
                userAddress={userAddress}
                isLoading={isLoading}
                error={error}
                onTransfer={handleTransferBalance}
                onShowAdvanced={handleShowAdvancedTransfer}
              />
            )}

            {currentAction === 'sign-extrinsic' && (
              <MessageForm
                message={message}
                setMessage={setMessage}
                isLoading={isLoading}
                error={error}
                onSave={handleSaveMessage}
                onShowAdvanced={handleShowAdvancedRemark}
              />
            )}

            {currentAction === 'transfer' && (
              <BillForm
                billPeriod={billPeriod}
                setBillPeriod={setBillPeriod}
                isLoading={isLoading}
                error={error}
                onPay={handlePayServiceBill}
                onShowAdvanced={handleShowAdvancedBatch}
              />
            )}
          </div>
        )}

        <Modal
          open={showExtrinsicsModal}
          onClose={() => setShowExtrinsicsModal(false)}
          useNative={false}
          title={
            <div className="flex flex-col">
              <span className="font-semibold">Vista Avanzada</span>
            </div>
          }
          className="w-[90vw] h-[80vh] max-w-7xl"
        >
          <div className="w-full h-full bg-background flex flex-col">
            <div className="flex-1 overflow-auto relative">
              <div className="max-w-(--breakpoint-xl) m-auto">
                <Extrinsics 
                  {...({ preConfigured: preConfiguredExtrinsic } as any)} 
                  onExtrinsicChange={handleExtrinsicChange}
                />
              </div>
            </div>
          </div>
        </Modal>
      </div>
          
      <NotificationContainer
        notifications={notifications}
        onRemoveNotification={removeNotification}
      />
      
      <Spinner
        isVisible={isSpinnerVisible}
        text={spinnerText}
      />
      
      <Confetti
        isVisible={isConfettiVisible}
        onComplete={hideConfetti}
      />
    </div>
  );
};

export default DemoTab; 