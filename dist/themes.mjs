export const THEMES = Object.freeze({
  warm: { name: '暖日散步', description: '奶油色卡片，把小事慢慢收好。', color: '#f7f2e9' },
  adventure: { name: '双人冒险', description: '深色任务面板，和队友探索城市。', color: '#151e25' },
  story: { name: '叙事卡牌', description: '翻开城市故事，向左换卡、向右完成。', color: '#292c29' }
});
export const themeOf = state => Object.hasOwn(THEMES, state.theme) ? state.theme : 'warm';
export function setTheme(state, theme) {
  if (!Object.hasOwn(THEMES, theme)) throw Error('这款皮肤暂时不可用。');
  state.theme = theme;
}
export function themePicker(state) {
  return `<div class="theme-options" role="group" aria-label="选择界面皮肤">${Object.entries(THEMES).map(([id, theme]) => `<button type="button" class="theme-option" data-action="set-theme" data-theme-choice="${id}" aria-pressed="${themeOf(state) === id}"><span class="theme-preview preview-${id}" aria-hidden="true"><span class="preview-heading">${id === 'warm' ? '一起走走' : id === 'story' ? '城市故事 / 01' : 'QUEST / 02'}</span><span class="preview-card">${id === 'warm' ? '发现一件小事' : id === 'story' ? '下一张，遇见你' : '开启城市任务'}<span class="preview-bar"></span></span><span class="preview-steps">${id === 'warm' ? '● ○ ○ ○' : '◆ ◇ ◇ ◇'}</span></span><span class="theme-option-title">${theme.name}<span class="theme-selected" data-theme-status="${id}">${themeOf(state) === id ? '使用中' : '选择'}</span></span><span class="theme-description">${theme.description}</span></button>`).join('')}</div>`;
}
