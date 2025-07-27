'use client';

import { useState, useRef, useEffect } from 'react';
import { open } from '@tauri-apps/api/dialog';
import { convertFileSrc } from '@tauri-apps/api/tauri';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Upload,
  AlertCircle,
  Settings,
  Trash2,
  X,
  Info,
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface AudioTrack {
  id: number;
  name: string;
  url: string;
  duration?: number;
  filePath: string;
}

type Language = 'ru' | 'en' | 'uk';

// Переводы
const translations = {
  ru: {
    playlist: 'Плейлист',
    audioPlayer: 'Аудиоплеер',
    noAudioFiles: 'Нет аудиофайлов',
    clickUploadIcon: 'Нажмите на иконку загрузки',
    selectTrack: 'Выберите трек',
    mouseControls: 'Управление мышью:',
    leftClick: 'ЛКМ - повтор текущего трека',
    rightClick: 'ПКМ - следующий трек',
    middleClick: 'СКМ - предыдущий трек',
    mouseWheel: 'Колесико мыши - изменение громкости',
    uploadFiles: 'Загрузите свои аудиофайлы через кнопку загрузки в плейлисте',
    autoPlay: 'Автопроигрывание',
    language: 'Язык',
    settings: 'Настройки',
    couldNotLoadAudio: 'Не удалось загрузить аудиофайл',
    playbackError: 'Ошибка воспроизведения',
    loadError: 'Ошибка загрузки файла',
    fileSelectionError: 'Ошибка при загрузке файлов',
    clearPlaylist: 'Очистить плейлист',
    removeTrack: 'Удалить трек',
    uploadTooltip: 'Загрузить файлы',
    about: 'О программе',
    aboutTitle: 'Аудиоплеер',
    aboutDescription:
      'Современный аудиоплеер, созданный с использованием Tauri и React. Поддерживает различные аудиоформаты и имеет удобный интерфейс для управления плейлистами.',
    version: 'Версия: 1.0.0',
    author: 'Разработчик: v0',
    close: 'Закрыть',
  },
  en: {
    playlist: 'Playlist',
    audioPlayer: 'Audio Player',
    noAudioFiles: 'No audio files',
    clickUploadIcon: 'Click the upload icon',
    selectTrack: 'Select track',
    mouseControls: 'Mouse controls:',
    leftClick: 'LMB - repeat current track',
    rightClick: 'RMB - next track',
    middleClick: 'MMB - previous track',
    mouseWheel: 'Mouse wheel - volume control',
    uploadFiles: 'Upload your audio files using the upload button in the playlist',
    autoPlay: 'Auto-play',
    language: 'Language',
    settings: 'Settings',
    couldNotLoadAudio: 'Could not load audio file',
    playbackError: 'Playback error',
    loadError: 'File loading error',
    fileSelectionError: 'Error loading files',
    clearPlaylist: 'Clear playlist',
    removeTrack: 'Remove track',
    uploadTooltip: 'Upload files',
    about: 'About',
    aboutTitle: 'Audio Player',
    aboutDescription:
      'Modern audio player built with Tauri and React. Supports various audio formats and features a convenient interface for playlist management.',
    version: 'Version: 1.0.0',
    author: 'Developer: v0',
    close: 'Close',
  },
  uk: {
    playlist: 'Плейлист',
    audioPlayer: 'Аудіоплеєр',
    noAudioFiles: 'Немає аудіофайлів',
    clickUploadIcon: 'Натисніть на іконку завантаження',
    selectTrack: 'Оберіть трек',
    mouseControls: 'Керування мишею:',
    leftClick: 'ЛКМ - повтор поточного треку',
    rightClick: 'ПКМ - наступний трек',
    middleClick: 'СКМ - попередній трек',
    mouseWheel: 'Колесо миші - зміна гучності',
    uploadFiles: 'Завантажте свої аудіофайли через кнопку завантаження у плейлисті',
    autoPlay: 'Автопрогравання',
    language: 'Мова',
    settings: 'Налаштування',
    couldNotLoadAudio: 'Не вдалося завантажити аудіофайл',
    playbackError: 'Помилка відтворення',
    loadError: 'Помилка завантаження файлу',
    fileSelectionError: 'Помилка при завантаженні файлів',
    clearPlaylist: 'Очистити плейлист',
    removeTrack: 'Видалити трек',
    uploadTooltip: 'Завантажити файли',
    about: 'Про програму',
    aboutTitle: 'Аудіоплеєр',
    aboutDescription:
      'Сучасний аудіоплеєр, створений з використанням Tauri та React. Підтримує різні аудіоформати та має зручний інтерфейс для керування плейлистами.',
    version: 'Версія: 1.0.0',
    author: 'Розробник: v0',
    close: 'Закрити',
  },
};

