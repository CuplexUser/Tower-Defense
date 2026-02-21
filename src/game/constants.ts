import { Point, TowerType, EnemyType } from './types';

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;
export const PATH_WIDTH = 48;
export const TOWER_SIZE = 36;

export const WAYPOINTS: Point[] = [
  { x: -50, y: 100 },
  { x: 150, y: 100 },
  { x: 150, y: 300 },
  { x: 400, y: 300 },
  { x: 400, y: 100 },
  { x: 650, y: 100 },
  { x: 650, y: 500 },
  { x: 300, y: 500 },
  { x: 300, y: 400 },
  { x: -50, y: 400 },
];

export const COLORS = {
  grass: '#2d5a27',
  grassLight: '#3a7332',
  path: '#c2b280',
  pathBorder: '#a69568',
  standard: '#3b82f6',
  slow: '#8b5cf6',
  aoe: '#ef4444',
  enemyStandard: '#22c55e',
  enemyFast: '#eab308',
  enemyTank: '#64748b',
};

export const TOWER_STATS: Record<TowerType, { cost: number, range: number, damage: number, cooldown: number, color: string, name: string, description: string }> = {
  standard: { cost: 50, range: 140, damage: 25, cooldown: 800, color: '#3b82f6', name: 'Blaster', description: 'Good all-around damage. Upgrades increase power and fire rate.' },
  slow: { cost: 75, range: 120, damage: 10, cooldown: 1200, color: '#8b5cf6', name: 'Frost', description: 'Slows enemies down. Upgrades improve range and slow duration.' },
  aoe: { cost: 120, range: 100, damage: 20, cooldown: 1800, color: '#ef4444', name: 'Cannon', description: 'Deals splash damage. Upgrades significantly boost blast power.' },
};

export const ENEMY_STATS: Record<EnemyType, { hp: number, speed: number, reward: number, color: string, radius: number }> = {
  standard: { hp: 60, speed: 60, reward: 10, color: '#22c55e', radius: 14 },
  fast: { hp: 35, speed: 100, reward: 12, color: '#eab308', radius: 10 },
  tank: { hp: 200, speed: 35, reward: 25, color: '#64748b', radius: 18 },
};
