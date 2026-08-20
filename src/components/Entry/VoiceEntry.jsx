import React, { useState, useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import { createPortal } from 'react-dom';
import { Mic, MicOff, X } from 'lucide-react';

// Hindi number words mapping (sorted longest-first for accurate matching)
const HINDI_NUMBERS = [
  // Compound: sawa (1.25x), pauna (0.75x), savaa
  ['sawa teen', 3.25], ['सवा तीन', 3.25],
  ['sawa do', 2.25], ['सवा दो', 2.25],
  ['sawa char', 4.25], ['सवा चार', 4.25],
  ['sawa paanch', 5.25], ['सवा पांच', 5.25],
  ['pauna do', 1.75], ['पौना दो', 1.75],
  ['pauna teen', 2.75], ['पौना तीन', 2.75],
  ['pauna char', 3.75], ['पौना चार', 3.75],
  // Fractional
  ['dedh', 1.5], ['डेढ़', 1.5], ['derh', 1.5], ['deedh', 1.5],
  ['dhai', 2.5], ['ढाई', 2.5], ['adhai', 2.5], ['dhaai', 2.5], ['dhhai', 2.5],
  ['aadha', 0.5], ['आधा', 0.5], ['half', 0.5], ['adha', 0.5],
  ['paav', 0.25], ['पाव', 0.25], ['quarter', 0.25], ['paaw', 0.25],
  ['pauna', 0.75], ['पौना', 0.75], ['pona', 0.75],
  ['sawa', 1.25], ['सवा', 1.25], ['savaa', 1.25],
  // Whole numbers
  ['ek', 1], ['एक', 1], ['one', 1], ['1', 1],
  ['do', 2], ['दो', 2], ['two', 2],
  ['teen', 3], ['तीन', 3], ['three', 3], ['tin', 3],
  ['char', 4], ['चार', 4], ['four', 4], ['chaar', 4],
  ['paanch', 5], ['पांच', 5], ['five', 5], ['panch', 5],
  ['chhe', 6], ['छह', 6], ['six', 6], ['chah', 6],
  ['saat', 7], ['सात', 7], ['seven', 7],
  ['aath', 8], ['आठ', 8], ['eight', 8],
  ['nau', 9], ['नौ', 9], ['nine', 9],
  ['das', 10], ['दस', 10], ['ten', 10],
];

function parseVoiceCommand(transcript) {
  const text = transcript.toLowerCase().trim();
  
  // ─── Check for "no" responses first ───────────────────────────
  const noPatterns = [
    // Hindi - nahi variations
    'nahi aaya', 'nhi aaya', 'nahin aaya', 'nahi aya',
    'nahi aaya hai', 'nahi aaya tha', 'aaj nahi aaya',
    'aaj nahi aaya hai', 'aaj nhi aaya',
    // Not given / not delivered
    'nahi diya', 'nhi diya', 'nahi diya hai', 'nahi de gaya',
    'aaj nahi diya', 'aaj nahi diya hai', 'aaj nahi degaya',
    'nahi deke gaya', 'nahi de ke gaya',
    // Will not come / off day
    'nahi aayega', 'nhi aayega', 'aaj nahi aayega',
    'nahi dega', 'aaj nahi dega',
    'nahi milega', 'aaj nahi milega',
    // Holiday / leave
    'chhuti', 'chhutti', 'chhuti hai', 'aaj chhuti',
    'chhuti hai aaj', 'off hai', 'aaj off hai',
    'band hai', 'aaj band', 'band hai aaj',
    'holiday', 'holiday hai',
    // Skip / cancel
    'skip', 'skip karo', 'skip kar do', 'chhod do', 'chhor do',
    'rehne do', 'rehne de', 'rahne do', 'rahne de',
    'mat karo', 'mat kar', 'mat likh', 'mat likho',
    'hata do', 'hatao', 'nikaal do', 'nikal do',
    'cancel', 'cancel karo', 'cancel kar do',
    // Simple no
    'nahi', 'nhi', 'no', 'naa', 'nahin', 'na',
    'naa bhai', 'nahi bhai', 'no bhai',
    'mat', 'nope', 'bilkul nahi',
    // Devanagari
    'नहीं आया', 'नहीं दिया', 'आज नहीं आया', 'आज नहीं दिया',
    'छुट्टी', 'छुट्टी है', 'बंद', 'बंद है',
    'नहीं', 'ना', 'मत', 'रहने दो', 'हटाओ', 'छोड़ दो',
    'नहीं आएगा', 'नहीं देगा', 'नहीं मिलेगा',
  ];
  for (const pat of noPatterns) {
    if (text.includes(pat)) {
      return { action: 'no' };
    }
  }

  // ─── Try to extract quantity ──────────────────────────────────
  let quantity = null;

  // Check for "X litre" or "X liter" patterns (numeric)
  const litreMatch = text.match(/(\d+\.?\d*)\s*(litre|liter|ltr|l\b|लीटर)/i);
  if (litreMatch) {
    quantity = parseFloat(litreMatch[1]);
  }

  // Check Hindi number words (longest-first to match "sawa do" before "do")
  if (!quantity) {
    for (const [word, val] of HINDI_NUMBERS) {
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

  // ─── Check for "yes" / affirmative patterns ───────────────────
  const yesPatterns = [
    // ── Direct milk references ──
    'doodh', 'dudh', 'milk', 'दूध',
    'doodh aaya', 'doodh aaya hai', 'doodh aa gaya', 'doodh aa gaya hai',
    'dudh aaya', 'dudh aaya hai',
    'doodh diya', 'doodh diya hai', 'doodh de gaya', 'doodh de gaya hai',
    'dudh diya', 'dudh diya hai', 'dudh de gaya',
    'doodh deke gaya', 'doodh deke gaya hai',
    'doodh mila', 'doodh mila hai', 'doodh mil gaya',
    'दूध आया', 'दूध आया है', 'दूध आ गया', 'दूध दिया', 'दूध दे गया',

    // ── Came / arrived ──
    'aaya', 'aaya hai', 'aaya tha',
    'aagaya', 'aa gaya', 'aa gaya hai', 'aa gaye',
    'aai', 'aa gayi', 'aa gayi hai',
    'aaj aaya', 'aaj aaya hai', 'aaj aa gaya', 'aaj aa gaya hai',
    'aaj aai', 'aaj aa gayi',
    'आया', 'आया है', 'आ गया', 'आ गया है',
    'आज आया', 'आज आया है', 'आज आ गया',

    // ── Given / delivered / left ──
    'diya', 'diya hai', 'diya tha',
    'de gaya', 'degaya', 'de gaya hai', 'de gaye',
    'de diya', 'dediya', 'de diya hai',
    'deke gaya', 'deke gaya hai', 'deke gayi',
    'de gayi', 'de gayi hai',
    'aaj diya', 'aaj diya hai', 'aaj de gaya', 'aaj de gaya hai',
    'aaj deke gaya', 'aaj de diya',
    'दिया', 'दिया है', 'दे गया', 'दे गया है', 'दे दिया',
    'आज दिया', 'आज दे गया',

    // ── Kept / placed ──
    'rakh gaya', 'rakh gaya hai', 'rakh ke gaya', 'rakh diya',
    'rakh diya hai', 'rakhke gaya', 'rakha hai', 'rakha hua hai',
    'aaj rakh gaya', 'aaj rakh diya',
    'रख गया', 'रख दिया', 'रखा है',

    // ── Got / received ──
    'mila', 'mila hai', 'mil gaya', 'mil gaya hai', 'mil gayi',
    'aaj mila', 'aaj mila hai', 'aaj mil gaya',
    'मिला', 'मिला है', 'मिल गया',

    // ── Bheja / sent ──
    'bheja', 'bheja hai', 'bhej diya', 'bhej diya hai',
    'भेजा', 'भेजा है', 'भेज दिया',

    // ── Quantity phrases ──
    'dedh litre', 'dedh liter', 'dedh litre diya', 'dedh litre diya hai',
    'dedh litre aaya', 'dedh litre aaya hai', 'dedh litre de gaya',
    'dhai litre', 'dhai liter', 'dhai litre diya', 'dhai litre diya hai',
    'dhai litre aaya', 'dhai litre aaya hai', 'dhai litre de gaya',
    'ek litre', 'ek litre diya', 'ek litre aaya',
    'do litre', 'do litre diya', 'do litre aaya',
    'teen litre', 'teen litre diya', 'teen litre aaya',
    'aadha litre', 'aadha litre diya', 'aadha litre aaya',
    'paav litre', 'paav litre diya',
    'sawa litre', 'sawa litre diya',
    'pauna litre', 'pauna litre diya',
    'डेढ़ लीटर', 'ढाई लीटर', 'एक लीटर', 'दो लीटर', 'आधा लीटर',

    // ── Affirmative / Yes ──
    'haan', 'ha', 'haa', 'hanji', 'han ji',
    'yes', 'yep', 'yeah',
    'ok', 'okay', 'theek hai', 'thik hai', 'theek', 'thik',
    'ji', 'ji haan', 'ji ha', 'bilkul', 'zaroor', 'sahi',
    'haan bhai', 'ha bhai', 'haa bhai',
    'haan ji', 'ha ji',
    'हां', 'हाँ', 'जी', 'जी हां', 'जी हाँ', 'ठीक है', 'बिल्कुल', 'सही',

    // ── Add / save / write commands ──
    'add', 'save', 'enter',
    'dal', 'daal', 'dal do', 'daal do', 'daaldo',
    'add kar', 'add karo', 'add kar do', 'add kardo',
    'save kar', 'save karo', 'save kar do', 'save kardo',
    'kar do', 'kardo', 'kar de', 'karde',
    'laga do', 'lagado', 'laga de',
    'likh do', 'likhdo', 'likh de', 'likhde',
    'note kar', 'note karo', 'note kar do',
    'entry kar', 'entry karo', 'entry kar do', 'entry kardo',
    'डाल दो', 'जोड़ दो', 'लिख दो', 'एंट्री करो', 'नोट करो',

    // ── Today ──
    'aaj', 'today', 'aaj ka', 'aaj ki',
    'आज', 'आज का', 'आज की',
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

// ─── Text-to-Speech helper (Chrome-safe) ───────────────────────
function speak(text) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  
  const synth = window.speechSynthesis;
  
  // Chrome bug workaround: cancel + resume to unstick the queue
  synth.cancel();
  
  const doSpeak = () => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'hi-IN';
    utterance.rate = 1.0;
    utterance.pitch = 1.05;
    utterance.volume = 1;
    
    // Try to find a Hindi voice, fallback to default
    const voices = synth.getVoices();
    const hindiVoice = voices.find(v => v.lang.startsWith('hi'));
    if (hindiVoice) utterance.voice = hindiVoice;
    
    synth.speak(utterance);
    
    // Chrome workaround: sometimes it pauses immediately, resume it
    setTimeout(() => {
      if (synth.paused) synth.resume();
    }, 100);
  };
  
  // Use requestAnimationFrame to escape setTimeout context (Chrome fix)
  requestAnimationFrame(() => {
    // Voices may not be loaded yet
    if (synth.getVoices().length > 0) {
      doSpeak();
    } else {
      // Wait for voices to load
      synth.addEventListener('voiceschanged', () => doSpeak(), { once: true });
      // Fallback: speak anyway after 300ms if voiceschanged never fires
      setTimeout(doSpeak, 300);
    }
  });
}


const VoiceEntry = forwardRef(function VoiceEntry({ currentProvider, onSave }, ref) {
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState('idle'); // 'idle' | 'listening' | 'processing' | 'success' | 'success-skip' | 'error'
  const [statusText, setStatusText] = useState('');
  const [transcriptText, setTranscriptText] = useState('');
  const [savedQty, setSavedQty] = useState(null);
  const [showOverlay, setShowOverlay] = useState(false);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);
  const processedRef = useRef(false);

  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const cleanup = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch(e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimText('');
  }, []);

  const handleResult = useCallback((transcript) => {
    if (processedRef.current) return;
    processedRef.current = true;
    cleanup();

    setStatus('processing');
    setTranscriptText(transcript);
    setStatusText('Samajh raha hoon...');

    const command = parseVoiceCommand(transcript);

    if (command.action === 'no') {
      setTimeout(() => {
        setStatus('success-skip');
        setStatusText('Theek hai, skip kiya!');
        speak('ठीक है, छोड़ दिया');
        setTimeout(() => { setShowOverlay(false); setStatus('idle'); setTranscriptText(''); setSavedQty(null); }, 2200);
      }, 400);
      return;
    }

    if (command.action === 'yes') {
      if (!currentProvider) {
        setStatus('error');
        setStatusText('Pehle provider select karo!');
        setTimeout(() => { setStatus('idle'); }, 2500);
        return;
      }

      const qty = command.quantity || currentProvider.defaultQuantity || 1.5;
      
      setTimeout(() => {
        setStatus('success');
        setSavedQty(qty);
        setStatusText('Ho gaya! ✨');
        speak(`हो गया! ${qty} लीटर एंट्री सेव हो गई`);
        
        onSave({
          quantity: qty,
          provider: currentProvider,
        });

        setTimeout(() => { setShowOverlay(false); setStatus('idle'); setTranscriptText(''); setSavedQty(null); }, 2800);
      }, 400);
      return;
    }

    // Unknown
    setStatus('error');
    setStatusText('Samajh nahi aaya');
    speak('समझ नहीं आया, दोबारा बोलो');
    setTimeout(() => { setStatus('idle'); setTranscriptText(''); }, 3500);
  }, [currentProvider, onSave, cleanup]);

  const startListening = useCallback(() => {
    if (!isSupported) return;

    cleanup();
    processedRef.current = false;
    setTranscriptText('');
    setSavedQty(null);

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'hi-IN';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = true;

    recognition.onstart = () => {
      setIsListening(true);
      setStatus('listening');
      setStatusText('Sun raha hoon...');
      setInterimText('');
      setShowOverlay(true);
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interim = '';
      
      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }

      if (interim) {
        setInterimText(interim);
      }

      if (finalTranscript) {
        handleResult(finalTranscript.trim());
      }
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      if (event.error === 'not-allowed') {
        cleanup();
        setStatus('error');
        setStatusText('Browser mein mic ki permission do!');
        setTimeout(() => { setStatus('idle'); }, 2500);
      }
    };

    recognition.onend = () => {
      if (!processedRef.current && recognitionRef.current) {
        try {
          recognition.start();
          return;
        } catch(e) {}
      }
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();

    timeoutRef.current = setTimeout(() => {
      if (!processedRef.current) {
        cleanup();
        setStatus('error');
        setStatusText('Kuch suna nahi, dobara try karo');
        setTimeout(() => { setStatus('idle'); }, 2500);
      }
    }, 15000);
  }, [isSupported, handleResult, cleanup]);

  const handleClose = () => {
    cleanup();
    setShowOverlay(false);
    setStatus('idle');
    setTranscriptText('');
    setSavedQty(null);
  };

  useImperativeHandle(ref, () => ({
    start: startListening,
  }), [startListening]);

  if (!isSupported) return null;

  const isSuccess = status === 'success';
  const isSkipSuccess = status === 'success-skip';
  const isError = status === 'error';

  return (
    <>
      {showOverlay && createPortal(
        <div className="voice-overlay" onPointerDown={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
          <div className={`voice-modal voice-modal--${status}`} onClick={e => e.stopPropagation()}>
            
            {/* Close button */}
            <button className="voice-close-btn" onClick={handleClose} aria-label="Close">
              <X size={18} />
            </button>

            {/* ── Visualizer Area ── */}
            <div className="voice-viz-area">
              {status === 'listening' && (
                <div className="voice-listen-viz">
                  <div className="voice-wave-bars">
                    {[...Array(7)].map((_, i) => (
                      <div key={i} className="voice-wave-bar" style={{ animationDelay: `${i * 0.08}s` }} />
                    ))}
                  </div>
                  <div className="voice-mic-orb">
                    <Mic size={26} />
                  </div>
                  <div className="voice-wave-bars">
                    {[...Array(7)].map((_, i) => (
                      <div key={i} className="voice-wave-bar" style={{ animationDelay: `${(7 + i) * 0.08}s` }} />
                    ))}
                  </div>
                </div>
              )}

              {status === 'processing' && (
                <div className="voice-processing-viz">
                  <div className="voice-spinner" />
                </div>
              )}

              {isSuccess && (
                <div className="voice-success-viz">
                  <div className="voice-check-circle">
                    <svg viewBox="0 0 52 52" className="voice-checkmark-svg">
                      <circle className="voice-checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
                      <path className="voice-checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
                    </svg>
                  </div>
                  {savedQty && (
                    <div className="voice-qty-badge">{savedQty}L</div>
                  )}
                </div>
              )}

              {isSkipSuccess && (
                <div className="voice-skip-viz">
                  <div className="voice-skip-icon">👍</div>
                </div>
              )}

              {isError && (
                <div className="voice-error-viz">
                  <div className="voice-error-icon">
                    <svg viewBox="0 0 52 52" className="voice-x-svg">
                      <circle cx="26" cy="26" r="25" fill="none" className="voice-x-circle"/>
                      <path d="M17 17l18 18M35 17l-18 18" fill="none" className="voice-x-path"/>
                    </svg>
                  </div>
                </div>
              )}

              {status === 'idle' && (
                <div className="voice-idle-viz">
                  <div className="voice-idle-mic">🎤</div>
                </div>
              )}
            </div>

            {/* ── Status Message ── */}
            <p className={`voice-msg voice-msg--${status}`}>{statusText}</p>

            {/* ── Transcript bubble ── */}
            {(interimText && status === 'listening') && (
              <div className="voice-transcript-bubble voice-transcript-interim">
                <span className="voice-transcript-dot" />
                <span className="voice-transcript-dot" />
                <span className="voice-transcript-dot" />
                <span className="voice-transcript-words">{interimText}</span>
              </div>
            )}

            {transcriptText && status !== 'listening' && (
              <div className={`voice-transcript-bubble ${isSuccess ? 'voice-transcript-success' : isSkipSuccess ? 'voice-transcript-skip' : isError ? 'voice-transcript-error' : ''}`}>
                <span className="voice-transcript-label">Tumne bola:</span>
                <span className="voice-transcript-words">"{transcriptText}"</span>
              </div>
            )}

            {/* ── Success details ── */}
            {isSuccess && currentProvider && (
              <div className="voice-saved-details">
                <span className="voice-saved-provider">{currentProvider.name}</span>
                <span className="voice-saved-sep">•</span>
                <span className="voice-saved-qty">{savedQty}L × ₹{currentProvider.ratePerLitre}</span>
                <span className="voice-saved-sep">=</span>
                <span className="voice-saved-total">₹{(savedQty * currentProvider.ratePerLitre).toFixed(0)}</span>
              </div>
            )}

            {/* ── Retry button ── */}
            {(status === 'idle' || isError) && (
              <button className="voice-retry-btn" onClick={startListening}>
                <Mic size={16} />
                <span>Dobara Bolo</span>
              </button>
            )}

            {/* ── Provider hint ── */}
            {currentProvider && status === 'listening' && (
              <div className="voice-provider-chip">
                <span className="voice-provider-chip-dot" />
                {currentProvider.name} — ₹{currentProvider.ratePerLitre}/L
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
});

export default VoiceEntry;

