import {createHash} from "node:crypto";

const canonicalize=(value:unknown):unknown=>{if(Array.isArray(value))return value.map(canonicalize);if(value&&typeof value==="object")return Object.fromEntries(Object.entries(value as Record<string,unknown>).sort(([a],[b])=>a.localeCompare(b)).map(([key,item])=>[key,canonicalize(item)]));return value;};
export const canonicalJson=(value:unknown):string=>JSON.stringify(canonicalize(value));
export const sha256Canonical=(value:unknown):string=>createHash("sha256").update(canonicalJson(value),"utf8").digest("hex");
