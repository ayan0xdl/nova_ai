import 'regenerator-runtime/runtime'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Square, ChevronRight, Activity, AlertCircle, ShieldCheck, BugPlay, Check } from 'lucide-react'
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

export default function InterviewInterface({ jdText, resumeData, deepResearch, firstQuestion, onComplete }) {
  const [currentQuestion, setCurrentQuestion] = useState(firstQuestion)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [qaHistory, setQaHistory] = useState([])
  
  // Debug toggle
  const [showDebug, setShowDebug] = useState(true)
  
  const [isProcessingNext, setIsProcessingNext] = useState(false)
  const [sentiment, setSentiment] = useState({ score: 100, flagged: false })
  const [manualAnswer, setManualAnswer] = useState("")
  
  // Audio Synthesis ref
  const synthRef = useRef(window.speechSynthesis)

  // React-Speech-Recognition Hook
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable
  } = useSpeechRecognition();

  useEffect(() => {
    // Sync transcript to local state
    if (listening) {
      setManualAnswer(transcript);
    }
  }, [transcript, listening]);

  useEffect(() => {
    // Auto-read the first question
    speakText(firstQuestion)
    return () => {
      synthRef.current.cancel()
    }
  }, [])

  const speakText = (text) => {
    if (synthRef.current.speaking) synthRef.current.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    synthRef.current.speak(utterance)
  }

  const toggleListening = () => {
    if (listening) {
      SpeechRecognition.stopListening()
    } else {
      SpeechRecognition.startListening({ continuous: true, language: 'en-US' })
    }
  }

  const handleNextAction = async () => {
    SpeechRecognition.stopListening()
    
    const finalAnswer = manualAnswer.trim() || transcript.trim() || "(No response provided)"
    const newHistory = [...qaHistory, { question: currentQuestion, answer: finalAnswer }]
    setQaHistory(newHistory)
    resetTranscript()
    setManualAnswer("")
    
    if (questionIndex < 4) {
      setIsProcessingNext(true)
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
        const res = await fetch(`${apiUrl}/api/next-question`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jd_text: jdText,
            deep_research: deepResearch,
            resume_data: resumeData,
            qa_history: newHistory,
            question_index: questionIndex
          }),
        })
        const data = await res.json()
        
        setSentiment({
          score: data.adaptive_data.confidence_score,
          flagged: data.adaptive_data.is_bs_flagged
        })

        setCurrentQuestion(data.adaptive_data.next_question)
        setQuestionIndex(prev => prev + 1)
        speakText(data.adaptive_data.next_question)
      } catch (error) {
        console.error("Failed to get next question", error)
        alert("Connection to AI Engine lost. Check backend.")
      } finally {
        setIsProcessingNext(false)
      }
    } else {
      handleEvaluate(newHistory)
    }
  }

  const [isEvaluating, setIsEvaluating] = useState(false)
  
  const handleEvaluate = async (finalHistory) => {
    setIsEvaluating(true)
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const res = await fetch(`${apiUrl}/api/evaluate-interview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jd_text: jdText,
          resume_data: resumeData,
          qa_history: finalHistory
        }),
      })
      const data = await res.json()
      onComplete(data.evaluation)
    } catch (error) {
      console.error('Error computing scorecard:', error)
      alert("Evaluation failed. See console.")
    } finally {
      setIsEvaluating(false)
    }
  }

  const progress = ((questionIndex) / 5) * 100

  if (isEvaluating || isProcessingNext) {
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[60vh]">
        <div className="relative w-32 h-32 mb-8">
          <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-t-purple-400 rounded-full animate-spin"></div>
          <div className="absolute inset-2 border-4 border-indigo-500/20 rounded-full"></div>
          <div className="absolute inset-2 border-4 border-b-indigo-400 rounded-full animate-spin-reverse-slow"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Activity className="text-purple-400 animate-pulse" size={32} />
          </div>
        </div>
        <h2 className="text-3xl font-display font-light text-white animate-pulse tracking-wide">
          {isEvaluating ? 'Compiling Final Evaluation...' : 'Analyzing Response...'}
        </h2>
        <p className="text-purple-400/70 mt-3 font-sans text-sm tracking-widest uppercase">
          {isEvaluating ? 'Running Match Matrix' : 'Processing Next Scenario'}
        </p>
      </div>
    )
  }

  // Animation variants
  const sentence = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: { delay: 0.2, staggerChildren: 0.03 }
    }
  }
  const letter = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-5xl mx-auto"
    >
      <div className="glass-panel overflow-hidden relative border-0">
        
        {/* Progress bar */}
        <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-700 z-20" style={{ width: `${progress}%` }}></div>
        
        <div className="flex flex-col lg:flex-row">
          
          {/* Left Column: AI Core */}
          <div className="w-full lg:w-1/3 border-b lg:border-b-0 lg:border-r border-white/5 p-6 lg:p-10 flex flex-col items-center justify-between relative overflow-hidden bg-black/40">
            
            {/* Background grid */}
            <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px]"></div>

            <div className="w-full relative z-10 flex justify-between items-center mb-8">
              <span className="font-sans text-[10px] text-purple-400/80 uppercase tracking-[0.2em] font-medium">AI System Active</span>
              <span className="font-sans text-[10px] text-white/40 uppercase tracking-[0.2em] font-medium">Q_{questionIndex + 1}/5</span>
            </div>

            {/* AI Core visualizer */}
            <div className="relative w-32 h-32 lg:w-48 lg:h-48 mb-6 flex items-center justify-center">
              {listening && (
                <>
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="absolute inset-0 bg-purple-500/20 rounded-full blur-[40px]"
                  ></motion.div>
                  <motion.div 
                    animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.3, 0.1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="absolute inset-[-10px] border border-purple-500/30 rounded-full"
                  ></motion.div>
                </>
              )}
              <motion.div 
                animate={listening ? { rotate: 360, scale: [1, 1.05, 1] } : { rotate: 360 }}
                transition={{ rotate: { repeat: Infinity, duration: 15, ease: "linear" }, scale: { repeat: Infinity, duration: 2 } }}
                className="w-24 h-24 lg:w-32 lg:h-32 rounded-full border border-white/10 shadow-[0_0_40px_rgba(139,92,246,0.3)] flex items-center justify-center z-10 overflow-hidden relative bg-gradient-to-br from-[#0a0520] via-[#1a0b2e] to-[#0a0520]"
              >
                <div className={`absolute inset-0 bg-gradient-to-tr from-purple-600/20 to-indigo-600/20 rounded-full ${listening ? 'animate-pulse' : ''}`}></div>
                <div className="w-full h-full opacity-40 mix-blend-screen bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] animate-spin-slow"></div>
                <div className={`absolute w-12 h-12 lg:w-16 lg:h-16 rounded-full blur-xl ${listening ? 'bg-gradient-to-r from-purple-400 to-pink-500' : 'bg-indigo-900/50'} transition-all duration-700`}></div>
              </motion.div>
            </div>
            
            <button 
              onClick={() => setShowDebug(!showDebug)}
              className="relative z-10 mb-8 flex items-center text-[9px] text-white/30 hover:text-white/80 transition-colors uppercase tracking-widest font-sans border border-white/5 rounded-full px-3 py-1.5 bg-white/5 backdrop-blur-md"
            >
              <BugPlay size={10} className="mr-1.5 opacity-60" /> Toggle Debug
            </button>

            {/* Confidence metrics */}
            <div className="w-full relative z-10 mt-auto bg-white/5 rounded-2xl p-5 border border-white/10 backdrop-blur-md shadow-lg">
              <h4 className="font-sans text-[10px] text-white/50 uppercase tracking-[0.1em] mb-4 flex items-center font-medium">
                <Activity size={12} className="mr-1.5 text-purple-400" /> Analysis Confidence
              </h4>
              <div className="flex items-end justify-between mb-3">
                <span className="text-3xl font-display font-light text-white leading-none">{sentiment.score}<span className="text-sm text-white/40 ml-1">%</span></span>
                {sentiment.flagged ? (
                  <span className="text-[10px] font-medium text-rose-300 bg-rose-500/20 px-2 py-1 rounded-md border border-rose-500/20 flex items-center tracking-widest">
                    <AlertCircle size={10} className="mr-1" /> FLAGGED
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-emerald-300 bg-emerald-500/20 px-2 py-1 rounded-md border border-emerald-500/20 flex items-center tracking-widest">
                    <ShieldCheck size={10} className="mr-1" /> VERIFIED
                  </span>
                )}
              </div>
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 rounded-full ${sentiment.score > 70 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : sentiment.score > 40 ? 'bg-gradient-to-r from-amber-500 to-orange-400' : 'bg-gradient-to-r from-rose-500 to-pink-500'}`} 
                  style={{ width: `${sentiment.score}%` }}
                ></div>
              </div>
            </div>
            
          </div>

          {/* Right Column: Q&A Area */}
          <div className="w-full lg:w-2/3 p-6 lg:p-14 flex flex-col justify-between min-h-[400px] lg:min-h-[500px] bg-white/[0.02]">
            
            {/* Question Display */}
            <div className="mb-8 lg:mb-12">
              <div className="w-8 h-8 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-5 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
                <span className="font-sans text-[10px] font-bold text-purple-300">Q{questionIndex + 1}</span>
              </div>
              <motion.h3 
                key={currentQuestion}
                variants={sentence}
                initial="hidden"
                animate="visible"
                className="text-2xl md:text-3xl lg:text-4xl font-display font-light text-white leading-[1.3] min-h-[90px]"
              >
                {currentQuestion.split("").map((char, index) => {
                  return (
                    <motion.span key={char + "-" + index} variants={letter}>
                      {char}
                    </motion.span>
                  )
                })}
              </motion.h3>
            </div>

            {/* Transcript Area */}
            <div className="bg-black/30 rounded-3xl p-6 min-h-[160px] lg:min-h-[220px] border border-white/5 mb-8 flex flex-col relative group hover:bg-black/40 hover:border-white/10 transition-all duration-300 shadow-inner">
              <div className="absolute top-5 right-5 flex items-center space-x-1.5 z-10">
                <span className={`w-2 h-2 rounded-full ${listening ? 'bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]' : 'bg-white/20'}`}></span>
                <span className="font-sans text-[9px] text-white/40 uppercase tracking-[0.2em] font-medium">
                  {listening ? 'REC' : 'STBY'}
                </span>
              </div>
              
              <div className="mt-4 flex-1 w-full h-full flex flex-col justify-center relative">
                <textarea
                  value={listening ? transcript : manualAnswer}
                  onChange={(e) => setManualAnswer(e.target.value)}
                  disabled={listening}
                  placeholder={listening ? "Listening closely..." : "Tap the mic to respond..."}
                  className={`w-full h-full min-h-[140px] bg-transparent resize-none outline-none text-center leading-relaxed transition-all placeholder:text-white/20 placeholder:font-light placeholder:font-sans ${
                    (transcript || manualAnswer || listening) 
                      ? 'text-lg lg:text-xl font-display font-normal text-white/90 drop-shadow-md' 
                      : 'text-sm lg:text-base font-light text-white/30 flex items-center justify-center'
                  }`}
                />
                {!listening && (manualAnswer || transcript) && (
                  <div className="w-full text-center mt-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[9px] text-white/30 font-sans tracking-[0.2em] uppercase bg-white/5 border border-white/10 rounded-full px-3 py-1 backdrop-blur-sm">
                      Response Captured
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Speech-to-text debug panel */}
            <AnimatePresence>
            {showDebug && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-8 p-4 bg-black/60 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-md"
              >
                <h5 className="text-[9px] font-sans text-white/40 uppercase tracking-[0.1em] mb-3 border-b border-white/5 pb-2 font-medium">System Diagnostics</h5>
                <ul className="text-[10px] lg:text-xs font-mono space-y-1.5">
                  <li className="flex justify-between">
                    <span className="text-white/40">Browser Supported:</span> 
                    <span className={browserSupportsSpeechRecognition ? 'text-emerald-400' : 'text-rose-400'}>
                      {browserSupportsSpeechRecognition ? 'YES' : 'NO (Chrome/Edge req)'}
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-white/40">Microphone Access:</span> 
                    <span className={isMicrophoneAvailable !== false ? 'text-emerald-400' : 'text-rose-400'}>
                      {isMicrophoneAvailable !== false ? 'ACTIVE' : 'DENIED'}
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-white/40">Engine Status:</span> 
                    <span className={listening ? 'text-purple-400 animate-pulse' : 'text-white/30'}>
                      {listening ? 'LISTENING_CONTINUOUS' : 'IDLE'}
                    </span>
                  </li>
                </ul>
              </motion.div>
            )}
            </AnimatePresence>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <button
                onClick={toggleListening}
                className={`flex-1 w-full flex items-center justify-center py-4 rounded-2xl font-sans font-semibold tracking-wide transition-all duration-300 text-sm lg:text-base ${
                  listening 
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 shadow-[0_0_20px_rgba(244,63,94,0.15)]'
                    : 'bg-white/5 text-white border border-white/10 hover:bg-white/10 shadow-lg hover:shadow-[0_0_20px_rgba(255,255,255,0.1)]'
                }`}
              >
                {listening ? (
                  <>
                    <Square size={16} className="mr-2 fill-current" /> Stop Listening
                  </>
                ) : (
                  <>
                    <Mic size={16} className="mr-2" /> Start Microphone
                  </>
                )}
              </button>

              <button
                onClick={handleNextAction}
                disabled={listening ? !transcript : !manualAnswer}
                className="flex-1 w-full flex items-center justify-center py-4 rounded-2xl font-sans font-semibold tracking-wide bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-none hover:from-purple-500 hover:to-indigo-500 transition-all disabled:opacity-40 disabled:from-white/10 disabled:to-white/10 disabled:text-white/40 disabled:cursor-not-allowed group text-sm lg:text-base shadow-[0_0_20px_rgba(139,92,246,0.2)] hover:shadow-[0_0_30px_rgba(139,92,246,0.4)]"
              >
                {questionIndex < 4 ? (
                  <>Submit Answer <ChevronRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" /></>
                ) : (
                  <>Finish Interview <Check size={16} className="ml-2" /></>
                )}
              </button>
            </div>

          </div>
        </div>
      </div>
    </motion.div>
  )
}
