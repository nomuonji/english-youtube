import React from "react";
import {AbsoluteFill, Html5Audio, Sequence, spring, staticFile, useCurrentFrame} from "remotion";
import {OfficeWorld, StreetWorld} from "./LessonVideo";
import type {AnimationLessonProps, TimedScene} from "./types";
import {validateResolvedLesson} from "./types";

const clamp = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
const hash = (n: number) => ((Math.sin(n * 83.19 + 19.7) * 43758.5453) % 1 + 1) % 1;
const pop = (frame: number, delay = 0) => spring({fps: 30, frame: Math.max(0, frame - delay), config: {damping: 10, stiffness: 190, mass: .65}});
const navy = "#071425";
const white = "#fff9e9";
const lime = "#d8ff62";
const pink = "#ff5f83";
const aqua = "#74edfa";
const font = '"Arial Black", Arial, sans-serif';

type Layout = {w: number; h: number; portrait: boolean; sx: number; sy: number; titleSize: number; subtitleTop: number};
const layoutFor = (portrait: boolean): Layout => portrait ? {w: 1080, h: 1920, portrait, sx: 66, sy: 215, titleSize: 104, subtitleTop: 1550} : {w: 1920, h: 1080, portrait, sx: 82, sy: 230, titleSize: 135, subtitleTop: 840};
const wrap = (value: string, max: number) => {
  const lines: string[] = [];
  for (const word of value.split(" ")) {
    const last = lines.length - 1;
    if (last >= 0 && lines[last].length + word.length + 1 <= max) lines[last] += ` ${word}`;
    else lines.push(word);
  }
  return lines;
};

const Burst: React.FC<{x: number; y: number; frame: number; start?: number; color: string; count?: number; scale?: number}> = ({x, y, frame, start = 0, color, count = 56, scale = 1}) => {
  const t = clamp((frame - start) / 40);
  if (t <= 0 || t >= 1) return null;
  return <g>
    <circle cx={x} cy={y} r={(25 + 410 * ease(t)) * scale} stroke={color} strokeWidth={11 * (1 - t)} fill="none" opacity={1 - t}/>
    {Array.from({length: count}, (_, i) => {
      const angle = i * 2.39996;
      const dist = (90 + hash(i + 81) * 450) * ease(t) * scale;
      const px = x + Math.cos(angle) * dist;
      const py = y + Math.sin(angle) * dist;
      const size = (5 + hash(i + 571) * 15) * scale;
      return <rect key={i} x={px} y={py} width={size} height={size} fill={i % 4 === 0 ? white : color} opacity={1 - t} transform={`rotate(${i * 47 + frame * 2} ${px} ${py})`}/>;
    })}
  </g>;
};

const SpeedLines: React.FC<{layout: Layout; frame: number; color: string; opacity?: number}> = ({layout, frame, color, opacity = .5}) => <g opacity={opacity}>
  {Array.from({length: 28}, (_, i) => {
    const x = ((hash(i + 51) * layout.w + frame * (14 + i % 4 * 5)) % (layout.w + 500)) - 250;
    const y = hash(i + 140) * layout.h * .76 + 100;
    return <path key={i} d={`M${x} ${y} h${55 + hash(i + 87) * 210}`} stroke={color} strokeWidth={i % 6 === 0 ? 9 : 3} opacity={.15 + hash(i + 7) * .45}/>;
  })}
</g>;

