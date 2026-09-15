import type {CSSProperties} from "react";
export const COLORS={background:"#F7F5EF",text:"#152B3C",muted:"#425569",accent:"#006D77",warning:"#9A4D00",line:"#CCD2D4",white:"#FFFFFF"} as const;
export const base:CSSProperties={backgroundColor:COLORS.background,color:COLORS.text,fontFamily:'Inter, "Noto Sans CJK JP", "Noto Sans JP", "Yu Gothic", Meiryo, Arial, sans-serif'};
export const mainArea:CSSProperties={position:"absolute",left:120,top:144,width:1680,height:576,display:"flex",alignItems:"center",justifyContent:"center"};
export const subtitleArea:CSSProperties={position:"absolute",left:144,top:756,width:1632,height:204,display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center",fontSize:64,lineHeight:1.28,fontWeight:400};
export const headerStyle:CSSProperties={position:"absolute",left:96,top:48,width:1728,height:64,display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:28,lineHeight:"36px",color:COLORS.muted,letterSpacing:"0.02em"};
