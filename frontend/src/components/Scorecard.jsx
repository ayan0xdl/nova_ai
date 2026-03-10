import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Award, Target, Crosshair, Zap, Compass, Briefcase, ChevronRight, Activity } from 'lucide-react'

export default function Scorecard({ evaluation, onRestart }) {
  
  // Animation states
  const [showRadar, setShowRadar] = useState(false)
  const [showRoadmap, setShowRoadmap] = useState(false)

  useEffect(() => {
    // Sequence the render
    setTimeout(() => setShowRadar(true), 500)
    setTimeout(() => setShowRoadmap(true), 1500)
  }, [])

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-400'
    if (score >= 60) return 'text-amber-400'
    return 'text-rose-400'
  }

  const getScoreBorder = (score) => {
    if (score >= 80) return 'border-emerald-500/50 shadow-[0_0_20px_rgba(52,211,153,0.3)]'
    if (score >= 60) return 'border-amber-500/50 shadow-[0_0_20px_rgba(251,191,36,0.3)]'
    return 'border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.3)]'
  }

  const recommendationColor = evaluation?.final_recommendation?.toLowerCase() === 'hire' 
    ? 'bg-emerald-500 text-slate-900 shadow-[0_0_30px_rgba(52,211,153,0.5)]' 
    : evaluation?.final_recommendation?.toLowerCase() === 'hold'
    ? 'bg-amber-500 text-slate-900 shadow-[0_0_30px_rgba(251,191,36,0.5)]'
    : 'bg-rose-500 text-white shadow-[0_0_30px_rgba(244,63,94,0.5)]'

  // Safeguard against malformed string evaluations (LLM failures)
  const isErrorState = typeof evaluation === 'string' || !evaluation
  const safeEval = isErrorState ? {} : evaluation

  // --- SVG Radar Chart Generator ---
  const radarMetrics = safeEval?.radar_metrics || {
    "Problem Solving": 50, "Technical Depth": 50, "Communication": 50, "Adaptability": 50, "System Design": 50
  }
  const metricKeys = Object.keys(radarMetrics)
  const metricValues = Object.values(radarMetrics)
  const numPoints = 5
  const center = 150
  const radius = 100

  // Calculate coordinates for a perfect pentagon (JD target - 100%)
  const targetPoints = metricKeys.map((_, i) => {
    const angle = (Math.PI * 2 * i) / numPoints - Math.PI / 2
    return {
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle)
    }
  })

  // Calculate coordinates for the Candidate's actual scores
  const candidatePoints = metricValues.map((val, i) => {
    const angle = (Math.PI * 2 * i) / numPoints - Math.PI / 2
    const r = radius * (val / 100)
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    }
  })

  const targetPath = targetPoints.map(p => `${p.x},${p.y}`).join(' ')
  const candidatePath = candidatePoints.map(p => `${p.x},${p.y}`).join(' ')

  if (isErrorState) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto py-20 text-center">
        <h2 className="text-3xl font-black text-rose-500 mb-4">Evaluation Processing Error</h2>
        <p className="text-slate-400 p-6 bg-slate-900 rounded-xl border border-slate-800">{typeof evaluation === 'string' ? evaluation : "The AI engine failed to generate a complete scorecard. This is usually due to an LLM formatting error or strict content filtering."}</p>
        <button onClick={onRestart} className="mt-8 px-6 py-3 bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 font-bold rounded-lg border border-teal-500/50 transition-colors">Start New Session</button>
      </motion.div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-6xl mx-auto space-y-8 pb-12"
    >
      {/* HUD Header */}
      <div className="glass-panel p-8 relative overflow-hidden border-t-2 border-t-teal-500/50">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/10 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row items-center justify-between relative z-10">
          <div>
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-slate-900 border border-teal-500/30 text-teal-400 text-xs font-bold mb-4 uppercase tracking-widest leading-none shadow-[0_0_10px_rgba(20,184,166,0.2)]">
              <Zap size={14} className="mr-2" /> Evaluation Complete
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-4 uppercase">
              Candidate <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-indigo-400">Profile</span>
            </h1>
            <p className="text-slate-400 max-w-2xl text-base font-light leading-relaxed p-4 bg-slate-950/60 rounded-xl border border-slate-800/50">
              {evaluation?.summary}
            </p>
          </div>
          
          <div className="mt-8 md:mt-0 flex flex-col items-center">
            <div className={`w-40 h-40 rounded-full flex items-center justify-center border-4 ${getScoreBorder(evaluation?.overall_score)} bg-slate-900/80 backdrop-blur-md relative overflow-hidden group`}>
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 group-hover:animate-pan"></div>
              <span className={`text-6xl font-black z-10 ${getScoreColor(evaluation?.overall_score)} tracking-tighter`}>
                {evaluation?.overall_score}
              </span>
            </div>
            <div className="mt-5 font-bold text-slate-500 uppercase tracking-widest text-xs tracking-[0.2em] flex items-center">
              <Crosshair size={14} className="mr-2 text-teal-500" /> Overall Score
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        
        {/* Radar Chart Panel */}
        <div className="glass-panel p-8 space-y-6 flex flex-col">
          <h2 className="text-xl font-bold text-white uppercase tracking-widest flex items-center border-b border-slate-700/50 pb-4">
            <Target className="mr-3 text-teal-400" /> Competency Radar
          </h2>
          
          <div className="flex-1 flex items-center justify-center relative min-h-[350px]">
            {showRadar ? (
              <motion.svg 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, type: 'spring' }}
                width="300" height="300" 
                viewBox="0 0 300 300"
                className="overflow-visible"
              >
                {/* Background Spoke Lines */}
                {targetPoints.map((p, i) => (
                  <line key={`spoke-${i}`} x1="150" y1="150" x2={p.x} y2={p.y} stroke="rgba(148, 163, 184, 0.2)" strokeWidth="1" />
                ))}
                
                {/* Concentric rings */}
                {[0.2, 0.4, 0.6, 0.8, 1].map((scale, i) => {
                  const ringPoints = targetPoints.map(p => {
                    const dx = p.x - center; const dy = p.y - center;
                    return `${center + dx * scale},${center + dy * scale}`
                  }).join(' ')
                  return <polygon key={`ring-${i}`} points={ringPoints} fill="none" stroke="rgba(148, 163, 184, 0.1)" strokeWidth="1" />
                })}

                {/* Target JD Polygon */}
                <polygon points={targetPath} fill="rgba(99, 102, 241, 0.05)" stroke="rgba(99, 102, 241, 0.5)" strokeWidth="1" strokeDasharray="4 4" />
                
                {/* Candidate Polygon */}
                <motion.polygon 
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                  points={candidatePath} 
                  fill="rgba(45, 212, 191, 0.2)" 
                  stroke="rgba(45, 212, 191, 0.8)" 
                  strokeWidth="2"
                  style={{ filter: 'drop-shadow(0 0 10px rgba(45, 212, 191, 0.5))' }}
                />

                {/* Data point dots */}
                {candidatePoints.map((p, i) => (
                  <circle key={`dot-${i}`} cx={p.x} cy={p.y} r="4" fill="#2dd4bf" />
                ))}

                {/* Labels */}
                {targetPoints.map((p, i) => {
                  const dx = p.x - center; const dy = p.y - center;
                  // Push labels outward
                  const lx = center + dx * 1.3; const ly = center + dy * 1.15;
                  return (
                    <text key={`label-${i}`} x={lx} y={ly} fill="#94a3b8" fontSize="10" fontWeight="bold" textAnchor="middle" dominantBaseline="middle" className="uppercase tracking-widest font-mono">
                      {metricKeys[i]} ({metricValues[i]})
                    </text>
                  )
                })}
              </motion.svg>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Activity className="text-teal-500/30 animate-pulse" size={48} />
              </div>
            )}
          </div>
        </div>

        {/* Strengths / Weaknesses block */}
        <div className="glass-panel p-8 flex flex-col space-y-8">
          <div className="flex-1">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-[0.2em] mb-4 flex items-center">
              <div className="w-2 h-2 rounded-full bg-emerald-400 mr-2 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></div> KEY STRENGTHS
            </h3>
            <ul className="space-y-3">
              {evaluation?.strengths?.map((str, i) => (
                <li key={i} className="flex items-start bg-emerald-500/5 border border-emerald-500/10 p-3 rounded-lg">
                  <span className="text-emerald-300 font-mono pr-3">{(i+1).toString().padStart(2, '0')}.</span>
                  <span className="text-slate-300 text-sm">{str}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="flex-1 pt-6 border-t border-slate-800/50">
            <h3 className="text-xs font-bold text-rose-400 uppercase tracking-[0.2em] mb-4 flex items-center">
              <div className="w-2 h-2 rounded-full bg-rose-400 mr-2 shadow-[0_0_8px_rgba(244,63,94,0.8)]"></div> AREAS FOR IMPROVEMENT
            </h3>
            <ul className="space-y-3">
              {evaluation?.areas_for_improvement?.map((area, i) => (
                <li key={i} className="flex items-start bg-rose-500/5 border border-rose-500/10 p-3 rounded-lg">
                  <span className="text-rose-300 font-mono pr-3">{(i+1).toString().padStart(2, '0')}.</span>
                  <span className="text-slate-300 text-sm">{area}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Futuristic Career Roadmap Generator */}
      <div className="glass-panel p-8 relative overflow-hidden flex flex-col">
        <h2 className="text-xl font-bold text-white uppercase tracking-widest flex items-center mb-10 border-b border-slate-700/50 pb-4">
          <Compass className="mr-3 text-indigo-400" /> Recommended Career Roadmap
        </h2>
        
        {showRoadmap ? (
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative w-full pt-4 pb-8">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-[28px] left-[10%] right-[10%] h-0.5 bg-slate-800 z-0"></div>
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: '80%' }}
              transition={{ duration: 1.5, delay: 0.2 }}
              className="hidden md:block absolute top-[28px] left-[10%] h-0.5 bg-gradient-to-r from-teal-500 via-indigo-500 to-rose-500 z-0 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
            ></motion.div>

            {evaluation?.roadmap_steps?.map((step, index) => (
              <motion.div 
                key={`roadmap-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.4 }}
                className="relative z-10 flex flex-col items-center flex-1 w-full mb-8 md:mb-0"
              >
                <div className={`w-14 h-14 rounded-full flex items-center justify-center border-4 border-slate-900 bg-slate-800 shadow-xl mb-4 
                  ${index === 0 ? 'text-teal-400 border-t-teal-500' : index === 1 ? 'text-indigo-400 border-t-indigo-500' : 'text-rose-400 border-t-rose-500'}`}>
                  <span className="font-black text-lg">{index + 1}</span>
                </div>
                <h4 className="font-mono text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 border border-slate-700 px-3 py-1 bg-slate-900/50 rounded-full">{step.timeframe}</h4>
                <p className="text-sm text-slate-300 text-center max-w-[250px] leading-relaxed bg-slate-900/30 p-3 rounded-lg border border-slate-800/50 shadow-inner">
                  {step.focus}
                </p>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="w-full py-12 flex items-center justify-center">
            <span className="font-mono text-sm text-slate-500 uppercase tracking-widest animate-pulse flex items-center">
              <Activity size={16} className="mr-2" /> Generating Roadmap...
            </span>
          </div>
        )}
      </div>

      {/* Final Recommendation */}
      <div className="glass-panel p-8 flex flex-col md:flex-row items-center justify-between overflow-hidden relative border-b-2 border-b-slate-700 block-cyber">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-slate-800/20 to-transparent"></div>
        <div className="relative z-10 w-full flex flex-col md:flex-row items-center justify-between text-center md:text-left">
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-[0.25em] flex items-center justify-center md:justify-start mb-2">
              <Briefcase size={14} className="mr-2 text-indigo-400" /> Final Decision
            </h2>
            <p className="text-white text-lg font-light">Based on comprehensive interview analysis.</p>
          </div>
          
          <div className="mt-6 md:mt-0 font-black text-3xl md:text-5xl uppercase tracking-tighter">
            <div className={`px-12 py-5 rounded-tr-3xl rounded-bl-3xl rounded-tl-md rounded-br-md ${recommendationColor} transition-all`}>
              {evaluation?.final_recommendation}
            </div>
          </div>
        </div>
      </div>

      {/* New Candidate-Centric Innovations */}
      <div className="grid md:grid-cols-2 gap-8 pt-4">
        {/* Market Value Estimator */}
        <div className="glass-panel p-6 border-l-4 border-l-emerald-500 flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <span className="text-6xl font-black text-emerald-500">$</span>
          </div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center">
            Live Market Value Estimate
          </h3>
          <p className="text-3xl font-black text-emerald-400 tracking-tight">
            {evaluation?.market_value_estimate || "Calculating..."}
          </p>
          <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-wide">
            Based on demonstrated technical depth & current industry compensation data.
          </p>
        </div>

        {/* Alternative Career Pivot */}
        <div className="glass-panel p-6 border-l-4 border-l-indigo-500 flex flex-col justify-center relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Compass size={64} className="text-indigo-500" />
          </div>
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center">
            Alternative Role Pivot Match
          </h3>
          <p className="text-xl font-bold text-indigo-400 leading-tight">
            {evaluation?.alternative_role_pivot || "Analyzing optimal vectors..."}
          </p>
          <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-wide">
            AI-suggested optimal career path based on interview performance.
          </p>
        </div>
      </div>

      <div className="flex justify-center pt-8">
        <button 
          onClick={onRestart}
          className="group relative flex items-center px-8 py-4 font-bold text-teal-400 bg-transparent border border-teal-500/50 hover:bg-teal-500/10 rounded-none shadow-[0_0_15px_rgba(20,184,166,0.1)] transition-all uppercase tracking-widest overflow-hidden block-cyber"
        >
          <div className="absolute inset-0 w-full h-full border-2 border-teal-500 opacity-0 group-hover:opacity-100 group-hover:scale-105 transition-all"></div>
          Start New Interview <ChevronRight size={18} className="ml-2 group-hover:translate-x-2 transition-transform" />
        </button>
      </div>

    </motion.div>
  )
}
