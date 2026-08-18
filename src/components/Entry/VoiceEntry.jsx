import React, { useState, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';
import { Mic, MicOff, X } from 'lucide-react';

// Hindi number words mapping
const HINDI_NUMBERS = {
  'ek': 1, 'एक': 1, 'one': 1,
  'dedh': 1.5, 'डेढ़': 1.5, 'derh': 1.5,
  'do': 2, 'दो': 2, 'two': 2,
  'dhai': 2.5, 'ढाई': 2.5, 'adhai': 2.5,
  'teen': 3, 'तीन': 3, 'three': 3,
  'char': 4, 'चार': 4, 'four': 4,
  'paanch': 5, 'पांच': 5, 'five': 5,
  'aadha': 0.5, 'आधा': 0.5, 'half': 0.5,
  'paav': 0.25, 'पाव': 0.25, 'quarter': 0.25,
};

function parseVoiceCommand(transcript) {
  const text = transcript.toLowerCase().trim();
  
  // Check for "no" responses first
  const noPatterns = [
    'nahi', 'nhi', 'no', 'naa', 'mat', 'nahin', 'cancel', 'band',
    'nahi aaya', 'nahi diya', 'aaj nahi', 'naa bhai',
    'नहीं', 'ना', 'मत',
  ];
  for (const pat of noPatterns) {
    if (text.includes(pat)) {
      return { action: 'no' };
    }
  }

  // Try to extract quantity
  let quantity = null;

  // Check for "X litre" or "X liter" patterns
  const litreMatch = text.match(/(\d+\.?\d*)\s*(litre|liter|ltr|l\b|लीटर)/i);
  if (litreMatch) {
    quantity = parseFloat(litreMatch[1]);
  }

  // Check Hindi number words
  if (!quantity) {
    for (const [word, val] of Object.entries(HINDI_NUMBERS)) {
      if (text.includes(word)) {
        quantity = val;
        break;
      }
    }
  }

  // Check for plain numbers (e.g. "2", "1.5")
  if (!quantity) {
    const numMatch = text.match(/(\d+\.?\d*)/);
    if (numMatch) {
      quantity = parseFloat(numMatch[1]);
    }
  }

  // Check for "yes" / affirmative patterns
  const yesPatterns = [
    // Direct milk references
    'doodh', 'milk', 'dudh', 'दूध',
    // Came / delivered
    'aaya', 'aagaya', 'aa gaya', 'aai', 'aa gayi', 'आया', 'आ गया',
    // Given / left
    'diya', 'de gaya', 'degaya', 'de diya', 'dediya', 'deke gaya',
    'de gaya hai', 'de gayi', 'de gayi hai', 'दिया', 'दे गया',
    // Affirmative
    'haan', 'ha', 'yes', 'ok', 'okay', 'haa', 'ji', 'ji haan',
    'हां', 'हाँ', 'जी', 'जी हां',
    // Add / save
    'add', 'save', 'dal', 'daal', 'daaldo', 'daal do', 'dal do',
    'add kar', 'add karo', 'add kar do', 'kar do', 'kardo',
    'laga do', 'lagado', 'likh do', 'likhdo', 'enter',
    'डाल दो', 'जोड़ दो', 'लिख दो',
    // Today
    'aaj', 'today', 'आज',
  ];
  for (const pat of yesPatterns) {
    if (text.includes(pat)) {
      return { action: 'yes', quantity };
    }
  }

  // If we found a quantity, assume yes
  if (quantity) {
    return { action: 'yes', quantity };
  }

  // Couldn't parse
  return { action: 'unknown', raw: text };
}

const VoiceEntry = forwardRef(function VoiceEntry({ currentProvider, onSave }, ref) {
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState('idle'); // 'idle' | 'listening' | 'processing' | 'success' | 'error'
  const [statusText, setStatusText] = useState('');
  const [showOverlay, setShowOverlay] = useState(false);
  const recognitionRef = useRef(null);

  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const handleResult = useCallback((transcript) => {
    setStatus('processing');
    setStatusText(`"${transcript}"`);

    const command = parseVoiceCommand(transcript);

    if (command.action === 'no') {
      setStatus('success');
      setStatusText('Thik hai, skip kiya! 👍');
      setTimeout(() => { setShowOverlay(false); setStatus('idle'); }, 1500);
      return;
    }

    if (command.action === 'yes') {
      if (!currentProvider) {
        setStatus('error');
        setStatusText('Pehle provider set karo!');
        setTimeout(() => { setStatus('idle'); }, 2000);
        return;
      }

      const qty = command.quantity || currentProvider.defaultQuantity || 1.5;
      
      setStatus('success');
      setStatusText(`✅ ${qty}L entry saved!`);
      
      onSave({
        quantity: qty,
        provider: currentProvider,
      });

      setTimeout(() => { setShowOverlay(false); setStatus('idle'); }, 1800);
      return;
    }

    // Unknown
    setStatus('error');
    setStatusText(`Samajh nahi aaya: "${transcript}"\nBolo: "doodh aaya" ya "nahi"`);
    setTimeout(() => { setStatus('idle'); }, 3000);
  }, [currentProvider, onSave]);

  const startListening = useCallback(() => {
    if (!isSupported) return;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'hi-IN'; // Hindi
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => {
      setIsListening(true);
      setStatus('listening');
      setStatusText('Bol do... 🎤');
      setShowOverlay(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      handleResult(transcript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        setStatus('error');
        setStatusText('Kuch sunai nahi diya. Dobara try karo.');
      } else if (event.error === 'not-allowed') {
        setStatus('error');
        setStatusText('Mic permission do browser mein!');
      } else {
        setStatus('error');
        setStatusText('Error aaya. Dobara try karo.');
      }
      setIsListening(false);
      setTimeout(() => { setStatus('idle'); }, 2500);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported, handleResult]);

  const handleMicClick = () => {
    if (isListening) {
      stopListening();
      setShowOverlay(false);
      setStatus('idle');
    } else {
      startListening();
    }
  };

  const handleClose = () => {
    stopListening();
    setShowOverlay(false);
    setStatus('idle');
  };

  // Expose start() to parent via ref
  useImperativeHandle(ref, () => ({
    start: startListening,
  }), [startListening]);

  if (!isSupported) return null;

  return (
    <>
      {/* Voice Overlay */}
      {showOverlay && createPortal(
        <div className="voice-overlay" onPointerDown={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
          <div className="voice-modal" onClick={e => e.stopPropagation()}>
            <button className="quick-entry-close" onClick={handleClose}>
              <X size={20} />
            </button>

            <div className="voice-visualizer">
              {status === 'listening' && (
                <div className="voice-rings">
                  <div className="voice-ring voice-ring-1"></div>
                  <div className="voice-ring voice-ring-2"></div>
                  <div className="voice-ring voice-ring-3"></div>
                  <div className="voice-mic-center">
                    <Mic size={28} />
                  </div>
                </div>
              )}
              {status === 'processing' && (
                <div className="voice-status-icon">🤔</div>
              )}
              {status === 'success' && (
                <div className="voice-status-icon voice-success-icon">✅</div>
              )}
              {status === 'error' && (
                <div className="voice-status-icon">❌</div>
              )}
              {status === 'idle' && (
                <div className="voice-status-icon">🎤</div>
              )}
            </div>

            <p className="voice-status-text">{statusText}</p>

            {status === 'idle' && (
              <button className="voice-retry-btn" onClick={startListening}>
                🎤 Dobara bolo
              </button>
            )}

            {currentProvider && (
              <p className="voice-provider-hint">
                {currentProvider.name} • ₹{currentProvider.ratePerLitre}/L
                {currentProvider.defaultQuantity > 0 && ` • Default: ${currentProvider.defaultQuantity}L`}
              </p>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
});

export default VoiceEntry;
