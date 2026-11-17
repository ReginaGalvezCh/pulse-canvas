import React, { useEffect, useRef, useState } from 'react';
import { Capabilities, initialSnapshot, SessionSnapshot, Source } from '../shared/contracts';
import { createPainting, PaintingControls, PaintingState, palettes } from './painting';
import styles from './App.module.css';

function Star({ size = 24 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true"><path d="M20 2v36M2 20h36M7.3 7.3l25.4 25.4M7.3 32.7 32.7 7.3" stroke="currentColor" strokeWidth="1.5"/><circle cx="20" cy="20" r="11" stroke="currentColor"/></svg>;
}

export function App() {
  const [session, setSession] = useState<SessionSnapshot>(initialSnapshot);
  const [source, setSource] = useState<Source>('simulation');
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null);
  const [cameraId, setCameraId] = useState('');
  const [accessKey, setAccessKey] = useState('');
  const [consent, setConsent] = useState(false);
  const [palette, setPalette] = useState(0);
  const [marks, setMarks] = useState(0);
  const [busy, setBusy] = useState(false);
  const [paused, setPaused] = useState(false);
  const [notice, setNotice] = useState('');
  const [privacy, setPrivacy] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);
  const host = useRef<HTMLDivElement>(null);
  const painter = useRef<PaintingControls | null>(null);
  const drawing = useRef<PaintingState>({ session, palette, paused, reducedMotion });
  drawing.current = { session, palette, paused, reducedMotion };
  const active = !['idle', 'stopped', 'error'].includes(session.phase);
  const liveAvailable = !!capabilities?.hasApiKey && !capabilities.cameraError;

  useEffect(() => {
    let mounted = true;
    const unsubscribe = window.pulse.onSession(value => { if (mounted) setSession(value); });
    void Promise.all([window.pulse.capabilities(), window.pulse.snapshot()]).then(([caps, snapshot]) => {
      if (!mounted) return;
      setCapabilities(caps); setSession(snapshot);
    }).catch(() => { if (mounted) setNotice('The desktop connection is unavailable. Restart Pulse Canvas.'); });
    return () => { mounted = false; unsubscribe(); };
  }, []);
  useEffect(() => {
    if (!host.current) return;
    const controls = createPainting(host.current, () => drawing.current, setMarks);
    painter.current = controls;
    return () => { controls.destroy(); painter.current = null; };
  }, []);

  async function start() {
    setBusy(true); setNotice(''); setPaused(false);
    try { setSession(await window.pulse.start({ source, consent: true, cameraId: cameraId || undefined })); }
    catch { setNotice('The session could not start. Check camera permission and restart the app.'); }
    finally { setBusy(false); }
  }
  async function stop(pause: boolean) {
    setBusy(true); setPaused(true); setNotice('');
    try { setSession(await window.pulse.stop()); setNotice(pause ? 'Paused. The camera is released; continue whenever you like.' : 'Finished. Save your artwork or begin again.'); }
    catch { setNotice('The session could not be released. Close the app before continuing.'); }
    finally { setBusy(false); }
  }
  async function save() {
    setBusy(true);
    try { const bytes = await painter.current!.exportPng(); const result = await window.pulse.saveArtwork(bytes); if (result.saved) setNotice('Your painting has been saved.'); }
    catch { setNotice('The artwork could not be saved. Please try again.'); }
    finally { setBusy(false); }
  }
  async function configureAccess(event: React.FormEvent) {
    event.preventDefault(); setBusy(true); setNotice('');
    try {
      await window.pulse.configureAccess(accessKey);
      setAccessKey(''); setCapabilities(await window.pulse.capabilities());
      setNotice('Presage access is set for this app launch. It has not been authenticated yet.');
    } catch { setNotice('Access could not be configured. Use the API key, not your account password.'); }
    finally { setBusy(false); }
  }
  function chooseSource(next: Source) {
    if (active || busy || next === source) return;
    setSource(next); setConsent(false); setNotice(''); painter.current?.reset();
  }
  const phaseLabel = paused && !active ? 'Paused' : {
    idle: 'Ready when you are', checking: 'Preparing', acquiring: 'Finding your rhythm', painting: 'Creating', signalLost: 'Waiting for signal', stopping: 'Releasing session', stopped: 'Session complete', error: 'Session needs attention',
  }[session.phase];

  return <div className={styles.app}>
    <header className={styles.header}>
      <a className={styles.brand} href="#main"><Star size={32}/><span>PULSE CANVAS<span className={styles.brandSub}>A small experiment in being here.</span></span></a>
      <div className={styles.headerRight}><span className={styles.edition}>CREATIVE STUDY / 001</span><button className={styles.textButton} onClick={() => setPrivacy(!privacy)} aria-expanded={privacy}>About & privacy ↗</button></div>
    </header>
    <main id="main" className={styles.layout}>
      <aside className={styles.sidebar}>
        <p className={styles.eyebrow}>YOUR RHYTHM, IN COLOUR</p>
        <h1>Make a little<br/><em>room</em> for art.</h1>
        <p className={styles.intro}>An abstract painting, shaped by your pulse. No right way to feel. Nothing to achieve.</p>
        <section className={styles.section} aria-labelledby="source-label">
          <div className={styles.sectionHeading}><h2 id="source-label">01 / Choose your input</h2><span>↘</span></div>
          <div className={styles.segmented}>
            <button aria-pressed={source === 'simulation'} disabled={active || busy} onClick={() => chooseSource('simulation')}>Simulation</button>
            <button aria-pressed={source === 'live'} disabled={active || busy} onClick={() => chooseSource('live')}>Live camera</button>
          </div>
          <p className={styles.help}>{source === 'simulation' ? 'Explore with generated values. Your camera stays off.' : 'Presage estimates your pulse from the camera. Good light and stillness help.'}</p>
          {source === 'live' && <>
            {!capabilities?.hasApiKey && <form className={styles.accessNote} onSubmit={configureAccess}>
              <label>Presage API key<input type="password" autoComplete="off" value={accessKey} onChange={event => setAccessKey(event.target.value)} placeholder="Paste your API key here" disabled={busy || active}/></label>
              <p>Use “Copy API key” in your Presage dashboard. This is not your account password. Kept in memory for this app launch only.</p>
              <button type="submit" disabled={busy || active || accessKey.trim().length < 8}>Use this key</button>
            </form>}
            {capabilities?.cameraError && <div className={styles.accessNote}>{capabilities.cameraError}</div>}
            <p className={styles.help}>Free-plan use only. Live sessions stop after 2 minutes. No automatic restart or paid upgrade.</p>
            <label className={styles.cameraLabel}>Camera<select value={cameraId} disabled={active || busy} onChange={event => setCameraId(event.target.value)}><option value="">Default camera</option>{capabilities?.cameras.map(camera => <option key={camera.id} value={camera.id}>{camera.name}</option>)}</select></label>
          </>}
        </section>
        <section className={styles.section} aria-labelledby="palette-label">
          <div className={styles.sectionHeading}><h2 id="palette-label">02 / Find your colours</h2><span>↘</span></div>
          <div className={styles.palettes}>{palettes.map((item, index) => <button key={item.name} aria-pressed={palette === index} disabled={active || busy || marks > 0} onClick={() => { setPalette(index); drawing.current.palette = index; painter.current?.reset(); }}>
            <span className={styles.swatches}>{item.colors.slice(0, 4).map(color => <i key={color} style={{ backgroundColor: color }}/>)}</span><span>{item.name}</span><span className={styles.paletteCheck}>{palette === index ? '✓' : ''}</span>
          </button>)}</div>
          <p className={styles.help}>{palettes[palette].note}. {marks > 0 && 'Clear the canvas to change palette.'}</p>
        </section>
        <section className={styles.section}>
          <label className={styles.checkbox}><input type="checkbox" checked={consent} disabled={active || busy} onChange={event => setConsent(event.target.checked)}/><span>{source === 'live' ? 'I agree to use my camera for this session. No video is recorded by this app.' : 'I understand this is a simulation, using generated pulse values.'}</span></label>
          <button className={styles.primary} onClick={active ? () => stop(true) : start} disabled={busy || (!active && (!consent || (source === 'live' && !liveAvailable)))}>{busy ? 'One moment…' : active ? 'Pause this moment' : paused ? 'Continue painting' : 'Begin your painting'}<span>{active ? 'Ⅱ' : '↗'}</span></button>
          {active && <button className={styles.finish} onClick={() => stop(false)} disabled={busy}>Finish session</button>}
        </section>
        <div className={styles.sidebarFoot}><Star size={16}/><p>A rhythm-inspired artwork.<br/>Not a health assessment.</p></div>
      </aside>
      <section className={styles.studio} aria-label="Painting studio">
        <div className={styles.studioToolbar}><span className={styles.modeBadge}><i className={source === 'live' && active ? styles.liveDot : ''}/>{source === 'simulation' ? 'SIMULATION · GENERATED SIGNAL' : active ? 'LIVE · PRESAGE SIGNAL' : 'LIVE MODE · CAMERA OFF'}</span><span className={styles.artworkNumber}>UNTITLED / {String(marks).padStart(3, '0')}</span></div>
        <div className={styles.frame}>
          <div className={styles.canvasHost} ref={host}/>
          {marks === 0 && <div className={styles.emptyCanvas}><div className={styles.orbit}><Star size={58}/></div><p>Your next quiet moment,<br/><em>in a colour you can keep.</em></p><span>CHOOSE A PALETTE. LET THE RHYTHM BEGIN.</span></div>}
          <div className={styles.canvasSignature}>PULSE CANVAS <span>—</span> {palettes[palette].name.toUpperCase()}</div>
        </div>
        <div className={styles.statusBar}><div className={styles.statusInfo}><span className={styles.statusDot}/><div><strong>{phaseLabel}</strong><p role="status" aria-live="polite">{notice || session.message}</p></div></div><div className={styles.pulseValue}><span>{session.signal ? Math.round(session.signal.bpm) : '—'}</span><small>{source === 'simulation' ? 'GENERATED BPM' : 'ESTIMATED BPM'}</small></div></div>
        <div className={styles.actions}><div><button className={styles.textButton} disabled={busy || active || marks === 0} onClick={() => { painter.current?.reset(); setPaused(false); setNotice('A fresh canvas. Begin whenever you are ready.'); }}>↺ Clear canvas</button><span className={styles.exportNote}>Only the artwork goes with you.</span></div><button className={styles.saveButton} onClick={save} disabled={!marks || busy}>Keep this painting <span>↓</span></button></div>
        <p className={styles.caption}>The mark-making rhythm is synthesized from a pulse-rate estimate. It does not track individual heartbeats.</p>
      </section>
    </main>
    {privacy && <section className={styles.about} aria-label="About and privacy"><div><p className={styles.eyebrow}>A NOTE ON THIS EXPERIMENT</p><h2>Made with a signal.<br/>Kept as a painting.</h2></div><div><p>Live mode uses Presage SmartSpectra on this computer. The app does not record video or retain your pulse history. SDK telemetry is disabled; Presage authentication requires a network connection.</p><p>Simulation uses generated values and never activates the camera. Export saves the artwork only, without your image or pulse measurements. This prototype has not yet been validated with a live Presage session.</p><p>Stopping or pausing releases the camera. This is a creative experiment, not a medical device.</p><button className={styles.textButton} onClick={() => setPrivacy(false)}>Close this note ×</button></div></section>}
    <footer className={styles.footer}><span>AN INDIVIDUAL PROJECT BY REGINA GÁLVEZ</span><span>BUILT WITH PRESAGE SMARTSPECTRA + P5.JS</span><label><input type="checkbox" checked={reducedMotion} onChange={event => setReducedMotion(event.target.checked)}/> Slower mark-making</label></footer>
  </div>;
}
