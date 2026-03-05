import { useState, useEffect, useRef } from 'react'
import { 
  Play, BookOpen, Image as ImageIcon, Mic, 
  MessageSquare, ChevronRight, CheckCircle, 
  RefreshCw, Award, Volume2, User, Search,
  Zap, Star, ThumbsUp, Sparkles, Send,
  Users, Monitor, Settings, Clock, GraduationCap,
  PenTool, Download, Palette, X, Eye, EyeOff
} from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import confetti from 'canvas-confetti'
import { chatWithDeepSeek } from './services/ai'
import { evaluateRecite, evaluateReciteAudio } from './services/recite'

function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// Mock Data
const COURSES = [
  { 
    id: 1, 
    title: '从军行', 
    author: '王昌龄 (唐)', 
    type: '古诗', 
    content: [
      '青海长云暗雪山，',
      '孤城遥望玉门关。',
      '黄沙百战穿金甲，',
      '不破楼兰终不还。'
    ],
    videoUrl: '/videos/congjunxing.mp4',
    meaning: '青海湖上空的乌云遮暗了雪山，遥望着孤城玉门关。守边将士身经百战，铠甲都磨穿了，但若不攻破楼兰绝不回家。',
    background: '《从军行七首》是唐代诗人王昌龄的组诗作品。第四首表现了守边将士的爱国激情和破敌立功的坚定决心。',
    images: [
      '/images/congjunxing.jpg', 
    ],
    completed: true
  },
  { 
    id: 2, 
    title: '春晓', 
    author: '孟浩然', 
    type: '古诗',
    content: [
      '春眠不觉晓，',
      '处处闻啼鸟。',
      '夜来风雨声，',
      '花落知多少。'
    ],
    videoUrl: '',
    meaning: '春日里贪睡不知不觉天已破晓，到处都可以听到鸟儿的啼叫声。回想昨夜的阵阵风雨声，吹落了多少芳香的春花。',
    background: '《春晓》是唐代诗人孟浩然隐居在鹿门山时所作。',
    images: [
      'https://images.unsplash.com/photo-1490750967868-58cb75062ed0?q=80&w=1000&auto=format&fit=crop',
    ],
    completed: false
  },
  { 
    id: 3, 
    title: '匆匆 (节选)', 
    author: '朱自清', 
    type: '现代文',
    content: [
      '燕子去了，有再来的时候；',
      '杨柳枯了，有再青的时候；',
      '桃花谢了，有再开的时候。',
      '但是，聪明的，你告诉我，',
      '我们的日子为什么一去不复返呢？'
    ],
    videoUrl: '',
    meaning: '文章紧扣“匆匆”二字，细腻地刻画了时间流逝的踪迹，表达了作者对时光流逝的无奈和惋惜。',
    background: '《匆匆》是现代散文家朱自清写的一篇脍炙人口的散文。',
    images: [
      'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=1000&auto=format&fit=crop',
    ],
    completed: false
  }
]

const ASSISTANT_PERSONAS = [
  {
    id: 'pageboy',
    name: '小书童',
    tag: '古风伴读',
    icon: '📜',
    systemPrompt: `你是一位中国古代的“智能小书童”，名叫“小书童”，负责辅助语文教学与背诵。
说话可古风，但要清晰好懂；称呼对方为“老师”。
回答尽量精炼，通常不超过100字。`
  },
  {
    id: 'teacher',
    name: '语文老师',
    tag: '课堂讲解',
    icon: '👩‍🏫',
    systemPrompt: `你是一名小学语文老师，擅长用简单语言解释诗文与写作技巧。
回答结构清晰：先结论，再一句话例子；称呼“老师”。
回答尽量精炼，通常不超过120字。`
  },
  {
    id: 'appreciator',
    name: '诗词鉴赏家',
    tag: '意境赏析',
    icon: '🪶',
    systemPrompt: `你是一位诗词鉴赏家，擅长讲意象、情绪与意境层次，但不堆砌术语。
称呼“老师”，用1-2个关键词点题，再给简短解释。
回答尽量精炼，通常不超过120字。`
  },
  {
    id: 'coach',
    name: '背诵教练',
    tag: '背诵训练',
    icon: '🎯',
    systemPrompt: `你是一位背诵训练教练，擅长把诗文拆成节奏、停顿与记忆钩子。
称呼“老师”，给出可执行的1-3步训练法。
回答尽量精炼，通常不超过120字。`
  },
  {
    id: 'examiner',
    name: '小考官',
    tag: '随堂出题',
    icon: '📝',
    systemPrompt: `你是一位严格但友善的小考官，擅长出选择题/填空题并给出一句解析。
称呼“老师”，先给题目，再给答案与解析（尽量短）。
回答尽量精炼，通常不超过140字。`
  },
  {
    id: 'storyteller',
    name: '故事讲解员',
    tag: '情景带入',
    icon: '🎬',
    systemPrompt: `你是一位故事讲解员，擅长用画面感把诗文讲成一个短场景，帮助学生记忆。
称呼“老师”，用2-4句短句描述场景即可。
回答尽量精炼，通常不超过140字。`
  }
]

const THEMES = [
  { id: 'paper', label: '纸感' },
  { id: 'classroom', label: '课堂' },
  { id: 'ink', label: '水墨' },
]

const WORKSHOP_DAILY_LIMIT = 10

