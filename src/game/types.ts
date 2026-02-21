export type EnemyType = 'standard' | 'fast' | 'tank';
export type TowerType = 'standard' | 'slow' | 'aoe';

export interface Point {
  x: number;
  y: number;
}

export interface Enemy {
  id: string;
  type: EnemyType;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  reward: number;
  waypointIndex: number;
  slowTimer: number;
  distanceTraveled: number;
}

export interface Tower {
  id: string;
  type: TowerType;
  x: number;
  y: number;
  range: number;
  damage: number;
  cooldown: number;
  lastFired: number;
  level: number;
  cost: number;
  targetId?: string;
}

export interface Projectile {
  id: string;
  x: number;
  y: number;
  targetId: string;
  speed: number;
  damage: number;
  type: TowerType;
  aoeRadius?: number;
  level: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}
