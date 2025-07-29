import React from 'react';

interface BillFormProps {
  billPeriod: string;
  setBillPeriod: (value: string) => void;
  isLoading: boolean;
  error: string;
  onPay: () => void;
  onShowAdvanced: () => void;
}

const BillForm: React.FC<BillFormProps> = ({
  billPeriod,
  setBillPeriod,
  isLoading,
  onPay,
  onShowAdvanced
}) => {
  return (
    <div className="action-form">
      <div className="transfer-header">
        <div className="transfer-header-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
            <line x1="16" y1="2" x2="16" y2="6" />
            <line x1="8" y1="2" x2="8" y2="6" />
            <line x1="3" y1="10" x2="21" y2="10" />
            <path d="M8 14h.01" />
            <path d="M12 14h.01" />
            <path d="M16 14h.01" />
            <path d="M8 18h.01" />
            <path d="M12 18h.01" />
            <path d="M16 18h.01" />
          </svg>
        </div>
        <div className="transfer-header-text">
          <h4>Pay Service Bill</h4>
          <p>Batch payment + receipt record in one transaction</p>
        </div>
      </div>

      <div className="service-provider-info">
        <div className="provider-header">
          <div className="provider-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>
          <div className="provider-details">
            <h5>VirtoPower Energy Co.</h5>
            <p>Electric service provider</p>
          </div>
          <div className="bill-amount">0.1 PAS</div>
        </div>
      </div>

      <div className="bill-details">
        <div className="form-group">
          <virto-input
            type="text"
            placeholder="e.g., Jul 2025"
            label="Bill Period"
            value={billPeriod}
            onInput={(e: any) => setBillPeriod(e.target.value)}
          />
          <div className="input-help">
            This will be recorded on the blockchain as payment proof
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
          label={isLoading ? "Processing Payment..." : "Pay Bill & Record"}
          onClick={onPay}
          disabled={isLoading}
        />
      </div>
    </div>
  );
};

export default BillForm; 