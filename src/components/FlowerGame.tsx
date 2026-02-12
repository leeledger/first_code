'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import {
  Trophy, Mic, MousePointer2,
  Home, RotateCcw, Keyboard, ArrowRight,
  Image as ImageIcon, Send, Wand2, Eraser, Search,
  Sparkles, Brain, Shapes, MessageSquarePlus
} from 'lucide-react';

// --- Types ---
type Persona = 'silver' | 'junior';
type Module = 'mouse' | 'keyboard' | 'voice' | 'prompt' | 'creation';

interface Flower {
  id: number;
  x: number;
  y: number;
  color: string;
  isBloomed: boolean;
}

interface Leaf {
  id: number;
  x: number;
  y: number;
  isCollected: boolean;
}

// --- Constants ---
const LEVEL_GOALS = {
  mouse: [30, 15],
  keyboard: [15, 5],
  prompt: [3, 2], // Missions to complete
};

const PROMPT_MISSIONS = [
  {
    id: "subject",
    category: "주인공",
    title: "누구를 그릴까요?",
    description: "그림의 가장 중요한 주인공을 골라보세요.",
    parts: ["귀여운 고양이", "용감한 강아지", "웃고있는 사자", "우주 비행사"]
  },
  {
    id: "action",
    category: "행동",
    title: "무엇을 하고 있나요?",
    description: "주인공이 어떤 행동을 하면 좋을까요?",
    parts: ["춤을 추고 있는", "노래를 부르는", "신나게 달리는", "잠을 자고 있는"]
  },
  {
    id: "place",
    category: "배경",
    title: "어느 장소인가요?",
    description: "멋진 배경을 더하면 그림이 더 풍성해져요.",
    parts: ["신비로운 우주", "깊은 바다 속", "구름 위 마을", "초록빛 숲속"]
  },
  {
    id: "style",
    category: "예술 스타일",
    title: "어떤 느낌이 좋은가요?",
    description: "그림의 분위기를 결정하는 마법의 가루예요.",
    parts: ["반짝이는 수채화", "선명한 애니메이션", "깜찍한 3D 캐릭터", "웅장한 유화"]
  }
];

// --- Components ---

const PetalFlower = ({ color, isBloomed, persona }: { color: string, isBloomed: boolean, persona: Persona }) => {
  const petals = [0, 60, 120, 180, 240, 300];
  return (
    <div className="relative w-32 h-32 flex items-center justify-center">
      <AnimatePresence>
        {isBloomed && petals.map((angle, i) => (
          <motion.div
            key={i}
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos(angle * Math.PI / 180) * 150,
              y: Math.sin(angle * Math.PI / 180) * 150,
              opacity: 0,
              rotate: 360,
              scale: 0.5
            }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute w-10 h-14 rounded-full pointer-events-none"
            style={{ backgroundColor: color, rotate: `${angle}deg` }}
          />
        ))}
      </AnimatePresence>

      {!isBloomed && (
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className={`w-20 h-20 rounded-full shadow-2xl flex items-center justify-center border-4 border-white/20`}
          style={{ backgroundColor: color }}
        >
          <div className="w-10 h-10 bg-white/30 rounded-full animate-pulse" />
        </motion.div>
      )}

      {isBloomed && (
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: [1, 1.4, 0], opacity: [1, 1, 0] }}
          transition={{ duration: 0.6 }}
          className="relative w-24 h-24 pointer-events-none"
        >
          {petals.map((angle, i) => (
            <div
              key={i}
              className="absolute w-10 h-14 rounded-full left-1/2 top-0 -translate-x-1/2 origin-bottom shadow-lg"
              style={{ backgroundColor: color, rotate: `${angle}deg` }}
            />
          ))}
          <div className="absolute w-8 h-8 bg-yellow-400 rounded-full left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 shadow-inner border-2 border-yellow-600/20" />
        </motion.div>
      )}
    </div>
  );
};

