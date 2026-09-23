import React from "react";
import {AbsoluteFill, Html5Audio, Sequence, interpolate, staticFile, useCurrentFrame} from "remotion";
import {OfficeWorld, StreetWorld} from "./LessonVideo";
import type {AnimationLessonProps, TimedScene} from "./types";
import {validateResolvedLesson} from "./types";

const W = 1920;
const H = 1080;
const white = "#fffaf0";
const yellow = "#ffe56a";
const pink = "#ff6588";
const blue = "#77ecfb";
const dark = "#071726";
const font = '"Arial", "Helvetica Neue", sans-serif';
const clamp = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const rise = (frame: number, delay = 0, length = 12) => 1 - Math.pow(1 - clamp((frame - delay) / length), 3);

const lineBreak = (caption: string): string[] => {
  if (caption.length <= 48) return [caption];
  const pivot = caption.lastIndexOf(" ", 49);
  return pivot > 20 ? [caption.slice(0, pivot), caption.slice(pivot + 1)] : [caption];
};

const Phrase: React.FC<{phrase: string; emphasis: string; x: number; y: number; size: number}> = ({phrase, emphasis, x, y, size}) => {
  const index = phrase.toLowerCase().indexOf(emphasis.toLowerCase());
  return <text x={x} y={y} fill={white} fontFamily={font} fontSize={size} fontWeight="900" letterSpacing="-4">
    {index < 0 ? phrase : <>{phrase.slice(0, index)}<tspan fill={yellow}>{phrase.slice(index, index + emphasis.length)}</tspan>{phrase.slice(index + emphasis.length)}</>}
  </text>;
};

