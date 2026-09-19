export const THEMES = Object.freeze({
  adventure: { name: '双人冒险', description: '城市探索', color: '#fff8e9' },
  warm: { name: '暖日散步', description: '暂未开放', color: '#f7f2e9', locked: true }
});
export const themeOf = () => 'adventure';
export function setTheme(state, theme) {
  if(theme !== 'adventure') throw Error('这款皮肤暂时不可用。');
  state.theme = theme;
}
export function restoreTheme(state, theme) {
  if(theme !== undefined && !['adventure','warm','story'].includes(theme)) throw Error('备份的皮肤设置无效。');
  state.theme = 'adventure';
}
export function themePicker() {
  return `<div class="theme-options" role="group" aria-label="主题"><button type="button" class="theme-option" aria-pressed="true" data-action="set-theme" data-theme-choice="adventure"><span class="theme-option-title">双人冒险 <span class="theme-selected">使用中</span></span></button><button type="button" class="theme-option" disabled aria-disabled="true"><span class="theme-option-title">暖日散步</span><span class="theme-description">暂未开放</span></button></div>`;
}
