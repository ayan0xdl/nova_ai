import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, FileText, CheckCircle, AlertTriangle } from 'lucide-react'

// Helper to strip markdown formatting
const stripMarkdown = (text) => {
  if (!text) return "";
  return text.toString()
    .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
    .replace(/\*(.*?)\*/g, '$1')     // Italic
    .replace(/```[\s\S]*?```/g, '')  // Code blocks
    .replace(/`/g, '')               // Inline code
    .replace(/^#+\s+/gm, '')         // Headers
    .trim();
}

export default function MatchScore({ jdText, resumeData, matchData, deepResearch, onStartInterview }) {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleStart = async () => {
    setIsGenerating(true)
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      const res = await fetch(`${apiUrl}/api/first-question`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jd_text: jdText,
          resume_data: resumeData,
          deep_research: deepResearch
        }),
      })
      const data = await res.json()
      onStartInterview(data.question)
    } catch (error) {
      console.error('Error fetching first question:', error)
      alert("Failed to connect to AI Agent. Ensure backend is running.")
    } finally {
      setIsGenerating(false)
    }
  }

  // Determine color based on score
  const scoreColor = matchData.fit_score >= 75 ? 'text-emerald-400' 
                   : matchData.fit_score >= 50 ? 'text-amber-400' 
                   : 'text-rose-400'

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-4xl mx-auto space-y-6"
    >
      <div className="glass-panel p-8">
        <div className="flex flex-col md:flex-row items-center gap-10 mb-8">
          
          {/* Holographic Radar Scanner UI */}
          <div className="relative w-56 h-56 flex-shrink-0 flex items-center justify-center">
            {/* Spinning radar sweep */}
            <div className="absolute inset-0 rounded-full border border-teal-500/30 bg-teal-500/5"></div>
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
              className="absolute inset-0 rounded-full border-t border-teal-400 opacity-50 radar-sweep"
            ></motion.div>
            
            <svg className="w-full h-full transform -rotate-90 relative z-10" viewBox="0 0 100 100">
              <circle
                className="text-slate-800 stroke-current"
                strokeWidth="6"
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
              ></circle>
              <circle
                className={`${scoreColor} stroke-current transition-all duration-1500 ease-out`}
                strokeWidth="6"
                strokeLinecap="round"
                cx="50"
                cy="50"
                r="40"
                fill="transparent"
                style={{ filter: 'drop-shadow(0 0 8px currentColor)' }}
                strokeDasharray={`${251.2 * (matchData.fit_score / 100)} 251.2`}
              ></circle>
            </svg>
            <div className="absolute flex flex-col items-center justify-center z-20">
              <span className={`text-6xl font-black ${scoreColor} drop-shadow-md`}>
                {matchData.fit_score}
              </span>
              <span className="text-xs font-bold text-teal-300 uppercase tracking-widest mt-1 opacity-80">
                Match Score
              </span>
            </div>
          </div>

          {/* Reasoning & Deep Research */}
          <div className="flex-1 space-y-6">
            <div>
              <h2 className="text-2xl font-bold tracking-wide text-white flex items-center mb-3">
                <span className="w-2 h-6 bg-teal-500 rounded-full mr-3 animate-pulse"></span>
                Match Overview
              </h2>
              <p className="text-slate-300 leading-relaxed text-sm bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 block-cyber whitespace-pre-line">
                {stripMarkdown(matchData.reasoning)}
              </p>
            </div>
            
            {(matchData.missing_skills?.length > 0 || deepResearch?.hidden_market_requirements?.length > 0) && (
              <div className="bg-rose-950/20 rounded-xl p-5 border border-rose-500/20 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-rose-500"></div>
                <div className="flex items-center text-rose-400 font-semibold mb-3 text-sm">
                  <AlertTriangle size={16} className="mr-2" />
                  Identified Gaps & Implicit Requirements
                </div>
                <div className="flex flex-wrap gap-2">
                  {matchData.missing_skills?.map((skill, i) => (
                    <span key={`missing-${i}`} className="px-3 py-1 bg-rose-500/10 text-rose-300 rounded-md text-xs font-medium border border-rose-500/30">
                      {skill}
                    </span>
                  ))}
                  {deepResearch?.hidden_market_requirements?.map((req, i) => (
                    <span key={`hidden-${i}`} className="px-3 py-1 bg-amber-500/10 text-amber-300 rounded-md text-xs font-medium border border-amber-500/30" title="Implicit Requirement">
                      🔍 {req}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center text-sm font-medium text-teal-400 bg-teal-900/20 px-4 py-2 rounded-full border border-teal-500/20">
            <CheckCircle size={16} className="mr-2" />
            Analysis Complete
          </div>
          
          <button
            onClick={handleStart}
            disabled={isGenerating}
            className="group flex items-center px-8 py-3 font-bold text-slate-900 transition-all duration-300 bg-teal-400 border border-transparent rounded-full hover:bg-teal-300 hover:shadow-[0_0_20px_rgba(45,212,191,0.5)] focus:outline-none disabled:opacity-50"
          >
            {isGenerating ? (
              <span className="flex items-center">
                <div className="w-5 h-5 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mr-3"></div>
                Preparing Interview...
              </span>
            ) : (
              <span className="flex items-center">
                <Play size={18} className="mr-2 fill-current" />
                Start Interview
              </span>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  )
}
