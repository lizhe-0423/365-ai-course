import { useState, useEffect, useRef } from 'react'
import { 
  Play, BookOpen, Image as ImageIcon, Mic, 
  MessageSquare, ChevronRight, CheckCircle, 
  RefreshCw, Award, Volume2, User, Search,
  Zap, Star, ThumbsUp, Sparkles, Send,
  Users, Monitor, Settings, Clock, GraduationCap
} from 'lucide-react'
import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

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
    ]
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
    ]
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
    ]
  }
]

export default function App() {
  const [activeCourse, setActiveCourse] = useState(COURSES[0])
  const [activeMode, setActiveMode] = useState('video') // video, read, image, recite
  const [aiMessages, setAiMessages] = useState([
    { role: 'ai', content: '王老师，您好！我是您的智能助教。本节课《静夜思》的教学重点已准备好。' }
  ])
  const [isRecording, setIsRecording] = useState(false)
  const [showEvaluation, setShowEvaluation] = useState(false)
  const [inputMessage, setInputMessage] = useState('')
  const [revealedLines, setRevealedLines] = useState(0)
  
  // Ref for scrolling chat to bottom
  const chatEndRef = useRef(null)
  const videoRef = useRef(null)

  const handleTimeJump = (time) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time
      videoRef.current.play().catch(() => {})
    }
  }

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [aiMessages])

  // Reset state when course changes
  useEffect(() => {
    setRevealedLines(0)
    setShowEvaluation(false)
    setAiMessages([
      { role: 'ai', content: `王老师，正在为您准备《${activeCourse.title}》的教学资源...已就绪。建议先引导学生观看视频，再进行逐句朗读。` }
    ])
  }, [activeCourse])

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return
    
    const newMessages = [...aiMessages, { role: 'user', content: inputMessage }]
    setAiMessages(newMessages)
    setInputMessage('')
    
    // Simulate AI response
    setTimeout(() => {
      let response = '收到，正在为您生成教学辅助内容...'
      if (inputMessage.includes('意思')) {
        response = `【教学参考】\n${activeCourse.meaning}\n\n建议引导学生用自己的话复述一遍，体会“穿金甲”的艰辛。`
      } else if (inputMessage.includes('背景')) {
        response = `【背景知识】\n${activeCourse.background}\n\n知识点延伸：介绍盛唐边塞诗派，以及同时期的诗人高适、岑参。`
      } else if (inputMessage.includes('背')) {
        response = '【背诵指导】\n建议采用“情景带入法”：\n1. 想象青海湖边的雪山景象。\n2. 感受“不破楼兰终不还”的豪迈誓言。'
      } else if (inputMessage.includes('难点')) {
        response = '【本课难点】\n1. 边塞诗的意象理解（孤城、玉门关、楼兰）。\n2. 体会从“暗雪山”到“穿金甲”的画面转换。\n建议播放边塞风光的视频片段辅助教学。'
      } else if (inputMessage.includes('测验')) {
        response = '【随堂测验生成中...】\n1. “青海长云暗雪山”中“暗”字的作用是？\n2. “不破楼兰终不还”化用了哪个历史典故？\n（点击查看答案解析）'
      }
      setAiMessages(prev => [...prev, { role: 'ai', content: response }])
    }, 1000)
  }

  const handleRecordToggle = () => {
    if (isRecording) {
      setIsRecording(false)
      // Simulate evaluation after recording
      setTimeout(() => {
        setShowEvaluation(true)
        setAiMessages(prev => [...prev, { 
          role: 'ai', 
          content: '【AI 激励点评】\n这位同学声音洪亮，自信满满！特别是在“不破楼兰终不还”这句，我听出了小男子汉的气概！继续保持这种昂扬的状态，你就是班里的小诗人！🌟' 
        }])
      }, 1500)
    } else {
      setIsRecording(true)
      setShowEvaluation(false)
    }
  }

  const renderContent = () => {
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
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">重点节点跳转</span>
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
      case 'read':
        return (
          <div className="flex flex-col items-center justify-center h-full p-8 overflow-y-auto">
            <h2 className="text-3xl font-bold mb-8 text-slate-800">{activeCourse.title}</h2>
            <div className="space-y-6 text-center">
              {activeCourse.content.map((line, index) => (
                <p key={index} 
                   className="text-2xl font-serif text-slate-700 hover:text-blue-600 cursor-pointer transition-colors"
                   onClick={() => setAiMessages(prev => [...prev, { role: 'ai', content: `【备课助手】"${line}" 教学要点：\n1. 释义：... \n2. 引导问题：...` }])}
                >
                  {line}
                </p>
              ))}
            </div>
            <div className="mt-12 flex gap-4">
              <button 
                onClick={handleRecordToggle}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all shadow-lg",
                  isRecording 
                    ? "bg-red-500 text-white animate-pulse" 
                    : "bg-blue-600 text-white hover:bg-blue-700"
                )}
              >
                {isRecording ? <><Mic className="w-5 h-5" /> 监听全班朗读...</> : <><Mic className="w-5 h-5" /> 启动朗读评测</>}
              </button>
            </div>
          </div>
        )
      case 'image-recite':
        return (
          <div className="flex flex-col h-full p-4">
            <div className="flex-1 bg-slate-100 rounded-xl overflow-hidden relative mb-4">
              <img 
                src={activeCourse.images[0]} 
                alt="Scene" 
                className="w-full h-full object-cover opacity-90 hover:opacity-100 transition-opacity"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
                <p className="text-white text-xl font-medium text-center">
                  图文复述教学：引导学生看图背诵
                </p>
              </div>
            </div>
            <div className="h-1/3 bg-white rounded-xl border border-slate-200 p-6 overflow-y-auto">
              <div className="space-y-4 text-center">
                {activeCourse.content.map((line, index) => (
                  <p key={index} 
                     className={cn(
                       "text-xl transition-all duration-500 cursor-pointer border-b border-transparent hover:border-slate-200 inline-block px-2",
                       index < revealedLines ? "text-slate-800" : "text-slate-200 blur-sm hover:blur-none"
                     )}
                     onClick={() => setRevealedLines(prev => Math.max(prev, index + 1))}
                  >
                    {line}
                  </p>
                ))}
              </div>
              <div className="mt-4 text-center">
                <button 
                  onClick={() => setRevealedLines(prev => prev + 1)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  显示下一句提示
                </button>
              </div>
            </div>
          </div>
        )
      case 'recite':
        return (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center mb-8 relative">
              <Mic className="w-12 h-12 text-blue-600" />
              {isRecording && (
                <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-ping opacity-20"></div>
              )}
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">背诵监测与评价</h3>
            <p className="text-slate-500 mb-8 text-center max-w-md">
              AI 智能助教将实时监听背诵情况（支持单人或多人），并生成鼓励性评价报告。
            </p>
            <button 
              onClick={handleRecordToggle}
              className={cn(
                "px-8 py-4 rounded-full text-lg font-bold shadow-xl transition-all transform hover:scale-105",
                isRecording 
                  ? "bg-red-500 text-white ring-4 ring-red-200" 
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white ring-4 ring-blue-200"
              )}
            >
              {isRecording ? '停止监测并生成报告' : '开始背诵监测'}
            </button>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-900">
      {/* Left Sidebar: Course List */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-sm z-10">
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">365</div>
            <span className="font-bold text-lg text-slate-800">365速记</span>
          </div>
        </div>
        
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="搜索课程..." 
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
          <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">今日任务</div>
          {COURSES.map(course => (
            <button
              key={course.id}
              onClick={() => setActiveCourse(course)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left transition-all",
                activeCourse.id === course.id 
                  ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium shrink-0",
                activeCourse.id === course.id ? "bg-blue-200 text-blue-700" : "bg-slate-100 text-slate-500"
              )}>
                {course.type === '古诗' ? '诗' : '文'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{course.title}</p>
                <p className="text-xs opacity-70 truncate">{course.author}</p>
              </div>
              {activeCourse.id === course.id && <ChevronRight className="w-4 h-4 opacity-50" />}
            </button>
          ))}
        </div>
        
        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600">
              <Users className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">三年级(2)班</p>
              <p className="text-xs text-slate-500">当前学生: 45人</p>
            </div>
            <RefreshCw className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Navigation for Modes */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
            {[
              { id: 'video', label: '视频教学', icon: Play },
              { id: 'read', label: '朗读评测', icon: BookOpen },
              { id: 'image-recite', label: '图文复述', icon: ImageIcon },
              { id: 'recite', label: '背诵监测', icon: Mic },
            ].map(mode => (
              <button
                key={mode.id}
                onClick={() => setActiveMode(mode.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                  activeMode === mode.id 
                    ? "bg-white text-blue-700 shadow-sm ring-1 ring-black/5" 
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                )}
              >
                <mode.icon className="w-4 h-4" />
                {mode.label}
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-2">
             <div className="flex gap-1">
               <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full" title="教学计时">
                 <Clock className="w-5 h-5" />
               </button>
               <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full" title="投屏模式">
                 <Monitor className="w-5 h-5" />
               </button>
               <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full" title="课程设置">
                 <Settings className="w-5 h-5" />
               </button>
             </div>
             <div className="h-6 w-px bg-slate-200 mx-2"></div>
             <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
               <GraduationCap className="w-4 h-4" />
               <span>布置作业</span>
             </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden relative bg-slate-50/50">
          {renderContent()}
        </div>
      </main>

      {/* Right Sidebar: AI Assistant */}
      <aside className="w-96 bg-white border-l border-slate-200 flex flex-col shadow-lg z-20">
        <div className="h-16 border-b border-slate-100 flex items-center px-6 justify-between bg-gradient-to-r from-indigo-50 to-white">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <span className="font-bold text-slate-800">AI 智能助教</span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/30">
          {/* AI Messages Area */}
          <div className="space-y-4 mb-4">
            {aiMessages.map((msg, idx) => (
              <div key={idx} className={cn("flex gap-3", msg.role === 'user' ? "flex-row-reverse" : "")}>
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm",
                  msg.role === 'ai' ? "bg-indigo-100 text-indigo-600" : "bg-slate-200 text-slate-600"
                )}>
                  {msg.role === 'ai' ? <Sparkles className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>
                <div className={cn(
                  "p-3 rounded-2xl max-w-[85%] text-sm shadow-sm",
                  msg.role === 'ai' 
                    ? "bg-white border border-slate-100 text-slate-700 rounded-tl-none" 
                    : "bg-blue-600 text-white rounded-tr-none"
                )}>
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Evaluation Result Card (Conditional) */}
          {showEvaluation && (
            <div className="bg-white rounded-xl border border-indigo-100 p-4 shadow-sm animate-in slide-in-from-right duration-500">
              <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Award className="w-5 h-5 text-orange-500" />
                AI 激励反馈
              </h4>
              
              <div className="flex items-center justify-center mb-4">
                 <div className="text-center">
                    <div className="text-4xl font-bold text-orange-500 mb-1">🌟 超级棒</div>
                    <p className="text-xs text-slate-500">战胜了 98% 的同学</p>
                 </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="text-center p-2 bg-slate-50 rounded-lg">
                  <div className="text-xs text-slate-500 mb-1">自信度</div>
                  <div className="font-bold text-green-600">满分</div>
                </div>
                <div className="text-center p-2 bg-slate-50 rounded-lg">
                  <div className="text-xs text-slate-500 mb-1">完整度</div>
                  <div className="font-bold text-blue-600">100%</div>
                </div>
                <div className="text-center p-2 bg-slate-50 rounded-lg">
                  <div className="text-xs text-slate-500 mb-1">情感</div>
                  <div className="font-bold text-orange-600">激昂</div>
                </div>
              </div>
              
              <div className="text-sm text-slate-600 bg-yellow-50 p-3 rounded-lg border border-yellow-100 mb-3">
                <p className="font-medium text-yellow-800 mb-1">� 进步空间</p>
                声音还可以再大一点点哦，让全班同学都听到你的豪情壮志！
              </div>

              <div className="flex gap-2">
                 <button className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm">
                   颁发小奖状 🏅
                 </button>
                 <button className="flex-1 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors">
                   再试一次
                 </button>
              </div>
            </div>
          )}

          {/* Recommendations Card (Static for demo) */}
          <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-100 p-4 shadow-sm">
            <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2 text-sm">
              <Zap className="w-4 h-4 text-purple-500" />
              课堂拓展资源
            </h4>
            <div className="space-y-2">
              <div className="flex gap-2 items-center p-2 hover:bg-white rounded-lg transition-colors cursor-pointer border border-transparent hover:border-purple-100">
                <div className="w-10 h-10 bg-slate-200 rounded overflow-hidden">
                   <img src="/images/congjunxing.jpg" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">拓展视频：王昌龄生平动画</p>
                  <p className="text-xs text-slate-400">时长 3:45 | 适合课后播放</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white border-t border-slate-100">
          <div className="relative flex items-center">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="问问AI关于这首诗的问题..."
              className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-inner"
            />
            <button 
              onClick={handleSendMessage}
              disabled={!inputMessage.trim()}
              className="absolute right-1.5 top-1.5 p-1.5 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="flex justify-center mt-2 gap-2">
            {['教学重点', '难点解析', '生成随堂测验'].map(hint => (
              <button 
                key={hint}
                onClick={() => setInputMessage(hint)}
                className="text-xs px-2 py-1 bg-slate-100 text-slate-500 rounded-full hover:bg-slate-200 transition-colors"
              >
                {hint}
              </button>
            ))}
          </div>
        </div>
      </aside>
    </div>
  )
}
