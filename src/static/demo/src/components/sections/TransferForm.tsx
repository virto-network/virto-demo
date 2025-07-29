import React from 'react';

interface TransferFormProps {
  transferRecipient: string;
  setTransferRecipient: (value: string) => void;
  transferAmount: string;
  setTransferAmount: (value: string) => void;
  balance: string;
  userAddress: string;
  isLoading: boolean;
  error: string;
  onTransfer: () => void;
  onShowAdvanced: () => void;
}

const TransferForm: React.FC<TransferFormProps> = ({
  transferRecipient,
  setTransferRecipient,
  transferAmount,
  setTransferAmount,
  balance,
  userAddress,
  isLoading,
  onTransfer,
  onShowAdvanced
}) => {
  return (
    <div className="action-form">
      <div className="balance-info">
        <div className="balance-card">
          <div className="balance-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className="balance-details">
            <h5>Available Balance</h5>
            <p className="balance-amount">{balance}</p>
            <p className="balance-address">Address: {userAddress}</p>
          </div>
        </div>
      </div>

      <div className="bill-details">
        <div className="form-group">
          <virto-input
            type="text"
            label="Recipient"
            placeholder="Enter username (alice, bob) or full address"
            value={transferRecipient}
            onInput={(e: any) => setTransferRecipient(e.target.value)}
          />
          <div className="input-help">
            You can use usernames like "alice" or "bob", or paste a full wallet address
          </div>
        </div>

        <div className="form-group">
          <virto-input
            type="text"
            placeholder="0.00"
            label="Amount (PAS)"
            value={transferAmount}
            onInput={(e: any) => setTransferAmount(e.target.value)}
          />
          <div className="input-help">
            Enter the amount of PAS tokens to transfer
          </div>
        </div>
      </div>

      <div className="advanced-link-section">
        <span>Want to see the raw transaction? </span>
        <button
          className="tertiary-button"
          onClick={onShowAdvanced}
          disabled={isLoading}
        >
          View Advanced
        </button>
      </div>
      
      <div className="button-wrapper">
        <virto-button
          label={isLoading ? "Sending..." : "Send PAS Tokens"}
          onClick={onTransfer}
          disabled={isLoading}
        />
      </div>
    </div>
  );
};

export default TransferForm; 