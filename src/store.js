const KEY='land-intelligence-demo-v1';
export const freshState=()=>({version:1,office:'all',registrationDecisions:{},riskDecisions:{},surveyChecks:[],scheduling:null,activities:[],capacityExtra:0});
export function createStore(storage){let state=freshState();try{const saved=JSON.parse(storage?.getItem(KEY)||'null');if(saved?.version===1)state={...state,...saved,registrationDecisions:saved.registrationDecisions||{},riskDecisions:saved.riskDecisions||{},surveyChecks:Array.isArray(saved.surveyChecks)?saved.surveyChecks:[],activities:Array.isArray(saved.activities)?saved.activities:[]};}catch{/* Memory-only demonstration remains available. */}
 const persist=()=>{try{storage?.setItem(KEY,JSON.stringify(state));}catch{/* Storage is optional. */}};
 return{get:()=>state,update:(partial)=>{state={...state,...partial};persist();return state;},record:(type,title,detail)=>{state.activities=[{id:Date.now().toString(36)+Math.random().toString(36).slice(2,6),type,title,detail,time:new Date().toISOString()},...state.activities].slice(0,40);persist();},reset:()=>{state=freshState();persist();return state;}};
}