const Background: React.FC<{layout: Layout; scene: TimedScene; frame: number}> = ({layout, scene, frame}) => {
  const {portrait, w, h} = layout;
  const impact = scene.mode === "story" && scene.action === "blocked" || scene.mode === "transfer";
  const shake = impact && frame < 18 ? Math.sin(frame * 3.6) * 16 * (1 - frame / 18) : 0;
  const wideZoom = scene.mode === "story" && scene.action === "drive" ? 1.08 + frame / scene.durationFrames * .09 : scene.mode === "answer" ? 1.12 : 1.06;
  const transform = portrait ? `translate(${-1250 + shake} -650) scale(2)` : `translate(${1920 * (1 - wideZoom) / 2 + shake} ${1080 * (1 - wideZoom) / 2}) scale(${wideZoom})`;
  return <>
    <rect width={w} height={h} fill="#10263a"/>
    <g transform={transform}>{scene.world === "street" ? <StreetWorld scene={scene} frame={frame}/> : <OfficeWorld frame={frame}/>}</g>
    <rect width={w} height={h} fill={impact ? "#270b2a" : "#031325"} opacity={scene.mode === "recall" ? .6 : scene.mode === "speak" ? .48 : .22}/>
    {scene.mode === "story" && scene.action === "drive" && <SpeedLines layout={layout} frame={frame} color={aqua} opacity={.6}/>}
    {scene.mode === "story" && scene.action === "reroute" && <SpeedLines layout={layout} frame={frame} color={lime} opacity={.35}/>}
    {impact && frame < 8 && <rect width={w} height={h} fill={pink} opacity={.45 * (1 - frame / 8)}/>}
  </>;
};

const Phrase: React.FC<{phrase: string; emphasis: string; x: number; y: number; size: number; maxWidth: number; frame: number; delay?: number}> = ({phrase, emphasis, x, y, size, maxWidth, frame, delay = 0}) => {
  const p = pop(frame, delay);
  const fittedSize = Math.min(size, maxWidth / Math.max(1, phrase.length * .57));
  const index = phrase.toLowerCase().indexOf(emphasis.toLowerCase());
  const before = index < 0 ? phrase : phrase.slice(0, index);
  const hit = index < 0 ? "" : phrase.slice(index, index + emphasis.length);
  const after = index < 0 ? "" : phrase.slice(index + emphasis.length);
  return <g transform={`translate(${x} ${y}) scale(${.55 + .45 * p})`} opacity={ease((frame - delay) / 9)}>
    <text x="0" y="0" fill={white} fontFamily={font} fontSize={fittedSize} fontWeight="900" letterSpacing="-5" paintOrder="stroke" stroke={navy} strokeWidth="17">
      {before}<tspan fill={lime}>{hit}</tspan>{after}
    </text>
  </g>;
};

