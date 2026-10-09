import {mount} from 'svelte';
import App from './App.svelte';
import './styles/base.css';
import './styles/theme.css';
import './styles/motion.css';
import './styles/accessibility.css';
const target=document.getElementById('app')!;
target.replaceChildren();
mount(App,{target});
