import React from "react";
import type {StageIcon} from "./types";

type Props = {icon: StageIcon; frame: number; accent: string};

const Server: React.FC<Props> = ({frame, accent}) => <g>
  <path d="M-180 -110 L-130 -137 H172 L120 -110Z" fill="#315F71" stroke="#9FCAD0" strokeWidth="4"/>
  <path d="M120 -110 L172 -137 V195 L120 220Z" fill="#0B2130" stroke="#6FA5B4" strokeWidth="4"/>
  <rect x="-180" y="-110" width="300" height="330" fill="#112B3D" stroke="#9FCAD0" strokeWidth="5"/>
  {Array.from({length: 3}, (_, rack) => <g key={rack} transform={`translate(${-162 + rack * 101} 0)`}>
    <rect y="-84" width="83" height="277" rx="2" fill="#071C2B" stroke="#517B8B" strokeWidth="3"/>
    {Array.from({length: 6}, (_, row) => <g key={row}>
      <rect x="8" y={-69 + row * 43} width="64" height="31" fill="#0D3043" stroke="#37667C" strokeWidth="2"/>
      <path d={`M16 ${-59 + row * 43} H46`} stroke={accent} strokeWidth="3" opacity=".65"/>
      <circle cx="60" cy={-54 + row * 43} r="3.5" fill={(Math.floor(frame / 9) + row + rack) % 4 === 0 ? "#F2BA67" : accent}/>
    </g>)}
  </g>)}
  <path d="M-180 220 H120" stroke={accent} strokeWidth="8" opacity=".45"/>
</g>;

const Grid: React.FC<Props> = ({accent}) => <g fill="none" strokeLinecap="square" strokeLinejoin="round">
  <path d="M-126 220 L-44 -123 L38 220 M-44 -123 V-165 M-96 39 H7 M-115 147 H28 M-100 39 L23 147 M7 39 L-115 147 M-126 220 H38" stroke="#ADC6C6" strokeWidth="6"/>
  <path d="M-118 -49 H28 M-132 5 H44 M-44 -165 L-74 -119 M-44 -165 L-15 -119" stroke="#ADC6C6" strokeWidth="5"/>
  <path d="M-15 -49 Q104 23 171 -42 M-31 5 Q89 69 182 12" stroke="#628D9D" strokeWidth="3"/>
  <path d="M110 214 V67 H193 V214 M125 96 H177 M151 67 V25" stroke="#ADC6C6" strokeWidth="5"/>
  <rect x="101" y="213" width="111" height="12" fill={accent} stroke="none" opacity=".7"/>
</g>;

const Power: React.FC<Props> = ({accent}) => <g>
  <path d="M-185 219 V27 H149 V219Z" fill="#1C3B4B" stroke="#AAC8C4" strokeWidth="5"/>
  <path d="M-185 27 L-128 -10 H203 L149 27Z" fill="#436070" stroke="#AAC8C4" strokeWidth="4"/>
  <path d="M149 27 L203 -10 V219 H149Z" fill="#102A39" stroke="#77999E" strokeWidth="4"/>
  <rect x="-139" y="75" width="105" height="105" fill="#112C3E" stroke={accent} strokeWidth="4"/>
  <path d="M-129 85 L-45 169 M-45 85 L-129 169" stroke={accent} strokeWidth="4"/>
  <path d="M0 27 V-120 H61 V27 M87 27 V-80 H126 V27" fill="#415767" stroke="#AEC5C2" strokeWidth="5"/>
  <path d="M13 -120 Q32 -155 48 -120 M99 -80 Q109 -107 118 -80" fill="none" stroke="#F5BB72" strokeWidth="3"/>
  <path d="M203 220 V-120 M157 -46 H249" fill="none" stroke="#B1C6C6" strokeWidth="6"/>
  <circle cx="203" cy="-25" r="12" fill={accent}/>
  <path d="M203 -25 L174 -125 M203 -25 L268 -74 M203 -25 L176 72" stroke="#B1C6C6" strokeWidth="8" strokeLinecap="round"/>
</g>;

const Factory: React.FC<Props> = ({accent}) => <g>
  <path d="M-185 215 V-30 L-70 25 V-30 L40 25 V-105 H102 V25 H185 V215Z" fill="#1C3C4D" stroke="#A9C6C7" strokeWidth="5"/>
  <path d="M-183 42 H183" stroke={accent} strokeWidth="6" opacity=".65"/>
  {[-125, -42, 41, 124].map(x => <rect key={x} x={x} y="85" width="49" height="58" fill="#0C2839" stroke={accent} strokeWidth="3"/>)}
  <path d="M-185 215 H185" stroke="#A9C6C7" strokeWidth="6"/>
</g>;

const Process: React.FC<Props> = ({frame, accent}) => <g transform={`rotate(${frame * .35})`}>
  <circle r="132" fill="#102D3E" stroke="#9FC5C8" strokeWidth="7"/>
  {Array.from({length: 8}, (_, i) => <rect key={i} x="-18" y="-168" width="36" height="50" fill="#274D61" stroke="#9FC5C8" strokeWidth="4" transform={`rotate(${i * 45})`}/>)}
  <circle r="51" fill="#081E2C" stroke={accent} strokeWidth="12"/>
  <circle r="14" fill={accent}/>
</g>;

const Package: React.FC<Props> = ({accent}) => <g strokeLinejoin="round">
  <path d="M-160 -45 L0 -125 L160 -45 L0 40Z" fill="#527283" stroke="#B1CDD0" strokeWidth="5"/>
  <path d="M-160 -45 L0 40 V208 L-160 123Z" fill="#244456" stroke="#B1CDD0" strokeWidth="5"/>
  <path d="M0 40 L160 -45 V123 L0 208Z" fill="#102D40" stroke="#B1CDD0" strokeWidth="5"/>
  <path d="M-49 -101 L113 -20 V31 L-49 -50Z" fill={accent} opacity=".7"/>
  <path d="M0 40 V208" stroke="#B1CDD0" strokeWidth="5"/>
</g>;

const components: Record<StageIcon, React.FC<Props>> = {server: Server, grid: Grid, power: Power, factory: Factory, process: Process, package: Package};

export const StageArt: React.FC<Props> = (props) => {
  const Component = components[props.icon];
  return <Component {...props}/>;
};
