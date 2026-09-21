// Built-in tasks are curated individually; custom tasks use a conservative fallback.
export const ART={
 explore:{src:'art-explore.webp',alt:'两人开启街角的符文入口'},
 challenge:{src:'art-challenge.webp',alt:'两人发现问号砖与隐藏通道'},
 discover:{src:'art-discover.webp',alt:'两人通过城市终端发现隐藏线索'},
 track:{src:'art-track.webp',alt:'两人在小巷追踪发光足迹'},
 talk:{src:'art-talk.webp',alt:'两位探险者在树荫长椅上交谈'},
 shop:{src:'art-shop.webp',alt:'两人在街角小店尝试新鲜事物'},
 photo:{src:'art-photo.webp',alt:'两人用手机发现建筑上的笑脸线索'},
 sound:{src:'art-sound.webp',alt:'两人在城市中聆听声音，发现音符线索'},
 cooperate:{src:'art-cooperate.webp',alt:'两人用动作与对话完成双人挑战'}
};
const scene=['explore','shop','talk','shop','track','track','explore','track','discover','explore','discover','discover','explore','sound','track','challenge'];
const talk=Array(16).fill('talk');
const event=['cooperate','cooperate','shop','photo','shop','shop','shop','challenge','cooperate','shop','shop','cooperate','challenge','photo','sound','cooperate'];
export const TASK_ART=Object.fromEntries(Object.entries({scene,talk,event}).flatMap(([type,list])=>list.map((art,i)=>[`${type}-${String(i+1).padStart(2,'0')}`,art])));
export function cardArtKey(card){
 if(Object.hasOwn(TASK_ART,card.id))return TASK_ART[card.id];
 if(card.type==='talk')return 'talk';
 const text=card.text||'';
 if(/相机|拍照|照片|摄影|镜头/.test(text))return 'photo';
 if(/声音|听|歌|音乐|旋律/.test(text))return 'sound';
 if(/动作|轮流|一句话|胡说|不能说|合作|挑战/.test(text))return 'cooperate';
 if(/店|吃|喝|食|餐|甜|饮|买|送/.test(text))return 'shop';
 if(/带路|导航|方向|小路|路线/.test(text))return 'challenge';
 if(/细节|招牌|颜色|手机|记录/.test(text))return 'discover';
 if(/猜|故事|旧|路人|NPC/.test(text))return 'track';
 if(/坐|发呆|休息|聊天/.test(text))return 'talk';
 return card.type==='event'?'cooperate':'explore';
}
export function cardArt(card){return ART[cardArtKey(card)];}
