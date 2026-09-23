import React from "react";
import {AbsoluteFill, Html5Audio, interpolate, staticFile, useCurrentFrame} from "remotion";
import {StageArt} from "./StageArt";
import type {ExplainerConfig} from "./types";
import {validateExplainerConfig} from "./types";

const W = 1920;
const H = 1080;
const ink = "#071622";
const cream = "#F7F0E4";
const cyan = "#64DDF3";
const amber = "#F5BD69";
const stageX = [340, 960, 1580];
const font = '"Arial", "Helvetica Neue", sans-serif';

const appear = (frame: number, from: number, duration = 24) => {
  const t = interpolate(frame, [from, from + duration], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return 1 - Math.pow(1 - t, 3);
};

export type ExplainerVideoProps = {config: ExplainerConfig};

export const ExplainerVideo: React.FC<ExplainerVideoProps> = ({config}) => {
  validateExplainerConfig(config);
  const frame = useCurrentFrame();
  const question = appear(frame, config.questionFrame, 18);
  const cue = config.cues.find(item => item.startFrame <= frame && frame < item.endFrame);
  const worldEnter = config.stages.map(stage => appear(frame, stage.revealFrame));
  const activeIndex = [...config.stages].reverse().findIndex(stage => frame >= stage.revealFrame);
  const active = activeIndex < 0 ? 0 : 2 - activeIndex;
  const flowEnter = Math.min(worldEnter[0], worldEnter[1], worldEnter[2]);
  const travel = (frame - Math.max(...config.stages.map(stage => stage.revealFrame))) * 5;
  const pulse = ((travel % 1240) + 1240) % 1240;
  const pulseX = config.flowDirection === "right-to-left" ? 1580 - pulse : 340 + pulse;
  const progress = (frame / config.durationFrames) * 1664;

  return <AbsoluteFill style={{background: ink, fontFamily: font}}>
    {config.audioSrc ? <Html5Audio src={staticFile(config.audioSrc)}/> : null}
    <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`} style={{position: "absolute", inset: 0}}>
      <defs>
        <linearGradient id="explain-sky" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#071622"/><stop offset=".57" stopColor="#15364E"/><stop offset="1" stopColor="#2F3E54"/></linearGradient>
        <linearGradient id="explain-ground" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#123346"/><stop offset="1" stopColor="#071722"/></linearGradient>
        <filter id="explain-glow"><feGaussianBlur stdDeviation="7" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      <rect width={W} height={H} fill="url(#explain-sky)"/>
      <circle cx="1540" cy="295" r="262" fill={amber} opacity=".05"/>
      <path d="M0 570 L190 460 L370 545 L660 393 L910 550 L1130 425 L1400 545 L1620 403 L1920 565 V780 H0Z" fill="#183349" opacity=".8"/>
      <path d="M0 635 Q450 562 820 615 T1510 554 T1920 620 V780 H0Z" fill="#112D3F"/>
      {Array.from({length: 36}, (_, i) => <rect key={i} x={(i * 137 + 41) % W} y={495 + (i * 71) % 145} width={18 + (i * 17) % 54} height={26 + (i * 23) % 85} fill={i % 4 === 0 ? "#20475B" : "#17384A"} opacity=".6"/>)}
      <path d="M0 744 H1920 V1080 H0Z" fill="url(#explain-ground)"/>
      <path d="M0 744 H1920 M0 812 H1920" stroke="#4C8796" strokeWidth="4"/>
      <path d="M0 940 H1920" stroke="#214657" strokeWidth="3"/>
      <path d="M340 814 H1580" fill="none" stroke="#195369" strokeWidth="22" opacity={flowEnter}/>
      <path d="M340 814 H1580" fill="none" stroke={cyan} strokeWidth="6" strokeDasharray="26 18" strokeDashoffset={config.flowDirection === "right-to-left" ? -travel : travel} filter="url(#explain-glow)" opacity={flowEnter}/>
      <circle cx={pulseX} cy="814" r="16" fill={cyan} filter="url(#explain-glow)" opacity={flowEnter}/>
      <circle cx={pulseX} cy="814" r="5" fill={cream} opacity={flowEnter}/>
      {config.stages.map((stage, i) => <g key={stage.id} opacity={worldEnter[i]} transform={`translate(${stageX[i]} 520)`}>
        <ellipse cx="0" cy="225" rx="245" ry="29" fill="#030E16" opacity=".6"/>
        <g transform={`translate(0 ${(1 - worldEnter[i]) * 36})`}><StageArt icon={stage.icon} frame={frame} accent={i === 2 ? amber : cyan}/></g>
        <path d="M0 -250 V-202" stroke={i === active ? (i === 2 ? amber : cyan) : "#7898A5"} strokeWidth="3"/>
        <circle cy="-199" r="6" fill={i === active ? (i === 2 ? amber : cyan) : "#7898A5"}/>
        <text y="-267" textAnchor="middle" fontFamily={font} fontSize="34" fontWeight="800" letterSpacing="5" fill={i === active ? cream : "#B6CCD0"}>{stage.label}</text>
      </g>)}
      <rect width={W} height="230" fill={ink} opacity=".82"/>
      <text x="82" y="62" fontSize="21" fontFamily={font} fontWeight="800" letterSpacing="5" fill={cyan}>{config.eyebrow}</text>
      <text x="82" y="178" fontSize="107" fontFamily={font} fontWeight="900" letterSpacing="-4" fill={cream} opacity={1 - question}>{config.title}</text>
      <text x="82" y="174" fontSize="77" fontFamily={font} fontWeight="900" letterSpacing="-2" fill={cream} opacity={question}>{config.question}</text>
      <rect y="885" width={W} height="195" fill="#06131E" opacity=".95"/>
      <rect x="85" y="914" width="7" height="110" fill={active === 2 ? amber : cyan}/>
      <text x="125" y="958" fontFamily={font} fontSize="25" fontWeight="800" letterSpacing="3" fill={cyan}>{config.topic}</text>
      <text x="125" y="1009" fontFamily={font} fontSize="34" fontWeight="600" fill={cream}>{cue?.text ?? ""}</text>
      <path d="M125 1044 H1789" stroke="#345566" strokeWidth="2"/>
      <path d={`M125 1044 H${125 + progress}`} stroke={cyan} strokeWidth="4"/>
      {config.sourceNote ? <text x="1800" y="862" textAnchor="end" fontFamily={font} fontSize="17" fill="#A9C4CC">{config.sourceNote}</text> : null}
    </svg>
  </AbsoluteFill>;
};