function getLocalISODate() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function App() {
  const [activeCourse, setActiveCourse] = useState(COURSES[0])
  const [activeMode, setActiveMode] = useState('video') // video, recite, ai-draw
  const [reciteSubMode, setReciteSubMode] = useState('image') // image, no-image
  const [assistantPersonaId, setAssistantPersonaId] = useState(ASSISTANT_PERSONAS[0].id)
  const [aiMessages, setAiMessages] = useState([
    { role: 'assistant', content: '王老师，您好！我是您的智能助教。本节课《静夜思》的教学重点已准备好。' }
  ])
  const [isRecording, setIsRecording] = useState(false)
  const [isEvaluating, setIsEvaluating] = useState(false)
  const [reciteText, setReciteText] = useState('')
  const [showEvaluation, setShowEvaluation] = useState(false)
  const [inputMessage, setInputMessage] = useState('')
  const [revealedLines, setRevealedLines] = useState(0) // Control how many lines are revealed
  const [activeTab, setActiveTab] = useState('course') // 'course' or 'workshop'
  const [artStyle, setArtStyle] = useState('') // Selected art style
  
  // Workshop State
  const [workshopStep, setWorkshopStep] = useState('course-selection') // 'course-selection', 'config', 'generating', 'result'
  const [workshopConfig, setWorkshopConfig] = useState({
    courseId: null,
    template: '',
    scope: '',
    element: ''
  })
  const [workshopQuestion, setWorkshopQuestion] = useState('template') // 'template' | 'scope' | 'element'
  const [showRecognizedText, setShowRecognizedText] = useState(false)
  const [themeId, setThemeId] = useState(() => {
      try {
        return localStorage.getItem('app-theme') || 'paper'
    } catch {
      return 'paper'
    }
  })
  const [isAssistantCollapsed, setIsAssistantCollapsed] = useState(false)
  const [workshopQuota, setWorkshopQuota] = useState(() => {
    const today = getLocalISODate()
    try {
      const raw = localStorage.getItem('workshop-quota')
      const parsed = raw ? JSON.parse(raw) : null
      if (parsed && parsed.date === today && typeof parsed.used === 'number') return parsed
    } catch {
    }
    return { date: today, used: 0 }
  })
  const [savedDrawings, setSavedDrawings] = useState([])

  const handleSaveDrawing = (course, imageUrl) => {
    // In a real app, this would save to backend/DB
    // Here we simulate saving to user's portfolio
    const newDrawing = {
      id: Date.now(),
      courseTitle: course.title,
      imageUrl,
      date: getLocalISODate(),
      style: workshopConfig.template === 'comic' ? '连环画' : '速记'
    }
    setSavedDrawings(prev => [newDrawing, ...prev])
    
    // Simulate download
    const link = document.createElement('a')
    link.href = imageUrl
    link.download = `${course.title}-AI创作.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    setAiMessages(prev => [
        ...prev,
        { role: 'assistant', content: `🎉 作品已保存！我也帮你把它收录进【学情档案】啦，快去看看吧！` }
    ])
  }
  const [workshopQuotaNotice, setWorkshopQuotaNotice] = useState('')
   
   const [showReportModal, setShowReportModal] = useState(false)

  const [reportType, setReportType] = useState('single') // single, class, weekly, monthly
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [isAiLoading, setIsAiLoading] = useState(false)
  const didInitPersonaRef = useRef(false)

  // Ref for scrolling chat to bottom
  const chatEndRef = useRef(null)
  const videoRef = useRef(null)
  const speechRecognitionRef = useRef(null)
  const reciteStartMsRef = useRef(0)
  const mediaRecorderRef = useRef(null)
  const mediaChunksRef = useRef([])
  const mediaStreamRef = useRef(null)

  const activePersona = ASSISTANT_PERSONAS.find(p => p.id === assistantPersonaId) || ASSISTANT_PERSONAS[0]

  useEffect(() => {
    try {
      document.documentElement.dataset.theme = themeId
      localStorage.setItem('app-theme', themeId)
    } catch {
    }
  }, [themeId])

  useEffect(() => {
    if (activeTab !== 'workshop') return
    const today = getLocalISODate()
    if (workshopQuota.date === today) return
    const next = { date: today, used: 0 }
    setWorkshopQuota(next)
    setWorkshopQuotaNotice('')
    try {
      localStorage.setItem('workshop-quota', JSON.stringify(next))
    } catch {
    }
  }, [activeTab, workshopQuota.date])

  const handleTimeJump = (time) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
      videoRef.current.play().catch(() => {})
    }
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [aiMessages, isAiLoading])

  // Reset state when course changes
  useEffect(() => {
    setRevealedLines(0)
    setShowEvaluation(false)
    setAiMessages([
      { role: 'assistant', content: `老师好，我是${activePersona.name}。已为您备好《${activeCourse.title}》教学资源，建议先看视频，再逐句朗读。` }
    ])
  }, [activeCourse])

  useEffect(() => {
    if (!didInitPersonaRef.current) {
      didInitPersonaRef.current = true
      return
    }
    setAiMessages(prev => [
      ...prev,
      { role: 'assistant', content: `身份已切换：${activePersona.icon}${activePersona.name}（${activePersona.tag}）` }
    ])
  }, [assistantPersonaId])

  // Reset workshop when tab changes
  useEffect(() => {
    if (activeTab === 'workshop') {
       // If coming from "Reward" button (showEvaluation is true), pre-select the current course
       if (showEvaluation) {
         setWorkshopStep('config')
         setWorkshopConfig({ courseId: activeCourse.id, template: '', scope: '', element: '' })
         setWorkshopQuestion('template')
       } else {
         setWorkshopStep('course-selection')
         setWorkshopConfig({ courseId: null, template: '', scope: '', element: '' })
         setWorkshopQuestion('template')
       }
    }
  }, [activeTab, showEvaluation, activeCourse.id])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isAiLoading) return
    
    const newMessages = [...aiMessages, { role: 'user', content: inputMessage }]
    setAiMessages(newMessages)
    setInputMessage('')
    setIsAiLoading(true)
    
    try {
      // Add context about the current course
      const contextMessage = {
        role: 'system',
        content: `当前正在学习的课程是《${activeCourse.title}》，作者${activeCourse.author}。内容是：${activeCourse.content.join('，')}。含义：${activeCourse.meaning}。背景：${activeCourse.background}。`
      }
      
      const response = await chatWithDeepSeek([contextMessage, ...newMessages], { systemPrompt: activePersona.systemPrompt })
      setAiMessages(prev => [...prev, { role: 'assistant', content: response }])
    } catch (error) {
      console.error('Failed to get AI response:', error)
      setAiMessages(prev => [...prev, { role: 'assistant', content: '小书童今日有些疲乏，请稍后再试。' }])
    } finally {
      setIsAiLoading(false)
    }
  }

  const [evaluationData, setEvaluationData] = useState({
    score: 0,
    title: '',
    comment: '',
    details: [],
    audioUrl: ''
  })

  const generateEvaluation = (course) => {
    // Mock random performance data
    const scores = [98, 95, 92, 100]
    const score = scores[Math.floor(Math.random() * scores.length)]
    
    const titles = [
      { name: '边塞小诗人', icon: '🏰', color: 'text-[var(--app-accent)]', bg: 'bg-[var(--app-accent-soft-bg)]' },
      { name: '韵律大师', icon: '🎵', color: 'text-[var(--app-primary)]', bg: 'bg-[var(--app-primary-soft-bg)]' },
      { name: '情感影帝', icon: '🎭', color: 'text-[var(--app-accent)]', bg: 'bg-[var(--app-accent-soft-bg)]' },
      { name: '记忆神童', icon: '🧠', color: 'text-emerald-700', bg: 'bg-emerald-100' }
    ]
    const title = titles[Math.floor(Math.random() * titles.length)]

    const comments = [
      `读到“${course.content[0].substring(0, 4)}”时，你的语速控制得太棒了！仿佛真的看到了${course.title}中的画面。`,
      `哇！特别是最后一句“${course.content[3]}”，那股豪迈的气势被你完全展现出来了！`,
      `整体节奏感非常强，尤其是在第二句的停顿处理上，简直是教科书级别的！`,
      `你的声音充满了感情，把诗人那种${course.meaning.substring(0, 10)}...的情感表达得淋漓尽致。`
    ]
    const comment = comments[Math.floor(Math.random() * comments.length)]

    return {
      score,
      title,
      comment,
      details: [
        { label: '准确度', value: '100%', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-100' },
        { label: '流畅度', value: 'S级', color: 'text-[var(--app-primary)]', bg: 'bg-[var(--app-primary-soft-bg)]', border: 'border-[var(--app-primary-soft-border)]' },
        { label: '情感', value: '充沛', color: 'text-[var(--app-accent)]', bg: 'bg-[var(--app-accent-soft-bg)]', border: 'border-[var(--app-accent-soft-border)]' }
      ]
    }
  }

  const startSpeechRecognition = () => {
    if (speechRecognitionRef.current) return
    const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!Ctor) return
    const recognition = new Ctor()
    recognition.lang = 'zh-CN'
    recognition.interimResults = true
    recognition.continuous = true
    recognition.maxAlternatives = 1
    recognition.onresult = (event) => {
      let text = ''
      for (let i = 0; i < event.results.length; i++) {
        text += event.results[i][0]?.transcript || ''
      }
      setReciteText(text.trim())
    }
    recognition.onerror = () => {
      try {
        recognition.stop()
      } catch {
      }
      speechRecognitionRef.current = null
    }
    recognition.onend = () => {
      if (isRecording && speechRecognitionRef.current === recognition) {
        try {
          recognition.start()
        } catch {
        }
      }
    }
    speechRecognitionRef.current = recognition
    try {
      recognition.start()
    } catch {
    }
  }

  const stopSpeechRecognition = () => {
    const recognition = speechRecognitionRef.current
    speechRecognitionRef.current = null
    if (!recognition) return
    try {
      recognition.onresult = null
      recognition.onerror = null
      recognition.onend = null
      recognition.stop()
    } catch {
    }
  }

  const startAudioRecording = async () => {
    if (!navigator?.mediaDevices?.getUserMedia || !window.MediaRecorder) return false
    if (mediaRecorderRef.current) return true

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaStreamRef.current = stream
    mediaChunksRef.current = []

    const preferredTypes = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg'
    ]
    const mimeType = preferredTypes.find((t) => window.MediaRecorder.isTypeSupported?.(t)) || ''
    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
    recorder.ondataavailable = (e) => {
      if (e?.data && e.data.size > 0) mediaChunksRef.current.push(e.data)
    }
    recorder.start(200)
    mediaRecorderRef.current = recorder
    return true
  }

  const stopAudioRecording = () => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current
      mediaRecorderRef.current = null
      const stream = mediaStreamRef.current
      mediaStreamRef.current = null

      const finalize = () => {
        try {
          stream?.getTracks?.().forEach((t) => t.stop())
        } catch {
        }
        const chunks = mediaChunksRef.current || []
        mediaChunksRef.current = []
        if (!chunks.length) return resolve(null)
        resolve(new Blob(chunks, { type: chunks[0]?.type || 'audio/webm' }))
      }

      if (!recorder) return finalize()
      try {
        recorder.onstop = () => finalize()
        recorder.stop()
      } catch {
        finalize()
      }
    })
  }

  const handleEvaluateByText = async () => {
    if (isEvaluating) return
    if (!reciteText.trim()) return
    const durationSec = Math.max(0.5, (Date.now() - reciteStartMsRef.current) / 1000)
    setIsEvaluating(true)
    try {
      const result = await evaluateRecite({
        itemId: activeCourse.id,
        recognizedText: reciteText,
        durationSec
      })
      const ui = result.ui || {}
      setEvaluationData({
        ...ui,
        improvement: result.feedback?.improvement || ''
      })
      setShowEvaluation(true)
      setReciteText(result.asr?.text || reciteText)
      setAiMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `【背诵评测（文本）】\n${result.feedback?.comment || ''}\n恭喜获得“${ui.title?.name || '小冠军'}”称号！`
        }
      ])
    } catch (error) {
      setAiMessages(prev => [
        ...prev,
        { role: 'assistant', content: `评测失败：${error?.message || '请稍后重试'}` }
      ])
      setShowEvaluation(false)
    } finally {
      setIsEvaluating(false)
    }
  }

  const handleRecordToggle = async () => {
    if (isEvaluating) return
    if (isRecording) {
      setIsRecording(false)
      stopSpeechRecognition()
      const durationSec = Math.max(0.5, (Date.now() - reciteStartMsRef.current) / 1000)
      setIsEvaluating(true)
      try {
        const audioBlob = await stopAudioRecording()
        const result = audioBlob
          ? await evaluateReciteAudio({ itemId: activeCourse.id, audioBlob, durationSec, recognizedText: reciteText })
          : await evaluateRecite({ itemId: activeCourse.id, recognizedText: reciteText, durationSec })
        const ui = result.ui || {}
        setEvaluationData({
          ...ui,
          improvement: result.feedback?.improvement || ''
        })
        setShowEvaluation(true)
        setReciteText(result.asr?.text || reciteText)
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#FFD700', '#FF69B4', '#00BFFF']
        })
        setAiMessages(prev => [
          ...prev,
          {
            role: 'assistant',
            content: `【背诵评测】\n${result.feedback?.comment || ''}\n恭喜获得“${ui.title?.name || '小冠军'}”称号！`
          }
        ])
      } catch (error) {
        setAiMessages(prev => [
          ...prev,
          { role: 'assistant', content: `评测没连上服务：${error?.message || '请稍后重试'}` }
        ])
        setShowEvaluation(false)
      } finally {
        setIsEvaluating(false)
      }
    } else {
      reciteStartMsRef.current = Date.now()
      setReciteText('')
      setIsRecording(true)
      setShowEvaluation(false)
      try {
        await startAudioRecording()
      } catch (e) {
        setAiMessages(prev => [
          ...prev,
          { role: 'assistant', content: `麦克风权限获取失败：${e?.message || '请允许麦克风权限'}` }
        ])
        setIsRecording(false)
        return
      }
      startSpeechRecognition()
    }
  }

  // Updated Hint Logic: Line by Line
  const handleRevealNextLine = () => {
    if (revealedLines < activeCourse.content.length) {
      setRevealedLines(prev => prev + 1)
    }
  }

  const handleHideHints = () => {
    setRevealedLines(0)
  }

  const handleGenerateImage = () => {
    if (!workshopConfig.template || !workshopConfig.scope) return
    if (workshopConfig.scope === 'single' && !workshopConfig.element) return

    const today = getLocalISODate()
    const usedToday = workshopQuota.date === today ? workshopQuota.used : 0
    const remaining = WORKSHOP_DAILY_LIMIT - usedToday
    if (remaining <= 0) {
      setWorkshopQuotaNotice('今日创作次数已用完')
      return
    }
    setWorkshopQuotaNotice('')
    setWorkshopQuota(prev => {
      const base = prev.date === today ? prev : { date: today, used: 0 }
      const next = { date: today, used: Math.min(WORKSHOP_DAILY_LIMIT, base.used + 1) }
      try {
        localStorage.setItem('workshop-quota', JSON.stringify(next))
      } catch {
      }
      return next
    })
    setIsGeneratingImage(true)
    setWorkshopStep('generating')
    
    setTimeout(() => {
      setIsGeneratingImage(false)
      setWorkshopStep('result')
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#FF69B4', '#00BFFF']
      })
    }, 3000)
  }

  // Workshop Config Handler
  const updateWorkshopConfig = (key, value) => {
    setWorkshopConfig(prev => ({ ...prev, [key]: value }))
  }

  const selectCourseForWorkshop = (course) => {
    if (!course.completed) return
    setWorkshopConfig({
        courseId: course.id,
        template: '',
        scope: '',
        element: ''
    })
    setWorkshopQuestion('template')
    setWorkshopStep('config')
  }

  const ScholarAvatar = ({ emotion = 'happy', onClick }) => {
    const [internalEmotion, setInternalEmotion] = useState(emotion)
    const [animationClass, setAnimationClass] = useState('')

    useEffect(() => {
      setInternalEmotion(emotion)
    }, [emotion])

    const handleClick = () => {
      // Trigger animation
      setAnimationClass('animate-bounce')
      // Random emotion
      const emotions = ['happy', 'excited', 'surprised']
      const randomEmotion = emotions[Math.floor(Math.random() * emotions.length)]
      setInternalEmotion(randomEmotion)
      
      // Reset after animation
      setTimeout(() => {
          setAnimationClass('')
          setInternalEmotion(emotion)
      }, 1000)
      
      if (onClick) onClick()
    }

    return (
      <div 
        className={cn("relative w-24 h-24 cursor-pointer transition-transform duration-300", animationClass)}
        onClick={handleClick}
      >
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl filter">
        <defs>
          <linearGradient id="skin" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFE0BD" />
            <stop offset="100%" stopColor="#FFCD94" />
          </linearGradient>
          <linearGradient id="hat" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4F46E5" />
            <stop offset="100%" stopColor="#3730A3" />
          </linearGradient>
        </defs>
        
        {/* Hair Back */}
        <path d="M20,50 Q10,60 15,80 Q20,90 30,90 L70,90 Q80,90 85,80 Q90,60 80,50" fill="#1A1A1A" />
        
        {/* Face */}
        <circle cx="50" cy="55" r="35" fill="url(#skin)" />
        
        {/* Ears */}
        <circle cx="16" cy="58" r="6" fill="url(#skin)" />
        <circle cx="84" cy="58" r="6" fill="url(#skin)" />
        
        {/* Hat (Scholar Cap) */}
        <path d="M20,35 Q50,15 80,35 L85,25 Q50,5 15,25 Z" fill="url(#hat)" />
        <rect x="25" y="20" width="50" height="20" rx="5" fill="url(#hat)" />
        <circle cx="50" cy="20" r="4" fill="#FCD34D" />
        {/* Hat Wings */}
        <path d="M15,28 L5,25 Q0,28 5,31 L15,28" fill="#3730A3" stroke="#1A1A1A" strokeWidth="1"/>
        <path d="M85,28 L95,25 Q100,28 95,31 L85,28" fill="#3730A3" stroke="#1A1A1A" strokeWidth="1"/>

        {/* Hair Front (Bangs) */}
        <path d="M25,40 Q35,50 50,42 Q65,50 75,40" fill="none" stroke="#1A1A1A" strokeWidth="3" strokeLinecap="round" />

        {/* Eyes */}
        <g className="animate-[blink_4s_infinite]">
          <circle cx="38" cy="58" r="3" fill="#1A1A1A" />
          <circle cx="62" cy="58" r="3" fill="#1A1A1A" />
        </g>
        
        {/* Cheeks */}
        <circle cx="30" cy="65" r="4" fill="#FFB6C1" opacity="0.6" />
        <circle cx="70" cy="65" r="4" fill="#FFB6C1" opacity="0.6" />

        {/* Mouth */}
        {internalEmotion === 'happy' && (
          <path d="M40,70 Q50,78 60,70" fill="none" stroke="#1A1A1A" strokeWidth="2" strokeLinecap="round" />
        )}
        {internalEmotion === 'excited' && (
           <path d="M40,70 Q50,85 60,70" fill="#FF9999" stroke="#1A1A1A" strokeWidth="1" />
        )}
        {internalEmotion === 'surprised' && (
           <circle cx="50" cy="75" r="5" fill="none" stroke="#1A1A1A" strokeWidth="2" />
        )}
      </svg>
      
      {/* Interactive Element: Hand waving or holding book */}
      <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-[var(--app-border)] animate-bounce">
        <span className="text-lg">📜</span>
      </div>
    </div>
    )
  }

  const renderCombinedRightCard = () => (
    <div className="bg-white rounded-3xl overflow-hidden shadow-xl border border-slate-100 transition-all duration-500 hover:shadow-2xl hover:scale-[1.01] group relative">
      {/* Decorative Background - Glassmorphism Style */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-slate-900 via-slate-800 to-amber-800">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent"></div>
        
        {/* Floating shapes for decoration */}
        <div className="absolute top-4 left-4 w-12 h-12 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-10 right-8 w-20 h-20 bg-amber-200/20 rounded-full blur-xl"></div>
      </div>
      
      {/* Avatar Header Section */}
      <div className="relative pt-8 px-6 pb-4 z-10 flex flex-col items-center">
        <div className="transform transition-transform duration-500 group-hover:scale-105 group-hover:-translate-y-1">
           <ScholarAvatar emotion={showEvaluation ? 'excited' : 'happy'} />
        </div>
        
        <div className="text-center mt-2">
          <h3 className="font-bold text-xl text-slate-800 tracking-tight">Hi, 我是{activePersona.name}</h3>
          <div className="mt-2 inline-flex items-center gap-2 px-4 py-1.5 bg-slate-50 border border-slate-200 rounded-full shadow-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <span className="text-xs font-bold text-slate-700">
              {showEvaluation ? '正在为您喝彩！🎉' : '全神贯注伴读中...'}
            </span>
          </div>

          <div className="mt-3 flex justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-white/70 border border-white/40 shadow-sm backdrop-blur-md">
              <span className="text-xs font-bold text-slate-600">身份</span>
              <select
                value={assistantPersonaId}
                onChange={(e) => setAssistantPersonaId(e.target.value)}
                className="text-xs font-bold text-slate-900 bg-transparent outline-none"
              >
                {ASSISTANT_PERSONAS.map(p => (
                  <option key={p.id} value={p.id}>{p.icon} {p.name} · {p.tag}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Content Body: Either Chat or Evaluation */}
      <div className="px-6 pb-6 bg-white min-h-[200px]">
        {!showEvaluation ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-5 border border-slate-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] mb-4 relative group/chat">
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-slate-50 rotate-45 border-t border-l border-slate-100 group-hover/chat:bg-white transition-colors"></div>
                <p className="text-sm text-slate-600 leading-relaxed text-center font-medium">
                   {(aiMessages.slice().reverse().find(m => m.role === 'assistant')?.content) || ''}
                </p>
             </div>
             <div className="flex justify-center gap-2 text-xs text-slate-400 font-medium mb-4">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 实时响应</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-yellow-400" /> 智能纠错</span>
             </div>

             <div className="relative group/input">
               <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-900 to-amber-800 rounded-xl opacity-0 group-hover/input:opacity-15 transition duration-500 blur-sm"></div>
               <div className="relative">
                 <input
                   type="text"
                   value={inputMessage}
                   onChange={(e) => setInputMessage(e.target.value)}
                   onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={isAiLoading ? `${activePersona.name}正在思考...` : `向${activePersona.name}提问...`}
                   disabled={isAiLoading}
                   className="w-full pl-4 pr-12 py-3.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 disabled:opacity-50 disabled:bg-slate-50 transition-all shadow-sm text-slate-700 placeholder:text-slate-400"
                 />
                 <button
                   onClick={handleSendMessage}
                   disabled={!inputMessage.trim() || isAiLoading}
                   className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 hover:shadow-md hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-200"
                 >
                   {isAiLoading ? (
                     <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                   ) : (
                     <Send className="w-4 h-4" />
                   )}
                 </button>
               </div>
             </div>
          </div>
        ) : (
          <div className="animate-in zoom-in duration-500 space-y-5">
            <div className="text-center">
               <div className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500 mb-1 drop-shadow-sm">
                 {(evaluationData.title?.icon || '🌟')}{' '}{(evaluationData.title?.name || '超级棒')}
               </div>
               <p className="text-xs text-slate-400 font-medium">本次得分 {evaluationData.score || 0} 分</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
               {(evaluationData.details?.length ? evaluationData.details.slice(0, 3) : [
                 { label: '准确度', value: '—', color: 'text-slate-700', border: 'border-slate-200' },
                 { label: '完整度', value: '—', color: 'text-slate-700', border: 'border-slate-200' },
                 { label: '语速', value: '—', color: 'text-slate-700', border: 'border-slate-200' },
               ]).map((d, idx) => (
                 <div key={idx} className={cn("bg-white p-3 rounded-2xl text-center border shadow-sm hover:shadow-md transition-shadow group/stat", d.border)}>
                   <div className={cn("text-[10px] font-bold uppercase tracking-wider mb-1 group-hover/stat:opacity-90 transition-opacity", d.color)}>{d.label}</div>
                   <div className={cn("text-xl font-black transition-colors", d.color)}>{d.value}</div>
                 </div>
               ))}
            </div>

            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-xs text-amber-800 flex gap-3 items-start relative overflow-hidden">
               <div className="absolute top-0 right-0 p-1 opacity-10">
                 <Zap className="w-12 h-12" />
               </div>
               <div className="bg-amber-100 p-1.5 rounded-full shrink-0 text-amber-600">
                  <Zap className="w-4 h-4" />
               </div>
               <p className="leading-relaxed font-medium relative z-10">{evaluationData.improvement || evaluationData.comment || '继续保持，下一次更棒～'}</p>
            </div>

            <div className="pt-2 space-y-3">
               <button 
                 onClick={() => setActiveTab('workshop')}
                 className="w-full py-3.5 bg-[var(--app-primary)] text-[var(--app-primary-contrast)] rounded-xl font-bold text-sm shadow-lg shadow-black/10 hover:opacity-90 hover:shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2 group/btn relative overflow-hidden"
               >
                 <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300"></div>
                 <Palette className="w-4 h-4 group-hover/btn:rotate-12 transition-transform relative z-10" />
                 <span className="relative z-10">奖励：绘制专属配图 🎁</span>
               </button>
               
               <button 
                 onClick={() => setShowReportModal(true)}
                 className="w-full py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-medium text-sm hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center justify-center gap-2"
               >
                 <Award className="w-4 h-4" />
                 生成学习报告
               </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const RecordingButton = ({ isRecording, onClick, label = '开始背诵监测', disabled = false }) => (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex items-center gap-3 px-8 py-4 rounded-full font-bold text-lg shadow-xl transition-all transform hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:active:scale-100",
        isRecording 
          ? "bg-red-500 text-white ring-4 ring-red-200 animate-pulse" 
          : "bg-[var(--app-primary)] text-[var(--app-primary-contrast)] ring-4 ring-[var(--app-primary-soft-border)]"
      )}
    >
      {isRecording ? (
        <>
          <div className="flex gap-1 h-4 items-center">
            <div className="w-1 bg-white animate-[bounce_1s_infinite] h-2"></div>
            <div className="w-1 bg-white animate-[bounce_1s_infinite_0.2s] h-4"></div>
            <div className="w-1 bg-white animate-[bounce_1s_infinite_0.4s] h-3"></div>
          </div>
          <span>停止监测并生成报告</span>
        </>
      ) : (
        <>
          <Mic className="w-6 h-6" />
          <span>{disabled ? '正在生成...' : label}</span>
        </>
      )}
    </button>
  )

  const ReportModal = () => (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white/80 backdrop-blur-md rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-white/60 animate-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-[var(--app-primary)] to-[var(--app-accent)] p-6 text-[var(--app-primary-contrast)] flex justify-between items-center">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Award className="w-6 h-6" />
            学生个性化学习报告
          </h3>
          <button onClick={() => setShowReportModal(false)} className="hover:bg-white/15 p-1 rounded-full transition-colors">
            <span className="text-2xl">×</span>
          </button>
        </div>
        
        <div className="p-6">
          <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-lg">
            {['single', 'class', 'weekly', 'monthly'].map(type => (
              <button
                key={type}
                onClick={() => setReportType(type)}
                className={cn(
                  "flex-1 py-2 text-sm font-medium rounded-md transition-all",
                  reportType === type ? "bg-white text-[var(--app-primary)] shadow-sm" : "text-[var(--app-muted)] hover:text-[var(--app-text)]"
                )}
              >
                {{single: '本次背诵', class: '本课小结', weekly: '周报', monthly: '月度总结'}[type]}
              </button>
            ))}
          </div>

          <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 bg-slate-50 flex flex-col items-center justify-center min-h-[300px]">
            {reportType === 'single' && (
              <div className="text-center space-y-4 w-full">
                <div className="flex justify-center">
                  <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center border-4 border-yellow-300">
                    <span className="text-4xl">{evaluationData.title.icon || '🏆'}</span>
                  </div>
                </div>
                <h4 className="text-2xl font-bold text-slate-800">{evaluationData.title.name || '记忆小神童'}</h4>
                <p className="text-slate-500">李同学在《{activeCourse.title}》背诵中表现优异！</p>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 text-sm text-slate-600 italic">
                  "{evaluationData.comment || '背诵流畅，情感充沛！'}"
                </div>
                
                <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <div className="text-xs text-slate-400">准确率</div>
                      <div className="text-xl font-bold text-emerald-700">100%</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <div className="text-xs text-slate-400">流畅度</div>
                      <div className="text-xl font-bold text-slate-900">S级</div>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm">
                      <div className="text-xs text-slate-400">情感</div>
                      <div className="text-xl font-bold text-amber-800">充沛</div>
                    </div>
                  </div>

                  {savedDrawings.length > 0 && (
                    <div className="mt-6 w-full">
                      <h5 className="text-left text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                        <Palette className="w-4 h-4 text-[var(--app-primary)]" />
                        AI 创意作品集
                      </h5>
                      <div className="flex gap-3 overflow-x-auto pb-2">
                        {savedDrawings.map((drawing, idx) => (
                          <div key={drawing.id} className="relative group shrink-0 w-32">
                            <div className="aspect-square rounded-lg overflow-hidden border border-slate-200 shadow-sm">
                              <img src={drawing.imageUrl} className="w-full h-full object-cover" alt="作品" />
                            </div>
                            <div className="mt-1.5">
                              <div className="text-[10px] font-bold text-slate-700 truncate">{drawing.courseTitle}</div>
                              <div className="text-[10px] text-slate-400">{drawing.style} · {drawing.date}</div>
                            </div>
                            {idx === 0 && (
                              <div className="absolute top-1 right-1 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm animate-pulse">
                                NEW
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            
            {reportType !== 'single' && (
              <div className="text-center text-slate-400">
                <div className="w-16 h-16 bg-slate-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <Clock className="w-8 h-8 text-slate-400" />
                </div>
                <p>更多维度的{reportType}数据正在分析中...</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
            发送给家长
          </button>
          <button className="px-6 py-2 bg-[var(--app-primary)] text-[var(--app-primary-contrast)] rounded-lg hover:opacity-90 shadow-md shadow-black/10 flex items-center gap-2">
            <Download className="w-4 h-4" />
            下载报告图片
          </button>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    if (activeTab === 'workshop') {
      const selectedCourse = COURSES.find(c => c.id === workshopConfig.courseId) || activeCourse
      const today = getLocalISODate()
      const usedToday = workshopQuota.date === today ? workshopQuota.used : 0
      const workshopRemaining = Math.max(0, WORKSHOP_DAILY_LIMIT - usedToday)
      const workshopSteps = [
        { id: 'course-selection', label: '选课程' },
        { id: 'config', label: '配画面' },
        { id: 'generating', label: '生成中' },
        { id: 'result', label: '出结果' },
      ]

      return (
        <div className="flex flex-col h-full relative overflow-hidden bg-[var(--app-bg)]">
          <div className="absolute inset-0">
            <div className="absolute -top-24 -left-24 w-72 h-72 bg-[var(--app-blob-1)] rounded-full blur-3xl"></div>
            <div className="absolute top-24 -right-24 w-96 h-96 bg-[var(--app-blob-2)] rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 left-1/3 w-[520px] h-[520px] bg-[var(--app-blob-3)] rounded-full blur-3xl"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.85),_rgba(255,255,255,0.15))]"></div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 lg:p-10 relative z-10">
            <div className="max-w-5xl mx-auto w-full">
              <div className="sticky top-4 z-20 w-fit">
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/80 border border-white/60 shadow-sm backdrop-blur-md">
                  <span className={cn("w-2 h-2 rounded-full", workshopRemaining > 0 ? "bg-emerald-500" : "bg-rose-500")}></span>
                  <span className="text-xs font-black text-[var(--app-text)]">今日创作 {workshopRemaining}/{WORKSHOP_DAILY_LIMIT}</span>
                  {workshopQuotaNotice && <span className="text-xs font-bold text-rose-600">{workshopQuotaNotice}</span>}
                </div>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 border border-white/50 shadow-sm backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-green-500"></span>
                  <span className="text-xs font-bold text-slate-600">解锁条件：完成课程后可创作</span>
                </div>

                <h2 className="mt-5 text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[var(--app-title-from)] via-[var(--app-title-via)] to-[var(--app-title-to)] tracking-tight flex items-center justify-center gap-3">
                  <Palette className="w-8 h-8 text-[var(--app-text)]" />
                  AI 创意绘图工坊
                </h2>
                <p className="text-slate-500 mt-2">
                  {workshopStep === 'course-selection' && '从已完成的课程里选一首，给它配一张专属画作'}
                  {workshopStep === 'config' && '用选择题快速定风格、定主角、定氛围'}
                  {workshopStep === 'generating' && 'AI 正在把诗句变成画面...'}
                  {workshopStep === 'result' && '创作完成，快保存分享给同学和家长吧'}
                </p>

                <div className="mt-6 flex items-center justify-center">
                  <div className="inline-flex items-center gap-2 bg-white/70 border border-white/50 shadow-sm backdrop-blur-md rounded-2xl px-3 py-2">
                    {workshopSteps.map((s, idx) => (
                      <div key={s.id} className="flex items-center gap-2">
                        <div className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black transition-all",
                          workshopStep === s.id
                            ? "bg-[var(--app-primary)] text-[var(--app-primary-contrast)] shadow-md shadow-black/10"
                            : workshopSteps.findIndex(x => x.id === workshopStep) > idx
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-100 text-slate-500"
                        )}>
                          {idx + 1}
                        </div>
                        <div className={cn(
                          "text-xs font-bold",
                          workshopStep === s.id ? "text-slate-900" : "text-slate-500"
                        )}>
                          {s.label}
                        </div>
                        {idx !== workshopSteps.length - 1 && <div className="w-6 h-px bg-slate-200 mx-2"></div>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-10 max-w-5xl mx-auto w-full">
              {/* Step 1: Course Selection */}
              {workshopStep === 'course-selection' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  {COURSES.map(course => (
                    <button
                      key={course.id}
                      onClick={() => selectCourseForWorkshop(course)}
                      disabled={!course.completed}
                      className={cn(
                        "relative bg-white/80 backdrop-blur-md p-6 rounded-3xl border-2 text-left transition-all duration-300 group overflow-hidden shadow-sm",
                        course.completed 
                          ? "border-white/60 hover:border-slate-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer" 
                          : "border-white/60 opacity-60 cursor-not-allowed"
                      )}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-white/70 to-white/20"></div>
                      <div className="absolute -top-16 -right-16 w-32 h-32 rounded-full bg-amber-200/25 blur-2xl group-hover:scale-110 transition-transform"></div>

                      <div className="flex items-center gap-4 mb-4">
                         <div className={cn(
                           "w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black shadow-sm relative z-10",
                           course.completed ? "bg-gradient-to-br from-amber-50 to-slate-50 text-slate-900" : "bg-slate-100 text-slate-400"
                         )}>
                           {course.type === '古诗' ? '诗' : '文'}
                         </div>
                         <div className="flex-1 min-w-0">
                           <h3 className="font-black text-lg text-slate-900 truncate relative z-10">{course.title}</h3>
                           <p className="text-sm text-slate-500 truncate relative z-10">{course.author}</p>
                         </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full font-bold text-xs relative z-10",
                          course.completed ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"
                        )}>
                          {course.completed ? '已完成' : '未解锁'}
                        </span>
                        {course.completed && <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-900 transition-colors relative z-10" />}
                      </div>

                      {/* Locked Overlay */}
                      {!course.completed && (
                        <div className="absolute inset-0 bg-white/40 flex items-center justify-center backdrop-blur-md">
                          <div className="bg-white/80 px-4 py-2 rounded-full shadow-sm flex items-center gap-2 text-slate-600 text-sm font-bold">
                            <span className="text-lg">🔒</span> 请先完成学习
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Step 2: Configuration */}
              {workshopStep === 'config' && (
                <div className="flex flex-col lg:flex-row gap-8 animate-in zoom-in-95 duration-500 min-h-[560px]">
                   {/* Left: Poem Card (Sticky) */}
                   <div className="lg:w-1/3 flex-shrink-0">
                     <div className="relative rounded-3xl overflow-hidden sticky top-8 shadow-xl border border-white/60 bg-white/70 backdrop-blur-md min-h-[560px]">
                       <div className="absolute inset-0 bg-gradient-to-br from-amber-50/70 via-white/40 to-slate-50/70"></div>
                       <div className="relative p-8 flex flex-col items-center text-center">
                       <div className="w-12 h-12 bg-white/80 rounded-2xl flex items-center justify-center text-slate-900 mb-4 shadow-sm border border-white/50">
                         <BookOpen className="w-6 h-6" />
                       </div>
                       <div className="flex items-center gap-2 mb-2">
                         <span className="text-xs font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-700">已选课程</span>
                         <span className="text-xs font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-600">{selectedCourse.author}</span>
                       </div>
                       <h3 className="font-serif text-2xl font-black mb-5 text-slate-900 tracking-wide">{selectedCourse.title}</h3>
                       <div className="text-xl font-serif text-slate-700 leading-loose mb-7">
                         {selectedCourse.content.map((line, i) => (
                           <p key={i}>{line}</p>
                         ))}
                       </div>
                       <div className="bg-white/70 text-slate-700 px-4 py-2 rounded-full text-sm font-bold border border-white/50 shadow-sm">
                         当前任务：为这首诗配图
                       </div>
                       <button 
                         onClick={() => setWorkshopStep('course-selection')}
                         className="mt-6 text-sm font-bold text-slate-500 hover:text-slate-900 underline transition-colors"
                       >
                         重选课程
                       </button>
                       </div>
                     </div>
                   </div>
                   
                   {/* Right: Config Form */}
                   <div className="flex-1 pb-16">
                     <div className="rounded-3xl overflow-hidden border border-white/60 bg-white/70 backdrop-blur-md shadow-xl min-h-[560px] flex flex-col">
                       <div className="px-6 py-5 bg-gradient-to-r from-white/70 to-amber-50/60 border-b border-white/60">
                         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                           <div>
                             <div className="text-sm font-black text-slate-900">创作设置</div>
                             <div className="text-xs text-slate-500 mt-1">选满即可生成，支持随时修改</div>
                           </div>
                           <div className="flex flex-wrap gap-2">
                             <span className={cn("px-2.5 py-1 rounded-full text-xs font-bold border", workshopConfig.template ? "bg-slate-900 text-white border-slate-900" : "bg-slate-100 text-slate-500 border-slate-200")}>模版</span>
                             <span className={cn("px-2.5 py-1 rounded-full text-xs font-bold border", workshopConfig.scope ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-slate-100 text-slate-500 border-slate-200")}>范围</span>
                             {workshopConfig.scope === 'single' && (
                               <span className={cn("px-2.5 py-1 rounded-full text-xs font-bold border", workshopConfig.element ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-slate-100 text-slate-500 border-slate-200")}>元素</span>
                             )}
                           </div>
                         </div>
                       </div>

                      <div className="p-6 flex-1 flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                          <div className="text-xs font-bold text-slate-500">
                            {workshopQuestion === 'template' ? '第 1 题' : workshopQuestion === 'scope' ? '第 2 题' : '第 3 题'}
                          </div>
                          <div className="text-xs font-bold text-slate-500">
                            {workshopQuestion === 'template' ? '先选模版' : workshopQuestion === 'scope' ? '再定范围' : '最后选元素'}
                          </div>
                        </div>

                        <div className="flex-1">
                          {workshopQuestion === 'template' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                              <div className="flex items-start justify-between gap-4">
                                <label className="flex items-center gap-3 text-lg font-black text-slate-900">
                                  <div className="w-8 h-8 bg-slate-900 text-white rounded-xl flex items-center justify-center text-sm font-black shadow-md shadow-slate-200">1</div>
                                  请选择创作模版
                                </label>
                                <div className="text-xs text-slate-500 mt-2">决定作品的基础风格</div>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[
                                  { id: 'comic', label: '连环画风格', icon: '📖', desc: '生动有趣，故事感强', grad: 'from-stone-100 via-amber-50 to-white' },
                                  { id: 'sketch', label: '速记风格', icon: '✏️', desc: '简约线条，重点突出', grad: 'from-slate-100 via-stone-50 to-white' },
                                ].map(item => (
                                  <button
                                    key={item.id}
                                    onClick={() => { updateWorkshopConfig('template', item.id); setWorkshopQuestion('scope') }}
                                    className={cn(
                                      "relative p-4 rounded-2xl border-2 text-left transition-all duration-300 group overflow-hidden",
                                      workshopConfig.template === item.id 
                                        ? "border-slate-900 bg-white shadow-md ring-2 ring-slate-200 ring-offset-2" 
                                        : "border-white/60 bg-white/60 hover:border-slate-200 hover:shadow-md"
                                    )}
                                  >
                                    <div className={cn("absolute inset-0 opacity-70 bg-gradient-to-br", item.grad)}></div>
                                    <div className="relative z-10">
                                      <div className="flex items-center justify-between">
                                        <div className="text-3xl mb-2 group-hover:scale-110 transition-transform origin-left">{item.icon}</div>
                                        {workshopConfig.template === item.id && (
                                          <div className="w-6 h-6 bg-slate-900 rounded-full flex items-center justify-center shadow-sm">
                                            <CheckCircle className="w-4 h-4 text-white" />
                                          </div>
                                        )}
                                      </div>
                                      <div className="font-black text-lg mb-1 text-slate-900">{item.label}</div>
                                      <div className="text-xs text-slate-500 font-medium">{item.desc}</div>
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {workshopQuestion === 'scope' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                              <div className="flex items-start justify-between gap-4">
                                <label className="flex items-center gap-3 text-lg font-black text-slate-900">
                                  <div className="w-8 h-8 bg-slate-900 text-white rounded-xl flex items-center justify-center text-sm font-black shadow-md shadow-slate-200">2</div>
                                  请选择生成范围
                                </label>
                                <div className="text-xs text-slate-500 mt-2">决定画面的内容覆盖面</div>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[
                                  { id: 'full', label: '生成全文', desc: '包含诗词完整意境' },
                                  { id: 'single', label: '单一主题句', desc: '聚焦某一句的核心画面' }
                                ].map(item => (
                                  <button
                                    key={item.id}
                                    onClick={() => { 
                                      updateWorkshopConfig('scope', item.id); 
                                      if (item.id === 'single') setWorkshopQuestion('element');
                                      // If full, stay here or ready to generate (handled by next button)
                                    }}
                                    className={cn(
                                      "px-5 py-4 rounded-2xl border-2 text-left transition-all font-bold flex flex-col justify-center group",
                                      workshopConfig.scope === item.id 
                                        ? "border-emerald-600 bg-white shadow-sm ring-2 ring-emerald-100 ring-offset-2 text-emerald-900" 
                                        : "border-white/60 bg-white/60 text-slate-700 hover:border-emerald-200 hover:bg-white"
                                    )}
                                  >
                                    <div className="flex items-center justify-between w-full">
                                      <span className="truncate text-lg">{item.label}</span>
                                      {workshopConfig.scope === item.id && <CheckCircle className="w-5 h-5 text-emerald-600" />}
                                    </div>
                                    <span className="text-xs font-normal opacity-70 mt-1">{item.desc}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {workshopQuestion === 'element' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                              <div className="flex items-start justify-between gap-4">
                                <label className="flex items-center gap-3 text-lg font-black text-slate-900">
                                  <div className="w-8 h-8 bg-slate-900 text-white rounded-xl flex items-center justify-center text-sm font-black shadow-md shadow-slate-200">3</div>
                                  选择手动的元素
                                </label>
                                <div className="text-xs text-slate-500 mt-2">你想突出哪个主角？</div>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {['孤城与远山', '身披金甲的将军', '漫天黄沙与战场', '月下楼兰'].map(elem => (
                                  <button
                                    key={elem}
                                    onClick={() => updateWorkshopConfig('element', elem)}
                                    className={cn(
                                      "px-5 py-4 rounded-2xl border-2 text-left transition-all font-bold flex items-center justify-between group",
                                      workshopConfig.element === elem 
                                        ? "border-amber-500 bg-white shadow-sm ring-2 ring-amber-100 ring-offset-2 text-amber-900" 
                                        : "border-white/60 bg-white/60 text-slate-700 hover:border-amber-200 hover:bg-white"
                                    )}
                                  >
                                    <span className="truncate">{elem}</span>
                                    {workshopConfig.element === elem && <CheckCircle className="w-5 h-5 text-amber-600" />}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                     </div>

                     <div className="sticky bottom-0 pt-5">
                       <div className="rounded-3xl bg-white/70 backdrop-blur-md border border-white/60 shadow-lg p-4">
                         <div className="flex flex-wrap gap-2 mb-3">
                           {workshopConfig.template && (
                             <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[var(--app-primary-soft-bg)] text-[var(--app-primary)] border border-[var(--app-primary-soft-border)]">
                               模版：{{comic: '连环画风格', sketch: '速记风格'}[workshopConfig.template]}
                             </span>
                            )}
                            {workshopConfig.scope && (
                             <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                               范围：{{full: '生成全文', single: '单一主题句'}[workshopConfig.scope]}
                             </span>
                            )}
                            {workshopConfig.element && (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
                                元素：{workshopConfig.element}
                              </span>
                            )}
                         </div>

                        <div className="flex gap-3">
                           <button
                             onClick={() => setWorkshopQuestion(prev => (prev === 'element' ? 'scope' : prev === 'scope' ? 'template' : 'template'))}
                             disabled={workshopQuestion === 'template'}
                             className="flex-1 py-4 bg-white text-slate-700 rounded-2xl font-black text-lg border border-white/70 hover:bg-slate-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                           >
                             上一步
                           </button>

                           <button
                             onClick={() => {
                               if (workshopQuestion === 'template') setWorkshopQuestion('scope')
                               else if (workshopQuestion === 'scope') {
                                 if (workshopConfig.scope === 'single') setWorkshopQuestion('element')
                                 else handleGenerateImage()
                               }
                               else handleGenerateImage()
                             }}
                             disabled={
                               (workshopQuestion === 'template' && !workshopConfig.template) ||
                               (workshopQuestion === 'scope' && !workshopConfig.scope) ||
                               (workshopQuestion === 'element' && (!workshopConfig.element || isGeneratingImage || workshopRemaining <= 0))
                             }
                             className="flex-[1.4] py-4 bg-slate-900 text-white rounded-2xl font-black text-lg hover:bg-slate-800 hover:shadow-lg hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-slate-200"
                           >
                             {isGeneratingImage ? (
                               <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                             ) : (
                               <Sparkles className="w-6 h-6" />
                             )}
                             <span>
                               {workshopQuestion === 'element' || (workshopQuestion === 'scope' && workshopConfig.scope === 'full')
                                 ? (workshopRemaining <= 0 ? '今日次数已用完' : '开始生成作品')
                                 : '下一题'}
                             </span>
                           </button>
                         </div>
                       </div>
                     </div>
                   </div>
                </div>
              )}

              {/* Step 3: Generating */}
              {workshopStep === 'generating' && (
                 <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-700">
                   <div className="w-24 h-24 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin mb-8"></div>
                   <h3 className="text-2xl font-black text-slate-900 animate-pulse mb-2">AI 正在挥毫泼墨...</h3>
                   <p className="text-slate-500">正在根据您的选择构图：{workshopConfig.scope === 'single' ? workshopConfig.element : workshopConfig.scope === 'full' ? '全文意境' : ''} / {{comic: '连环画', sketch: '速记'}[workshopConfig.template]}</p>
                 </div>
              )}

              {/* Step 4: Result */}
              {workshopStep === 'result' && (
                <div className="max-w-lg mx-auto animate-in zoom-in duration-500">
                  <div className="bg-white/80 backdrop-blur-md p-4 rounded-3xl shadow-xl border border-white/60 relative overflow-hidden">
                    <div className="aspect-video bg-slate-100 rounded-xl overflow-hidden mb-4 relative group">
                      <img 
                        src={selectedCourse.images[0]} 
                        className="w-full h-full object-cover" 
                        alt="AI Generated" 
                      />
                      <div className="absolute top-4 left-4 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-md">
                        风格：{{comic: '连环画', sketch: '速记'}[workshopConfig.template]}
                      </div>
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity gap-3">
                        <button 
                          onClick={() => handleSaveDrawing(selectedCourse, '/images/workshop/congjunxing.jpg')}
                          className="bg-white text-slate-900 px-4 py-2 rounded-full font-medium flex items-center gap-2 hover:bg-slate-100 shadow-lg transform hover:scale-105 transition-all"
                        >
                          <Download className="w-4 h-4" /> 保存图片
                        </button>
                        <button 
                          onClick={() => {
                            handleSaveDrawing(selectedCourse, '/images/workshop/congjunxing.jpg')
                            setShowReportModal(true)
                          }}
                          className="bg-[var(--app-primary)] text-[var(--app-primary-contrast)] px-4 py-2 rounded-full font-medium flex items-center gap-2 hover:opacity-90 shadow-lg transform hover:scale-105 transition-all"
                        >
                          <Award className="w-4 h-4" /> 记录到档案
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <h3 className="font-bold text-slate-800 mb-1">《{selectedCourse.title}》- 专属配图</h3>
                      <p className="text-xs text-slate-500">创作者：三年级(2)班 李同学 & AI</p>
                    </div>
                    
                    <div className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded shadow-sm rotate-12">
                      AI 甄选
                    </div>
                  </div>
                  
                  <div className="mt-8 text-center flex gap-4 justify-center">
                    <button 
                      onClick={() => setWorkshopStep('config')}
                      className="px-6 py-2 bg-slate-100 text-slate-600 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                    >
                      再画一张
                    </button>
                    <button 
                      onClick={() => handleSaveDrawing(selectedCourse, '/images/workshop/congjunxing.jpg')}
                      className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50 transition-colors shadow-sm"
                    >
                      <Download className="w-4 h-4 inline-block mr-2" />
                      保存图片
                    </button>
                    <button 
                      onClick={() => {
                        handleSaveDrawing(selectedCourse, '/images/workshop/congjunxing.jpg')
                        setShowReportModal(true)
                      }}
                      className="px-6 py-2 bg-[var(--app-primary)] text-[var(--app-primary-contrast)] rounded-lg font-medium hover:opacity-90 transition-colors shadow-md shadow-black/10 flex items-center gap-2"
                    >
                      <Award className="w-4 h-4" />
                      记录到学情档案
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      )
    }

    switch (activeMode) {
      case 'video':
        return (
          <div className="flex flex-col h-full bg-slate-900 rounded-xl overflow-hidden relative group">
            <div className="flex-1 relative">
              {activeCourse.videoUrl ? (
                <video 
                  ref={videoRef}
                  className="w-full h-full object-contain bg-black"
                  controls
                  src={activeCourse.videoUrl}
                >
                  您的浏览器不支持视频播放。
                </video>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white">
                  <div className="text-center">
                    <Play className="w-16 h-16 mx-auto mb-4 opacity-80 group-hover:opacity-100 transition-opacity cursor-pointer" />
                    <p className="text-lg font-medium">播放教学视频</p>
                    <p className="text-sm text-gray-400 mt-2">AI 智能分析重点片段中...</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Video Chapter Navigation */}
            <div className="h-16 bg-slate-800 border-t border-slate-700 flex items-center px-4 gap-4 overflow-x-auto">
              {[
                { label: '诗朗诵', time: 7, display: '0:07' },
                { label: '含义解释', time: 19, display: '0:19' },
                { label: '图文记忆', time: 40, display: '0:40' },
                { label: '无图背诵', time: 89, display: '1:29' },
              ].map((chapter, idx) => (
                <button
                  key={idx}
                  onClick={() => handleTimeJump(chapter.time)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-700 hover:bg-slate-600 transition-colors text-xs text-slate-200 border border-slate-600 hover:border-slate-500 whitespace-nowrap"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span className="font-medium">{chapter.label}</span>
                  <span className="opacity-50 font-mono">{chapter.display}</span>
                </button>
              ))}
            </div>
          </div>
        )
      case 'recite':
        return (
          <div className="flex flex-col h-full relative">
            {/* Sub-mode Toggle */}
            <div className="flex justify-center py-4 bg-white/50 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-10">
              <div className="bg-slate-100 p-1 rounded-lg flex gap-1">
                <button
                  onClick={() => setReciteSubMode('image')}
                  className={cn(
                    "px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2",
                    reciteSubMode === 'image'
                      ? "bg-white text-[var(--app-primary)] shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <ImageIcon className="w-4 h-4" />
                  有图背诵
                </button>
                <button
                  onClick={() => setReciteSubMode('no-image')}
                  className={cn(
                    "px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2",
                    reciteSubMode === 'no-image'
                      ? "bg-white text-[var(--app-primary)] shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  )}
                >
                  <Mic className="w-4 h-4" />
                  无图背诵
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-hidden relative">
              {reciteSubMode === 'image' ? (
                // Image Recite Content
                <div className="flex flex-col h-full p-4 relative">
                  <div className="flex-1 bg-slate-100 rounded-xl overflow-hidden relative mb-4 group">
                    <img 
                      src={activeCourse.images[0]} 
                      alt="Scene" 
                      className={cn(
                        "w-full h-full object-cover transition-all duration-700",
                        isRecording ? "scale-110" : "scale-100"
                      )}
                    />
                    <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px] transition-opacity duration-500 group-hover:backdrop-blur-0 group-hover:bg-black/10"></div>
                    
                    {/* Floating Text Overlay */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 pointer-events-none">
                      <div className="space-y-6 text-center max-w-2xl">
                        {activeCourse.content.map((line, index) => (
                          <p key={index} 
                             className={cn(
                               "text-3xl font-serif font-bold text-white drop-shadow-lg transition-all duration-500",
                               index < revealedLines
                                 ? "opacity-100 translate-y-0" 
                                 : "opacity-0 translate-y-4"
                             )}
                          >
                            {line}
                          </p>
                        ))}
                      </div>
                    </div>

                    {/* Hint Buttons */}
                    <div className="absolute top-4 right-4 pointer-events-auto flex gap-2">
                      {/* Hide Button (Only if visible) */}
                      {revealedLines > 0 && (
                        <button 
                          onClick={handleHideHints}
                          className="backdrop-blur-md bg-black/30 hover:bg-black/50 text-white w-10 h-10 rounded-full flex items-center justify-center transition-all animate-in zoom-in"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      
                      {/* Show/Next Button */}
                      {revealedLines < activeCourse.content.length && (
                        <button 
                          onClick={handleRevealNextLine}
                          className="backdrop-blur-md bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2"
                        >
                          <Sparkles className="w-4 h-4" />
                          {revealedLines === 0 ? '显示提示' : '提示下一句'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Control Bar */}
                  <div className="h-24 bg-white rounded-xl border border-slate-200 p-4 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-[var(--app-primary-soft-bg)] rounded-full flex items-center justify-center text-[var(--app-primary)]">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">图文联想背诵</p>
                        <p className="text-xs text-slate-500">看着图片，尝试回忆诗句</p>
                      </div>
                    </div>
                    
                    <RecordingButton 
                      isRecording={isRecording} 
                      onClick={handleRecordToggle}
                      disabled={isEvaluating}
                    />
                  </div>

                  <div className="mt-3 bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-bold text-slate-500">识别文本（可修改）</div>
                      <button 
                        onClick={() => setShowRecognizedText(!showRecognizedText)}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                        title={showRecognizedText ? '隐藏' : '显示'}
                      >
                        {showRecognizedText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {showRecognizedText && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                        <textarea
                          value={reciteText}
                          onChange={(e) => setReciteText(e.target.value)}
                          rows={2}
                          placeholder="背诵后这里会出现识别内容，也可以手动补充或修改～"
                          className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 placeholder:text-slate-400"
                        />
                        <div className="mt-2 flex justify-end">
                          <button
                            onClick={handleEvaluateByText}
                            disabled={isRecording || isEvaluating || !reciteText.trim()}
                            className="px-3 py-2 rounded-lg text-xs font-bold bg-slate-900 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            用当前文本重新评测
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // No Image Recite Content
                <div className="flex flex-col items-center justify-center h-full p-8 relative">
                  <div className="w-48 h-48 bg-[var(--app-primary-soft-bg)] rounded-full flex items-center justify-center mb-12 relative">
                    {isRecording ? (
                      <>
                        <div className="absolute inset-0 rounded-full border-4 border-[var(--app-primary-soft-border)] animate-[ping_2s_infinite]"></div>
                        <div className="absolute inset-4 rounded-full border-4 border-[var(--app-primary-soft-border)] animate-[ping_2s_infinite_0.5s]"></div>
                        <div className="w-32 h-32 bg-[var(--app-primary)] rounded-full flex items-center justify-center relative z-10 animate-pulse">
                          <Mic className="w-12 h-12 text-[var(--app-primary-contrast)]" />
                        </div>
                      </>
                    ) : (
                      <div className="w-32 h-32 bg-white border-4 border-[var(--app-primary-soft-border)] rounded-full flex items-center justify-center shadow-sm">
                        <Mic className="w-12 h-12 text-[var(--app-muted)]" />
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-3xl font-bold text-slate-800 mb-4">
                    {isRecording ? '正在认真倾听...' : '准备好开始了吗？'}
                  </h3>
                  <p className="text-slate-500 mb-12 text-center max-w-md text-lg">
                    {isRecording 
                      ? '请大声背诵，AI 老师正在为你加油打气！' 
                      : '脱离图片辅助，挑战纯记忆背诵，赢取“记忆小达人”称号！'}
                  </p>
                  
                  <RecordingButton 
                    isRecording={isRecording} 
                    onClick={handleRecordToggle}
                    label="开始无图挑战"
                    disabled={isEvaluating}
                  />

                  <div className="mt-8 w-full max-w-xl bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-xs font-bold text-slate-500">识别文本（可修改）</div>
                      <button 
                        onClick={() => setShowRecognizedText(!showRecognizedText)}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                        title={showRecognizedText ? '隐藏' : '显示'}
                      >
                        {showRecognizedText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {showRecognizedText && (
                      <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                        <textarea
                          value={reciteText}
                          onChange={(e) => setReciteText(e.target.value)}
                          rows={3}
                          placeholder="背诵后这里会出现识别内容，也可以手动补充或修改～"
                          className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-900 placeholder:text-slate-400"
                        />
                        <div className="mt-2 flex justify-end">
                          <button
                            onClick={handleEvaluateByText}
                            disabled={isRecording || isEvaluating || !reciteText.trim()}
                            className="px-3 py-2 rounded-lg text-xs font-bold bg-slate-900 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            用当前文本重新评测
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* AI Drawing Entry (Bottom right optional entry) */}
                  {!isRecording && showEvaluation && (
                    <div className="absolute bottom-8 right-8 animate-in slide-in-from-bottom duration-700">
                      <button 
                        onClick={() => setActiveTab('workshop')}
                        className="flex items-center gap-2 bg-[var(--app-primary)] text-[var(--app-primary-contrast)] px-6 py-3 rounded-full shadow-lg shadow-black/10 hover:opacity-90 hover:shadow-xl hover:scale-105 transition-all"
                      >
                        <Palette className="w-5 h-5" />
                        <span>奖励：生成我的专属配图</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex h-screen w-full bg-[var(--app-bg)] font-sans text-[var(--app-text)]">
      {/* Left Sidebar: Course List */}
      <aside className="w-64 bg-[var(--app-surface-2)] border-r border-[var(--app-border)] flex flex-col shadow-sm z-10">
        <div className="h-16 flex items-center px-6 border-b border-[var(--app-border)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[var(--app-primary)] rounded-lg flex items-center justify-center text-[var(--app-primary-contrast)] font-black text-sm">365</div>
            <span className="font-black text-lg">365速记</span>
          </div>
        </div>
        
        {/* Navigation Tabs */}
        <div className="p-3">
          <div className="flex gap-1 bg-[var(--app-bg-2)] p-1 rounded-lg mb-4 border border-[var(--app-border)]">
            <button 
              onClick={() => setActiveTab('course')}
              className={cn(
                "flex-1 py-1.5 text-xs font-bold rounded-md transition-all",
                activeTab === 'course' ? "bg-[var(--app-surface-2)] text-[var(--app-text)] shadow-sm" : "text-[var(--app-muted)] hover:text-[var(--app-text)]"
              )}
            >
              课程学习
            </button>
            <button 
              onClick={() => setActiveTab('workshop')}
              className={cn(
                "flex-1 py-1.5 text-xs font-bold rounded-md transition-all flex items-center justify-center gap-1",
                activeTab === 'workshop' ? "bg-[var(--app-surface-2)] text-[var(--app-text)] shadow-sm" : "text-[var(--app-muted)] hover:text-[var(--app-text)]"
              )}
            >
              <Palette className="w-3 h-3" />
              创意工坊
            </button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-[var(--app-muted)]" />
            <input 
              type="text" 
              placeholder="搜索课程..." 
              className="w-full pl-9 pr-4 py-2 bg-[var(--app-bg-2)] border border-[var(--app-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--app-primary-soft-border)] focus:border-[var(--app-primary)]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
          <div className="px-3 py-2 text-xs font-semibold text-[var(--app-muted)] uppercase tracking-wider">今日任务</div>
          {COURSES.map(course => (
            <button
              key={course.id}
              onClick={() => { setActiveCourse(course); setActiveTab('course'); }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all",
                activeCourse.id === course.id 
                  ? "bg-[var(--app-primary-soft-bg)] text-[var(--app-text)] shadow-sm ring-1 ring-[var(--app-primary-soft-border)]" 
                  : "text-[color:var(--app-text)]/70 hover:bg-[var(--app-bg-2)] hover:text-[var(--app-text)]"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium shrink-0",
                activeCourse.id === course.id ? "bg-[var(--app-primary-soft-border)] text-[var(--app-text)]" : "bg-[var(--app-bg-2)] text-[var(--app-muted)]"
              )}>
                {course.type === '古诗' ? '诗' : '文'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{course.title}</p>
                <p className="text-xs text-[var(--app-muted)] truncate">{course.author}</p>
              </div>
              {activeCourse.id === course.id && <ChevronRight className="w-4 h-4 opacity-50" />}
            </button>
          ))}
        </div>
        
        <div className="p-4 border-t border-[var(--app-border)]">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] font-black text-[var(--app-muted)] uppercase tracking-wider">主题</div>
            <div className="text-[10px] font-bold text-[var(--app-muted)]">
              {THEMES.find(t => t.id === themeId)?.label || ''}
            </div>
          </div>
          <div className="flex gap-1 bg-[var(--app-bg-2)] p-1 rounded-xl border border-[var(--app-border)]">
            {THEMES.map(t => (
              <button
                key={t.id}
                onClick={() => setThemeId(t.id)}
                className={cn(
                  "flex-1 py-1.5 text-[10px] font-black rounded-lg transition-all",
                  themeId === t.id
                    ? "bg-[var(--app-surface-2)] text-[var(--app-text)] shadow-sm ring-1 ring-black/5"
                    : "text-[var(--app-muted)] hover:text-[var(--app-text)]"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Navigation for Modes */}
        {activeTab === 'course' && (
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10">
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              {[
                { id: 'video', label: '视频教学', icon: Play },
                { id: 'recite', label: '智能背诵', icon: Mic },
              ].map(mode => (
                <button
                  key={mode.id}
                  onClick={() => setActiveMode(mode.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                    activeMode === mode.id 
                      ? "bg-white text-[var(--app-primary)] shadow-sm ring-1 ring-black/5" 
                      : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                  )}
                >
                  <mode.icon className="w-4 h-4" />
                  {mode.label}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-2">
               <div className="h-6 w-px bg-slate-200 mx-2"></div>
            </div>
          </header>
        )}

        {/* Content Body */}
        <div className={cn(
          "flex-1 overflow-hidden relative bg-slate-50/50",
          activeTab === 'workshop' ? "p-0" : "" // Adjust padding for workshop if needed
        )}>
          {renderContent()}
        </div>
      </main>

      {/* Right Sidebar: AI Assistant */}
      <aside className={cn(
        "bg-[var(--app-surface-2)] border-l border-[var(--app-border)] flex flex-col shadow-lg z-20 transition-[width] duration-300 ease-out",
        isAssistantCollapsed ? "w-14" : "w-96"
      )}>
        <div className={cn(
          "h-16 border-b border-[var(--app-border)] flex items-center justify-between bg-[var(--app-surface-2)] shrink-0 relative",
          isAssistantCollapsed ? "px-2" : "px-6"
        )}>
          <div className={cn("flex items-center gap-2 min-w-0", isAssistantCollapsed ? "justify-center w-full" : "")}>
            <Sparkles className="w-5 h-5 text-[var(--app-accent)]" />
            {!isAssistantCollapsed && <span className="font-bold text-slate-800 truncate">AI 智能助教</span>}
          </div>
          <button
            onClick={() => setIsAssistantCollapsed(v => !v)}
            className={cn(
              "h-9 w-9 rounded-xl border border-[var(--app-border)] bg-white/70 backdrop-blur-sm hover:bg-white transition-colors flex items-center justify-center",
              isAssistantCollapsed ? "absolute right-2" : ""
            )}
            title={isAssistantCollapsed ? "展开 AI 助教" : "折叠 AI 助教"}
          >
            <ChevronRight className={cn("w-4 h-4 text-[var(--app-text)] transition-transform", isAssistantCollapsed ? "" : "rotate-180")} />
          </button>
        </div>

        {isAssistantCollapsed ? (
          <div className="flex-1 flex items-center justify-center bg-[var(--app-bg)]">
            <button
              onClick={() => setIsAssistantCollapsed(false)}
              className="h-10 w-10 rounded-2xl bg-[var(--app-primary)] text-[var(--app-primary-contrast)] shadow-sm shadow-black/10 flex items-center justify-center hover:opacity-90 transition-opacity"
              title="展开 AI 助教"
            >
              <Sparkles className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <>
            <div className="p-5 bg-gradient-to-b from-[var(--app-surface-2)] to-[var(--app-bg)] border-b border-[var(--app-border)] shrink-0 z-20">
              <div className="bg-[var(--app-surface-2)] rounded-2xl border border-[var(--app-border)] p-4 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-[var(--app-accent-soft-bg)] rounded-bl-full opacity-70 group-hover:scale-110 transition-transform"></div>
                <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-xs uppercase tracking-wider text-[var(--app-accent)] relative z-10">
                  <span className="bg-[var(--app-accent-soft-bg)] p-1 rounded-md group-hover:bg-[var(--app-accent)] group-hover:text-[var(--app-accent-contrast)] transition-colors duration-300">
                    <Zap className="w-3 h-3" />
                  </span>
                  课堂拓展资源
                </h4>
                <div className="flex gap-3 items-center relative z-10">
                  <div className="w-20 h-14 bg-slate-200 rounded-lg overflow-hidden shrink-0 relative shadow-inner group-hover:ring-2 ring-[var(--app-primary-soft-border)] transition-all">
                    <img src="/images/congjunxing.jpg" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 flex items-center justify-center transition-colors">
                      <div className="w-6 h-6 bg-white/90 rounded-full flex items-center justify-center backdrop-blur-sm shadow-sm group-hover:scale-110 transition-transform">
                        <Play className="w-3 h-3 text-[var(--app-primary)] fill-[var(--app-primary)] ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-700 truncate group-hover:text-[var(--app-primary)] transition-colors">王昌龄生平动画</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-medium px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200">3:45</span>
                      <span className="text-[10px] text-amber-500 flex items-center gap-0.5 font-medium">
                        <Star className="w-2.5 h-2.5 fill-current" /> 必看
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--app-bg)]">
              {renderCombinedRightCard()}
            </div>
          </>
        )}
      </aside>

      {showReportModal && <ReportModal />}
    </div>
  )
}
