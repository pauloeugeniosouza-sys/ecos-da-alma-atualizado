import { Button } from "@/components/ui/button";
import { Mail, Music, Share2, Play, Pause, Globe, Mic2 } from "lucide-react";
import { Karaoke } from "@/components/Karaoke";
import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { translations, Language } from "@/lib/translations";

// Dados das faixas do álbum
const tracks = [
  { id: 1, title: "Alma de Vidro", duration: "3:19", filename: "Alma-de-Vidro.mp3" },
  { id: 2, title: "Coração em Espera", duration: "4:51", filename: "Coração-em-Espera.mp3" },
  { id: 3, title: "Deixa Falar", duration: "3:44", filename: "Deixa-Falar.mp3" },
  { id: 4, title: "Nossa Canção (44 Anos)", duration: "1:57", filename: "Nossa-Canção-(44-Anos).mp3" },
  { id: 5, title: "O Futuro Começa Agora", duration: "3:37", filename: "O-Futuro-Começa-Agora.mp3" },
  { id: 6, title: "Ritmo da Redenção", duration: "3:45", filename: "Ritmo-da-Redenção.mp3" },
  { id: 7, title: "Velas Acesas", duration: "4:14", filename: "Velas-Acesas.mp3" },
  { id: 8, title: "O Abrigo de Papel", duration: "2:43", filename: "O-Abrigo-de-Papel.mp3" },
  { id: 9, title: "O Som do Silêncio Entre Nós", duration: "3:22", filename: "O-Som-do-Silêncio-Entre-Nós.mp3" },
  { id: 10, title: "O Que Resta de Mim", duration: "4:12", filename: "O-Que-Resta-de-Mim.mp3" },
];

const streamingLinks = [
  { name: "Spotify", url: "https://open.spotify.com" },
  { name: "Apple Music", url: "https://music.apple.com" },
  { name: "Deezer", url: "https://www.deezer.com" },
];