// Компонент для бегущей строки
function MarqueeText({
  text,
  isActive,
  alwaysAnimate = false,
  debugLabel = '',
  maxWidth,
}: {
  text: string;
  isActive: boolean;
  alwaysAnimate?: boolean;
  debugLabel?: string;
  maxWidth?: string;
}) {
  const [shouldMarquee, setShouldMarquee] = useState(false);
  const textRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkOverflow = () => {
      if (textRef.current && containerRef.current) {
        const textWidth = textRef.current.scrollWidth;
        const containerWidth = containerRef.current.clientWidth;
        const needsMarquee = textWidth > containerWidth;
        setShouldMarquee(needsMarquee);
      }
    };

    // Проверяем сразу
    checkOverflow();

    // И через небольшую задержку для уверенности
    const timer = setTimeout(checkOverflow, 100);

    // И еще раз через большую задержку на случай медленной загрузки
    const timer2 = setTimeout(checkOverflow, 500);

    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
    };
  }, [text, isActive, debugLabel, alwaysAnimate]);

  const shouldAnimate = shouldMarquee && (alwaysAnimate || isActive);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-hidden relative min-w-0 flex justify-center"
      style={{ maxWidth: maxWidth || '250px' }}
    >
      <span
        ref={textRef}
        className={`block whitespace-nowrap ${
          shouldAnimate ? 'animate-marquee' : shouldMarquee ? 'truncate' : ''
        }`}
        style={{
          animationDuration: shouldAnimate ? '15s' : undefined,
          display: 'inline-block',
          minWidth: shouldAnimate ? '100%' : 'auto',
        }}
      >
        {text}
      </span>
    </div>
  );
}

