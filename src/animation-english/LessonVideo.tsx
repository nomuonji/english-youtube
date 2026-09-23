import React from "react";
import {AbsoluteFill, Html5Audio, Sequence, interpolate, staticFile, useCurrentFrame} from "remotion";
import type {AnimationLessonProps, TimedScene} from "./types";
import {validateResolvedLesson} from "./types";

const W = 1920;
const H = 1080;
const cyan = "#69DCEB";
const amber = "#F7BC69";
const paper = "#FFF6E8";
const ink = "#081722";
const font = '"Arial", "Helvetica Neue", sans-serif';

const ease = (frame: number, from: number, duration = 22) => {
  const t = interpolate(frame, [from, from + duration], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return 1 - Math.pow(1 - t, 3);
};

export const StreetWorld: React.FC<{scene: TimedScene; frame: number}> = ({scene, frame}) => {
  const blocked = scene.action === "blocked";
  const reroute = scene.action === "reroute";
  const cartX = scene.action === "drive" ? interpolate(frame, [0, scene.durationFrames], [240, 760], {extrapolateRight: "clamp"}) : reroute ? interpolate(frame, [0, scene.durationFrames], [740, 1460], {extrapolateRight: "clamp"}) : 760;
  const gate = (blocked || reroute) ? ease(frame, 4) : 0;
  return <g>
    <rect width={W} height={H} fill="#112943"/>
    <circle cx="1560" cy="235" r="210" fill="#EFAF79" opacity=".16"/>
    <path d="M0 670 L220 515 L440 675 L690 505 L960 660 L1240 510 L1490 650 L1740 480 L1920 605 V800 H0Z" fill="#1A3E56"/>
    {Array.from({length: 16}, (_, i) => <rect key={i} x={i * 135} y={555 + (i * 79) % 100} width={65 + (i * 23) % 52} height="200" fill={i % 3 === 0 ? "#204B5D" : "#1A3D50"}/>)}
    <path d="M0 773 H1920 V1080 H0Z" fill="#122936"/>
    <path d="M0 795 H1920 M0 910 H1920" stroke="#5B8A92" strokeWidth="5"/>
    <path d="M0 865 H1920" stroke="#C7D8CA" strokeWidth="7" strokeDasharray="70 50" opacity=".55"/>
    <g transform="translate(160 520)"><rect width="245" height="253" fill="#274D5B" stroke="#AACEC7" strokeWidth="5"/><path d="M0 0 L125 -65 H370 L245 0Z" fill="#3F6570" stroke="#AACEC7" strokeWidth="5"/><path d="M245 0 L370 -65 V254 L245 254Z" fill="#173647" stroke="#7299A3" strokeWidth="5"/><rect x="54" y="83" width="100" height="105" fill="#132E40" stroke={cyan} strokeWidth="4"/><text x="125" y="-20" fill={paper} fontSize="30" fontWeight="800" letterSpacing="3">DEPOT</text></g>
    <g transform="translate(1525 500)"><rect width="230" height="273" fill="#284858" stroke="#BCD0C7" strokeWidth="5"/><path d="M0 0 L115 -70 H345 L230 0Z" fill="#4A6870" stroke="#BCD0C7" strokeWidth="5"/><rect x="52" y="85" width="120" height="140" fill="#173243" stroke={amber} strokeWidth="4"/><path d="M52 85 L112 138 L172 85" fill="none" stroke={amber} strokeWidth="4"/></g>
    {reroute && <path d="M760 810 Q930 585 1130 700 T1460 810" fill="none" stroke={cyan} strokeWidth="8" strokeDasharray="23 17" strokeDashoffset={-frame * 6} opacity={ease(frame, 0)}/>}
    <g opacity={gate} transform="translate(1060 765)"><path d="M-115 30 H115" stroke="#F0C58A" strokeWidth="14"/><rect x="-108" y="-195" width="216" height="160" rx="9" fill="#863F40" stroke="#FFD0A2" strokeWidth="8"/><path d="M-85 -174 L-15 -57 M0 -174 L70 -57" stroke="#FFD0A2" strokeWidth="20"/><text x="0" y="-99" textAnchor="middle" fill={paper} fontSize="52" fontWeight="900">!</text></g>
    <g transform={`translate(${cartX} ${reroute ? -65 * Math.sin(frame / Math.max(1, scene.durationFrames) * Math.PI) : 0})`}>
      <ellipse cx="0" cy="795" rx="132" ry="25" fill="#061723" opacity=".7"/>
      <rect x="-105" y="665" width="212" height="110" rx="14" fill="#2A6375" stroke="#A3DBD5" strokeWidth="6"/>
      <path d="M-74 665 V620 H35 L81 665" fill="#1B465D" stroke="#A3DBD5" strokeWidth="6"/>
      <rect x="-50" y="633" width="54" height="23" fill={cyan}/><circle cx="76" cy="722" r="10" fill={amber}/>
      <circle cx="-62" cy="781" r="25" fill="#0A2332" stroke="#8BB4B8" strokeWidth="7"/><circle cx="65" cy="781" r="25" fill="#0A2332" stroke="#8BB4B8" strokeWidth="7"/>
      <rect x="-80" y="581" width="70" height="35" fill="#DFA968" stroke="#F6D09B" strokeWidth="4"/>
    </g>
  </g>;
};

export const OfficeWorld: React.FC<{frame: number}> = ({frame}) => <g>
  <rect width={W} height={H} fill="#11263B"/>
  <path d="M0 0 H1920 V590 H0Z" fill="#172F48"/>
  <rect x="130" y="165" width="1650" height="460" fill="#1C3F58" stroke="#75A5AD" strokeWidth="8"/>
  <path d="M680 165 V625 M1230 165 V625" stroke="#75A5AD" strokeWidth="8"/>
  <circle cx="1520" cy="320" r="115" fill="#E9A86C" opacity=".65"/>
  <path d="M130 505 L420 400 L700 520 L980 410 L1250 535 L1500 440 L1780 535 V625 H130Z" fill="#254D65"/>
  <rect y="625" width={W} height="455" fill="#193447"/>
  <path d="M0 875 H1920" stroke="#4C7887" strokeWidth="7"/>
  <path d="M290 700 H1590" stroke="#D4B886" strokeWidth="26"/>
  <path d="M340 712 V875 M1540 712 V875" stroke="#567C87" strokeWidth="18"/>
  <g transform="translate(690 370)"><path d="M0 0 H535 V340 H0Z" fill="#0B2435" stroke="#9DBFC1" strokeWidth="10"/><rect x="25" y="24" width="485" height="278" fill="#102F44"/><path d="M-50 345 H580 L535 370 H0Z" fill="#71979B"/><circle cx="267" cy="150" r="75" fill="#9E4D51" opacity={.35 + .15 * Math.sin(frame * .2)}/><text x="267" y="183" textAnchor="middle" fill="#FFD7BB" fontFamily={font} fontSize="93" fontWeight="900">!</text><path d="M90 270 H438" stroke={cyan} strokeWidth="6" strokeDasharray="16 10"/></g>
  <g transform="translate(460 455)"><circle cx="0" cy="0" r="64" fill="#F3C898"/><path d="M-90 182 Q-85 62 0 70 Q90 62 90 182" fill="#376377"/><path d="M-53 -47 Q0 -112 53 -47" fill="none" stroke="#24384A" strokeWidth="25"/></g>
</g>;

const Phrase: React.FC<{phrase: string; emphasis: string; x: number; y: number; size?: number}> = ({phrase, emphasis, x, y, size = 92}) => {
  const at = phrase.toLowerCase().indexOf(emphasis.toLowerCase());
  return <text x={x} y={y} fill={paper} fontFamily={font} fontSize={size} fontWeight="900" letterSpacing="-2">{at >= 0 ? <>{phrase.slice(0, at)}<tspan fill={amber}>{phrase.slice(at, at + emphasis.length)}</tspan>{phrase.slice(at + emphasis.length)}</> : phrase}</text>;
};

const LessonSceneView: React.FC<{props: AnimationLessonProps; scene: TimedScene}> = ({props, scene}) => {
  const frame = useCurrentFrame();
  const enter = ease(frame, 0);
  const speaking = frame >= scene.speechFrames;
  const topLabel = scene.mode === "story" ? "WATCH THE SITUATION" : scene.mode === "notice" ? "NOTICE THE CHUNK" : scene.mode === "transfer" ? "NEW SITUATION" : scene.mode === "speak" ? "SAY IT OUT LOUD" : scene.mode === "recall" ? "RECALL" : "THAT'S IT";
  const showPhrase = ["notice", "transfer", "speak", "answer"].includes(scene.mode);
  return <AbsoluteFill style={{background: ink, fontFamily: font}}>
    <svg width="100%" height="100%" viewBox={`0 0 ${W} ${H}`}>
      {scene.world === "street" ? <StreetWorld scene={scene} frame={frame}/> : <OfficeWorld frame={frame}/>}
      <rect width={W} height="195" fill={ink} opacity=".86"/>
      <text x="88" y="64" fill={cyan} fontFamily={font} fontSize="23" fontWeight="800" letterSpacing="5">WORLD IN CLEAR ENGLISH / ANIMATED ENGLISH</text>
      <text x="88" y="146" fill={paper} fontFamily={font} fontSize="72" fontWeight="900" letterSpacing="-2">{props.lesson.title}</text>
      <rect x="1300" y="70" width="525" height="54" rx="27" fill="#22465A" stroke={cyan} strokeWidth="2"/>
      <text x="1562" y="105" textAnchor="middle" fill={cyan} fontFamily={font} fontSize="25" fontWeight="800" letterSpacing="3">{topLabel}</text>
      {showPhrase && <g opacity={enter} transform={`translate(0 ${(1 - enter) * 30})`}><rect x="72" y="238" width="1120" height={scene.mode === "notice" ? 235 : 135} rx="12" fill="#071723" opacity=".91"/><Phrase phrase={props.lesson.target.phrase} emphasis={props.lesson.target.emphasis} x={112} y={346}/>{scene.mode === "notice" && <><text x="115" y="407" fill="#BBD3D5" fontFamily={font} fontSize="32">{props.lesson.target.meaningEn}</text><text x="115" y="454" fill={amber} fontFamily={font} fontSize="26">{props.lesson.target.meaningJa}</text></>}</g>}
      {scene.mode === "story" && scene.action === "blocked" && <g opacity={enter}><rect x="1210" y="265" width="580" height="124" rx="12" fill="#071723" opacity=".9"/><text x="1260" y="342" fill={amber} fontFamily={font} fontSize="53" fontWeight="900">A SMALL PROBLEM</text></g>}
      {scene.mode === "recall" && <g opacity={enter}><rect x="91" y="230" width="1170" height="205" rx="14" fill="#071723" opacity=".92"/><text x="130" y="312" fill={paper} fontFamily={font} fontSize="64" fontWeight="900">WHAT WOULD YOU SAY?</text><text x="130" y="386" fill={amber} fontFamily={font} fontSize="38">{props.lesson.target.transferSituation}</text></g>}
      {scene.mode === "speak" && <g><text x="108" y="464" fill={cyan} fontFamily={font} fontSize="31" fontWeight="800" letterSpacing="3">{speaking ? "YOUR TURN — SAY IT NOW" : "LISTEN, THEN SPEAK"}</text><rect x="107" y="492" width="700" height="8" fill="#36616D"/><rect x="107" y="492" width={700 * Math.min(1, frame / scene.durationFrames)} height="8" fill={cyan}/></g>}
      {scene.mode === "answer" && <g opacity={enter}><circle cx="1650" cy="340" r="78" fill="#2C6E69"/><path d="M1605 340 L1637 373 L1694 304" fill="none" stroke={paper} strokeWidth="16" strokeLinecap="round"/></g>}
      <rect y="889" width={W} height="191" fill="#06131E" opacity=".96"/>
      <rect x="86" y="918" width="7" height="112" fill={scene.mode === "recall" ? amber : cyan}/>
      <text x="126" y="960" fill={cyan} fontFamily={font} fontSize="24" fontWeight="800" letterSpacing="3">ONE EXPRESSION · REAL SITUATIONS · {props.lesson.level}</text>
      <text x="126" y="1010" fill={paper} fontFamily={font} fontSize="35" fontWeight="600">{scene.captionEn}</text>
      <path d="M126 1043 H1788" stroke="#345566" strokeWidth="2"/>
      <path d={`M126 1043 H${126 + 1662 * Math.min(1, frame / scene.durationFrames)}`} stroke={cyan} strokeWidth="4"/>
    </svg>
  </AbsoluteFill>;
};

export const LessonVideo: React.FC<AnimationLessonProps> = (props) => {
  validateResolvedLesson(props);
  return <AbsoluteFill style={{background: ink}}>
    {props.bgmSrc && <Html5Audio src={staticFile(props.bgmSrc)} volume={0.28}/>}
    {props.scenes.map(scene => <Sequence key={scene.id} from={scene.startFrame} durationInFrames={scene.durationFrames}>
    <LessonSceneView props={props} scene={scene}/>
    {scene.audioPath && <Html5Audio src={staticFile(scene.audioPath)}/>}
  </Sequence>)}
  </AbsoluteFill>;
};
