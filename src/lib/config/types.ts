export type CardType='scene'|'talk'|'event';
export type Mode='trial'|'short'|'half'|'free';
export type Place='both'|'indoor'|'outdoor';
export type ArtKey='explore'|'challenge'|'discover'|'track'|'talk'|'shop'|'photo'|'sound'|'cooperate';
export interface Card {id:string;type:CardType;text:string;note:string;minutes:number;cost:number;place:Place;source?:string;artKey?:ArtKey;duo?:{first:string;action:string;done:string}}
export interface Slot {id:string;type:CardType;points:number;status:'waiting'|'active'|'later'|'done'|'skipped';card:Card|null;completedAt:number|null;spent:number}
export type JourneyTheme='mixed'|'observe'|'duo';
export interface ThemePlan {id:string;name:string;opening:string;closing:string;recap:string;cards:Record<CardType,string[]>}
export interface Config {mode:Mode;journeyTheme:JourneyTheme;place:Place;budget:number;scoring:boolean;rewards:string[]}
export interface RuleSnapshot {id:string;sequence:CardType[];typePoints:Record<CardType,number>;trio:number;bonus:number;closing:number;target:number;thresholds:number[]}
export interface Journey extends Config {id:string;rules:RuleSnapshot;themePlan:ThemePlan|null;branch:'clues'|'sounds'|null;startedAt:number;pausedAt:number|null;pausedMs:number;endedAt:number|null;seen:string[];slots:Slot[];bonuses:{surprise:boolean;laugh:boolean};closing:boolean;name:string;memory:string}
export interface GameState {version:3;revision:number;theme:string;session:Journey|null;history:Journey[];customCards:Card[];disabled:string[];favorites:string[];preferences:Config;offlineReady:boolean;sound:boolean}
export type InteractionPhase='idle'|'saving'|'drawing'|'replacing'|'completing'|'reward';
export interface UIState {phase:InteractionPhase;focusSlot:string|null;libraryType:'all'|CardType;libraryFavorites:boolean;libraryCompleted:boolean;libraryDisabled:boolean;customEditor:boolean;offlineReady:boolean;storageError:string;schemaMessage:string;updateWaiting:boolean;updateChecking:boolean;updateMessage:string;swipeSeen?:boolean}
export interface Snapshot {state:GameState;ui:UIState;name:string;id?:string;ready:boolean;release:string}
