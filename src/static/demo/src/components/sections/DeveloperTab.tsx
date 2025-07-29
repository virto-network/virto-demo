import React, { useState, useEffect } from 'react';

interface ColorValues {
  green: string;
  'dark-green': string;
  'light-green': string;
  'extra-light-green': string;
  text: string;
}

interface FontValues {
  primary: string;
  secondary: string;
}

const DeveloperTab: React.FC = () => {
  const [colors, setColors] = useState<ColorValues>({
    green: '#24AF37',
    'dark-green': '#006B0A',
    'light-green': '#90EE90',
    'extra-light-green': '#DDFBE0',
    text: '#2F4F4F'
  });

  const [fonts, setFonts] = useState<FontValues>({  
    primary: 'Outfit, sans-serif',
    secondary: 'Plus Jakarta, sans-serif'
  });

  const fontOptions = [
    'Outfit, sans-serif',
    'Inter, sans-serif', 
    'Roboto, sans-serif',
    'Arial, sans-serif',
    'Georgia, serif',
    "'Times New Roman', serif"
  ];

  const secondaryFontOptions = [
    'Plus Jakarta, sans-serif',
    'Inter, sans-serif',
    'Roboto, sans-serif', 
    'Arial, sans-serif',
    'Georgia, serif',
    "'Times New Roman', serif"
  ];

  const updateCSSVariable = (variable: string, value: string) => {
    document.documentElement.style.setProperty(variable, value);
  };

  const generateCSSOutput = () => {
    const cssVariables = {
      '--green': colors.green,
      '--dark-green': colors['dark-green'],
      '--lightgreen': colors['light-green'],
      '--extra-light-green': colors['extra-light-green'],
      '--darkslategray': colors.text,
      '--font-primary': fonts.primary,
      '--font-secondary': fonts.secondary
    };

    return `:root {\n${Object.entries(cssVariables)
      .map(([key, value]) => `  ${key}: ${value};`)
      .join('\n')}\n}`;
  };

  const handleColorChange = (colorKey: keyof ColorValues, value: string) => {
    const newColors = { ...colors, [colorKey]: value };
    setColors(newColors);
    
    const cssVarMap: Record<keyof ColorValues, string> = {
      green: '--green',
      'dark-green': '--dark-green',
      'light-green': '--lightgreen',
      'extra-light-green': '--extra-light-green',
      text: '--darkslategray'
    };
    updateCSSVariable(cssVarMap[colorKey], value);
  };

  const handleFontChange = (fontKey: keyof FontValues, value: string) => {
    const newFonts = { ...fonts, [fontKey]: value };
    setFonts(newFonts);
    
    const cssVarMap: Record<keyof FontValues, string> = {
      primary: '--font-primary',
      secondary: '--font-secondary'
    };
    updateCSSVariable(cssVarMap[fontKey], value);
  };

  const copyCSSToClipboard = () => {
    const cssOutput = generateCSSOutput();
    navigator.clipboard.writeText(cssOutput).then(() => {
      console.log('CSS copied to clipboard');
    });
  };

  const resetToDefaults = () => {
    const defaultColors: ColorValues = {
      green: '#24AF37',
      'dark-green': '#006B0A',
      'light-green': '#90EE90',
      'extra-light-green': '#DDFBE0',
      text: '#2F4F4F'
    };
    
    const defaultFonts: FontValues = {
      primary: 'Outfit, sans-serif',
      secondary: 'Plus Jakarta, sans-serif'
    };

    setColors(defaultColors);
    setFonts(defaultFonts);

    updateCSSVariable('--green', defaultColors.green);
    updateCSSVariable('--dark-green', defaultColors['dark-green']);
    updateCSSVariable('--lightgreen', defaultColors['light-green']);
    updateCSSVariable('--extra-light-green', defaultColors['extra-light-green']);
    updateCSSVariable('--darkslategray', defaultColors.text);
    updateCSSVariable('--font-primary', defaultFonts.primary);
    updateCSSVariable('--font-secondary', defaultFonts.secondary);
  };

  const openPreviewConnect = () => {
    const previewConnect = document.getElementById('previewVirtoConnect') as any;
    if (previewConnect && typeof previewConnect.open === 'function') {
      previewConnect.open();
    }
  };

  useEffect(() => {
    updateCSSVariable('--green', colors.green);
    updateCSSVariable('--dark-green', colors['dark-green']);
    updateCSSVariable('--lightgreen', colors['light-green']);
    updateCSSVariable('--extra-light-green', colors['extra-light-green']);
    updateCSSVariable('--darkslategray', colors.text);
    updateCSSVariable('--font-primary', fonts.primary);
    updateCSSVariable('--font-secondary', fonts.secondary);
  }, []);

  return (
  <div id="developer-tab" className="tab-content">
    <div className="developer-layout">
      <div className="customization-panel">
        <h2>Customize Virto Connect</h2>
          
        <div className="customization-section">
          <h3>Colors</h3>
          <div className="section-content">
              {Object.entries(colors).map(([colorKey, colorValue]) => (
                <div className="control-group" key={colorKey}>
                  <label>{colorKey.replace(/-/g, ' ')} Color</label>
                <div className="color-input-group">
                    <input 
                      type="color" 
                      className="color-picker" 
                      value={colorValue}
                      onChange={(e) => handleColorChange(colorKey as keyof ColorValues, e.target.value)}
                    />
                    <input 
                      type="text" 
                      className="color-value" 
                      value={colorValue}
                      onChange={(e) => handleColorChange(colorKey as keyof ColorValues, e.target.value)}
                    />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="customization-section">
          <h3>Typography</h3>
          <div className="section-content">
            <div className="control-group">
              <label>Primary Font Family</label>
                <select 
                  className="font-select" 
                  value={fonts.primary}
                  onChange={(e) => handleFontChange('primary', e.target.value)}
                >
                  {fontOptions.map(opt => (
                  <option key={opt} value={opt}>{opt.split(',')[0]}</option>
                ))}
              </select>
            </div>
            <div className="control-group">
              <label>Secondary Font Family</label>
                <select 
                  className="font-select"
                  value={fonts.secondary}
                  onChange={(e) => handleFontChange('secondary', e.target.value)}
                >
                  {secondaryFontOptions.map(opt => (
                  <option key={opt} value={opt}>{opt.split(',')[0]}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="customization-section">
          <h3>CSS Variables</h3>
            <div className="css-output">
              <pre>{generateCSSOutput()}</pre>
            </div>
          <div className="css-buttons">
              <button className="copy-button" onClick={copyCSSToClipboard}>
                Copy CSS
              </button>
              <button className="reset-button" onClick={resetToDefaults}>
                Reset to Default
              </button>
          </div>
        </div>
      </div>

      <div className="preview-panel">
        <h3>Live Preview</h3>
        <div className="theme-preview-card">
          <h4 className="theme-preview-title">Current Theme</h4>
          <div className="color-palette-grid">
            <div className="color-palette-item">
                <div className="color-swatch primary" style={{ backgroundColor: colors.green }}></div>
              <span className="color-label">Primary</span>
            </div>
            <div className="color-palette-item">
                <div className="color-swatch dark" style={{ backgroundColor: colors['dark-green'] }}></div>
              <span className="color-label">Dark</span>
            </div>
            <div className="color-palette-item">
                <div className="color-swatch light" style={{ backgroundColor: colors['light-green'] }}></div>
              <span className="color-label">Light</span>
            </div>
          </div>
          <div className="typography-preview">
              <p className="typography-primary" style={{ fontFamily: fonts.primary }}>Primary Font</p>
              <p className="typography-secondary" style={{ fontFamily: fonts.secondary }}>Secondary Font Preview</p>
          </div>
        </div>
        <div className="interactive-components">
          <h4>Interactive Components</h4>
          <div className="button-variations">
            <virto-button label="Primary Button" id="preview-button-primary" />
              <virto-button label="Connect Dialog" id="preview-connect-button" onClick={openPreviewConnect} />
          </div>
          <div className="form-elements">
            <virto-input type="text" placeholder="Username" />
          </div>
        </div>

        <div className="integration-section">
          <div className="integration-header">
            <h4 className="integration-title">Integration Code</h4>
          </div>
          <p className="integration-description">Copy and paste this code into your HTML:</p>
          <div className="code-block">
            <pre>&lt;virto-connect id="virtoConnect"&gt;&lt;/virto-connect&gt;</pre>
          </div>
          <div className="integration-buttons">
            <button className="copy-code-btn" onClick={() => navigator.clipboard.writeText('<virto-connect id="virtoConnect"></virto-connect>')}>Copy Code</button>
            <button className="docs-btn" onClick={() => window.open('https://ailens-organization.gitbook.io/virto-connect', '_blank')}>Documentation</button>
          </div>
        </div>

        <div className="live-indicator">
          <div className="live-indicator-badge">
            <div className="live-dot"></div>
            <span className="live-text">Live Preview Active</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

export default DeveloperTab; 