function App() {
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState([70]);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoPlay, setAutoPlay] = useState(true);
  const [language, setLanguage] = useState<Language>('ru');
  const [showSettings, setShowSettings] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  const audioRef = useRef<HTMLAudioElement>(null);
  const languageRef = useRef<Language>(language);

  // Обновляем ref при изменении языка
  useEffect(() => {
    languageRef.current = language;
  }, [language]);

  const currentTrack = tracks[currentTrackIndex];
  const t = translations[language];

  // Обработка прокрутки колесика мыши для громкости
  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      // Игнорируем прокрутку на скроллируемых элементах
      const target = event.target as HTMLElement;
      if (target.closest('[data-radix-scroll-area-viewport]')) {
        return;
      }

      event.preventDefault();

      const delta = event.deltaY > 0 ? -5 : 5; // Инвертируем для интуитивности
      const newVolume = Math.max(0, Math.min(100, volume[0] + delta));
      setVolume([newVolume]);
    };

    document.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      document.removeEventListener('wheel', handleWheel);
    };
  }, [volume]);

  // Обработка кликов мыши
  useEffect(() => {
    const handleMouseClick = (event: MouseEvent) => {
      // Игнорируем клики на интерактивных элементах
      const target = event.target as HTMLElement;
      if (target.closest('button, input, [role="slider"], [role="switch"]')) {
        return;
      }

      event.preventDefault();

      if (tracks.length === 0) return;

      if (event.button === 0) {
        // ЛКМ - повтор
        playCurrentTrack();
      } else if (event.button === 2) {
        // ПКМ - следующий
        playNext();
      } else if (event.button === 1) {
        // СКМ - предыдущий
        playPrevious();
      }
    };

    const handleContextMenu = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('button, input, [role="slider"], [role="switch"]')) {
        event.preventDefault();
      }
    };

    document.addEventListener('mousedown', handleMouseClick);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('mousedown', handleMouseClick);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [currentTrackIndex, tracks.length]);

  // Обработка аудио событий
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
      setAudioError(null);
    };

    const handleCanPlay = () => {
      setIsLoading(false);
      setAudioError(null);
    };

    const handleError = (e: Event) => {
      console.error('Audio error:', e);
      setIsLoading(false);
      setIsPlaying(false);
      // Используем ref для получения актуального языка без зависимости
      const currentTranslations = translations[languageRef.current];
      setAudioError(`${currentTranslations.couldNotLoadAudio}: ${currentTrack?.name || 'Unknown'}`);
    };

    const handleEnded = () => {
      if (autoPlay) {
        playNext();
      } else {
        setIsPlaying(false);
      }
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('error', handleError);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentTrackIndex, autoPlay, currentTrack]);

  // Обновление громкости
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume[0] / 100;
    }
  }, [volume]);

  // Загрузка и воспроизведение трека
  useEffect(() => {
    if (!currentTrack) return;

    const loadTrack = async () => {
      try {
        setIsLoading(true);
        setAudioError(null);

        // Конвертируем путь файла в URL, который может использовать браузер
        const assetUrl = convertFileSrc(currentTrack.filePath);
        console.log('Loading track:', currentTrack.name, 'URL:', assetUrl);

        if (audioRef.current) {
          audioRef.current.src = assetUrl;
          audioRef.current.load();

          if (isPlaying) {
            try {
              await audioRef.current.play();
            } catch (playError) {
              console.error('Play error:', playError);
              setIsPlaying(false);
              // Используем ref для получения актуального языка без зависимости
              const currentTranslations = translations[languageRef.current];
              setAudioError(`${currentTranslations.playbackError}: ${currentTrack.name}`);
            }
          }
        }
      } catch (error) {
        console.error('Error loading track:', error);
        // Используем ref для получения актуального языка без зависимости
        const currentTranslations = translations[languageRef.current];
        setAudioError(`${currentTranslations.loadError}: ${currentTrack.name}`);
        setIsLoading(false);
      }
    };

    loadTrack();
  }, [currentTrackIndex, currentTrack]);

  // Автовоспроизведение при смене трека
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && isPlaying && !audioError && currentTrack && audio.src) {
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error('Auto-play error:', error);
          setIsPlaying(false);
        });
      }
    }
  }, [isPlaying, audioError, currentTrack]);

  const playCurrentTrack = () => {
    const audio = audioRef.current;
    if (!audio || audioError || !currentTrack) return;

    if (isPlaying) {
      audio.currentTime = 0; // Перезапуск с начала
      audio.play().catch(error => {
        console.error('Restart play error:', error);
        setIsPlaying(false);
      });
    } else {
      setIsPlaying(true);
    }
  };

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio || audioError || !currentTrack) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      setIsPlaying(true);
    }
  };

  const playNext = () => {
    if (tracks.length === 0) return;
    const nextIndex = currentTrackIndex === tracks.length - 1 ? 0 : currentTrackIndex + 1;
    setCurrentTrackIndex(nextIndex);
    setIsPlaying(true);
  };

  const playPrevious = () => {
    if (tracks.length === 0) return;
    const prevIndex = currentTrackIndex === 0 ? tracks.length - 1 : currentTrackIndex - 1;
    setCurrentTrackIndex(prevIndex);
    setIsPlaying(true);
  };

  const selectTrack = (index: number) => {
    setCurrentTrackIndex(index);
    setIsPlaying(true);
  };

  const removeTrack = (indexToRemove: number) => {
    const newTracks = tracks.filter((_, index) => index !== indexToRemove);
    setTracks(newTracks);

    // Если удаляем текущий трек
    if (indexToRemove === currentTrackIndex) {
      if (newTracks.length === 0) {
        setCurrentTrackIndex(0);
        setIsPlaying(false);
      } else if (indexToRemove >= newTracks.length) {
        setCurrentTrackIndex(newTracks.length - 1);
      }
      // Если удаляем трек до текущего, сдвигаем индекс
    } else if (indexToRemove < currentTrackIndex) {
      setCurrentTrackIndex(currentTrackIndex - 1);
    }
  };

  const clearPlaylist = () => {
    setTracks([]);
    setCurrentTrackIndex(0);
    setIsPlaying(false);
    setAudioError(null);
  };

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current;
    if (audio && duration) {
      audio.currentTime = (value[0] / 100) * duration;
    }
  };

  const handleFileUpload = async () => {
    try {
      const selected = await open({
        multiple: true,
        filters: [
          {
            name: 'Audio',
            extensions: ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'wma'],
          },
        ],
      });

      if (selected && Array.isArray(selected)) {
        const newTracks: AudioTrack[] = selected.map((filePath, index) => {
          const fileName = filePath.split(/[\\/]/).pop() || 'Unknown';
          return {
            id: tracks.length + index + 1,
            name: fileName,
            url: convertFileSrc(filePath),
            filePath: filePath,
          };
        });

        setTracks(prev => [...prev, ...newTracks]);

        // Если это первые треки, выбираем первый
        if (tracks.length === 0 && newTracks.length > 0) {
          setCurrentTrackIndex(0);
        }
      }
    } catch (error) {
      console.error('Ошибка при выборе файлов:', error);
      setAudioError(t.fileSelectionError);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Плейлист */}
        <Card className="lg:col-span-1 bg-black/20 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              {t.playlist}
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/10"
                  onClick={() => setShowSettings(!showSettings)}
                  title={t.settings}
                >
                  <Settings className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/10"
                  onClick={clearPlaylist}
                  disabled={tracks.length === 0}
                  title={t.clearPlaylist}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white hover:bg-white/10"
                  onClick={handleFileUpload}
                  title={t.uploadTooltip}
                >
                  <Upload className="w-4 h-4" />
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Настройки */}
            {showSettings && (
              <div className="mb-4 p-3 bg-black/30 rounded-lg space-y-3">
                <h3 className="text-white font-semibold text-sm">{t.settings}</h3>

                {/* Автопроигрывание */}
                <div className="flex items-center justify-between">
                  <span className="text-white/70 text-sm">{t.autoPlay}</span>
                  <Switch
                    checked={autoPlay}
                    onCheckedChange={setAutoPlay}
                    className="data-[state=checked]:bg-purple-500"
                  />
                </div>

                {/* Язык */}
                <div className="flex items-center justify-between">
                  <span className="text-white/70 text-sm">{t.language}</span>
                  <Select value={language} onValueChange={(value: Language) => setLanguage(value)}>
                    <SelectTrigger className="w-32 h-6 bg-white/10 border-white/20 text-white text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-black/90 border-white/20">
                      <SelectItem value="ru" className="text-white hover:bg-white/10">
                        Русский
                      </SelectItem>
                      <SelectItem value="en" className="text-white hover:bg-white/10">
                        English
                      </SelectItem>
                      <SelectItem value="uk" className="text-white hover:bg-white/10">
                        Українська
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* О программе */}
                <div className="flex items-center justify-between">
                  <span className="text-white/70 text-sm">{t.about}</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/10 h-6 px-2"
                    onClick={() => setShowAbout(true)}
                  >
                    <Info className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}

            {tracks.length === 0 ? (
              <div className="text-center text-white/70 py-8">
                <Upload className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{t.noAudioFiles}</p>
                <p className="text-sm">{t.clickUploadIcon}</p>
              </div>
            ) : (
              <ScrollArea className={`${showSettings ? 'h-[390px]' : 'h-[550px]'}`}>
                <div className="space-y-2">
                  {tracks.map((track, index) => (
                    <div
                      key={track.id}
                      className={`w-full rounded-md p-3 cursor-pointer transition-colors group ${
                        index === currentTrackIndex
                          ? 'bg-white/20 text-white'
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                      }`}
                      onClick={() => selectTrack(index)}
                    >
                      <div className="flex items-center gap-3 w-full min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-sm font-bold flex-shrink-0">
                          {index + 1}
                        </div>
                        <MarqueeText
                          text={track.name}
                          isActive={index === currentTrackIndex}
                          alwaysAnimate={false}
                          debugLabel=""
                          maxWidth="180px"
                        />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="opacity-0 group-hover:opacity-100 text-white/70 hover:text-red-400 hover:bg-red-500/20 w-6 h-6 p-0 flex-shrink-0"
                          onClick={e => {
                            e.stopPropagation();
                            removeTrack(index);
                          }}
                          title={t.removeTrack}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Плеер */}
        <Card className="lg:col-span-2 bg-black/20 backdrop-blur-sm border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-center">{t.audioPlayer}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Ошибка */}
            {audioError && (
              <Alert className="bg-red-500/20 border-red-500/50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-white">{audioError}</AlertDescription>
              </Alert>
            )}

            {/* Информация о треке */}
            <div className="text-center">
              <div className="mb-2 overflow-hidden flex justify-center">
                <h2 className="text-2xl font-bold text-white max-w-full">
                  {currentTrack ? (
                    <MarqueeText
                      text={currentTrack.name}
                      isActive={true}
                      debugLabel="player-title"
                      maxWidth="100%"
                    />
                  ) : (
                    t.selectTrack
                  )}
                </h2>
              </div>
              <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-4xl font-bold text-white">
                {isLoading ? '...' : tracks.length > 0 ? currentTrackIndex + 1 : '?'}
              </div>
            </div>

            {/* Прогресс бар */}
            <div className="space-y-2">
              <Slider
                value={[duration ? (currentTime / duration) * 100 : 0]}
                onValueChange={handleSeek}
                disabled={!currentTrack || audioError !== null}
                className="w-full [&>span:first-child]:h-2 [&>span:first-child]:bg-white/20 [&_[role=slider]]:bg-white [&_[role=slider]]:w-4 [&_[role=slider]]:h-4 [&_[role=slider]]:border-0 [&>span:first-child_span]:bg-gradient-to-r [&>span:first-child_span]:from-purple-500 [&>span:first-child_span]:to-pink-500"
              />
              <div className="flex justify-between text-sm text-white/70">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Управление */}
            <div className="flex items-center justify-center gap-4">
              <Button
                size="icon"
                variant="ghost"
                className="w-12 h-12 text-white hover:bg-white/10"
                onClick={playPrevious}
                disabled={tracks.length === 0}
              >
                <SkipBack className="w-6 h-6" />
              </Button>

              <Button
                size="icon"
                className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
                onClick={togglePlayPause}
                disabled={!currentTrack || audioError !== null}
              >
                {isLoading ? (
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : isPlaying ? (
                  <Pause className="w-8 h-8" />
                ) : (
                  <Play className="w-8 h-8" />
                )}
              </Button>

              <Button
                size="icon"
                variant="ghost"
                className="w-12 h-12 text-white hover:bg-white/10"
                onClick={playNext}
                disabled={tracks.length === 0}
              >
                <SkipForward className="w-6 h-6" />
              </Button>
            </div>

            {/* Громкость */}
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-white" />
              <Slider
                value={volume}
                onValueChange={setVolume}
                max={100}
                step={1}
                className="flex-1 [&>span:first-child]:h-2 [&>span:first-child]:bg-white/20 [&_[role=slider]]:bg-white [&_[role=slider]]:w-4 [&_[role=slider]]:h-4 [&_[role=slider]]:border-0 [&>span:first-child_span]:bg-gradient-to-r [&>span:first-child_span]:from-purple-500 [&>span:first-child_span]:to-pink-500"
              />
              <span className="text-white text-sm w-12">{volume[0]}%</span>
            </div>

            {/* Инструкции */}
            <div className="bg-black/30 rounded-lg p-4 text-white/70 text-sm">
              <h3 className="font-semibold mb-2">{t.mouseControls}</h3>
              <ul className="space-y-1">
                <li>
                  • <strong>{t.leftClick}</strong>
                </li>
                <li>
                  • <strong>{t.rightClick}</strong>
                </li>
                <li>
                  • <strong>{t.middleClick}</strong>
                </li>
                <li>
                  • <strong>{t.mouseWheel}</strong>
                </li>
              </ul>
              <p className="mt-2 text-xs opacity-75">{t.uploadFiles}</p>
            </div>

            {/* Скрытый аудио элемент */}
            <audio
              ref={audioRef}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              preload="metadata"
            />
          </CardContent>
        </Card>
      </div>

      {/* Диалог "О программе" */}
      <Dialog open={showAbout} onOpenChange={setShowAbout}>
        <DialogContent className="bg-gradient-to-br from-purple-900/95 via-blue-900/95 to-indigo-900/95 backdrop-blur-sm border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white text-center">{t.aboutTitle}</DialogTitle>
            <DialogDescription className="text-white/70 text-center">
              {t.aboutDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-center">
            <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-2xl font-bold text-white">
              ♪
            </div>
            <div className="space-y-2 text-sm text-white/70">
              <p>{t.version}</p>
              <p>{t.author}</p>
            </div>
          </div>
          <div className="flex justify-center">
            <Button
              variant="ghost"
              className="text-white hover:bg-white/10 bg-white/5"
              onClick={() => setShowAbout(false)}
            >
              {t.close}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default App;