const SceneText: React.FC<{props: AnimationLessonProps; scene: TimedScene; frame: number; layout: Layout}> = ({props, scene, frame, layout}) => {
  const {w, portrait, sx, sy, titleSize} = layout;
  const phrase = props.lesson.target.phrase;
  const emphasis = props.lesson.target.emphasis;
  const mode = scene.mode;
  const blocked = scene.action === "blocked";
  const isSetup = scene.action === "drive";
  const reroute = scene.action === "reroute";
  const topY = portrait ? sy : sy + 28;
  const phraseSize = portrait ? 75 : 120;
  const enter = pop(frame, 3);
  const phraseY = portrait ? 740 : 498;
  const centerX = w / 2;
  const response = clamp((frame - scene.speechFrames) / Math.max(1, scene.durationFrames - scene.speechFrames));
  const cueWidth = portrait ? 885 : 1100;
  return <>
    {isSetup && <g transform={`translate(${sx} ${topY + (1 - enter) * 130})`} opacity={ease(frame / 12)}>
      <text y="0" fill={white} fontFamily={font} fontSize={titleSize} fontWeight="900" stroke={navy} strokeWidth="13" paintOrder="stroke">ON TIME.</text>
      <text y={portrait ? 132 : 150} fill={lime} fontFamily={font} fontSize={titleSize * .85} fontWeight="900" stroke={navy} strokeWidth="13" paintOrder="stroke">UNTIL...</text>
      <path d={`M0 ${portrait ? 163 : 181} H${portrait ? 610 : 850}`} stroke={lime} strokeWidth="17" strokeDasharray="60 18" strokeDashoffset={-frame * 7}/>
    </g>}
    {blocked && mode === "story" && <>
      <Burst x={portrait ? 580 : 1110} y={portrait ? 1020 : 650} frame={frame} color={pink} count={75} scale={portrait ? .72 : 1}/>
      <g transform={`translate(${sx} ${topY + (1 - enter) * -180}) scale(${.7 + .3 * enter})`} opacity={ease(frame / 10)}>
        <rect x="-18" y={portrait ? -105 : -132} width={portrait ? 850 : 1480} height={portrait ? 174 : 220} rx="22" fill={pink} stroke={white} strokeWidth="8"/>
        <text y="0" fill={white} fontFamily={font} fontSize={portrait ? 93 : 145} fontWeight="900" letterSpacing="-5">ROAD CLOSED!</text>
      </g>
      <Phrase phrase={phrase} emphasis={emphasis} x={sx} y={phraseY + (portrait ? 165 : 180)} size={phraseSize} maxWidth={w - sx * 2} frame={frame} delay={16}/>
    </>}
    {mode === "notice" && <>
      <rect x={sx - 20} y={portrait ? 400 : 245} width={w - 2 * sx + 40} height={portrait ? 650 : 505} rx="30" fill={navy} opacity=".9" stroke={lime} strokeWidth="6"/>
      <text x={sx + 30} y={portrait ? 490 : 322} fill={aqua} fontFamily={font} fontSize={portrait ? 49 : 47} fontWeight="900" letterSpacing="4">HEARD IN THE STORY</text>
      <Phrase phrase={phrase} emphasis={emphasis} x={sx + 25} y={portrait ? 655 : 480} size={phraseSize} maxWidth={w - sx * 2 - 50} frame={frame} delay={4}/>
      <rect x={sx + 25} y={portrait ? 715 : 555} width={(portrait ? 770 : 1200) * ease((frame - 12) / 26)} height="13" fill={lime}/>
      <text x={sx + 30} y={portrait ? 811 : 635} fill={white} fontFamily={font} fontSize={portrait ? 43 : 54} fontWeight="700">{props.lesson.target.meaningEn}</text>
      <text x={sx + 30} y={portrait ? 901 : 713} fill={lime} fontFamily="Arial, sans-serif" fontSize={portrait ? 45 : 42} fontWeight="700">{props.lesson.target.meaningJa}</text>
      <Burst x={portrait ? 920 : 1580} y={portrait ? 600 : 410} frame={frame} start={6} color={lime} count={35} scale={.55}/>
    </>}
    {reroute && <>
      <text x={sx} y={topY + (1 - enter) * 120} fill={white} fontFamily={font} fontSize={titleSize * .83} fontWeight="900" stroke={navy} strokeWidth="13" paintOrder="stroke">FIND A WAY</text>
      <text x={sx} y={topY + (portrait ? 135 : 160)} fill={lime} fontFamily={font} fontSize={titleSize} fontWeight="900" stroke={navy} strokeWidth="13" paintOrder="stroke">AROUND IT.</text>
      <path d={portrait ? "M140 760 Q320 540 545 680 T980 600" : "M120 580 Q500 290 950 510 T1770 400"} fill="none" stroke={lime} strokeWidth="21" strokeLinecap="round" strokeDasharray={`${Math.floor(ease(frame / 40) * 2200)} 2200`}/>
      <Burst x={portrait ? 800 : 1550} y={portrait ? 650 : 460} frame={frame} start={27} color={lime} count={40} scale={.58}/>
    </>}
    {mode === "transfer" && <>
      <g transform={`translate(${sx} ${portrait ? topY + 50 : topY - 90})`} opacity={ease(frame / 8)}>
        <rect width={portrait ? 850 : 970} height="118" rx="15" fill={pink}/>
        <text x="32" y="84" fill={white} fontFamily={font} fontSize={portrait ? 72 : 79} fontWeight="900">LAUNCH ERROR</text>
      </g>
      <Phrase phrase={phrase} emphasis={emphasis} x={sx} y={phraseY + (portrait ? 120 : 88)} size={phraseSize} maxWidth={w - sx * 2} frame={frame} delay={13}/>
      <rect x={sx} y={phraseY + (portrait ? 175 : 136)} width={cueWidth * ease((frame - 12) / 32)} height="16" fill={pink}/>
      <text x={sx} y={phraseY + (portrait ? 265 : 215)} fill={white} fontFamily={font} fontSize={portrait ? 42 : 49} fontWeight="700">SAME WORDS. NEW SITUATION.</text>
      <Burst x={portrait ? 810 : 1460} y={portrait ? 900 : 650} frame={frame} start={13} color={pink} count={40} scale={.55}/>
    </>}
    {mode === "speak" && <>
      <text x={sx} y={topY} fill={lime} fontFamily={font} fontSize={portrait ? 86 : 115} fontWeight="900">{frame < scene.speechFrames ? "LISTEN FIRST" : "YOUR TURN!"}</text>
      <Phrase phrase={phrase} emphasis={emphasis} x={sx} y={phraseY} size={phraseSize} maxWidth={w - sx * 2} frame={frame} delay={5}/>
      <rect x={sx} y={phraseY + (portrait ? 70 : 100)} width={cueWidth} height="22" rx="11" fill="#365365"/>
      <rect x={sx} y={phraseY + (portrait ? 70 : 100)} width={cueWidth * response} height="22" rx="11" fill={lime}/>
      {frame >= scene.speechFrames && Array.from({length: 13}, (_, i) => <rect key={i} x={sx + i * (portrait ? 55 : 78)} y={phraseY + (portrait ? 170 : 208) - Math.abs(Math.sin(frame * .21 + i * .8)) * 55} width={portrait ? 28 : 38} height={60 + Math.abs(Math.sin(frame * .21 + i * .8)) * 55} rx="8" fill={i % 2 ? aqua : lime} opacity=".72"/>)}
    </>}
    {mode === "recall" && <>
      <rect x={sx - 25} y={portrait ? 400 : 230} width={w - 2 * sx + 50} height={portrait ? 640 : 500} rx="28" fill={navy} opacity=".92" stroke={pink} strokeWidth="7"/>
      <text x={sx + 20} y={portrait ? 510 : 330} fill={aqua} fontFamily={font} fontSize={portrait ? 47 : 49} fontWeight="900">NEW SITUATION</text>
      {wrap(props.lesson.target.transferSituation, portrait ? 25 : 40).map((line, i) => <text key={i} x={sx + 20} y={(portrait ? 618 : 430) + i * (portrait ? 62 : 66)} fill={white} fontFamily={font} fontSize={portrait ? 48 : 59} fontWeight="700">{line}</text>)}
      <text x={sx + 20} y={portrait ? 815 : 600} fill={lime} fontFamily={font} fontSize={portrait ? 69 : 83} fontWeight="900">WHAT WOULD YOU SAY?</text>
      <rect x={sx + 20} y={portrait ? 884 : 655} width={cueWidth} height="22" fill="#3c4e60"/>
      <rect x={sx + 20} y={portrait ? 884 : 655} width={cueWidth * response} height="22" fill={pink}/>
    </>}
    {mode === "answer" && <>
      <Burst x={centerX} y={portrait ? 770 : 510} frame={frame} start={2} color={lime} count={88} scale={portrait ? .8 : 1.2}/>
      <rect x={sx - 26} y={portrait ? 460 : 300} width={w - 2 * sx + 52} height={portrait ? 520 : 420} rx="31" fill={navy} opacity=".88" stroke={lime} strokeWidth="9"/>
      <text x={sx + 15} y={portrait ? 560 : 391} fill={aqua} fontFamily={font} fontSize={portrait ? 46 : 45} fontWeight="900">SAY IT IN BOTH WORLDS</text>
      <Phrase phrase={phrase} emphasis={emphasis} x={sx + 15} y={portrait ? 725 : 560} size={phraseSize} maxWidth={w - sx * 2 - 35} frame={frame} delay={4}/>
      <path d={portrait ? "M720 795 l60 60 112 -136" : "M1540 625 l60 60 112 -136"} fill="none" stroke={lime} strokeWidth="24" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${ease((frame - 10) / 22) * 280} 280`}/>
    </>}
  </>;
};

const SceneView: React.FC<{props: AnimationLessonProps; scene: TimedScene; index: number; layout: Layout}> = ({props, scene, index, layout}) => {
  const frame = useCurrentFrame();
  const accent = scene.mode === "answer" || scene.action === "reroute" ? lime : scene.mode === "recall" || scene.mode === "transfer" || scene.mode === "story" && scene.action === "blocked" ? pink : aqua;
  const caption = wrap(scene.captionEn, layout.portrait ? 38 : 55);
  const captionFont = layout.portrait ? 48 : 54;
  const label = scene.mode === "story" ? "STORY" : scene.mode === "notice" ? "NOTICE" : scene.mode === "transfer" ? "SAME PHRASE, NEW WORLD" : scene.mode === "speak" ? "SPEAK" : scene.mode === "recall" ? "RECALL" : "REVEAL";
  return <AbsoluteFill style={{background: navy}}><svg width="100%" height="100%" viewBox={`0 0 ${layout.w} ${layout.h}`}>
    <Background layout={layout} scene={scene} frame={frame}/>
    {layout.portrait && scene.world === "street" && <g>
      <rect x="65" y="1130" width="950" height="279" rx="25" fill={navy} opacity=".87" stroke={accent} strokeWidth="5"/>
      <text x="97" y="1193" fill={aqua} fontFamily={font} fontSize="38" fontWeight="900">DELIVERY ROUTE</text>
      <path d="M145 1290 H925" stroke="#365466" strokeWidth="16" strokeLinecap="round"/>
      <path d={scene.action === "reroute" ? "M145 1290 Q365 1085 550 1270 T925 1290" : scene.action === "drive" ? "M145 1290 H925" : "M145 1290 H510"} stroke={scene.action === "reroute" ? lime : aqua} strokeWidth="16" fill="none" strokeLinecap="round" strokeDasharray={`${Math.floor(ease(frame / 50) * 1200)} 1200`}/>
      <circle cx="145" cy="1290" r="23" fill={aqua}/><circle cx="925" cy="1290" r="23" fill={lime}/>
      {scene.action === "blocked" && <g><circle cx="525" cy="1290" r="30" fill={pink}/><path d="M510 1275 L540 1305 M540 1275 L510 1305" stroke={white} strokeWidth="8"/></g>}
      <text x="99" y="1370" fill={white} fontFamily={font} fontSize="31" fontWeight="900">DEPOT</text>
      <text x="390" y="1370" fill={scene.action === "blocked" ? pink : lime} fontFamily={font} fontSize="31" fontWeight="900">{scene.action === "reroute" ? "DETOUR" : scene.action === "drive" ? "ON TIME" : "ROAD CLOSED"}</text>
      <text x="760" y="1370" fill={white} fontFamily={font} fontSize="31" fontWeight="900">ARRIVAL</text>
    </g>}
    {layout.portrait && scene.world === "office" && <g>
      <rect x="65" y="1130" width="950" height="279" rx="25" fill={navy} opacity=".87" stroke={accent} strokeWidth="5"/>
      <text x="97" y="1193" fill={aqua} fontFamily={font} fontSize="38" fontWeight="900">RELEASE PIPELINE</text>
      {["BUILD", "TEST", "LAUNCH"].map((stage, i) => <g key={stage} transform={`translate(${102 + i * 303} 1244)`}>
        <rect width="270" height="108" rx="14" fill={i === 2 ? "#603047" : "#214e57"} stroke={i === 2 ? pink : aqua} strokeWidth="4"/>
        <text x="22" y="67" fill={white} fontFamily={font} fontSize="43" fontWeight="900">{stage}</text>
        <text x="225" y="68" fill={i === 2 ? pink : lime} fontFamily={font} fontSize="50" fontWeight="900">{i === 2 ? "!" : "✓"}</text>
      </g>)}
      <rect x="95" y="1378" width={850 * ease(frame / Math.max(1, scene.durationFrames))} height="8" fill={accent}/>
    </g>}
    <rect x="0" y="0" width={layout.w} height={layout.portrait ? 145 : 158} fill={navy} opacity=".94"/>
    <text x={layout.sx} y={layout.portrait ? 70 : 74} fill={aqua} fontFamily={font} fontSize={layout.portrait ? 31 : 30} fontWeight="900" letterSpacing="5">WORLD IN CLEAR ENGLISH</text>
    <text x={layout.sx} y={layout.portrait ? 119 : 128} fill={white} fontFamily={font} fontSize={layout.portrait ? 42 : 50} fontWeight="900">{label}</text>
    <text x={layout.w - layout.sx} y={layout.portrait ? 111 : 122} textAnchor="end" fill={accent} fontFamily={font} fontSize={layout.portrait ? 42 : 48} fontWeight="900">{String(index + 1).padStart(2, "0")}/{String(props.scenes.length).padStart(2, "0")}</text>
    <SceneText props={props} scene={scene} frame={frame} layout={layout}/>
    <rect y={layout.subtitleTop} width={layout.w} height={layout.h - layout.subtitleTop} fill={navy} opacity=".97"/>
    <rect x={layout.sx} y={layout.subtitleTop + 32} width="13" height={layout.portrait ? 238 : 124} fill={accent}/>
    <text x={layout.sx + 44} y={layout.subtitleTop + (layout.portrait ? 82 : 35)} fill={accent} fontFamily={font} fontSize={layout.portrait ? 31 : 28} fontWeight="900" letterSpacing="3">ONE PHRASE · TWO WORLDS · {props.lesson.level}</text>
    {caption.map((line, i) => <text key={i} x={layout.sx + 44} y={layout.subtitleTop + (layout.portrait ? 160 : 115) + i * (captionFont + 7)} fill={white} fontFamily="Arial, sans-serif" fontSize={captionFont} fontWeight="800">{line}</text>)}
    <path d={`M${layout.sx + 44} ${layout.h - (layout.portrait ? 40 : 18)} H${layout.w - layout.sx}`} stroke="#365265" strokeWidth="7"/>
    <path d={`M${layout.sx + 44} ${layout.h - (layout.portrait ? 40 : 18)} H${layout.sx + 44 + (layout.w - layout.sx * 2 - 44) * clamp(frame / scene.durationFrames)}`} stroke={accent} strokeWidth="9"/>
  </svg></AbsoluteFill>;
};

const cue = (scene: TimedScene): string | undefined => scene.mode === "story" && scene.action === "blocked" ? "road-hit.wav" : scene.mode === "story" && scene.action === "reroute" ? "route-sweep.wav" : scene.mode === "transfer" ? "glitch.wav" : scene.mode === "notice" ? "phrase-glint.wav" : scene.mode === "answer" ? "answer-burst.wav" : undefined;

export const JuicyLessonVideo: React.FC<AnimationLessonProps & {portrait?: boolean}> = props => {
  validateResolvedLesson(props);
  const layout = layoutFor(Boolean(props.portrait));
  return <AbsoluteFill style={{background: navy}}>
    <Html5Audio src={staticFile("generated/animation-english/juicy-bgm.wav")} volume={0.22}/>
    {props.scenes.map((scene, index) => <Sequence key={scene.id} from={scene.startFrame} durationInFrames={scene.durationFrames}>
      <SceneView props={props} scene={scene} index={index} layout={layout}/>
      {scene.audioPath && <Html5Audio src={staticFile(scene.audioPath)}/>}
      {cue(scene) && <Html5Audio src={staticFile(`generated/animation-english/${cue(scene)}`)} volume={0.32}/>}
      {(scene.mode === "speak" || scene.mode === "recall") && scene.speechFrames < scene.durationFrames && <Sequence from={scene.speechFrames} durationInFrames={scene.durationFrames - scene.speechFrames}><Html5Audio src={staticFile("generated/animation-english/practice-ping.wav")} volume={0.26}/></Sequence>}
    </Sequence>)}
  </AbsoluteFill>;
};
