import { useState, useEffect, useRef } from 'react';
import { Play, Pause, StopCircle, RotateCcw, Clock, Timer as TimerIcon, Plus, Minus, Sun, Moon } from 'lucide-react';
import "./App.css"
function App() {
  // App state
  const [mode, setMode] = useState('stopwatch'); // 'stopwatch' or 'timer'
  const [darkMode, setDarkMode] = useState(false);
  
  // Load state from localStorage on initial render
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode) {
      setDarkMode(JSON.parse(savedDarkMode));
    }
  }, []);

  // Save dark mode preference to localStorage
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className={`min-h-screen ${darkMode ? 'dark bg-gray-900 text-white' : 'bg-gray-100 text-gray-900'} transition-colors duration-300`}>
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Time Master</h1>
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-full ${darkMode ? 'bg-gray-800 text-yellow-300' : 'bg-gray-200 text-gray-800'} transition-colors`}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>
          <div className="mt-6 bg-white  rounded-lg shadow-md p-1 flex">
            <button 
              onClick={() => setMode('stopwatch')}
              className={`flex-1 py-2 px-4 rounded-md flex items-center justify-center gap-2 transition ${
                mode === 'stopwatch' 
                  ? 'bg-blue-500 text-white shadow-sm' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Clock size={18} />
              <span>Stopwatch</span>
            </button>
            <button 
              onClick={() => setMode('timer')}
              className={`flex-1 py-2 px-4 rounded-md flex items-center justify-center gap-2 transition ${
                mode === 'timer' 
                  ? 'bg-blue-500 text-white shadow-sm' 
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <TimerIcon size={18} />
              <span>Timer</span>
            </button>
          </div>
        </header>

        <main className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          {mode === 'stopwatch' ? <Stopwatch darkMode={darkMode} /> : <TimerComponent darkMode={darkMode} />}
        </main>

        <footer className="mt-8 text-center text-sm text-white dark:text-white">
          <p>Press spacebar to start/stop. Press "L" for lap in stopwatch mode.</p>
        </footer>
      </div>
    </div>
  );
}

function Stopwatch({ darkMode }) {
  // State
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [laps, setLaps] = useState([]);
  const [startTime, setStartTime] = useState(null);
  const [timeAtLastStop, setTimeAtLastStop] = useState(0);
  
  // Refs
  const intervalRef = useRef(null);
  const lapsContainerRef = useRef(null);
  
  // Load state from localStorage
  useEffect(() => {
    const savedStopwatch = localStorage.getItem('stopwatch');
    if (savedStopwatch) {
      const { laps, elapsedTime, isRunning, timeAtLastStop } = JSON.parse(savedStopwatch);
      setLaps(laps || []);
      setElapsedTime(isRunning ? elapsedTime + (Date.now() - timeAtLastStop) : elapsedTime);
      // Don't auto-start, just restore the elapsed time
      setIsRunning(false);
      setTimeAtLastStop(timeAtLastStop);
    }
  }, []);

  // Save state to localStorage when changes occur
  useEffect(() => {
    localStorage.setItem('stopwatch', JSON.stringify({
      laps,
      elapsedTime,
      isRunning,
      timeAtLastStop: isRunning ? Date.now() : timeAtLastStop
    }));
  }, [laps, elapsedTime, isRunning, timeAtLastStop]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        toggleRunning();
      } else if (e.code === 'KeyL' && isRunning) {
        addLap();
      } else if (e.code === 'KeyR') {
        resetStopwatch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, elapsedTime]);

  // Timer logic
  useEffect(() => {
    if (isRunning) {
      setStartTime(Date.now() - elapsedTime);
      intervalRef.current = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 10); // Update every 10ms for smoother display
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      setTimeAtLastStop(Date.now());
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, startTime]);

  // Auto-scroll to the newest lap
  useEffect(() => {
    if (lapsContainerRef.current && laps.length > 0) {
      lapsContainerRef.current.scrollTop = lapsContainerRef.current.scrollHeight;
    }
  }, [laps]);

  // Calculate fastest and slowest laps
  const { fastestLapIndex, slowestLapIndex } = findFastestAndSlowestLaps(laps);

  // Format time as HH:MM:SS.MS
  const formattedTime = formatTime(elapsedTime);

  // Callbacks
  const toggleRunning = () => {
    setIsRunning(!isRunning);
  };

  const addLap = () => {
    const newLapTime = elapsedTime - (laps.length > 0 ? laps[laps.length - 1].totalTime : 0);
    setLaps([...laps, { 
      number: laps.length + 1, 
      lapTime: newLapTime, 
      totalTime: elapsedTime 
    }]);
  };

  const resetStopwatch = () => {
    setIsRunning(false);
    setElapsedTime(0);
    setLaps([]);
    setTimeAtLastStop(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="text-center mb-8">
        <div className="text-5xl md:text-6xl text-white font-mono font-bold mb-8 tracking-tight">
          {formattedTime}
        </div>
        
        <div className="flex justify-center gap-4">
          {!isRunning && elapsedTime > 0 && (
            <button 
              onClick={resetStopwatch} 
              className={`p-3 rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}
              aria-label="Reset"
            >
              <RotateCcw size={24} className="text-red-500" />
            </button>
          )}
          
          <button 
            onClick={toggleRunning}
            className={`p-3 rounded-full ${
              isRunning 
                ? 'bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800' 
                : 'bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800'
            } transition-colors`}
            aria-label={isRunning ? "Pause" : "Start"}
          >
            {isRunning 
              ? <Pause size={24} className="text-red-500 dark:text-red-400" /> 
              : <Play size={24} className="text-green-500 dark:text-green-400" />
            }
          </button>
          
          {isRunning && (
            <button 
              onClick={addLap} 
              className={`p-3 rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}
              aria-label="Lap"
            >
              <StopCircle size={24} className="text-blue-500" />
            </button>
          )}
        </div>
      </div>
      
      {laps.length > 0 && (
        <div className="mt-4">
          <h2 className="text-lg text-white font-semibold mb-2">Laps</h2>
          <div 
            ref={lapsContainerRef} 
            className={`max-h-64 overflow-y-auto rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'} p-2`}
          >
            <table className="w-full">
              <thead className="text-left">
                <tr className={`border-b ${darkMode ? 'border-gray-600' : 'border-gray-300'}`}>
                  <th className="p-2">#</th>
                  <th className="p-2">Lap Time</th>
                  <th className="p-2">Total Time</th>
                </tr>
              </thead>
              <tbody>
                {laps.map((lap, index) => (
                  <tr 
                    key={lap.number} 
                    className={`
                      ${index === fastestLapIndex ? 'text-green-500 font-medium' : ''}
                      ${index === slowestLapIndex ? 'text-red-500 font-medium' : ''}
                      ${darkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}
                      transition-colors
                    `}
                  >
                    <td className="p-2">{lap.number}</td>
                    <td className="p-2 font-mono">{formatTime(lap.lapTime)}</td>
                    <td className="p-2 font-mono">{formatTime(lap.totalTime)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function TimerComponent({ darkMode }) {
  // Timer state
  const [timeLeft, setTimeLeft] = useState(0);
  const [inputHours, setInputHours] = useState(0);
  const [inputMinutes, setInputMinutes] = useState(0);
  const [inputSeconds, setInputSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [timeCompleted, setTimeCompleted] = useState(false);
  
  // Refs
  const intervalRef = useRef(null);
  const audioRef = useRef(null);
  
  // Load state from localStorage
  useEffect(() => {
    const savedTimer = localStorage.getItem('timer');
    if (savedTimer) {
      const { timeLeft, isRunning, inputHours, inputMinutes, inputSeconds, lastUpdated } = JSON.parse(savedTimer);
      
      // Calculate the correct time left if the timer was running when the page was closed
      let updatedTimeLeft = timeLeft;
      if (isRunning && lastUpdated) {
        const elapsedSinceLastUpdate = Math.floor((Date.now() - lastUpdated) / 1000);
        updatedTimeLeft = Math.max(0, timeLeft - elapsedSinceLastUpdate);
      }
      
      setTimeLeft(updatedTimeLeft);
      setInputHours(inputHours || 0);
      setInputMinutes(inputMinutes || 0);
      setInputSeconds(inputSeconds || 0);
      
      // Don't auto-start timers when reloading the page
      setIsRunning(false);
      setTimeCompleted(updatedTimeLeft === 0);
    }
  }, []);

  // Save state to localStorage
  useEffect(() => {
    localStorage.setItem('timer', JSON.stringify({
      timeLeft,
      isRunning,
      inputHours,
      inputMinutes,
      inputSeconds,
      lastUpdated: Date.now()
    }));
  }, [timeLeft, isRunning, inputHours, inputMinutes, inputSeconds]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (timeLeft > 0) {
          toggleRunning();
        }
      } else if (e.code === 'KeyR') {
        resetTimer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, timeLeft]);

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            setTimeCompleted(true);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (!isRunning && intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  // Play sound when timer completes
  useEffect(() => {
    if (timeCompleted) {
      // Create and play a beep sound
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.type = 'sine';
      oscillator.frequency.value = 800;
      gainNode.gain.value = 0.3;
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.start();
      
      // Beep for 0.5 seconds
      setTimeout(() => {
        oscillator.stop();
      }, 500);
      
      // Add a visual indicator that will clear after 3 seconds
      setTimeout(() => {
        setTimeCompleted(false);
      }, 3000);
    }
  }, [timeCompleted]);

  // Format the remaining time
  const formattedTime = formatTimeHMS(timeLeft);

  // Callbacks
  const toggleRunning = () => {
    if (!isRunning && timeLeft === 0) {
      // If timer is at 0, start the timer with input values
      const totalSeconds = 
        (inputHours * 3600) + 
        (inputMinutes * 60) + 
        parseInt(inputSeconds);
      
      if (totalSeconds > 0) {
        setTimeLeft(totalSeconds);
        setIsRunning(true);
        setTimeCompleted(false);
      }
    } else {
      setIsRunning(!isRunning);
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(0);
    setTimeCompleted(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const updateInputTime = (hours, minutes, seconds) => {
    // Ensure values are within valid ranges
    const validHours = Math.max(0, Math.min(99, hours));
    let validMinutes = Math.max(0, Math.min(59, minutes));
    let validSeconds = Math.max(0, Math.min(59, seconds));
    
    setInputHours(validHours);
    setInputMinutes(validMinutes);
    setInputSeconds(validSeconds);
  };

  const addPresetTime = (seconds) => {
    if (!isRunning) {
      const newTimeLeft = timeLeft + seconds;
      setTimeLeft(newTimeLeft);
      
      // Update input fields to match
      const hours = Math.floor(newTimeLeft / 3600);
      const minutes = Math.floor((newTimeLeft % 3600) / 60);
      const secs = newTimeLeft % 60;
      
      setInputHours(hours);
      setInputMinutes(minutes);
      setInputSeconds(secs);
    }
  };

  return (
    <div className="flex flex-col">
      <div className={`text-center mb-6 p-6 rounded-lg ${timeCompleted ? 'animate-pulse bg-red-100 dark:bg-red-900/40' : ''}`}>
        <div className="text-5xl md:text-6xl text-white font-mono font-bold tracking-tight">
          {formattedTime}
        </div>
      </div>
      
      {!isRunning && (
        <div className="mb-6">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-center">Hours</label>
              <div className="flex items-center">
                <button 
                  onClick={() => updateInputTime(Math.max(0, inputHours - 1), inputMinutes, inputSeconds)}
                  className={`p-2 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded-l-lg transition-colors`}
                  disabled={isRunning}
                >
                  <Minus size={16} />
                </button>
                <input
                  type="number"
                  min="0"
                  max="99"
                  value={inputHours}
                  onChange={(e) => updateInputTime(parseInt(e.target.value) || 0, inputMinutes, inputSeconds)}
                  className={`w-full text-center py-2 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'} border-y`}
                  disabled={isRunning}
                />
                <button 
                  onClick={() => updateInputTime(inputHours + 1, inputMinutes, inputSeconds)}
                  className={`p-2 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded-r-lg transition-colors`}
                  disabled={isRunning}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-center">Minutes</label>
              <div className="flex items-center">
                <button 
                  onClick={() => updateInputTime(inputHours, Math.max(0, inputMinutes - 1), inputSeconds)}
                  className={`p-2 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded-l-lg transition-colors`}
                  disabled={isRunning}
                >
                  <Minus size={16} />
                </button>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={inputMinutes}
                  onChange={(e) => updateInputTime(inputHours, parseInt(e.target.value) || 0, inputSeconds)}
                  className={`w-full text-center py-2 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'} border-y`}
                  disabled={isRunning}
                />
                <button 
                  onClick={() => updateInputTime(inputHours, Math.min(59, inputMinutes + 1), inputSeconds)}
                  className={`p-2 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded-r-lg transition-colors`}
                  disabled={isRunning}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 text-center">Seconds</label>
              <div className="flex items-center">
                <button 
                  onClick={() => updateInputTime(inputHours, inputMinutes, Math.max(0, inputSeconds - 1))}
                  className={`p-2 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded-l-lg transition-colors`}
                  disabled={isRunning}
                >
                  <Minus size={16} />
                </button>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={inputSeconds}
                  onChange={(e) => updateInputTime(inputHours, inputMinutes, parseInt(e.target.value) || 0)}
                  className={`w-full text-center py-2 ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'} border-y`}
                  disabled={isRunning}
                />
                <button 
                  onClick={() => updateInputTime(inputHours, inputMinutes, Math.min(59, inputSeconds + 1))}
                  className={`p-2 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded-r-lg transition-colors`}
                  disabled={isRunning}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-2 mb-6">
            <button 
              onClick={() => addPresetTime(30)}
              className={`py-2 px-1 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded transition-colors text-sm`}
              disabled={isRunning}
            >
              +30s
            </button>
            <button 
              onClick={() => addPresetTime(60)}
              className={`py-2 px-1 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded transition-colors text-sm`}
              disabled={isRunning}
            >
              +1m
            </button>
            <button 
              onClick={() => addPresetTime(300)}
              className={`py-2 px-1 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded transition-colors text-sm`}
              disabled={isRunning}
            >
              +5m
            </button>
            <button 
              onClick={() => addPresetTime(600)}
              className={`py-2 px-1 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} rounded transition-colors text-sm`}
              disabled={isRunning}
            >
              +10m
            </button>
          </div>
        </div>
      )}
      
      <div className="flex justify-center gap-4">
        {(!isRunning && timeLeft > 0) && (
          <button 
            onClick={resetTimer} 
            className={`p-3 rounded-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} transition-colors`}
            aria-label="Reset"
          >
            <RotateCcw size={24} className="text-red-500" />
          </button>
        )}
        
        <button 
          onClick={toggleRunning}
          disabled={!isRunning && timeLeft === 0 && (inputHours === 0 && inputMinutes === 0 && inputSeconds === 0)}
          className={`p-3 rounded-full ${
            isRunning 
              ? 'bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800' 
              : 'bg-green-100 hover:bg-green-200 dark:bg-green-900 dark:hover:bg-green-800'
          } transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
          aria-label={isRunning ? "Pause" : "Start"}
        >
          {isRunning 
            ? <Pause size={24} className="text-red-500 dark:text-red-400" /> 
            : <Play size={24} className="text-green-500 dark:text-green-400" />
          }
        </button>
      </div>
    </div>
  );
}

// Utility functions
function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = Math.floor((ms % 1000) / 10);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
}

function formatTimeHMS(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function findFastestAndSlowestLaps(laps) {
  if (laps.length <= 1) {
    return { fastestLapIndex: -1, slowestLapIndex: -1 };
  }
  
  let fastestLapIndex = 0;
  let slowestLapIndex = 0;
  let fastestTime = laps[0].lapTime;
  let slowestTime = laps[0].lapTime;
  
  laps.forEach((lap, index) => {
    if (lap.lapTime < fastestTime) {
      fastestTime = lap.lapTime;
      fastestLapIndex = index;
    }
    if (lap.lapTime > slowestTime) {
      slowestTime = lap.lapTime;
      slowestLapIndex = index;
    }
  });
  
  return { fastestLapIndex, slowestLapIndex };
}

export default App;