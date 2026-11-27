export const offices=[
{id:'north',name:'สำนักงานสาธิต A',region:'พื้นที่เหนือ',x:390,y:130,backlog:42,demand:10,capacity:12},
{id:'central',name:'สำนักงานสาธิต B',region:'พื้นที่กลาง',x:285,y:228,backlog:35,demand:8,capacity:10},
{id:'east',name:'สำนักงานสาธิต C',region:'พื้นที่ตะวันออก',x:515,y:240,backlog:28,demand:7,capacity:8},
{id:'south',name:'สำนักงานสาธิต D',region:'พื้นที่ใต้',x:370,y:360,backlog:15,demand:5,capacity:6}
];
export function queueProjection({backlog,demand,capacity,days=20}){for(const x of [backlog,demand,capacity,days])if(!Number.isFinite(x)||x<0)throw new RangeError('Non-negative finite inputs required');const net=capacity-demand;return{net,clearDays:backlog===0?0:net>0?Math.ceil(backlog/net):null,points:Array.from({length:days+1},(_,i)=>Math.max(0,backlog-net*i))};}
export function officeTotals(id='all'){return offices.filter(o=>id==='all'||o.id===id).reduce((sum,o)=>({backlog:sum.backlog+o.backlog,demand:sum.demand+o.demand,capacity:sum.capacity+o.capacity}),{backlog:0,demand:0,capacity:0});}
