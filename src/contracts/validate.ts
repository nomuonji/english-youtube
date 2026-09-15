import type {EpisodeManifest, ValidationIssue} from "./types";
import {validateStructure} from "./schema";
import {semanticValidate} from "./semantic";

export type ValidationResult={ok:true;value:EpisodeManifest;issues:[]}|{ok:false;issues:ValidationIssue[]};
export const validateEpisode=(value:unknown):ValidationResult=>{const structural=validateStructure(value);if(!structural.ok)return {ok:false,issues:structural.issues};const issues=semanticValidate(structural.value);if(issues.length>0)return {ok:false,issues};return {ok:true,value:structural.value,issues:[]};};
