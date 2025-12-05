import React, { useState, useRef, useCallback } from 'react';
import { AppPhase, SignDefinition, GeneratedContent } from './types';
import { CSL_SIGNS } from './constants';
import WebcamCapture, { WebcamRef } from './components/WebcamCapture';
import { verifyGesture, generateArtisticResult } from './services/geminiService';

const App: React.FC = () => {
  const [phase, setPhase] = useState<AppPhase>(AppPhase.INTRO);
  const [collectedSigns, setCollectedSigns] = useState<SignDefinition[]>([]);
  const [currentSign, setCurrentSign] = useState<SignDefinition | null>(null);
  const [feedback, setFeedback] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [finalContent, setFinalContent] = useState<GeneratedContent | null>(null);
  
  const webcamRef = useRef<WebcamRef>(null);

  // --- Handlers ---

  const startJourney = () => {
    setPhase(AppPhase.TEACHING_SELECTION);
    setCollectedSigns([]);
  };

  const selectSign = (sign: SignDefinition) => {
    if (collectedSigns.find(s => s.id === sign.id)) {
      setFeedback("You have already collected this sign.");
      return;
    }
    setCurrentSign(sign);
    setFeedback("");
    setPhase(AppPhase.PRACTICE);
  };

  const handleCapture = useCallback(async (base64: string) => {
    if (!currentSign) return;

    setIsProcessing(true);
    setFeedback("Consulting the spirits...");

    try {
      const result = await verifyGesture(base64, currentSign);
      
      if (result.match) {
        setFeedback(`Success! ${result.feedback}`);
        setTimeout(() => {
          setCollectedSigns(prev => [...prev, currentSign]);
          setPhase(AppPhase.TEACHING_SELECTION);
          setCurrentSign(null);
          setFeedback("");
        }, 2000);
      } else {
        setFeedback(`Not quite. ${result.feedback} Try again.`);
      }
    } catch (error) {
      setFeedback("Something went wrong with the vision. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [currentSign]);

  const triggerCapture = () => {
    webcamRef.current?.capture();
  };

  const finishCollection = async () => {
    if (collectedSigns.length === 0) return;
    
    setPhase(AppPhase.GENERATING_NARRATIVE);
    try {
      const content = await generateArtisticResult(collectedSigns);
      setFinalContent(content);
      setPhase(AppPhase.RESULT);
    } catch (e) {
      setFeedback("Failed to weave the story.");
      setPhase(AppPhase.TEACHING_SELECTION);
    }
  };

  const resetApp = () => {
    setPhase(AppPhase.INTRO);
    setCollectedSigns([]);
    setFinalContent(null);
    setFeedback("");
  };

  // --- Render Helpers ---

  const renderIntro = () => (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center max-w-2xl mx-auto animate-fadeIn">
      <h1 className="text-6xl font-serif text-gorogoa-dark mb-6 tracking-wide">Hand to Heart</h1>
      <p className="text-xl font-serif text-gorogoa-frame mb-8 italic">
        "Echoes of Gorogoa"
      </p>
      <div className="p-8 border-double border-4 border-gorogoa-frame bg-white shadow-xl rounded-lg mb-8">
        <p className="text-lg mb-4">
          Welcome. This is an interactive experiment connecting <strong>Language</strong>, <strong>Gesture</strong>, and <strong>Emotion</strong>.
        </p>
        <p className="text-lg mb-6">
          You will learn simple Chinese Sign Language gestures. Your hands will tell a story, and AI will paint it.
        </p>
      </div>
      <button 
        onClick={startJourney}
        className="px-8 py-3 bg-gorogoa-accent text-white font-serif text-lg rounded shadow-lg hover:bg-opacity-90 transition-all transform hover:scale-105"
      >
        Begin Journey
      </button>
    </div>
  );

  const renderSelection = () => (
    <div className="flex flex-col items-center min-h-screen p-6">
      <h2 className="text-3xl font-serif text-gorogoa-dark mb-2">Select a Sign to Learn</h2>
      <p className="mb-6 text-gorogoa-frame italic">Collect at least one to weave a story ({collectedSigns.length} collected)</p>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 w-full max-w-5xl">
        {CSL_SIGNS.map(sign => {
          const isCollected = collectedSigns.some(s => s.id === sign.id);
          return (
            <button
              key={sign.id}
              onClick={() => !isCollected && selectSign(sign)}
              disabled={isCollected}
              className={`
                relative p-4 border-2 rounded-lg flex flex-col items-center justify-center aspect-square transition-all
                ${isCollected 
                  ? 'bg-gorogoa-frame/10 border-gorogoa-frame/30 opacity-60 cursor-default' 
                  : 'bg-white border-gorogoa-frame hover:shadow-xl hover:-translate-y-1 hover:border-gorogoa-accent cursor-pointer'
                }
              `}
            >
              <span className="text-3xl font-serif font-bold text-gorogoa-dark mb-1">{sign.chineseName}</span>
              <span className="text-sm font-sans uppercase tracking-widest text-gorogoa-frame">{sign.name}</span>
              {isCollected && (
                <div className="absolute inset-0 flex items-center justify-center bg-gorogoa-accent/20 rounded-lg">
                  <span className="text-4xl text-gorogoa-dark">✓</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {collectedSigns.length > 0 && (
        <div className="fixed bottom-8 z-10">
          <button
            onClick={finishCollection}
            className="px-10 py-4 bg-gorogoa-dark text-white font-serif text-xl rounded shadow-2xl hover:bg-gorogoa-accent transition-colors"
          >
            Weave Story & Generate Art
          </button>
        </div>
      )}
    </div>
  );

  const renderPractice = () => (
    <div className="flex flex-col items-center min-h-screen p-4 justify-center">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center bg-white p-8 rounded-xl shadow-2xl border border-gorogoa-frame">
        
        {/* Instruction Side */}
        <div className="flex flex-col space-y-4">
          <div className="border-b-2 border-gorogoa-accent pb-2">
            <h3 className="text-4xl font-serif text-gorogoa-dark">{currentSign?.chineseName}</h3>
            <h4 className="text-xl font-sans text-gorogoa-frame uppercase tracking-widest">{currentSign?.name}</h4>
          </div>
          <div className="bg-gorogoa-bg p-4 rounded border border-gorogoa-frame/20">
            <h5 className="font-bold text-gorogoa-dark mb-2">Instruction:</h5>
            <p className="text-lg leading-relaxed">{currentSign?.instruction}</p>
          </div>
          <div className="text-sm text-gray-500 italic">
            Pose in front of the camera and click "Verify".
          </div>
          <button
            onClick={() => setPhase(AppPhase.TEACHING_SELECTION)}
            className="text-gorogoa-frame hover:text-gorogoa-dark underline self-start mt-4"
          >
            ← Back to Selection
          </button>
        </div>

        {/* Camera Side */}
        <div className="flex flex-col items-center space-y-4">
          <WebcamCapture 
            ref={webcamRef} 
            onCapture={handleCapture}
            isProcessing={isProcessing}
          />
          <div className="h-16 flex items-center justify-center w-full">
            {feedback ? (
              <p className={`text-center font-serif ${feedback.includes('Success') ? 'text-green-700' : 'text-gorogoa-accent'}`}>
                {feedback}
              </p>
            ) : (
              <div className="h-full"></div>
            )}
          </div>
          <button
            onClick={triggerCapture}
            disabled={isProcessing}
            className="w-full py-3 bg-gorogoa-accent text-white font-serif font-bold rounded shadow hover:bg-opacity-90 disabled:opacity-50"
          >
            {isProcessing ? 'Observing...' : 'Verify Gesture'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderGeneration = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gorogoa-dark text-gorogoa-bg p-8">
      <div className="animate-pulse flex flex-col items-center">
        <div className="w-24 h-24 border-4 border-gorogoa-accent rounded-full animate-spin border-t-transparent mb-8"></div>
        <h2 className="text-3xl font-serif mb-4">Weaving Elements...</h2>
        <div className="flex space-x-2 text-xl opacity-80 font-serif">
           {collectedSigns.map(s => <span key={s.id}>{s.name}...</span>)}
        </div>
      </div>
    </div>
  );

  const renderResult = () => (
    <div className="min-h-screen flex items-center justify-center p-4 md:p-8">
      <div className="bg-white max-w-5xl w-full grid md:grid-cols-2 shadow-2xl rounded-sm overflow-hidden border-8 border-gorogoa-frame">
        
        {/* Image Frame */}
        <div className="relative bg-gorogoa-bg aspect-square md:aspect-auto flex items-center justify-center p-4 border-r-0 md:border-r-4 border-b-4 md:border-b-0 border-gorogoa-frame">
          {finalContent?.imageUrl ? (
            <div className="relative w-full h-full p-2 border-2 border-gorogoa-frame/20">
               <img 
                src={finalContent.imageUrl} 
                alt="Generated Art" 
                className="w-full h-full object-contain"
              />
              {/* Gorogoa style decorative corners */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-gorogoa-dark"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-gorogoa-dark"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-gorogoa-dark"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-gorogoa-dark"></div>
            </div>
          ) : (
            <div className="text-gorogoa-frame/50">Image generation unavailable</div>
          )}
        </div>

        {/* Text Frame */}
        <div className="p-8 md:p-12 flex flex-col justify-center items-center text-center bg-[#fcfbf9]">
          <h3 className="text-2xl font-sans uppercase tracking-[0.2em] text-gorogoa-accent mb-8">
            The Echo
          </h3>
          <p className="text-xl md:text-2xl font-serif leading-loose text-gorogoa-dark italic mb-12">
            "{finalContent?.story}"
          </p>
          
          <div className="mt-auto pt-8 border-t border-gorogoa-frame/20 w-full">
             <div className="flex flex-wrap gap-2 justify-center mb-6">
                {collectedSigns.map(s => (
                  <span key={s.id} className="px-3 py-1 bg-gorogoa-bg border border-gorogoa-frame/30 rounded-full text-xs uppercase tracking-wider text-gorogoa-frame">
                    {s.name}
                  </span>
                ))}
             </div>
             <button 
               onClick={resetApp}
               className="px-6 py-2 border-2 border-gorogoa-dark text-gorogoa-dark hover:bg-gorogoa-dark hover:text-white transition-colors font-serif text-sm uppercase tracking-widest"
             >
               Start New Journey
             </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-[#f4f1ea] min-h-screen text-[#2c241b]">
       {phase === AppPhase.INTRO && renderIntro()}
       {phase === AppPhase.TEACHING_SELECTION && renderSelection()}
       {phase === AppPhase.PRACTICE && renderPractice()}
       {phase === AppPhase.GENERATING_NARRATIVE && renderGeneration()}
       {phase === AppPhase.RESULT && renderResult()}
    </div>
  );
};

export default App;
