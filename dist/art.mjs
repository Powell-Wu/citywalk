// Use task meaning, not random art, so a card keeps its illustration after reload.
export function cardArt(card){
 if(card.type==='talk')return {src:'art-talk.webp',alt:'两位探险者在树荫长椅上交谈'};
 const text=card.text||'';
 if(/店|吃|喝|食|餐|甜|饮|买/.test(text))return {src:'art-shop.webp',alt:'两人在街角小店尝试新鲜事物'};
 if(/声音|细节|招牌|颜色|拍|照|手机|记录/.test(text))return {src:'art-discover.webp',alt:'两人通过城市终端发现隐藏线索'};
 if(/猜|故事|旧|寻找|观察|路人|NPC/.test(text))return {src:'art-track.webp',alt:'两人在小巷追踪发光足迹'};
 if(card.type==='event')return {src:'art-challenge.webp',alt:'两人发现问号砖与隐藏通道'};
 return {src:'art-explore.webp',alt:'两人开启街角的符文入口'};
}
