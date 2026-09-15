import Ajv2020, {type ErrorObject, type ValidateFunction} from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import type {AnySchema} from "ajv";
import {readFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import {dirname, resolve} from "node:path";
import type {EpisodeManifest, ValidationIssue} from "./types";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const loadObject = (path:string):Record<string,unknown> => JSON.parse(readFileSync(path,"utf8")) as Record<string,unknown>;
let validateFunction:ValidateFunction|null = null;

const getValidator = ():ValidateFunction => {
  if (validateFunction) return validateFunction;
  const legacy = loadObject(resolve(root,"schemas/episode.schema.json"));
  const schema = loadObject(resolve(root,"schemas/episode-v2.1.schema.json")) as AnySchema;
  const definitionsOnly = {$schema:legacy.$schema,$id:legacy.$id,$defs:legacy.$defs} as AnySchema;
  // The v2.0 shared $defs predate Ajv strictTypes and contain conditional
  // property fragments without repeated type declarations. Runtime validation
  // remains strict for unknown keywords/properties/required fields; only the
  // legacy schema-lint rule is relaxed until common v2.1 defs are extracted.
  const ajv = new Ajv2020({allErrors:true,strict:true,strictTypes:false});
  addFormats(ajv);
  ajv.addSchema(definitionsOnly);
  validateFunction = ajv.compile(schema);
  return validateFunction;
};

const formatError = (error:ErrorObject):ValidationIssue => ({code:"E_SCHEMA",targetId:error.instancePath||"/",detail:`${error.keyword}: ${error.message??"schema validation failed"}`});

export const validateStructure = (value:unknown):{ok:true;value:EpisodeManifest}|{ok:false;issues:ValidationIssue[]} => {
  const validate=getValidator();
  if (validate(value)) return {ok:true,value:value as EpisodeManifest};
  return {ok:false,issues:(validate.errors??[]).map(formatError)};
};
