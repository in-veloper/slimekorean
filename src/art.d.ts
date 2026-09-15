import { ComponentType } from 'react';

export interface SlimeProps {
  hat?: string;
  color?: string;
  mood?: 'calm' | 'happy' | 'oops';
  size?: number;
}
export function Slime(props: SlimeProps): JSX.Element;
export function MiniSlime(props: { fill?: string; size?: number; faded?: boolean }): JSX.Element;
export function Crown(props: { size?: number }): JSX.Element;
export function Back(props: { size?: number; color?: string }): JSX.Element;
export function Pencil(props: { size?: number; color?: string }): JSX.Element;
export function Check(props: { size?: number; color?: string }): JSX.Element;
export function Erase(props: { size?: number; color?: string }): JSX.Element;
export function Speaker(props: { on?: boolean; size?: number }): JSX.Element;

export const HATS: Record<string, { n: string; Draw: ComponentType<any> }>;
export const HAT_IDS: string[];

export interface StickerDef {
  id: string;
  n: string;
  tier: 1 | 2 | 3;
  Draw: ComponentType<{ size?: number }>;
}
export const STICKERS: StickerDef[];
export const TIERS: Record<number, string>;
