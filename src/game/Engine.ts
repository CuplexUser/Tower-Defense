import { Enemy, Tower, Projectile, Particle, Point, TowerType, EnemyType } from './types';
import { WAYPOINTS, TOWER_STATS, ENEMY_STATS, PATH_WIDTH, TOWER_SIZE, CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';
import { SoundManager } from './SoundManager';

export class GameEngine {
  money: number = 250;
  lives: number = 20;
  wave: number = 1;
  enemies: Enemy[] = [];
  towers: Tower[] = [];
  projectiles: Projectile[] = [];
  particles: Particle[] = [];
  
  isGameOver: boolean = false;
  isPaused: boolean = false;
  hoveredTowerId: string | null = null;
  selectedTowerId: string | null = null;
  
  private lastTime: number = 0;
  private spawnTimer: number = 0;
  private enemiesToSpawn: EnemyType[] = [];
  private waveActive: boolean = false;
  private waveDelayTimer: number = 0;
  private soundManager: SoundManager;
  
  onGameOver?: () => void;
  onStateChange?: () => void;

  constructor() {
    this.soundManager = new SoundManager();
    this.prepareWave();
  }

  getUpgradeCost(tower: Tower): number {
    return Math.floor(TOWER_STATS[tower.type].cost * (tower.level + 0.5));
  }

  upgradeTower(towerId: string): boolean {
    const tower = this.towers.find(t => t.id === towerId);
    if (!tower) return false;
    
    const cost = this.getUpgradeCost(tower);
    if (this.money >= cost) {
      this.money -= cost;
      tower.level++;
      
      // Stat boosts
      tower.damage = Math.floor(tower.damage * 1.4);
      tower.range = Math.floor(tower.range * 1.1);
      tower.cooldown = Math.max(150, Math.floor(tower.cooldown * 0.85));
      
      this.soundManager.playWaveStart(); // Use wave start sound as a placeholder for upgrade success
      return true;
    }
    return false;
  }

  sellTower(towerId: string): boolean {
    const index = this.towers.findIndex(t => t.id === towerId);
    if (index === -1) return false;
    
    const tower = this.towers[index];
    const sellValue = Math.floor(tower.cost * 0.7) + (tower.level - 1) * 20;
    this.money += sellValue;
    this.towers.splice(index, 1);
    if (this.selectedTowerId === towerId) this.selectedTowerId = null;
    return true;
  }

  prepareWave() {
    this.waveActive = false;
    this.waveDelayTimer = 5000; // 5 seconds between waves
    this.enemiesToSpawn = [];
    
    // Calculate enemies for this wave
    const count = 5 + Math.floor(this.wave * 2.5);
    for (let i = 0; i < count; i++) {
      const rand = Math.random();
      if (this.wave >= 3 && rand < 0.2 + (this.wave * 0.02)) {
        this.enemiesToSpawn.push('tank');
      } else if (this.wave >= 2 && rand < 0.4 + (this.wave * 0.02)) {
        this.enemiesToSpawn.push('fast');
      } else {
        this.enemiesToSpawn.push('standard');
      }
    }
  }

  update(time: number) {
    if (this.isGameOver || this.isPaused) {
      this.lastTime = time;
      return;
    }
    
    if (this.lastTime === 0) this.lastTime = time;
    const dt = time - this.lastTime;
    this.lastTime = time;
    
    if (!this.waveActive) {
      this.waveDelayTimer -= dt;
      if (this.waveDelayTimer <= 0) {
        this.waveActive = true;
        this.spawnTimer = 0;
        this.soundManager.playWaveStart();
      }
    } else {
      this.updateSpawns(dt);
    }
    
    this.updateEnemies(dt);
    this.updateTowers(dt);
    this.updateProjectiles(dt);
    this.updateParticles(dt);
    
    if (this.waveActive && this.enemies.length === 0 && this.enemiesToSpawn.length === 0) {
      this.wave++;
      this.money += 50 + this.wave * 10; // Wave clear bonus
      this.prepareWave();
    }
    
    if (this.lives <= 0 && !this.isGameOver) {
      this.isGameOver = true;
      if (this.onGameOver) this.onGameOver();
    }
    
    if (this.onStateChange) this.onStateChange();
  }

  private updateSpawns(dt: number) {
    if (this.enemiesToSpawn.length === 0) return;
    
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      const type = this.enemiesToSpawn.shift()!;
      const stats = ENEMY_STATS[type];
      // Scale HP with wave
      const hpMultiplier = 1 + (this.wave - 1) * 0.2;
      
      this.enemies.push({
        id: Math.random().toString(36).substr(2, 9),
        type,
        x: WAYPOINTS[0].x,
        y: WAYPOINTS[0].y,
        hp: stats.hp * hpMultiplier,
        maxHp: stats.hp * hpMultiplier,
        speed: stats.speed,
        reward: stats.reward,
        waypointIndex: 1,
        slowTimer: 0,
        distanceTraveled: 0
      });
      
      this.spawnTimer = 1000 - Math.min(this.wave * 20, 600); // Spawn faster in later waves
    }
  }

  private updateEnemies(dt: number) {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      
      // Handle slow effect
      let currentSpeed = enemy.speed;
      if (enemy.slowTimer > 0) {
        enemy.slowTimer -= dt;
        currentSpeed *= 0.5; // 50% slow
      }
      
      const target = WAYPOINTS[enemy.waypointIndex];
      const dx = target.x - enemy.x;
      const dy = target.y - enemy.y;
      const dist = Math.hypot(dx, dy);
      
      const moveDist = (currentSpeed * dt) / 1000;
      
      if (dist <= moveDist) {
        enemy.x = target.x;
        enemy.y = target.y;
        enemy.distanceTraveled += dist;
        enemy.waypointIndex++;
        
        if (enemy.waypointIndex >= WAYPOINTS.length) {
          this.lives--;
          this.enemies.splice(i, 1);
        }
      } else {
        enemy.x += (dx / dist) * moveDist;
        enemy.y += (dy / dist) * moveDist;
        enemy.distanceTraveled += moveDist;
      }
    }
  }

  private updateTowers(dt: number) {
    const now = performance.now();
    for (const tower of this.towers) {
      if (now - tower.lastFired >= tower.cooldown) {
        // Find target
        let bestTarget: Enemy | null = null;
        let maxDist = -1;
        
        for (const enemy of this.enemies) {
          const distToTower = Math.hypot(enemy.x - tower.x, enemy.y - tower.y);
          if (distToTower <= tower.range) {
            // Target enemy furthest along the path
            if (enemy.distanceTraveled > maxDist) {
              maxDist = enemy.distanceTraveled;
              bestTarget = enemy;
            }
          }
        }
        
        if (bestTarget) {
          tower.lastFired = now;
          tower.targetId = bestTarget.id;
          this.soundManager.playShoot(tower.type);
          
          this.projectiles.push({
            id: Math.random().toString(36).substr(2, 9),
            x: tower.x,
            y: tower.y,
            targetId: bestTarget.id,
            speed: 300,
            damage: tower.damage,
            type: tower.type,
            aoeRadius: tower.type === 'aoe' ? 60 + (tower.level - 1) * 10 : undefined,
            level: tower.level
          });
        } else {
          tower.targetId = undefined;
        }
      }
    }
  }

  private updateProjectiles(dt: number) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      const target = this.enemies.find(e => e.id === proj.targetId);
      
      if (!target) {
        this.projectiles.splice(i, 1);
        continue;
      }
      
      const dx = target.x - proj.x;
      const dy = target.y - proj.y;
      const dist = Math.hypot(dx, dy);
      const moveDist = (proj.speed * dt) / 1000;
      
      if (dist <= moveDist) {
        // Hit
        this.handleHit(proj, target);
        this.projectiles.splice(i, 1);
      } else {
        proj.x += (dx / dist) * moveDist;
        proj.y += (dy / dist) * moveDist;
      }
    }
  }

  private handleHit(proj: Projectile, target: Enemy) {
    this.soundManager.playHit();
    if (proj.type === 'aoe') {
      this.createExplosion(target.x, target.y, proj.aoeRadius!, '#ef4444');
      for (let i = this.enemies.length - 1; i >= 0; i--) {
        const e = this.enemies[i];
        if (Math.hypot(e.x - target.x, e.y - target.y) <= proj.aoeRadius!) {
          this.damageEnemy(e, proj.damage, proj.type, i, proj.level);
        }
      }
    } else {
      this.createParticles(target.x, target.y, TOWER_STATS[proj.type].color);
      this.damageEnemy(target, proj.damage, proj.type, this.enemies.indexOf(target), proj.level);
    }
  }

  private damageEnemy(enemy: Enemy, damage: number, type: TowerType, index: number, level: number = 1) {
    if (index === -1) return;
    
    enemy.hp -= damage;
    if (type === 'slow') {
      enemy.slowTimer = 2000 + (level - 1) * 500; // Increase slow duration with level
    }
    
    if (enemy.hp <= 0) {
      this.money += enemy.reward;
      this.soundManager.playDeath();
      this.createParticles(enemy.x, enemy.y, ENEMY_STATS[enemy.type].color, 15);
      this.enemies.splice(index, 1);
    }
  }

  private createParticles(x: number, y: number, color: string, count: number = 5) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 50 + 20;
      this.particles.push({
        id: Math.random().toString(36).substr(2, 9),
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: Math.random() * 300 + 200,
        color,
        size: Math.random() * 3 + 2
      });
    }
  }

  private createExplosion(x: number, y: number, radius: number, color: string) {
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 100 + 50;
      this.particles.push({
        id: Math.random().toString(36).substr(2, 9),
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
        maxLife: 400,
        color,
        size: Math.random() * 4 + 2
      });
    }
  }

  private updateParticles(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += dt;
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      } else {
        p.x += (p.vx * dt) / 1000;
        p.y += (p.vy * dt) / 1000;
        p.size *= 0.95; // shrink
      }
    }
  }

  canPlaceTower(x: number, y: number): boolean {
    // Check bounds
    if (x < TOWER_SIZE || x > CANVAS_WIDTH - TOWER_SIZE || y < TOWER_SIZE || y > CANVAS_HEIGHT - TOWER_SIZE) return false;
    
    // Check overlap with other towers
    for (const t of this.towers) {
      if (Math.hypot(t.x - x, t.y - y) < TOWER_SIZE * 2) return false;
    }
    
    // Check overlap with path
    for (let i = 0; i < WAYPOINTS.length - 1; i++) {
      const p1 = WAYPOINTS[i];
      const p2 = WAYPOINTS[i+1];
      
      const dist = this.distToSegment(x, y, p1.x, p1.y, p2.x, p2.y);
      if (dist < PATH_WIDTH / 2 + TOWER_SIZE) return false;
    }
    
    return true;
  }

  placeTower(type: TowerType, x: number, y: number): boolean {
    const stats = TOWER_STATS[type];
    if (this.money >= stats.cost && this.canPlaceTower(x, y)) {
      this.money -= stats.cost;
      this.towers.push({
        id: Math.random().toString(36).substr(2, 9),
        type,
        x, y,
        range: stats.range,
        damage: stats.damage,
        cooldown: stats.cooldown,
        lastFired: 0,
        level: 1,
        cost: stats.cost
      });
      return true;
    }
    return false;
  }

  private distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
    const l2 = (x1 - x2) ** 2 + (y1 - y2) ** 2;
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
  }
  
  getWaveDelayTimer() {
    return this.waveDelayTimer;
  }
  
  isWaveActive() {
    return this.waveActive;
  }
}
