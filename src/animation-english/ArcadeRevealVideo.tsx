import React from "react";
import {AbsoluteFill, Html5Audio, Sequence, staticFile, useCurrentFrame} from "remotion";
import type {AnimationLessonProps} from "./types";
import {validateResolvedLesson} from "./types";

const lim = (x: number, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ease = (x: number) => 1 - Math.pow(1 - lim(x), 3);
const hash = (n: number) => ((Math.sin(n * 127.1 + 78.233) * 43758.5453) % 1 + 1) % 1;
const ink = "#090b28";
const cream = "#fff1c7";
const gold = "#ffd558";
const violet = "#ac5cff";
const cyan = "#72f3ff";
const wrapWords = (value: string, maxChars: number): string[] => {
  const lines: string[] = [];
  for (const word of value.split(" ")) {
    const last = lines.length - 1;
    if (last >= 0 && lines[last].length + word.length + 1 <= maxChars) lines[last] += ` ${word}`;
    else lines.push(word);
  }
  return lines;
};

type Layout = {w: number; h: number; portrait: boolean; cx: number; cardW: number; cardH: number; cardY: number};

const PixelRoom: React.FC<{layout: Layout; frame: number; reveal: number}> = ({layout, frame, reveal}) => {
  const {w, h, portrait} = layout;
  const tile = portrait ? 32 : 28;
  const bricks = Array.from({length: Math.ceil(h / tile) * Math.ceil(w / (tile * 2))}, (_, i) => {
    const cols = Math.ceil(w / (tile * 2));
    const row = Math.floor(i / cols);
    const col = i % cols;
    const x = col * tile * 2 + (row % 2 ? -tile : 0);
    const y = row * tile;
    const shade = 12 + Math.floor(hash(i + 14) * 19);
    return <rect key={i} x={x} y={y} width={tile * 2 - 2} height={tile - 2} fill={`rgb(${shade},${Math.floor(shade * .9)},${Math.floor(shade * 2.1)})`} stroke="#3e357c" strokeWidth="1" opacity={.78}/>;
  });
  const stars = Array.from({length: portrait ? 38 : 45}, (_, i) => {
    const x = hash(i + 215) * w;
    const y = hash(i + 421) * h;
    const bright = .15 + .35 * (1 + Math.sin(frame * .13 + i)) / 2;
    return <rect key={i} x={x} y={y} width={i % 7 === 0 ? 3 : 2} height={i % 7 === 0 ? 3 : 2} fill={i % 3 ? cyan : gold} opacity={bright}/>;
  });
  const torchY = portrait ? h * .31 : h * .38;
  return <>
    <rect width={w} height={h} fill={ink}/>
    <g>{bricks}</g>
    <rect width={w} height={h} fill={reveal > .4 ? "#4c1170" : "#100b3c"} opacity={.3 + reveal * .2}/>
    <ellipse cx={w / 2} cy={h * .55} rx={portrait ? 230 : 390} ry={portrait ? 360 : 250} fill={reveal > .2 ? violet : cyan} opacity={.13 + reveal * .13}/>
    {stars}
    {[.08, .92].map((side, i) => <g key={i} transform={`translate(${w * side} ${torchY})`}>
      <rect x="-10" y="23" width="20" height="47" fill="#403663"/><rect x="-14" y="18" width="28" height="12" fill="#a6874a"/>
      <rect x="-5" y="-19" width="10" height="36" fill="#fda841" opacity={.55 + .25 * Math.sin(frame * .29 + i)}/>
      <rect x="-2" y="-26" width="4" height="29" fill="#fff3a2"/>
      <circle cx="0" cy="-4" r="46" fill="#ffb54b" opacity=".07"/>
    </g>)}
    <path d={`M0 ${h * .83} H${w} V${h} H0Z`} fill="#080a20" opacity=".86"/>
    <path d={`M0 ${h * .83} H${w}`} stroke="#7f5dc0" strokeWidth="4"/>
    {Array.from({length: 8}, (_, i) => <path key={i} d={`M${i * w / 7} ${h} L${w / 2 + (i - 3.5) * 29} ${h * .83}`} stroke="#4c387e" strokeWidth="2"/>)}
    {Array.from({length: 4}, (_, i) => <path key={i} d={`M0 ${h * (.86 + i * .045)} H${w}`} stroke="#42316c" strokeWidth="2"/>)}
  </>;
};

const DeliverySprite: React.FC<{layout: Layout; frame: number; snagAt: number}> = ({layout, frame, snagAt}) => {
  const {w, h, portrait} = layout;
  const drive = ease(frame / Math.max(1, snagAt - 20));
  const x = -90 + drive * (portrait ? w * .45 : w * .51);
  const y = portrait ? h * .755 : h * .765;
  const barrier = ease((frame - snagAt + 26) / 12);
  return <g>
    <g transform={`translate(${x} ${y})`}>
      <rect x="4" y="-38" width="56" height="34" fill="#41c7cf" stroke="#b9fbef" strokeWidth="3"/>
      <rect x="58" y="-26" width="24" height="22" fill="#34849c" stroke="#b9fbef" strokeWidth="3"/>
      <rect x="65" y="-21" width="10" height="9" fill="#9ff6fe"/>
      <rect x="13" y="-46" width="21" height="8" fill="#ffc86c"/>
      <rect x="10" y="-4" width="15" height="10" fill="#0c153c"/><rect x="61" y="-4" width="15" height="10" fill="#0c153c"/>
      <rect x="14" y="0" width="8" height="6" fill={gold}/><rect x="65" y="0" width="8" height="6" fill={gold}/>
    </g>
    <g opacity={barrier} transform={`translate(${portrait ? w * .71 : w * .73} ${y - 20})`}>
      <rect x="-8" y="0" width="16" height="52" fill="#ffd46b"/>
      <rect x="-55" y="-42" width="110" height="42" fill="#e65a82" stroke={cream} strokeWidth="4"/>
      <path d="M-40 -40 L-15 -2 M0 -40 L25 -2 M40 -40 L54 -18" stroke="#fff2b5" strokeWidth="8"/>
    </g>
  </g>;
};

const RuneCard: React.FC<{layout: Layout; frame: number; snagAt: number; phrase: string; meaning: string}> = ({layout, frame, snagAt, phrase, meaning}) => {
  const {cx, cardW, cardH, cardY, portrait} = layout;
  const appear = ease(frame / 19);
  const turn = ease((frame - snagAt - 13) / 24);
  const spinWidth = Math.max(.055, Math.abs(Math.cos(turn * Math.PI)));
  const isFront = turn > .5;
  const float = Math.sin(frame * .085) * 5;
  const frontTitle = phrase.toUpperCase();
  return <g opacity={appear} transform={`translate(${cx} ${cardY + (1 - appear) * -240 + float}) rotate(${(1 - appear) * -13}) scale(${spinWidth} ${.83 + .17 * appear}) translate(${-cardW / 2} 0)`}>
    <rect x="-11" y="-10" width={cardW + 22} height={cardH + 20} rx="10" fill="#b05aff" opacity=".21"/>
    <rect width={cardW} height={cardH} rx="7" fill="#090a23" stroke={gold} strokeWidth="7"/>
    <rect x="12" y="12" width={cardW - 24} height={cardH - 24} rx="3" fill={isFront ? "#17123c" : "#0f123a"} stroke={isFront ? cyan : violet} strokeWidth="3"/>
    {isFront ? <>
      <text x={cardW / 2} y="43" textAnchor="middle" fill={gold} fontFamily="monospace" fontSize={portrait ? 14 : 12} fontWeight="900" letterSpacing="2">PHRASE FOUND</text>
      <g transform={`translate(${cardW / 2} ${cardH * .39})`}>
        <circle r={cardW * .27} fill="#372061" stroke="#9d5cff" strokeWidth="3"/>
        <path d="M-52 24 L-29 -34 L-5 -12 L19 -49 L54 21 L19 48 L-17 32Z" fill="#ff7fbd" stroke="#fff1d6" strokeWidth="4"/>
        <path d="M-31 8 L-10 -5 L5 12 L33 -9" stroke="#4e1d72" strokeWidth="8" fill="none"/>
        <rect x="-19" y="-10" width="8" height="8" fill="#17123c"/><rect x="16" y="-20" width="8" height="8" fill="#17123c"/>
        <path d="M-13 25 L2 34 L17 20" fill="none" stroke="#8a2b69" strokeWidth="6"/>
      </g>
      <rect x="24" y={cardH * .66} width={cardW - 48} height="3" fill={gold}/>
      <text x={cardW / 2} y={cardH * .75} textAnchor="middle" fill={cream} fontFamily="monospace" fontSize={portrait ? 17 : 17} fontWeight="900" textLength={cardW - 35} lengthAdjust="spacingAndGlyphs">{frontTitle}</text>
      <text x={cardW / 2} y={cardH * .85} textAnchor="middle" fill={cyan} fontFamily="monospace" fontSize={portrait ? 11 : 10} textLength={cardW - 43} lengthAdjust="spacingAndGlyphs">{meaning.toUpperCase()}</text>
      <text x={cardW / 2} y={cardH - 20} textAnchor="middle" fill={gold} fontFamily="monospace" fontSize="10">★  USE IT IN REAL LIFE  ★</text>
    </> : <>
      <path d={`M${cardW / 2} 33 L${cardW - 30} ${cardH / 2} L${cardW / 2} ${cardH - 33} L30 ${cardH / 2}Z`} fill="none" stroke={gold} strokeWidth="4"/>
      <circle cx={cardW / 2} cy={cardH / 2} r={cardW * .19} fill="#39237b" stroke={cyan} strokeWidth="3"/>
      <text x={cardW / 2} y={cardH / 2 + 21} textAnchor="middle" fill={gold} fontFamily="monospace" fontSize="63" fontWeight="900">?</text>
      <path d={`M${cardW / 2} 25 V${cardH - 25} M20 ${cardH / 2} H${cardW - 20}`} stroke={violet} strokeWidth="2"/>
    </>}
  </g>;
};

const Burst: React.FC<{layout: Layout; frame: number; at: number}> = ({layout, frame, at}) => {
  const {cx, cardY, cardH} = layout;
  const t = lim((frame - at) / 35);
  if (t <= 0 || t >= 1) return null;
  const y = cardY + cardH * .48;
  return <g>
    <circle cx={cx} cy={y} r={12 + 320 * ease(t)} fill="none" stroke={cyan} strokeWidth={8 * (1 - t)} opacity={1 - t}/>
    <circle cx={cx} cy={y} r={7 + 220 * ease(lim(t * 1.4))} fill="none" stroke={gold} strokeWidth={6 * (1 - t)} opacity={1 - t}/>
    {Array.from({length: 94}, (_, i) => {
      const angle = i * 2.39996;
      const speed = 80 + hash(i + 134) * 300;
      const x = cx + Math.cos(angle) * speed * ease(t);
      const py = y + Math.sin(angle) * speed * ease(t);
      const size = 2 + hash(i + 634) * 7;
      return <rect key={i} x={x} y={py} width={size} height={size} fill={i % 3 ? gold : cyan} opacity={1 - t} transform={`rotate(${i * 31} ${x} ${py})`}/>;
    })}
  </g>;
};

export const ArcadeRevealVideo: React.FC<AnimationLessonProps & {portrait?: boolean}> = props => {
  validateResolvedLesson(props);
  const portrait = Boolean(props.portrait);
  const frame = useCurrentFrame();
  const w = portrait ? 540 : 960;
  const h = portrait ? 960 : 540;
  const layout: Layout = {w, h, portrait, cx: portrait ? 270 : 620, cardW: portrait ? 290 : 245, cardH: portrait ? 430 : 340, cardY: portrait ? 240 : 91};
  const noticeIndex = props.scenes.findIndex(scene => scene.mode === "notice");
  const snagAt = props.scenes[noticeIndex - 1].startFrame;
  const noticeAt = props.scenes[noticeIndex].startFrame;
  const reveal = ease((frame - snagAt) / 33);
  const impact = lim((frame - snagAt) / 13);
  const shake = impact > 0 && impact < 1 ? Math.sin(frame * 3.2) * 6 * (1 - impact) : 0;
  const flash = frame >= snagAt + 26 && frame < snagAt + 31 ? .8 * (1 - (frame - snagAt - 26) / 5) : 0;
  const titleX = portrait ? 29 : 39;
  const titleY = portrait ? 132 : 126;
  const captionY = portrait ? 818 : 465;
  const current = props.scenes.slice(0, noticeIndex + 1).filter(scene => frame >= scene.startFrame).at(-1) ?? props.scenes[0];
  const subtitle = current.captionEn;
  const textSize = portrait ? 24 : 22;
  const captionLines = portrait ? wrapWords(subtitle, 31) : [subtitle];

  return <AbsoluteFill style={{background: ink}}>
    <svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} style={{imageRendering: "pixelated"}}>
      <defs>
        <filter id="arcade-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="8"/></filter>
      </defs>
      <g transform={`translate(${shake} ${-shake * .45})`}>
        <PixelRoom layout={layout} frame={frame} reveal={reveal}/>
        <DeliverySprite layout={layout} frame={frame} snagAt={snagAt}/>
        <g opacity={.4 + .33 * Math.sin(frame * .08)} transform={`translate(${layout.cx} ${layout.cardY + layout.cardH * .5}) rotate(${frame * .35})`}>
          <circle r={layout.cardH * .58} fill="none" stroke={cyan} strokeWidth="2" strokeDasharray="9 19"/>
          <circle r={layout.cardH * .65} fill="none" stroke={gold} strokeWidth="2" strokeDasharray="3 33"/>
        </g>
        <ellipse cx={layout.cx} cy={layout.cardY + layout.cardH / 2} rx={layout.cardW * .9} ry={layout.cardH * .73} fill={violet} opacity={.13 + reveal * .19} filter="url(#arcade-glow)"/>
        <RuneCard layout={layout} frame={frame} snagAt={snagAt} phrase={props.lesson.target.phrase} meaning={props.lesson.target.meaningEn}/>
        <Burst layout={layout} frame={frame} at={snagAt + 27}/>
        {frame >= snagAt && frame < snagAt + 70 && Array.from({length: 45}, (_, i) => {
          const t = (frame - snagAt) / 70;
          const angle = i * 2.39996;
          const dist = (50 + hash(i + 91) * 360) * ease(t);
          const x = layout.cx + Math.cos(angle) * dist;
          const y = layout.cardY + layout.cardH * .5 + Math.sin(angle) * dist;
          const size = 3 + hash(i + 512) * 14;
          return <rect key={i} x={x} y={y} width={size} height={size} fill={i % 3 ? "#9d62f0" : gold} opacity={1 - t} transform={`rotate(${frame * (i % 2 ? 3 : -4)} ${x} ${y})`}/>;
        })}
      </g>
      <rect width={w} height={h} fill="#fff5ce" opacity={flash} pointerEvents="none"/>
      <rect x="0" y="0" width={w} height={portrait ? 174 : 71} fill="#080a22" opacity=".88"/>
      <text x={titleX} y={portrait ? 47 : 30} fill={cyan} fontFamily="monospace" fontWeight="900" fontSize={portrait ? 17 : 13} letterSpacing="2">ENGLISH QUEST  /  DISCOVERY 01</text>
      {portrait && <text x={titleX} y="82" fill={cream} fontFamily="monospace" fontWeight="900" fontSize="19">ONE PHRASE. TWO WORLDS.</text>}
      <rect x={titleX} y={portrait ? 102 : 46} width={portrait ? 480 : 885} height="5" fill="#453970"/>
      <rect x={titleX} y={portrait ? 102 : 46} width={(portrait ? 480 : 885) * lim(frame / noticeAt)} height="5" fill={gold}/>
      <g opacity={frame < snagAt ? 1 : 1 - ease((frame - snagAt) / 12)}>
        <text x={titleX} y={titleY + (portrait ? 31 : 0)} fill={cream} fontFamily="monospace" fontWeight="900" fontSize={portrait ? 29 : 31}>DELIVERY: ON TIME</text>
        <text x={titleX} y={titleY + (portrait ? 68 : 38)} fill={gold} fontFamily="monospace" fontWeight="900" fontSize={portrait ? 23 : 22}>THEN THE ROAD CLOSED.</text>
      </g>
      {frame >= snagAt && <g opacity={ease((frame - snagAt) / 12)}>
        <text x={titleX} y={titleY + (portrait ? 26 : 0)} fill={gold} fontFamily="monospace" fontWeight="900" fontSize={portrait ? 25 : 32}>PHRASE UNLOCKED!</text>
        <text x={titleX} y={titleY + (portrait ? 62 : 38)} fill={cream} fontFamily="monospace" fontWeight="900" fontSize={portrait ? 22 : 20}>{props.lesson.target.phrase.toUpperCase()}</text>
      </g>}
      {!portrait && frame >= noticeAt && <g opacity={ease((frame - noticeAt) / 13)}>
        <rect x="34" y="242" width="360" height="151" fill="#090a27" opacity=".9" stroke={cyan} strokeWidth="2"/>
        <text x="51" y="276" fill={gold} fontFamily="monospace" fontWeight="900" fontSize="18">MEANING:</text>
        {wrapWords(props.lesson.target.meaningEn.toUpperCase(), 25).slice(0, 3).map((line, i) => <text key={i} x="51" y={308 + i * 31} fill={cream} fontFamily="monospace" fontWeight="900" fontSize="19">{line}</text>)}
      </g>}
      <rect x="0" y={captionY - (portrait ? 22 : 15)} width={w} height={portrait ? 164 : 90} fill="#07091e" opacity=".97"/>
      <rect x={titleX} y={captionY - 5} width="7" height={portrait ? 103 : 43} fill={gold}/>
      {captionLines.map((line, i) => portrait ? <text key={i} x={titleX + 22} y={captionY + 18 + i * 28} fill={cream} fontFamily="monospace" fontWeight="900" fontSize={textSize}>{line}</text> : <text key={i} x={titleX + 22} y={captionY + 15} fill={cream} fontFamily="monospace" fontWeight="900" fontSize={textSize} textLength={Math.min(855, line.length * textSize * .59)} lengthAdjust="spacingAndGlyphs">{line}</text>)}
      {frame >= noticeAt && <text x={titleX + 22} y={captionY + (portrait ? 111 : 44)} fill={gold} fontFamily="sans-serif" fontWeight="700" fontSize={portrait ? 20 : 15}>{props.lesson.target.meaningJa}</text>}
    </svg>
    <Html5Audio src={staticFile("generated/animation-english/arcade-bgm.wav")} volume={0.27}/>
    {props.scenes.slice(0, noticeIndex + 1).map(scene => <Sequence key={scene.id} from={scene.startFrame} durationInFrames={scene.durationFrames}>
      {scene.audioPath && <Html5Audio src={staticFile(scene.audioPath)}/>}
    </Sequence>)}
    <Sequence from={snagAt} durationInFrames={45}><Html5Audio src={staticFile("generated/animation-english/arcade-reveal.wav")} volume={0.35}/></Sequence>
  </AbsoluteFill>;
};

export const arcadePreviewFrames = (props: AnimationLessonProps): number => {
  const notice = props.scenes.find(scene => scene.mode === "notice");
  if (!notice) throw new Error("Arcade reveal needs a notice scene");
  return notice.startFrame + notice.durationFrames;
};