export default function MagicStickApp() {
  const [persona, setPersona] = useState<Persona | null>(null);
  const [currentModule, setCurrentModule] = useState<Module>('mouse');
  const [currentLevel, setCurrentLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [isStarted, setIsStarted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [praise, setPraise] = useState('');

  const [flowers, setFlowers] = useState<Flower[]>([]);
  const [leaves, setLeaves] = useState<Leaf[]>([]);
  const [targetKey, setTargetKey] = useState('');
  const [targetWord, setTargetWord] = useState('');
  const [inputValue, setInputValue] = useState('');

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiResult, setAiResult] = useState<{ image?: string } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Prompt Module Specific States
  const [promptStep, setPromptStep] = useState(0);
  const [selectedPromptParts, setSelectedPromptParts] = useState<string[]>([]);

  const gameStageRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (persona) document.documentElement.setAttribute('data-theme', persona);
  }, [persona]);

  useEffect(() => {
    if (currentModule === 'keyboard' && isStarted && !isCompleted) {
      inputRef.current?.focus();
    }
  }, [currentModule, isStarted, isCompleted, targetWord, targetKey]);

  const speak = (text: string) => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = persona === 'junior' ? 1.1 : 0.8;
      window.speechSynthesis.speak(utterance);
    }
  };

  const playSound = (freq = 440) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.start(); osc.stop(ctx.currentTime + 0.3);
    } catch (e) { }
  };

  const spawnFlower = () => {
    const id = Date.now();
    setFlowers(prev => [
      ...prev.filter(f => !f.isBloomed),
      {
        id,
        x: Math.random() * 80 + 10,
        y: Math.random() * 70 + 15,
        color: ['#ff7eb6', '#ffb6b6', '#ffcc00', '#99ccff', '#cc99ff'][Math.floor(Math.random() * 5)],
        isBloomed: false
      }
    ].slice(-1));
  };

  const spawnLeaves = () => {
    const newLeaves = Array.from({ length: 10 }).map((_, i) => ({
      id: i,
      x: Math.random() * 70 + 15,
      y: Math.random() * 60 + 15,
      isCollected: false
    }));
    setLeaves(newLeaves);
  };

  const spawnKey = () => {
    const keys = ['A', 'S', 'D', 'F', 'J', 'K', 'L', 'Enter', 'Space'];
    setTargetKey(keys[Math.floor(Math.random() * keys.length)]);
    setInputValue('');
  };

  const spawnWord = () => {
    const words = persona === 'junior' ? ['사과', '바나나', '친구', '학교', '하늘'] : ['사랑', '안녕', '행복', '건강', '감사'];
    setTargetWord(words[Math.floor(Math.random() * words.length)]);
    setInputValue('');
  };

  const handleBloom = (id: number) => {
    setFlowers(prev => prev.map(f => f.id === id ? { ...f, isBloomed: true } : f));
    updateScore(1, LEVEL_GOALS.mouse[0]);
    playSound(440 + score * 5);

    setTimeout(() => {
      setFlowers(prev => prev.filter(f => f.id !== id));
      if (!isCompleted) spawnFlower();
    }, 800);
  };

  const handleLeafCollect = (id: number) => {
    setLeaves(prev => prev.map(l => l.id === id ? { ...l, isCollected: true } : l));
    updateScore(1, LEVEL_GOALS.mouse[1]);
    playSound(523);
    if (leaves.filter(l => !l.isCollected).length <= 1) {
      setTimeout(spawnLeaves, 1000);
    }
  };

  const updateScore = (increment: number, goal: number) => {
    setScore(s => {
      const newScore = s + increment;
      if (newScore >= goal) {
        handleLevelComplete();
        return newScore;
      }
      givePraise();
      return newScore;
    });
  };

  const handleLevelComplete = () => {
    setIsCompleted(true);
    speak(persona === 'junior' ? "최고야! 다음 단계로 넘어가보자!" : "축하합니다! 단계를 완벽하게 마치셨습니다.");
    confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
  };

  const givePraise = () => {
    const list = persona === 'junior'
      ? ["멋져!", "대단해!", "잘했어!", "우와!", "최고!"]
      : ["잘하셨어요!", "훌륭합니다!", "정확해요!", "좋습니다!", "최고예요!"];
    const p = list[Math.floor(Math.random() * list.length)];
    setPraise(p);
    speak(p);
    setTimeout(() => setPraise(''), 1000);
  };

  const nextMode = () => {
    setIsCompleted(false);
    setScore(0);
    setFlowers([]);
    setLeaves([]);
    setTranscript('');
    setAiResult(null);

    if (currentModule === 'mouse' && currentLevel === 1) {
      setCurrentLevel(2);
      spawnLeaves();
      setIsStarted(true);
      speak(persona === 'junior' ? "낙엽을 옮겨볼까?" : "마우스를 이동시켜 낙엽을 바구니에 담아보세요.");
    } else if (currentModule === 'mouse' && currentLevel === 2) {
      setCurrentModule('keyboard');
      setCurrentLevel(1);
      setIsStarted(false);
      speak(persona === 'junior' ? "키보드 연습 시작!" : "이제 키보드 연습을 시작합니다.");
    } else if (currentModule === 'keyboard' && currentLevel === 1) {
      setCurrentLevel(2);
      setIsStarted(false);
      speak(persona === 'junior' ? "단어를 직접 써보자!" : "이제 예쁜 단어를 입력해볼까요?");
    } else if (currentModule === 'keyboard' && currentLevel === 2) {
      if (persona === 'junior') {
        setCurrentModule('prompt');
        setCurrentLevel(1);
        setIsStarted(false);
        setPromptStep(0);
        setSelectedPromptParts([]);
        speak("이제 AI에게 명령하는 법을 배워보자!");
      } else {
        setCurrentModule('voice');
        setIsStarted(true);
        speak("AI와 대화를 나누어 보세요.");
      }
    } else if (currentModule === 'prompt' || currentModule === 'voice') {
      setCurrentModule('creation');
      setIsStarted(true);
      speak("상상하는 그림을 만들어 전송해보세요.");
    }
  };

  const handlePromptSelect = (part: string) => {
    setSelectedPromptParts(prev => [...prev, part]);
    playSound(440 + selectedPromptParts.length * 40);
    speak(part);

    if (promptStep < PROMPT_MISSIONS.length - 1) {
      setTimeout(() => setPromptStep(s => s + 1), 500);
    } else {
      setTimeout(() => {
        updateScore(1, LEVEL_GOALS.prompt[0]);
        if (score + 1 < LEVEL_GOALS.prompt[0]) {
          setPromptStep(0);
          setSelectedPromptParts([]);
        }
      }, 1000);
    }
  };

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) return;
    const recognition = new (window as any).webkitSpeechRecognition();
    recognition.lang = 'ko-KR';
    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (e: any) => setTranscript(e.results[0][0].transcript);
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const generateAI = async () => {
    const text = currentModule === 'creation' ? transcript : selectedPromptParts.join(' ');
    if (!text) return;
    setIsGenerating(true);
    speak("AI가 상상을 현실로 만드는 중이야!");
    setTimeout(() => {
      setAiResult({
        image: `https://picsum.photos/seed/${text}/800/600`,
      });
      setIsGenerating(false);
      speak("와! 정말 멋진 작품이 완성됐어!");
      confetti({ particleCount: 60, spread: 60 });
    }, 3000);
  };

  const resetState = () => {
    setPersona(null);
    setCurrentModule('mouse');
    setCurrentLevel(1);
    setScore(0);
    setIsStarted(false);
    setIsCompleted(false);
    setFlowers([]);
    setLeaves([]);
    setTranscript('');
    setAiResult(null);
    setPromptStep(0);
    setSelectedPromptParts([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (currentModule === 'keyboard') {
      if (currentLevel === 1) {
        const isEnter = targetKey === 'Enter' && e.key === 'Enter';
        const isSpace = targetKey === 'Space' && e.key === ' ';
        const isChar = e.key.toUpperCase() === targetKey.toUpperCase();

        if (isEnter || isSpace || isChar) {
          updateScore(1, LEVEL_GOALS.keyboard[0]);
          playSound(660);
          spawnKey();
          e.preventDefault();
          setInputValue('');
        }
      } else if (currentLevel === 2 && (e.key === 'Enter' || e.key === ' ')) {
        if (inputValue.trim() === targetWord) {
          updateScore(1, LEVEL_GOALS.keyboard[1]);
          playSound(700);
          spawnWord();
          setInputValue('');
        }
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    if (currentModule === 'keyboard') {
      if (currentLevel === 1) {
        const lastChar = value.slice(-1).toUpperCase();
        const target = targetKey === 'Space' ? ' ' : targetKey.toUpperCase();
        if (lastChar === target && targetKey !== 'Enter') {
          updateScore(1, LEVEL_GOALS.keyboard[0]);
          playSound(660);
          spawnKey();
        }
      } else if (currentLevel === 2) {
        if (value.trim() === targetWord) {
          updateScore(1, LEVEL_GOALS.keyboard[1]);
          playSound(700);
          spawnWord();
        }
      }
    }
  };

  // --- Views ---

  const PersonaSelection = () => (
    <div className="fixed inset-0 z-[100] bg-gray-950 flex flex-col items-center justify-center gap-8 text-white p-6">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
        <h2 className="text-5xl font-black mb-2">반가워요!<br /><span className="text-accent underline decoration-wavy underline-offset-4">누가 사용하나요?</span></h2>
      </motion.div>
      <div className="flex flex-wrap justify-center gap-8">
        <button onClick={() => { setPersona('silver'); speak("반갑습니다 어르신. 수업을 시작해볼까요?"); }} className="group flex flex-col items-center gap-4 p-10 bg-gray-900 border-4 border-amber-400/30 rounded-[3rem] hover:border-amber-400 transition-all hover:scale-105 shadow-2xl">
          <div className="text-8xl group-hover:scale-110 transition-transform">👵</div>
          <span className="text-3xl font-bold">어르신</span>
        </button>
        <button onClick={() => { setPersona('junior'); speak("안녕 친구야! 우리 재미있게 놀자!"); }} className="group flex flex-col items-center gap-4 p-10 bg-gray-900 border-4 border-pink-400/30 rounded-[3rem] hover:border-pink-400 transition-all hover:scale-105 shadow-2xl">
          <div className="text-8xl group-hover:scale-110 transition-transform">👶</div>
          <span className="text-3xl font-bold">어린이</span>
        </button>
      </div>
    </div>
  );

  const Header = () => (
    <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="w-full glass-panel p-4 rounded-[2rem] flex justify-between items-center shadow-xl border border-white/5 shrink-0">
      <div className="flex items-center gap-4 text-left">
        <div className={`w-16 h-16 rounded-[1.2rem] flex items-center justify-center text-gray-900 shadow-lg ${persona === 'junior' ? 'bg-pink-400' : 'bg-accent'}`}>
          {currentModule === 'mouse' ? <MousePointer2 size={32} /> :
            currentModule === 'keyboard' ? <Keyboard size={32} /> :
              currentModule === 'prompt' ? <Brain size={32} /> :
                currentModule === 'voice' ? <Mic size={32} /> : <ImageIcon size={32} />}
        </div>
        <div>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${persona === 'junior' ? 'bg-pink-400/20 text-pink-400' : 'bg-accent/20 text-accent'}`}>
            Level {currentModule === 'mouse' ? '1' : currentModule === 'keyboard' ? '2' : currentModule === 'prompt' ? '3' : '4'}
          </span>
          <h1 className="text-2xl font-black high-contrast-text">
            {currentModule === 'mouse' ? (currentLevel === 1 ? '클릭 마법' : '드래그 마법') :
              currentModule === 'keyboard' ? (currentLevel === 1 ? '단어 톡톡' : '문장 톡톡') :
                currentModule === 'prompt' ? 'AI 프롬프트 학교' :
                  currentModule === 'voice' ? '음성 대화' : '상상 일기 만들기'}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="w-48 text-right">
          <div className="flex justify-between mb-1 font-bold text-sm">
            <span className="opacity-60">미션 진행중</span>
            <span className="text-accent">{score} / {currentModule === 'mouse' ? LEVEL_GOALS.mouse[currentLevel - 1] : currentModule === 'keyboard' ? LEVEL_GOALS.keyboard[currentLevel - 1] : (currentModule === 'prompt' ? LEVEL_GOALS.prompt[0] : '∞')}</span>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${persona === 'junior' ? 'bg-pink-400' : 'bg-accent'}`}
              animate={{ width: `${(score / (currentModule === 'mouse' ? LEVEL_GOALS.mouse[currentLevel - 1] : currentModule === 'keyboard' ? LEVEL_GOALS.keyboard[currentLevel - 1] : 10)) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="flex flex-col items-center w-full max-w-6xl mx-auto p-4 gap-4 h-screen max-h-screen overflow-hidden">
      {!persona && <PersonaSelection />}
      {persona && <Header />}

      {persona && (
        <div className="relative w-full flex-1 min-h-0 rounded-[2.5rem] glass-panel overflow-hidden shadow-2xl border-4 border-white/5" ref={gameStageRef}>
          <AnimatePresence>
            {praise && (
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.3 } }}
                className="absolute inset-0 z-[100] flex items-center justify-center pointer-events-none"
              >
                <div className={`px-12 py-6 rounded-[3rem] shadow-xl border-4 border-white/40 ${persona === 'junior' ? 'bg-pink-500' : 'bg-amber-500'}`}>
                  <span className="text-6xl font-black text-white drop-shadow-lg">{praise}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {currentModule === 'mouse' && currentLevel === 1 && isStarted && (
            <div className="absolute inset-0">
              <AnimatePresence>
                {flowers.map(f => (
                  <motion.div
                    key={f.id} initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                    style={{ left: `${f.x}%`, top: `${f.y}%` }}
                    onClick={() => !f.isBloomed && handleBloom(f.id)}
                  >
                    <PetalFlower color={f.color} isBloomed={f.isBloomed} persona={persona} />
                    <div className="absolute w-48 h-48 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2 rounded-full group-hover:bg-white/5 transition-colors" />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {currentModule === 'mouse' && currentLevel === 2 && (
            <div className="absolute inset-0">
              <div className="absolute bottom-6 right-6 w-48 h-48 bg-amber-900/40 rounded-3xl border-4 border-dashed border-amber-400/30 flex flex-col items-center justify-center text-xl font-bold text-amber-400">
                <span className="text-4xl mb-1">🧺</span> 바구니
              </div>
              {leaves.map(l => !l.isCollected && (
                <motion.div
                  key={l.id} drag dragConstraints={gameStageRef}
                  onDragEnd={(_, info) => {
                    const stage = gameStageRef.current?.getBoundingClientRect();
                    if (stage) {
                      const basketX = stage.right - 220;
                      const basketY = stage.bottom - 220;
                      if (info.point.x > basketX && info.point.y > basketY) handleLeafCollect(l.id);
                    }
                  }}
                  className="absolute w-20 h-20 text-5xl cursor-grab active:cursor-grabbing p-4"
                  style={{ left: `${l.x}%`, top: `${l.y}%` }}
                >
                  🍂
                </motion.div>
              ))}
            </div>
          )}

          {currentModule === 'keyboard' && isStarted && !isCompleted && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-8">
              {currentLevel === 1 ? (
                <>
                  <motion.div key={targetKey} initial={{ scale: 0.5 }} animate={{ scale: 1 }} className={`w-56 h-56 rounded-[2rem] flex items-center justify-center text-[7rem] font-black shadow-2xl border-b-[12px] ${persona === 'junior' ? 'bg-pink-400 border-pink-700' : 'bg-accent border-amber-700'} text-gray-900`}>
                    {targetKey === 'Space' ? '⎵' : targetKey === 'Enter' ? '↵' : targetKey}
                  </motion.div>
                  <h3 className="text-4xl font-black opacity-80">{targetKey === 'Space' ? '긴 막대기(스페이스)' : targetKey === 'Enter' ? '엔터(Enter)' : targetKey} 키를 누르세요!</h3>
                </>
              ) : (
                <>
                  <div className="flex gap-3">
                    {targetWord.split('').map((char, i) => {
                      const isCorrect = inputValue[i] === char;
                      return (
                        <motion.div key={i} className={`w-24 h-32 rounded-xl flex items-center justify-center text-6xl font-black ${isCorrect ? 'bg-green-500 text-white' : 'bg-gray-800 text-gray-400'}`}>
                          {char}
                        </motion.div>
                      );
                    })}
                  </div>
                  <p className="text-3xl font-bold opacity-60">아래 빈칸을 누르고 단어를 쳐보세요.</p>
                </>
              )}

              <div className="relative w-full max-w-xl">
                <input
                  ref={inputRef} type="text" value={inputValue} onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-white/40 border-4 border-white/60 rounded-[2rem] px-12 py-8 text-5xl font-black text-gray-800 text-center focus:border-accent outline-none shadow-inner transition-all"
                  autoComplete="off" placeholder="여기에 입력"
                />
                <div className="absolute left-8 top-1/2 -translate-y-1/2 opacity-30 text-gray-800"><Search size={40} /></div>
              </div>
            </div>
          )}

          {currentModule === 'prompt' && isStarted && !isCompleted && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-12 gap-6 bg-gradient-to-b from-white/20 to-transparent">
              {/* Mission Panel */}
              <motion.div
                key={promptStep}
                initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                className="glass-panel p-10 rounded-[3rem] w-full max-w-4xl border-white/20 shadow-2xl bg-white/90 backdrop-blur-xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-4 opacity-10"><Brain size={120} /></div>
                <div className="flex items-center gap-4 mb-4 text-pink-600">
                  <span className="px-4 py-1 bg-pink-100 rounded-full text-lg font-black uppercase tracking-widest">{PROMPT_MISSIONS[promptStep].category}</span>
                </div>
                <h2 className="text-4xl font-black text-gray-900 mb-2">{PROMPT_MISSIONS[promptStep].title}</h2>
                <p className="text-2xl font-bold text-gray-500 mb-10">{PROMPT_MISSIONS[promptStep].description}</p>

                <div className="flex flex-wrap gap-5 justify-center">
                  {PROMPT_MISSIONS[promptStep].parts.map((part, idx) => (
                    <motion.button
                      key={idx}
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      onClick={() => handlePromptSelect(part)}
                      className="px-8 py-5 bg-white border-4 border-pink-100 rounded-[2rem] text-3xl font-black text-pink-500 transition-all shadow-lg hover:border-pink-400 hover:text-pink-600"
                    >
                      {part}
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              {/* Prompt Builder Context */}
              <div className="flex flex-col items-center gap-4 mt-4 w-full max-w-5xl">
                <div className="flex gap-3 flex-wrap justify-center">
                  {PROMPT_MISSIONS.map((m, i) => (
                    <div key={m.id} className={`px-6 py-4 rounded-3xl border-2 transition-all flex flex-col items-center min-w-[160px] ${promptStep === i ? 'border-pink-500 bg-pink-50 shadow-lg' : selectedPromptParts[i] ? 'border-green-400 bg-green-50' : 'border-dashed border-gray-300 bg-white/50'}`}>
                      <span className="text-sm font-bold opacity-40 mb-1">{m.category}</span>
                      <span className={`text-xl font-black ${selectedPromptParts[i] ? 'text-gray-900' : 'text-gray-300 italic'}`}>
                        {selectedPromptParts[i] || '기다리는 중...'}
                      </span>
                    </div>
                  ))}
                </div>

                {selectedPromptParts.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4 p-6 bg-gray-900 rounded-[2.5rem] border-4 border-accent shadow-2xl w-full text-center">
                    <p className="text-sm font-bold text-accent mb-2 tracking-[0.3em]">AI에게 전달되는 마법의 문장</p>
                    <p className="text-3xl font-black text-white">"{selectedPromptParts.join(', ')}"</p>
                  </motion.div>
                )}
              </div>
            </div>
          )}

          {currentModule === 'voice' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 p-10 bg-gradient-to-b from-blue-900/10 to-black/60">
              <motion.div animate={{ scale: isListening ? [1, 1.1, 1] : 1 }} className={`w-56 h-56 rounded-full flex items-center justify-center shadow-2xl ${isListening ? 'bg-red-500' : 'bg-blue-600'}`}>
                <Mic size={80} className="text-white" />
              </motion.div>
              <div className="glass-panel p-6 rounded-[2rem] w-full max-w-2xl text-center">
                <p className="text-3xl font-black text-white">{transcript || '"오늘 날씨 어때?" 라고 물어봐!'}</p>
              </div>
              <button onMouseDown={startListening} className="px-16 py-6 bg-blue-600 hover:bg-blue-500 text-white rounded-[3rem] text-3xl font-black shadow-2xl transition-all">
                {isListening ? "듣는 중..." : "눌러서 말하기"}
              </button>
            </div>
          )}

          {currentModule === 'creation' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-gray-900/50 backdrop-blur-md overflow-hidden">
              {!aiResult ? (
                <div className="flex flex-col items-center gap-8">
                  <div className="w-32 h-32 bg-pink-500 rounded-full flex items-center justify-center text-white text-6xl shadow-2xl animate-pulse">✨</div>
                  <h2 className="text-4xl font-black text-white">무엇을 상상했나요?</h2>
                  <div className="flex gap-4">
                    <button onClick={startListening} className="px-12 py-6 bg-blue-600 text-white rounded-[2rem] text-2xl font-black flex items-center gap-3"><Mic size={32} /> 말씀하기</button>
                    {transcript && <button onClick={generateAI} disabled={isGenerating} className="px-12 py-6 bg-accent text-gray-950 rounded-[2rem] text-2xl font-black flex items-center gap-3 disabled:opacity-50">{isGenerating ? "그리는 중..." : "그림 그리기"}</button>}
                  </div>
                  {transcript && <p className="text-3xl text-accent font-black">"{transcript}"</p>}
                </div>
              ) : (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-6">
                  <img src={aiResult.image} alt="AI" className="max-w-full max-h-[45vh] object-contain rounded-[2rem] shadow-2xl border-4 border-white/10" />
                  <div className="flex gap-4">
                    <button onClick={() => setAiResult(null)} className="px-8 py-4 bg-white/10 text-white rounded-full text-lg font-bold">다시하기</button>
                    <button onClick={() => speak("전송 완료!")} className="px-10 py-4 bg-green-500 text-white rounded-full text-2xl font-black flex items-center gap-3"><Send size={24} /> 카톡 전송</button>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          <AnimatePresence>
            {!isStarted && currentModule !== 'voice' && currentModule !== 'creation' && currentModule !== 'prompt' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[60] bg-gray-900/90 backdrop-blur-xl flex flex-col items-center justify-center gap-10">
                <div className="text-[10rem] animate-bounce">{currentModule === 'mouse' ? '🖱️' : '⌨️'}</div>
                <h2 className="text-5xl font-black text-center leading-tight">
                  {currentModule === 'mouse' ? '마우스 마법을 시작해볼까?' : '키보드 마법을 시작해볼까?'}
                </h2>
                <button onClick={() => { setIsStarted(true); currentModule === 'mouse' ? spawnFlower() : (currentLevel === 1 ? spawnKey() : spawnWord()); speak("시작!"); }} className={`px-20 py-8 rounded-full text-4xl font-black text-gray-900 shadow-2xl hover:scale-110 transition-all ${persona === 'junior' ? 'bg-pink-400' : 'bg-accent'}`}>도전 시작!</button>
              </motion.div>
            )}

            {!isStarted && currentModule === 'prompt' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[60] bg-gray-900/95 backdrop-blur-xl flex flex-col items-center justify-center gap-10 text-center p-12">
                <Brain size={140} className="text-accent animate-pulse" />
                <h2 className="text-5xl font-black text-white leading-tight">AI에게 똑똑하게 말하는 법!<br />프롬프트 퍼즐을 맞춰봐!</h2>
                <button onClick={() => { setIsStarted(true); speak("AI 학교에 온 걸 환영해!"); }} className="px-20 py-8 rounded-full text-4xl font-black bg-accent text-gray-900 shadow-2xl hover:scale-110 transition-all">수업 시작!</button>
              </motion.div>
            )}

            {isCompleted && (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 z-[70] bg-gray-950/95 backdrop-blur-3xl flex flex-col items-center justify-center gap-8 text-center p-10">
                <Trophy size={140} className="text-accent animate-bounce" />
                <h2 className="text-6xl font-black text-white">미션 클리어!</h2>
                <button onClick={nextMode} className={`px-20 py-8 rounded-[2rem] text-4xl font-black text-gray-900 flex items-center gap-6 ${persona === 'junior' ? 'bg-pink-400' : 'bg-accent'}`}>다음 미션으로! <ArrowRight size={48} /></button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {persona && (
        <div className="flex flex-col gap-4 w-full items-center shrink-0 mb-4">
          <div className="glass-panel px-6 py-3 rounded-full flex gap-4 border border-white/10 shadow-lg bg-white/5 backdrop-blur-md">
            <button onClick={() => { setCurrentModule('mouse'); setCurrentLevel(1); setScore(0); setFlowers([]); }} className={`px-6 py-3 rounded-full font-bold transition-all ${currentModule === 'mouse' ? (persona === 'junior' ? 'bg-pink-400 text-white shadow-lg' : 'bg-accent text-gray-900 shadow-lg') : 'opacity-40'}`}>1단계: 마우스</button>
            <button onClick={() => { setCurrentModule('keyboard'); setCurrentLevel(1); setScore(0); }} className={`px-6 py-3 rounded-full font-bold transition-all ${currentModule === 'keyboard' ? (persona === 'junior' ? 'bg-pink-400 text-white shadow-lg' : 'bg-accent text-gray-900 shadow-lg') : 'opacity-40'}`}>2단계: 키보드</button>
            {persona === 'junior' ? (
              <button onClick={() => { setCurrentModule('prompt'); setScore(0); setPromptStep(0); setSelectedPromptParts([]); }} className={`px-6 py-3 rounded-full font-bold transition-all ${currentModule === 'prompt' ? 'bg-accent text-gray-900 shadow-lg' : 'opacity-40'}`}>3단계: 프롬프트</button>
            ) : (
              <button onClick={() => { setCurrentModule('voice'); setScore(0); }} className={`px-6 py-3 rounded-full font-bold transition-all ${currentModule === 'voice' ? 'bg-blue-600 text-white shadow-lg' : 'opacity-40'}`}>3단계: 음성대화</button>
            )}
            <button onClick={() => { setCurrentModule('creation'); setScore(0); }} className={`px-6 py-3 rounded-full font-bold transition-all ${currentModule === 'creation' ? 'bg-purple-600 text-white shadow-lg' : 'opacity-40'}`}>4단계: AI 창작</button>
          </div>
          <div className="flex gap-4">
            <button onClick={resetState} className="glass-panel px-8 py-3 rounded-full text-lg font-bold flex items-center gap-2 hover:bg-white/10 transition-all border border-white/5"><Home size={20} /> 처음으로</button>
            <button onClick={() => { setScore(0); setIsStarted(false); setIsCompleted(false); setFlowers([]); setLeaves([]); setPromptStep(0); setSelectedPromptParts([]); }} className="glass-panel px-8 py-3 rounded-full text-lg font-bold flex items-center gap-2 hover:bg-white/10 transition-all border border-white/5"><RotateCcw size={20} /> 다시 하기</button>
          </div>
        </div>
      )}

      {persona && (
        <div className="fixed bottom-6 right-6 flex flex-col items-end gap-3 z-[110]">
          <AnimatePresence>
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="glass-panel px-6 py-4 rounded-[2.5rem] rounded-br-none max-w-xs border-white/10 shadow-2xl bg-white/10 backdrop-blur-xl">
              <p className="text-lg font-medium leading-relaxed">
                {isListening ? "잘 듣고 있어요!" : isGenerating ? "멋진 그림을 그리는 중!" : (persona === 'junior' ? "프롬프트 퍼즐을 맞춰봐! 🐱" : "정확하게 입력해 보세요! 🤖")}
              </p>
            </motion.div>
          </AnimatePresence>
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
            onClick={() => speak(currentModule === 'prompt' ? "문장을 완성해서 AI에게 명령을 내려보자!" : "도움이 필요하신가요?")}
            className={`w-20 h-20 rounded-full flex items-center justify-center text-5xl border-4 border-white/10 shadow-2xl ${persona === 'junior' ? 'from-pink-400 to-rose-500' : 'from-accent to-orange-500'} bg-gradient-to-tr cursor-pointer`}
          >
            {persona === 'junior' ? '🐶' : '🤖'}
          </motion.button>
        </div>
      )}
    </div>
  );
}