const Scene: React.FC<{props: AnimationLessonProps; scene: TimedScene; index: number}> = ({props, scene, index}) => {
  const frame = useCurrentFrame();
  const enter = rise(frame);
  const beat = scene.mode === "story" && scene.action === "drive" ? "THE PLAN" :
    scene.mode === "story" && scene.action === "blocked" ? "PLOT TWIST" :
    scene.mode === "story" ? "KEEP MOVING" : scene.mode === "notice" ? "THE PHRASE" :
    scene.mode === "transfer" ? "SAME PHRASE. NEW WORLD." : scene.mode === "speak" ? "YOUR TURN" :
    scene.mode === "recall" ? "CAN YOU REMEMBER?" : "THE REVEAL";
  const accent = scene.mode === "recall" ? pink : scene.mode === "answer" ? yellow : blue;
  const phraseVisible = ["notice", "transfer", "speak", "answer"].includes(scene.mode);
  const pulse = scene.mode === "answer" ? 1 + Math.sin(frame * .28) * .018 : 1;
  const camera = 1.05 + .025 * (frame / Math.max(1, scene.durationFrames));
  const captionLines = lineBreak(scene.captionEn);
  const holdStart = Math.min(scene.speechFrames, scene.durationFrames - 1);
  const responseProgress = clamp((frame - holdStart) / Math.max(1, scene.durationFrames - holdStart));

  return <AbsoluteFill style={{background: dark}}>
    <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
      <g transform={`translate(${W * (1 - camera) / 2} ${H * (1 - camera) / 2}) scale(${camera})`}>
        {scene.world === "street" ? <StreetWorld scene={scene} frame={frame}/> : <OfficeWorld frame={frame}/>}
      </g>
      <rect width={W} height={H} fill={dark} opacity={scene.mode === "notice" || scene.mode === "recall" ? .55 : .21}/>
      <rect width={W} height="17" fill="#132e43"/>
      {props.scenes.map((item, itemIndex) => <rect key={item.id} x={itemIndex * W / props.scenes.length + 3} y="0" width={W / props.scenes.length - 6} height="17" fill={itemIndex < index ? blue : itemIndex === index ? accent : "#234357"} opacity={itemIndex < index ? .68 : 1}/>)}
      <g opacity={enter} transform={`translate(${(1 - enter) * -90} 0)`}>
        <rect x="70" y="75" width={Math.max(370, beat.length * 31)} height="72" fill={accent}/>
        <text x="102" y="127" fill={dark} fontFamily={font} fontSize="37" fontWeight="900" letterSpacing="2">{beat}</text>
      </g>
      <text x="1815" y="122" fill={white} textAnchor="end" fontFamily={font} fontSize="30" fontWeight="800">{String(index + 1).padStart(2, "0")} / {String(props.scenes.length).padStart(2, "0")}</text>

      {scene.mode === "story" && scene.action === "drive" && <g opacity={rise(frame, 8)} transform={`translate(0 ${(1 - rise(frame, 8)) * 70})`}>
        <text x="95" y="378" fill={white} fontFamily={font} fontSize="86" fontWeight="900">ON TIME.</text>
        <text x="95" y="476" fill={yellow} fontFamily={font} fontSize="74" fontWeight="900">UNTIL...</text>
      </g>}
      {scene.mode === "story" && scene.action === "blocked" && <g opacity={rise(frame, 3)} transform={`translate(1040 560) scale(${.88 + .12 * rise(frame, 3)})`}>
        <rect x="0" y="-138" width="755" height="190" rx="17" fill={pink}/>
        <text x="375" y="-5" textAnchor="middle" fill={white} fontFamily={font} fontSize="80" fontWeight="900">ROAD CLOSED</text>
      </g>}
      {scene.mode === "story" && scene.action === "reroute" && <g opacity={rise(frame, 4)}><text x="98" y="400" fill={white} fontFamily={font} fontSize="78" fontWeight="900">NEW ROUTE</text><path d="M100 435 H655" stroke={blue} strokeWidth="15"/></g>}

      {phraseVisible && <g opacity={rise(frame, 3)} transform={`translate(0 ${(1 - rise(frame, 3)) * 95}) scale(${pulse})`}>
        <rect x="72" y={scene.mode === "notice" ? 300 : 285} width="1776" height={scene.mode === "notice" ? 300 : 180} rx="22" fill={dark} opacity=".94" stroke={accent} strokeWidth="5"/>
        <Phrase phrase={props.lesson.target.phrase} emphasis={props.lesson.target.emphasis} x={120} y={scene.mode === "notice" ? 434 : 414} size={scene.mode === "notice" ? 117 : 106}/>
        {scene.mode === "notice" && <><text x="124" y="512" fill={white} fontFamily={font} fontSize="44" fontWeight="700">{props.lesson.target.meaningEn}</text><text x="124" y="566" fill={yellow} fontFamily={font} fontSize="36" fontWeight="700">{props.lesson.target.meaningJa}</text></>}
      </g>}
      {scene.mode === "transfer" && <g opacity={rise(frame, 12)}><rect x="990" y="503" width="820" height="116" rx="14" fill={pink}/><text x="1035" y="580" fill={white} fontFamily={font} fontSize="51" fontWeight="900">AT WORK, TOO.</text></g>}
      {scene.mode === "speak" && <g><text x="105" y="570" fill={white} fontFamily={font} fontSize="53" fontWeight="900">{frame < holdStart ? "LISTEN FIRST" : "SAY IT NOW"}</text><rect x="105" y="606" width="750" height="19" rx="8" fill="#315267"/><rect x="105" y="606" width={750 * responseProgress} height="19" rx="8" fill={yellow}/></g>}
      {scene.mode === "recall" && <g opacity={rise(frame, 2)}>
        <rect x="70" y="245" width="1775" height="355" rx="22" fill={dark} opacity=".94" stroke={pink} strokeWidth="5"/>
        <text x="117" y="355" fill={white} fontFamily={font} fontSize="78" fontWeight="900">{props.lesson.target.transferSituation}</text>
        <text x="117" y="470" fill={yellow} fontFamily={font} fontSize="85" fontWeight="900">WHAT WOULD YOU SAY?</text>
        <rect x="117" y="525" width="1575" height="20" fill="#3d5667"/>
        <rect x="117" y="525" width={1575 * responseProgress} height="20" fill={pink}/>
      </g>}
      {scene.mode === "answer" && <g opacity={rise(frame, 5)}><circle cx="1685" cy="598" r={66 + 15 * Math.sin(frame * .17)} fill={yellow}/><path d="M1645 598 L1674 629 L1733 562" fill="none" stroke={dark} strokeWidth="16" strokeLinecap="round"/></g>}

      <rect x="0" y="858" width={W} height="222" fill={dark} opacity=".97"/>
      <rect x="80" y="888" width="13" height="150" fill={accent}/>
      <text x="120" y="930" fill={accent} fontFamily={font} fontSize="26" fontWeight="900" letterSpacing="3">{props.lesson.level} ENGLISH · WATCH / HEAR / SAY</text>
      {captionLines.map((line, i) => <text key={i} x="120" y={captionLines.length === 1 ? 1006 : 990 + i * 53} fill={white} fontFamily={font} fontSize={captionLines.length === 1 ? 48 : 42} fontWeight="800">{line}</text>)}
    </svg>
  </AbsoluteFill>;
};

const cueForScene = (scene: TimedScene): string | undefined =>
  scene.mode === "story" && scene.action === "blocked" ? "hook-impact.wav" :
  scene.mode === "notice" || scene.mode === "speak" ? "phrase-ping.wav" :
  scene.mode === "transfer" ? "chapter-whoosh.wav" :
  scene.mode === "recall" ? "check-cue.wav" :
  scene.mode === "answer" ? "metric-hit.wav" : undefined;

export const KineticLessonVideo: React.FC<AnimationLessonProps> = props => {
  validateResolvedLesson(props);
  return <AbsoluteFill style={{background: dark}}>
    {props.bgmSrc && <Html5Audio src={staticFile(props.bgmSrc)} volume={0.25}/>}
    {props.scenes.map((scene, index) => <Sequence key={scene.id} from={scene.startFrame} durationInFrames={scene.durationFrames}>
      <Scene props={props} scene={scene} index={index}/>
      {scene.audioPath && <Html5Audio src={staticFile(scene.audioPath)}/>}
      {cueForScene(scene) && <Html5Audio src={staticFile(`generated/sfx/${cueForScene(scene)}`)} volume={0.16}/>}
    </Sequence>)}
  </AbsoluteFill>;
};
