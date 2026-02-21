import { GameEngine } from './Engine';
import { WAYPOINTS, PATH_WIDTH, TOWER_SIZE, TOWER_STATS, ENEMY_STATS, CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './constants';
import { TowerType } from './types';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private engine: GameEngine;
  
  // For UI interaction
  hoverX: number = -1;
  hoverY: number = -1;
  selectedTowerType: TowerType | null = null;

  constructor(canvas: HTMLCanvasElement, engine: GameEngine) {
    this.ctx = canvas.getContext('2d')!;
    this.engine = engine;
  }

  draw() {
    this.drawBackground();
    this.drawPath();
    this.drawTowers();
    this.drawEnemies();
    this.drawProjectiles();
    this.drawParticles();
    this.drawPlacementPreview();
    this.drawTowerRange();
  }

  private drawBackground() {
    // Grass with subtle pattern
    const gradient = this.ctx.createRadialGradient(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, 0, CANVAS_WIDTH/2, CANVAS_HEIGHT/2, CANVAS_WIDTH);
    gradient.addColorStop(0, COLORS.grassLight);
    gradient.addColorStop(1, COLORS.grass);
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Subtle grass blades
    this.ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    this.ctx.lineWidth = 1;
    for (let i = 0; i < 200; i++) {
      const x = (i * 137.5) % CANVAS_WIDTH;
      const y = (i * 211.1) % CANVAS_HEIGHT;
      this.ctx.beginPath();
      this.ctx.moveTo(x, y);
      this.ctx.lineTo(x + 2, y - 4);
      this.ctx.stroke();
    }
  }

  private drawPath() {
    // Path shadow
    this.ctx.beginPath();
    this.ctx.moveTo(WAYPOINTS[0].x, WAYPOINTS[0].y);
    for (let i = 1; i < WAYPOINTS.length; i++) {
      this.ctx.lineTo(WAYPOINTS[i].x, WAYPOINTS[i].y);
    }
    this.ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    this.ctx.lineWidth = PATH_WIDTH + 8;
    this.ctx.lineCap = 'round';
    this.ctx.lineJoin = 'round';
    this.ctx.stroke();

    // Main path
    this.ctx.strokeStyle = COLORS.path;
    this.ctx.lineWidth = PATH_WIDTH;
    this.ctx.stroke();

    // Path texture (cracks/stones)
    this.ctx.strokeStyle = COLORS.pathBorder;
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 15]);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  private drawTowers() {
    for (const tower of this.engine.towers) {
      const stats = TOWER_STATS[tower.type];
      
      // Base shadow
      this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
      this.ctx.beginPath();
      this.ctx.arc(tower.x + 4, tower.y + 4, TOWER_SIZE, 0, Math.PI * 2);
      this.ctx.fill();

      // Base
      const baseGradient = this.ctx.createLinearGradient(tower.x - TOWER_SIZE, tower.y - TOWER_SIZE, tower.x + TOWER_SIZE, tower.y + TOWER_SIZE);
      baseGradient.addColorStop(0, '#475569');
      baseGradient.addColorStop(1, '#1e293b');
      this.ctx.fillStyle = baseGradient;
      this.ctx.beginPath();
      this.ctx.arc(tower.x, tower.y, TOWER_SIZE, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Inner color ring
      this.ctx.strokeStyle = stats.color;
      this.ctx.lineWidth = 4;
      this.ctx.beginPath();
      this.ctx.arc(tower.x, tower.y, TOWER_SIZE * 0.75, 0, Math.PI * 2);
      this.ctx.stroke();
      
      // Turret
      const turretAngle = tower.targetId 
        ? Math.atan2(this.engine.enemies.find(e => e.id === tower.targetId)?.y! - tower.y, this.engine.enemies.find(e => e.id === tower.targetId)?.x! - tower.x)
        : 0;

      this.ctx.save();
      this.ctx.translate(tower.x, tower.y);
      this.ctx.rotate(turretAngle);
      
      // Barrel
      this.ctx.fillStyle = '#0f172a';
      this.ctx.fillRect(0, -6, TOWER_SIZE * 1.1, 12);
      this.ctx.strokeStyle = stats.color;
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(0, -6, TOWER_SIZE * 1.1, 12);
      
      // Turret head
      this.ctx.fillStyle = '#1e293b';
      this.ctx.beginPath();
      this.ctx.arc(0, 0, TOWER_SIZE * 0.5, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
      
      this.ctx.restore();

      // Level indicator (stars/dots)
      if (tower.level > 1) {
        this.ctx.fillStyle = '#fbbf24'; // Gold
        for (let i = 0; i < tower.level - 1; i++) {
          const angle = (i * 0.4) - ((tower.level - 2) * 0.2) - Math.PI/2;
          const rx = tower.x + Math.cos(angle) * (TOWER_SIZE * 0.8);
          const ry = tower.y + Math.sin(angle) * (TOWER_SIZE * 0.8);
          this.ctx.beginPath();
          this.ctx.arc(rx, ry, 3, 0, Math.PI * 2);
          this.ctx.fill();
        }
      }
    }
  }

  private drawEnemies() {
    for (const enemy of this.engine.enemies) {
      const stats = ENEMY_STATS[enemy.type];
      
      // Shadow
      this.ctx.fillStyle = 'rgba(0,0,0,0.2)';
      this.ctx.beginPath();
      this.ctx.arc(enemy.x + 4, enemy.y + 4, stats.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Body gradient
      const gradient = this.ctx.createRadialGradient(enemy.x - stats.radius/3, enemy.y - stats.radius/3, 0, enemy.x, enemy.y, stats.radius);
      gradient.addColorStop(0, stats.color);
      gradient.addColorStop(1, '#000');
      
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(enemy.x, enemy.y, stats.radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      
      // Eyes for cartoon look
      this.ctx.fillStyle = 'white';
      this.ctx.beginPath();
      this.ctx.arc(enemy.x + stats.radius*0.3, enemy.y - stats.radius*0.2, stats.radius*0.2, 0, Math.PI*2);
      this.ctx.arc(enemy.x - stats.radius*0.3, enemy.y - stats.radius*0.2, stats.radius*0.2, 0, Math.PI*2);
      this.ctx.fill();
      this.ctx.fillStyle = 'black';
      this.ctx.beginPath();
      this.ctx.arc(enemy.x + stats.radius*0.3, enemy.y - stats.radius*0.2, stats.radius*0.1, 0, Math.PI*2);
      this.ctx.arc(enemy.x - stats.radius*0.3, enemy.y - stats.radius*0.2, stats.radius*0.1, 0, Math.PI*2);
      this.ctx.fill();
      
      // Slow effect
      if (enemy.slowTimer > 0) {
        this.ctx.strokeStyle = '#8b5cf6';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(enemy.x, enemy.y, stats.radius + 4, 0, Math.PI * 2);
        this.ctx.stroke();
      }
      
      // Health bar
      const hpPercent = enemy.hp / enemy.maxHp;
      const barWidth = stats.radius * 2.5;
      this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
      this.ctx.fillRect(enemy.x - barWidth/2, enemy.y - stats.radius - 12, barWidth, 6);
      this.ctx.fillStyle = hpPercent > 0.5 ? '#22c55e' : hpPercent > 0.2 ? '#eab308' : '#ef4444';
      this.ctx.fillRect(enemy.x - barWidth/2 + 1, enemy.y - stats.radius - 11, (barWidth - 2) * hpPercent, 4);
    }
  }

  private drawProjectiles() {
    for (const proj of this.engine.projectiles) {
      const color = TOWER_STATS[proj.type].color;
      
      // Glow
      this.ctx.shadowBlur = 10;
      this.ctx.shadowColor = color;
      
      this.ctx.fillStyle = 'white';
      this.ctx.beginPath();
      this.ctx.arc(proj.x, proj.y, 4, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 2;
      this.ctx.stroke();
      
      this.ctx.shadowBlur = 0;
    }
  }

  private drawParticles() {
    for (const p of this.engine.particles) {
      this.ctx.fillStyle = p.color;
      this.ctx.globalAlpha = 1 - (p.life / p.maxLife);
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1;
  }

  private drawPlacementPreview() {
    if (!this.selectedTowerType || this.hoverX === -1 || this.hoverY === -1) return;
    
    const canPlace = this.engine.canPlaceTower(this.hoverX, this.hoverY);
    const stats = TOWER_STATS[this.selectedTowerType];
    
    // Range circle
    this.ctx.fillStyle = canPlace ? 'rgba(59, 130, 246, 0.15)' : 'rgba(239, 68, 68, 0.15)';
    this.ctx.beginPath();
    this.ctx.arc(this.hoverX, this.hoverY, stats.range, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.strokeStyle = canPlace ? 'rgba(59, 130, 246, 0.4)' : 'rgba(239, 68, 68, 0.4)';
    this.ctx.setLineDash([5, 5]);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
    
    // Tower preview
    this.ctx.globalAlpha = 0.6;
    this.ctx.fillStyle = '#334155';
    this.ctx.beginPath();
    this.ctx.arc(this.hoverX, this.hoverY, TOWER_SIZE, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.globalAlpha = 1;
  }

  private drawTowerRange() {
    // Show range for hovered or selected tower
    const activeTowerId = this.engine.hoveredTowerId || this.engine.selectedTowerId;
    
    if (activeTowerId) {
      const tower = this.engine.towers.find(t => t.id === activeTowerId);
      if (tower) {
        const isSelected = tower.id === this.engine.selectedTowerId;
        this.ctx.fillStyle = isSelected ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.05)';
        this.ctx.beginPath();
        this.ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = isSelected ? 'rgba(59, 130, 246, 0.4)' : 'rgba(255, 255, 255, 0.2)';
        this.ctx.setLineDash([10, 5]);
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
        this.ctx.setLineDash([]);
      }
    }
  }
}
