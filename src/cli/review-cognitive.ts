import {readFileSync} from "node:fs";
import {resolve} from "node:path";
import {validateEpisode} from "../contracts/validate";
import {reviewCognitiveLoad} from "../editorial/cognitive-load";

const path=process.argv[2]??"fixtures/v2.1-demo.json";
try{
  const absolute=resolve(process.cwd(),path);
  const value:unknown=JSON.parse(readFileSync(absolute,"utf8"));
  const validated=validateEpisode(value);
  if(!validated.ok){
    console.error(JSON.stringify({ok:false,path,stage:"contract",issues:validated.issues},null,2));
    process.exitCode=2;
  }else{
    const review=reviewCognitiveLoad(validated.value);
    console.log(JSON.stringify({ok:review.hardFailures.length===0&&review.score>=75,path,...review},null,2));
    if(review.hardFailures.length>0||review.score<75)process.exitCode=3;
  }
}catch(error){
  console.error(JSON.stringify({ok:false,path,error:error instanceof Error?error.message:String(error)},null,2));
  process.exitCode=2;
}
