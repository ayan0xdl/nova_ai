import { useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, FileText, CheckCircle, Zap, Cpu, Scan } from 'lucide-react'

export default function UploadSection({ onUploadComplete }) {
  const [jdText, setJdText] = useState('')
  const [resumeFile, setResumeFile] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setResumeFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!jdText || !resumeFile) return
    
    setIsUploading(true)
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
      
      // 1. Upload Resume
      const formData = new FormData()
      formData.append('file', resumeFile)
      
      const uploadRes = await fetch(`${apiUrl}/api/upload-resume`, {
        method: 'POST',
        body: formData,
      })
      const uploadData = await uploadRes.json()
      
      // 2. Match JD & Deep Research
      const matchRes = await fetch(`${apiUrl}/api/match-jd`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jd_text: jdText,
          resume_data: uploadData.data
        }),
      })
      const matchData = await matchRes.json()
      
      onUploadComplete(jdText, uploadData.data, matchData.result, matchData.deep_research)
    } catch (error) {
      console.error('Error in upload process:', error)
      alert("Failed to process data. Ensure backend is active.")
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto"
    >
      <div className="text-center mb-12 relative z-10">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
          className="w-20 h-20 mx-auto mb-6 relative flex items-center justify-center p-4 rounded-full border border-teal-500/30 bg-slate-900 shadow-[0_0_30px_rgba(20,184,166,0.15)]"
        >
          <Cpu size={40} className="text-teal-400 absolute" />
          <div className="absolute inset-2 border border-dashed border-teal-500/50 rounded-full"></div>
        </motion.div>
        
        <h1 className="text-5xl md:text-6xl font-black tracking-tighter mb-4 text-white">
          NOVA <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-indigo-400">AI</span>
        </h1>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto font-light tracking-wide">
          Upload candidate resume and job requirements to generate a dynamic, intelligent interview session.
        </p>
      </div>

      <div className="glass-panel p-8 md:p-10 relative overflow-hidden">
        {/* Decorative corner accents */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-teal-500/50"></div>
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-teal-500/50"></div>
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-teal-500/50"></div>
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-teal-500/50"></div>

        <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Job Description Terminal Input */}
            <div className="space-y-3 group">
              <label className="flex items-center text-xs font-bold text-teal-500 uppercase tracking-widest">
                <FileText size={16} className="mr-2" />
                Input Job Description [JD]
              </label>
              <div className="relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-teal-500/50 transition-all group-focus-within:bg-teal-400 shadow-[0_0_10px_rgba(20,184,166,0.5)]"></div>
                <textarea
                  required
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  placeholder="Paste job description and requirements here."
                  className="w-full h-64 p-5 pl-6 bg-slate-950/80 border border-slate-700 focus:outline-none focus:border-teal-500/50 resize-none transition-colors text-slate-300 font-mono text-sm shadow-inner"
                />
              </div>
            </div>

            {/* Resume Upload Dropzone */}
            <div className="space-y-3 relative group">
              <label className="flex items-center text-xs font-bold text-indigo-400 uppercase tracking-widest">
                <Scan size={16} className="mr-2" />
                Upload Resume [CV]
              </label>
              
              <div 
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`w-full h-64 border-2 border-dashed flex flex-col items-center justify-center p-6 text-center transition-all duration-300 relative overflow-hidden bg-slate-950/80 ${
                  dragActive 
                    ? "border-teal-400 bg-teal-900/10 shadow-[0_0_20px_rgba(20,184,166,0.2)]" 
                    : resumeFile ? "border-indigo-500/50" : "border-slate-700 hover:border-slate-500"
                }`}
              >
                <input
                  type="file"
                  accept=".pdf,.docx"
                  required={!resumeFile}
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                />
                
                {/* Scanning Animation line inside dropzone */}
                {isUploading && (
                  <motion.div 
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                    className="absolute left-0 right-0 h-1 bg-teal-400 shadow-[0_0_15px_rgba(45,212,191,1)] z-10"
                  ></motion.div>
                )}

                {!resumeFile ? (
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 mb-4 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload size={24} className="text-slate-400 group-hover:text-teal-400" />
                    </div>
                    <p className="font-mono text-slate-300 mb-1 tracking-wide">Drag & Drop Resume Here</p>
                    <p className="font-mono text-[10px] text-slate-500 uppercase tracking-widest">Accepted limits: PDF/DOCX ~5MB</p>
                  </div>
                ) : (
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-16 h-16 mb-4 rounded-full bg-indigo-900/50 border border-indigo-500 flex items-center justify-center">
                      <CheckCircle size={32} className="text-indigo-400" />
                    </div>
                    <p className="font-mono font-bold text-white mb-1 line-clamp-1 px-4">
                      {resumeFile.name}
                    </p>
                    <p className="font-mono text-xs text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-3 py-1 mt-2 rounded border border-indigo-500/20">File Uploaded</p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-6 block-cyber">
            <button
              type="submit"
              disabled={!jdText || !resumeFile || isUploading}
              className="relative group flex items-center justify-center px-10 py-5 font-bold text-slate-900 transition-all duration-300 bg-teal-400 border border-transparent hover:bg-teal-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(20,184,166,0.4)] w-full md:w-auto overflow-hidden uppercase tracking-widest"
              style={{ clipPath: 'polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px)' }}
            >
              {/* Button Glitch/Shine effect */}
              <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"></div>
              
              {isUploading ? (
                <span className="flex items-center relative z-10">
                  <span className="flex space-x-1 mr-3">
                    <span className="w-1 h-4 bg-slate-900 animate-pulse"></span>
                    <span className="w-1 h-4 bg-slate-900 animate-pulse delay-75"></span>
                    <span className="w-1 h-4 bg-slate-900 animate-pulse delay-150"></span>
                  </span>
                  Analyzing Match...
                </span>
              ) : (
                <span className="flex items-center relative z-10">
                  <Zap size={18} className="mr-3 fill-current" />
                  Analyze Candidate
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  )
}
