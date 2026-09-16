import type {CSSProperties} from "react";

export const COLORS={
  background:"#F4F1E8",
  text:"#102A36",
  muted:"#536873",
  accent:"#008B8B",
  accentSoft:"#DDF3EF",
  accent2:"#E56B3F",
  accent2Soft:"#FBE7DE",
  warning:"#9A4D00",
  line:"#C8D0CE",
  lineStrong:"#93A5A2",
  white:"#FFFFFF",
  navy:"#0B2531",
  panel:"rgba(255,255,255,.88)",
  shadow:"rgba(16,42,54,.16)",
} as const;

export const base:CSSProperties={
  backgroundColor:"transparent",
  color:COLORS.text,
  fontFamily:'Inter, "Noto Sans CJK JP", "Noto Sans JP", "Yu Gothic", Meiryo, Arial, sans-serif',
};

export const mainArea:CSSProperties={
  position:"absolute",
  left:72,
  top:132,
  width:1776,
  height:620,
  display:"flex",
  alignItems:"center",
  justifyContent:"center",
};

export const subtitleArea:CSSProperties={
  position:"absolute",
  left:116,
  top:810,
  width:1688,
  height:190,
  display:"flex",
  alignItems:"center",
  justifyContent:"center",
  textAlign:"center",
};

export const headerStyle:CSSProperties={
  position:"absolute",
  left:92,
  top:28,
  width:1736,
  height:78,
  display:"flex",
  alignItems:"center",
  justifyContent:"space-between",
  fontSize:24,
  lineHeight:"32px",
  color:COLORS.muted,
  letterSpacing:"0.02em",
};
