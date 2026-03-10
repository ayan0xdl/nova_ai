import 'regenerator-runtime/runtime'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutDashboard, CheckCircle2 } from 'lucide-react'

import UploadSection from './components/UploadSection'
import MatchScore from './components/MatchScore'
import InterviewInterface from './components/InterviewInterface'
import Scorecard from './components/Scorecard'

function App() {
  const [step, setStep] = useState(1) // 1: Upload, 2: Match, 3: Interview, 4: Scorecard
  
  const [jdText, setJdText] = useState('')
  const [resumeData, setResumeData] = useState(null)
  const [matchData, setMatchData] = useState(null)
  const [deepResearch, setDeepResearch] = useState(null)
  const [firstQuestion, setFirstQuestion] = useState("")
  const [evaluation, setEvaluation] = useState(null)

  const handleUploadComplete = (jd, rData, mData, drData) => {
    setJdText(jd)
    setResumeData(rData)
    setMatchData(mData)
    setDeepResearch(drData)
    setStep(2)
  }

  const handleStartInterview = (initialQuestion) => {
    setFirstQuestion(initialQuestion)
    setStep(3)
  }

  const handleInterviewComplete = (evalData) => {
    setEvaluation(evalData)
    setStep(4)
  }

  const handleRestart = () => {
    setJdText('')
    setResumeData(null)
    setMatchData(null)
    setDeepResearch(null)
    setFirstQuestion("")
    setEvaluation(null)
    setStep(1)
  }

  return (
    <div className="min-h-screen font-sans overflow-x-hidden relative app-container">
      
      {/* Background styling */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] bg-purple-900/10 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-indigo-900/10 rounded-full blur-[120px] mix-blend-screen animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        <div className="grid-overlay"></div>
      </div>
      
      {/* Navigation */}
      <header className="fixed top-0 w-full z-50 py-3 px-4 md:py-4 md:px-8 flex items-center justify-between border-b border-white/5 bg-[#030014]/40 backdrop-blur-xl supports-[backdrop-filter]:bg-[#030014]/40">
        <div className="flex items-center space-x-4 cursor-pointer group">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center transform group-hover:rotate-12 transition-all duration-300 shadow-[0_0_15px_rgba(139,92,246,0.15)]">
            <LayoutDashboard size={20} className="text-purple-400 group-hover:text-purple-300 md:w-6 md:h-6" />
          </div>
          <div>
            <span className="text-white font-display font-bold text-xl md:text-2xl tracking-tight block leading-none">NOVA</span>
            <span className="text-purple-400/80 font-bold text-[10px] md:text-xs uppercase tracking-widest block mt-1">AI Interview BOT</span>
          </div>
        </div>

        {/* Step progress */}
        <div className="hidden md:flex items-center space-x-3 text-sm font-semibold tracking-wide font-display">
          <span className={step >= 1 ? 'text-white' : 'text-white/30'}>01. SYNC</span>
          <span className="text-white/20">|</span>
          <span className={step >= 2 ? 'text-white' : 'text-white/30'}>02. SCAN</span>
          <span className="text-white/20">|</span>
          <span className={step >= 3 ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'text-white/30'}>03. INTERVIEW</span>
          <span className="text-white/20">|</span>
          <span className={step >= 4 ? 'text-white' : 'text-white/30'}>04. SCORECARD</span>
        </div>
      </header>

      {/* Main layout */}
      <main className="relative z-10 container mx-auto px-4 pt-20 pb-20 md:pt-28 md:pb-24 min-h-[calc(100vh-80px)] flex flex-col justify-center">
        <AnimatePresence mode="wait">
          
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <UploadSection onUploadComplete={handleUploadComplete} />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3 }}
            >
              <MatchScore 
                jdText={jdText} 
                resumeData={resumeData} 
                matchData={matchData} 
                deepResearch={deepResearch}
                onStartInterview={handleStartInterview} 
              />
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              transition={{ duration: 0.4 }}
            >
              <InterviewInterface 
                jdText={jdText}
                resumeData={resumeData}
                deepResearch={deepResearch}
                firstQuestion={firstQuestion}
                onComplete={handleInterviewComplete}
              />
            </motion.div>
          )}

          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Scorecard 
                evaluation={evaluation}
                onRestart={handleRestart}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Footer text */}
      <footer className="relative z-10 w-full p-4 md:p-6 border-t border-white/5 bg-transparent text-center text-white/40 text-xs md:text-sm flex flex-col items-center justify-center space-y-2">
        <div className="flex items-center space-x-2 font-display">
          <span>{new Date().getFullYear()} NOVA AI</span>
          <span className="text-white/20">|</span>
          <span className="hover:text-white cursor-pointer transition-colors">Privacy Policy</span>
          <span className="text-white/20">|</span>
          <span className="hover:text-white cursor-pointer transition-colors">Terms of Service</span>
        </div>
        <div className="font-sans text-[10px] uppercase tracking-widest text-white/30">
          Powered by NOVA AI
        </div>
      </footer>

    </div>
  )
}

export default App
