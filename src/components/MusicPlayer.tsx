import { Music, Pause, Play, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { media } from "../data/media";

type Track = {
  id: "evaluasi" | "everything";
  title: string;
  subtitle: string;
  src: string;
  cover: string;
  note: string;
};

const tracks: Track[] = [
  {
    id: "evaluasi",
    title: "Evaluasi (Reprise)",
    subtitle: "Hindia",
    src: media.music.evaluasi,
    cover: media.music.evaluasiCover,
    note: "Raw, simple, and close. A song that gives room to pause without feeling like I have stopped trying.",
  },
  {
    id: "everything",
    title: "everything u are",
    subtitle: "Hindia",
    src: media.music.everything,
    cover: media.music.everythingCover,
    note: "A warmer kind of acceptance. It reminds me that being unfinished and tired is still human.",
  },
];

export function MusicPlayer() {
  const [track, setTrack] = useState<Track>(tracks[0]);
  const [playing, setPlaying] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const play = async () => {
    try {
      await audioRef.current?.play();
      setPlaying(true);
      setBlocked(false);
    } catch {
      setBlocked(true);
      setPlaying(false);
    }
  };

  const pause = () => {
    audioRef.current?.pause();
    setPlaying(false);
  };

  useEffect(() => {
    audioRef.current?.load();
    void play();
    // Browser autoplay policies may block this until the visitor interacts.
    // The visible play button is the fallback.
  }, [track]);

  return (
    <section className="music-section" data-reveal>
      <audio ref={audioRef} loop preload="metadata">
        <source src={track.src} type="audio/mpeg" />
      </audio>
      <div className="container music-grid">
        <div>
          <div className="section-kicker">Songs that give me space</div>
          <h2>Some songs do not push me to be stronger.</h2>
          <p>
            They simply give me space to breathe. Hindia&apos;s “everything u are” and “Evaluasi (Reprise)” do not feel
            like forced motivation. They feel calm, honest, and human — like a quiet reminder that I am allowed to rest
            and still continue.
          </p>
          <p>
            Resting is not the opposite of trying. Sometimes, resting is how I keep trying.
          </p>
          {blocked ? (
            <p className="music-note">Autoplay was blocked by the browser. Press play to start the soundtrack.</p>
          ) : null}
        </div>

        <div className="music-player-card">
          <img src={track.cover} alt={`${track.title} cover`} />
          <div className="music-player-content">
            <div className="music-now">
              <Music size={16} />
              <span>Now selected</span>
            </div>
            <h3>{track.title}</h3>
            <p>{track.subtitle}</p>
            <p className="music-note">{track.note}</p>
            <div className="music-actions">
              <button className="btn btn-primary" type="button" onClick={playing ? pause : play}>
                {playing ? <Pause size={16} /> : <Play size={16} />}
                {playing ? "Pause" : "Play"}
              </button>
              <span className="music-loop">
                <Volume2 size={15} /> Looping
              </span>
            </div>
          </div>
        </div>

        <div className="track-switcher">
          {tracks.map((item) => (
            <button
              className={`track-button ${item.id === track.id ? "track-button-active" : ""}`}
              type="button"
              key={item.id}
              onClick={() => setTrack(item)}
            >
              <img src={item.cover} alt={`${item.title} cover`} />
              <span>
                <strong>{item.title}</strong>
                <small>{item.subtitle}</small>
              </span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