function ApprovedMemoriesSection({ language }: { language: Language }) {
  const { data: memoriesData } = trpc.memories.getApproved.useQuery();
  const t = translations[language];

  if (!memoriesData?.memories || memoriesData.memories.length === 0) {
    return null;
  }

  return (
    <div className="mt-12 pt-12 border-t border-slate-800">
      <h3 className="text-2xl font-bold text-cyan-300 mb-6">{t.memoriesThatResonate}</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {memoriesData.memories.slice(0, 4).map((mem) => (
          <div
            key={mem.id}
            className="p-4 rounded-lg bg-slate-900/30 border border-cyan-500/20 hover:border-cyan-500/50 transition-all duration-300"
          >
            <p className="text-slate-300 text-sm italic">"{mem.memory}"</p>
            <p className="text-cyan-400 text-xs mt-3">— {mem.email}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [email, setEmail] = useState("");
  const [memory, setMemory] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [language, setLanguage] = useState<Language>('pt');
  const [currentTime, setCurrentTime] = useState(0);
  const [showKaraoke, setShowKaraoke] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const t = translations[language];

  // Initialize language from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language | null;
    if (savedLanguage && (savedLanguage === 'pt' || savedLanguage === 'en')) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Save language to localStorage
  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const newsletterMutation = trpc.newsletter.subscribe.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setEmail("");
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 3000);
    },
    onError: (error) => {
      toast.error(error.message || t.errorSubscribe);
    },
  });

  const memoryMutation = trpc.memories.submit.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setMemory("");
    },
    onError: (error) => {
      toast.error(error.message || t.errorMemory);
    },
  });

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    newsletterMutation.mutate({ email });
  };

  const handleMemorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error(t.pleaseEmail);
      return;
    }
    memoryMutation.mutate({ email, memory });
  };

  const playTrack = (index: number) => {
    if (audioRef.current) {
      setCurrentTrack(index);
      audioRef.current.src = `/musicas/${tracks[index].filename}`;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleAudioEnded = () => {
    if (currentTrack !== null && currentTrack < tracks.length - 1) {
      playTrack(currentTrack + 1);
    } else {
      setIsPlaying(false);
      setCurrentTrack(null);
    }
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else if (currentTrack !== null) {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  return (
    <main className="min-h-screen w-full bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 relative overflow-hidden">
      {/* Language Selector */}
      <div className="fixed top-4 right-4 z-50 flex gap-2">
        <Button
          onClick={() => handleLanguageChange('pt')}
          variant={language === 'pt' ? 'default' : 'outline'}
          size="sm"
          className={`${
            language === 'pt'
              ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
              : 'border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/10'
          }`}
        >
          PT
        </Button>
        <Button
          onClick={() => handleLanguageChange('en')}
          variant={language === 'en' ? 'default' : 'outline'}
          size="sm"
          className={`${
            language === 'en'
              ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950'
              : 'border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/10'
          }`}
        >
          EN
        </Button>
      </div>

      {/* Animated background orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float"></div>
      <div className="absolute bottom-20 right-10 w-72 h-72 bg-cyan-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-float" style={{ animationDelay: "2s" }}></div>
      <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-float" style={{ animationDelay: "4s" }}></div>

      {/* Hero Section */}
      <section className="relative z-10 min-h-screen flex items-center justify-center px-4 py-20">
        <div className="text-center max-w-4xl mx-auto">
          {/* Decorative stars */}
          <div className="absolute top-10 left-5 w-1 h-1 bg-white rounded-full opacity-60 animate-twinkle"></div>
          <div className="absolute top-32 right-10 w-1 h-1 bg-white rounded-full opacity-40 animate-twinkle" style={{ animationDelay: "1s" }}></div>
          <div className="absolute bottom-32 left-20 w-1 h-1 bg-white rounded-full opacity-50 animate-twinkle" style={{ animationDelay: "2s" }}></div>

          {/* Main title with glow */}
          <h1 className="text-6xl md:text-8xl font-black mb-6 glow-cyan-lg animate-glow-pulse" style={{ letterSpacing: "-0.02em" }}>
            {t.heroTitle}
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-cyan-300 mb-8 font-light tracking-wide">
            {t.heroSubtitle}
          </p>

          {/* Slogan */}
          <p className="text-lg md:text-xl text-slate-300 mb-12 max-w-2xl mx-auto leading-relaxed">
            {t.heroSlogan}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button
              size="lg"
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-8 glow-cyan transition-all duration-300"
              onClick={() => document.getElementById("tracklist")?.scrollIntoView({ behavior: "smooth" })}
            >
              <Music className="mr-2 h-5 w-5" />
              {t.listenAlbum}
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-cyan-500 text-cyan-300 hover:bg-cyan-500/10 font-bold px-8"
              onClick={() => document.getElementById("meu-eco")?.scrollIntoView({ behavior: "smooth" })}
            >
              <Share2 className="mr-2 h-5 w-5" />
              {t.shareMemory}
            </Button>
          </div>

          {/* Streaming links */}
          <div className="flex flex-wrap gap-4 justify-center">
            {streamingLinks.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2 rounded-full border border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/10 transition-all duration-300 text-sm font-medium hover:border-cyan-400 hover:text-cyan-200"
              >
                <Music className="inline mr-2 h-4 w-4" />
                {link.name}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Tracklist Section */}
      <section id="tracklist" className="relative z-10 py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black mb-8 text-center glow-cyan">
            {t.tracklist}
          </h2>

          {/* Main Audio Player */}
          <div className="mb-8 p-4 rounded-lg bg-slate-900/50 border border-cyan-500/30">
            <audio
              ref={audioRef}
              controls
              controlsList="nodownload"
              className="w-full"
              onEnded={handleAudioEnded}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            >
              Your browser does not support the audio element.
            </audio>
            <div className="flex flex-col items-center mt-4">
              {currentTrack !== null && (
                <p className="text-center text-cyan-300 mb-2">
                  {t.nowPlaying} {tracks[currentTrack].title}
                </p>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowKaraoke(!showKaraoke)}
                className={`border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/10 ${showKaraoke ? 'bg-cyan-500/20' : ''}`}
              >
                <Mic2 className="mr-2 h-4 w-4" />
                {showKaraoke ? t.hideKaraoke : t.showKaraoke}
              </Button>
            </div>

            {currentTrack !== null && (
              <Karaoke
                songName={tracks[currentTrack].filename.replace('.mp3', '')}
                currentTime={currentTime}
                language={language}
                isVisible={showKaraoke}
              />
            )}
          </div>

          <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)] items-start">
            <div className="sticky top-24 self-start rounded-3xl overflow-hidden border border-cyan-500/20 bg-slate-950/80 shadow-xl shadow-cyan-500/10">
              <img
                src="/Capa-Album-Ecos-da-Alma.jpg"
                alt="Capa do álbum Ecos da Alma"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-3">
              {tracks.map((track, index) => (
                <div
                  key={track.id}
                  className={`group p-4 rounded-lg border transition-all duration-300 ${
                    currentTrack === index
                      ? "border-cyan-500 bg-cyan-500/10"
                      : "border-cyan-500/20 hover:border-cyan-500/50 bg-slate-900/30 hover:bg-slate-900/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-cyan-400 font-bold text-lg w-8">{String(index + 1).padStart(2, "0")}</span>
                      <div>
                        <h3 className={`text-lg font-semibold transition-colors ${
                          currentTrack === index ? "text-cyan-300" : "text-slate-100 group-hover:text-cyan-300"
                        }`}>
                          {track.title}
                        </h3>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-sm">{track.duration}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => playTrack(index)}
                        className="text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="relative z-10 py-20 px-4 bg-slate-900/20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black mb-12 text-center glow-cyan">
            {t.aboutAlbum}
          </h2>

          <div className="space-y-6 text-slate-300 leading-relaxed">
            <p>
              <strong className="text-cyan-300">"Ecos da Alma"</strong> {t.aboutText1}
            </p>

            <p>
              {t.aboutText2}
            </p>

            <p>
              {t.aboutText3}
            </p>
          </div>

          {/* Approved memories showcase */}
          <ApprovedMemoriesSection language={language} />
        </div>
      </section>

      {/* Gallery Section */}
      <section className="relative z-10 py-20 px-4 bg-slate-900/20" style={{ display: 'none' }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black mb-16 text-center glow-cyan">
            Identidade Visual
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Visual Element 1 - Cosmic Gradient */}
            <div className="relative h-64 rounded-lg overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-slate-900 group-hover:from-cyan-500/40 group-hover:via-purple-500/40 transition-all duration-300"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Music className="h-12 w-12 text-cyan-400 mx-auto mb-2" />
                  <p className="text-cyan-300 font-bold">Sonoridade Etérea</p>
                </div>
              </div>
            </div>

            {/* Visual Element 2 - Memory Waves */}
            <div className="relative h-64 rounded-lg overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-indigo-500/20 to-slate-900 group-hover:from-purple-500/40 group-hover:via-indigo-500/40 transition-all duration-300"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Share2 className="h-12 w-12 text-purple-400 mx-auto mb-2" />
                  <p className="text-purple-300 font-bold">Memórias Partilhadas</p>
                </div>
              </div>
            </div>

            {/* Visual Element 3 - Resonance */}
            <div className="relative h-64 rounded-lg overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-slate-900 to-purple-500/10 group-hover:from-cyan-500/30 group-hover:via-slate-900 group-hover:to-purple-500/30 transition-all duration-300"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-2 border-2 border-cyan-400 rounded-full animate-pulse"></div>
                  <p className="text-cyan-300 font-bold">Ressonância da Alma</p>
                </div>
              </div>
            </div>

            {/* Visual Element 4 - Hope */}
            <div className="relative h-64 rounded-lg overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-slate-900 to-cyan-500/20 group-hover:from-indigo-500/40 group-hover:via-slate-900 group-hover:to-cyan-500/40 transition-all duration-300"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2">✨</div>
                  <p className="text-indigo-300 font-bold">Esperança e Luz</p>
                </div>
              </div>
            </div>

            {/* Visual Element 5 - Vulnerability */}
            <div className="relative h-64 rounded-lg overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-slate-900 to-indigo-500/20 group-hover:from-purple-500/40 group-hover:via-slate-900 group-hover:to-indigo-500/40 transition-all duration-300"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2">💜</div>
                  <p className="text-purple-300 font-bold">Vulnerabilidade Autêntica</p>
                </div>
              </div>
            </div>

            {/* Visual Element 6 - Connection */}
            <div className="relative h-64 rounded-lg overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-slate-900 group-hover:from-cyan-500/40 group-hover:via-purple-500/40 transition-all duration-300"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2">🌌</div>
                  <p className="text-cyan-300 font-bold">Conexão Cósmica</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-slate-300 text-lg max-w-2xl mx-auto">
              Cada elemento visual representa uma dimensão do álbum "Ecos da Alma". A paleta de cores cósmica, as formas etéreas e as animações suaves criam uma experiência imersiva que reflete a essência do projeto.
            </p>
          </div>
        </div>
      </section>

      {/* #MeuEco Section */}
      <section id="meu-eco" className="relative z-10 py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-black mb-4 text-center glow-cyan">
            {t.myEcho}
          </h2>
          <p className="text-center text-slate-300 mb-12 text-lg">
            {t.shareYourMemory}
          </p>

          <form onSubmit={handleMemorySubmit} className="space-y-4">
            <div>
              <label htmlFor="memory-email" className="block text-sm font-medium text-cyan-300 mb-2">
                {t.email}
              </label>
              <input
                id="memory-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.yourEmail}
                className="w-full p-4 rounded-lg bg-slate-900/50 border border-cyan-500/30 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all duration-300"
                required
                disabled={memoryMutation.isPending}
                aria-label="Email para partilhar memória"
              />
            </div>
            <div>
              <label htmlFor="memory-text" className="block text-sm font-medium text-cyan-300 mb-2">
                {t.yourMemory}
              </label>
              <textarea
                id="memory-text"
                value={memory}
                onChange={(e) => setMemory(e.target.value)}
                placeholder={t.memoryPlaceholder}
                className="w-full p-4 rounded-lg bg-slate-900/50 border border-cyan-500/30 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all duration-300 resize-none"
                rows={5}
                required
                disabled={memoryMutation.isPending}
                aria-label="Texto da memória a partilhar"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold"
              disabled={memoryMutation.isPending}
            >
              {memoryMutation.isPending ? t.sending : t.shareButton}
            </Button>
          </form>

          <p className="text-center text-slate-400 text-sm mt-8">
            {t.hashtag}
          </p>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="relative z-10 py-20 px-4 bg-slate-900/20">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black mb-6 text-center glow-cyan">
            {t.newsletter}
          </h2>
          <p className="text-center text-slate-300 mb-8">
            {t.newsletterDescription}
          </p>

          <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3">
            <label htmlFor="newsletter-email" className="sr-only">
              {t.emailForNewsletter}
            </label>
            <input
              id="newsletter-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t.emailForNewsletter}
              className="flex-1 px-4 py-3 rounded-lg bg-slate-900/50 border border-cyan-500/30 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all duration-300"
              required
              disabled={newsletterMutation.isPending}
              aria-label="Email para subscrição da newsletter"
            />
            <Button
              type="submit"
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold px-8"
              disabled={newsletterMutation.isPending || submitted}
            >
              <Mail className="mr-2 h-4 w-4" />
              {newsletterMutation.isPending ? t.subscribeButtonSending : submitted ? t.subscribeButtonSuccess : t.subscribe}
            </Button>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800 bg-slate-950/50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {/* Brand */}
            <div>
              <h3 className="text-2xl font-black glow-cyan mb-2">Ecos da Alma</h3>
              <p className="text-slate-400 text-sm">{t.journeyThroughMemories}</p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-bold text-cyan-300 mb-4">{t.quickLinks}</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#tracklist" className="hover:text-cyan-300 transition-colors">{t.tracklist}</a></li>
                <li><a href="#meu-eco" className="hover:text-cyan-300 transition-colors">{t.myEcho}</a></li>
                <li><a href="#" className="hover:text-cyan-300 transition-colors">{t.aboutLink}</a></li>
              </ul>
            </div>

            {/* Social */}
            <div>
              <h4 className="font-bold text-cyan-300 mb-4">{t.socialNetworks}</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-300 transition-colors">Instagram</a></li>
                <li><a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-300 transition-colors">Twitter</a></li>
                <li><a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-300 transition-colors">YouTube</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8">
            <p className="text-center text-slate-500 text-sm">
              {t.copyright}
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
