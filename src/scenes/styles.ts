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
  panel:"rgba(255,255,255,.86)",
  shadow:"rgba(16,42,54,.12)",
} as const;

export const base:CSSProperties={
  backgroundColor:"transparent",
  color:COLORS.text,
  fontFamily:'Inter, "Noto Sans CJK JP", "Noto Sans JP", "Yu Gothic", Meiryo, Arial, sans-serif',
};

export const mainArea:CSSProperties={
  position:"absolute",
  left:92,
  top:146,
  width:1736,
  height:516,
  display:"flex",
  alignItems:"center",
  justifyContent:"center",
};

export const subtitleArea:CSSProperties={
  position:"absolute",
  left:116,
  top:700,
  width:1688,
  height:292,
  display:"flex",
  alignItems:"center",
  justifyContent:"center",
  textAlign:"center",
};

export const headerStyle:CSSProperties={
  position:"absolute",
  left:92,
  top:34,
  width:1736,
  height:82,
  display:"flex",
  alignItems:"center",
  justifyContent:"space-between",
  fontSize:24,
  lineHeight:"32px",
  color:COLORS.muted,
  letterSpacing:"0.02em",
};
