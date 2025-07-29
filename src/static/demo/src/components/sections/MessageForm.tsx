import React from 'react';

interface MessageFormProps {
  message: string;
  setMessage: (value: string) => void;
  isLoading: boolean;
  error: string;
  onSave: () => void;
  onShowAdvanced: () => void;
}

const MessageForm: React.FC<MessageFormProps> = ({
  message,
  setMessage,
  isLoading,
  onSave,
  onShowAdvanced
}) => {
  return (
    <div className="action-form">
      <div className="bill-details">
        <div className="form-group">
          <virto-input
            type="text"
            placeholder="Enter your message to save on blockchain"
            label="Your Message"
            value={message}
            onInput={(e: any) => setMessage(e.target.value)}
          />
          <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '8px', marginBottom: 0 }}>
            This message will be permanently stored on the blockchain and can be viewed by anyone.
          </p>
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
          label={isLoading ? "Saving..." : "Save Message"}
          onClick={onSave}
          disabled={isLoading}
        />
      </div>
    </div>
  );
};

export default MessageForm; 