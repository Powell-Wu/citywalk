import {CARDS} from './cards.mjs';
const compact={
 'scene-09':['你描述细节 → 对方找 → 交换','各找到一个新细节'],
 'scene-12':['你选颜色 → 对方先找 → 交替三件','共同找到三件同色物品'],
 'scene-14':['站定听十秒 → 轮流分享','一起说出三种声音'],
 'talk-09':['各想三个镜头 → 轮流揭晓','共同选定一个镜头'],
 'talk-10':['轮流分享 → 听听对方的版本','每人分享一个具体瞬间'],
 'talk-12':['你分享小开心 → 对方追问 → 交换','各说一件事，听完对方'],
 'talk-13':['你选一刻 → 对方写寄语 → 交换','共同选定一句寄语'],
 'event-09':['你开头 → 对方接一句 → 交替','接故事三分钟，共同收尾'],
 'event-13':['少带路的人选方向 → 一起走','走五分钟，交换新发现'],
 'event-14':['你给笑脸线索 → 对方找 → 交换','各找到一个物品上的笑脸'],
 'event-15':['各为对方选歌 → 轮流说理由','各说一首歌和选择理由'],
 'event-16':['你给三个词 → 对方连一句 → 交换','各出一次题，说一句话']
};
export function taskInstructions(card,journey){
 return journey?.themePlan?.tasks?.[card.id]||card.duo||{
  first:'拿手机的人',action:card.id==='scene-03'?'一起选位置 → 安静休息两分钟':'你先尝试 → 对方接着做 → 交换感受',
  done:card.id==='scene-03'?'两人都休息了两分钟':'两人都完成卡上的任务'
 };
}
export function taskBrief(card,journey){
 const rule=taskInstructions(card,journey);
 const original=CARDS.find(item=>item.id===card.id)?.duo;
 if(journey?.themePlan?.tasks?.[card.id]||!card.duo||!compact[card.id]||!original||['first','action','done'].some(field=>original[field]!==card.duo[field]))return rule;
 return{first:rule.first,action:compact[card.id][0],done:compact[card.id][1]};
}
