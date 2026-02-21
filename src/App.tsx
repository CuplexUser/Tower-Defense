/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './game/Engine';
import { Renderer } from './game/Renderer';
import { TowerType } from './game/types';
import { TOWER_STATS, CANVAS_WIDTH, CANVAS_HEIGHT, TOWER_SIZE } from './game/constants';
import { Coins, Heart, ShieldAlert, Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const rendererRef = useRef<Renderer | null>(null);
  const requestRef = useRef<number>();
  
  const [money, setMoney] = useState(0);
  const [lives, setLives] = useState(0);
  const [wave, setWave] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedTower, setSelectedTower] = useState<TowerType | null>(null);
  const [waveActive, setWaveActive] = useState(false);
  const [waveDelay, setWaveDelay] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [selectedTowerId, setSelectedTowerId] = useState<string | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const engine = new GameEngine();
    const renderer = new Renderer(canvasRef.current, engine);
    
    engineRef.current = engine;
    rendererRef.current = renderer;
    
    engine.onStateChange = () => {
      setMoney(Math.floor(engine.money));
      setLives(engine.lives);
      setWave(engine.wave);
      setWaveActive(engine.isWaveActive());
      setWaveDelay(Math.ceil(engine.getWaveDelayTimer() / 1000));
      setSelectedTowerId(engine.selectedTowerId);
    };
    
    engine.onGameOver = () => {
      setIsGameOver(true);
    };
    
    const loop = (time: number) => {
      engine.update(time);
      renderer.draw();
      requestRef.current = requestAnimationFrame(loop);
    };
    
    requestRef.current = requestAnimationFrame(loop);
    
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!rendererRef.current || !canvasRef.current || !engineRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    rendererRef.current.hoverX = x;
    rendererRef.current.hoverY = y;

    // Check if hovering over a tower
    let hoveredId: string | null = null;
    for (const tower of engineRef.current.towers) {
      if (Math.hypot(tower.x - x, tower.y - y) < TOWER_SIZE) {
        hoveredId = tower.id;
        break;
      }
    }
    engineRef.current.hoveredTowerId = hoveredId;
  };

  const handleCanvasMouseLeave = () => {
    if (!rendererRef.current || !engineRef.current) return;
    rendererRef.current.hoverX = -1;
    rendererRef.current.hoverY = -1;
    engineRef.current.hoveredTowerId = null;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!engineRef.current || !rendererRef.current || isGameOver || isPaused) return;
    
    const rect = canvasRef.current!.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    if (selectedTower) {
      if (engineRef.current.placeTower(selectedTower, x, y)) {
        setSelectedTower(null);
        rendererRef.current.selectedTowerType = null;
      }
    } else {
      // Try to select a tower
      let found = false;
      for (const tower of engineRef.current.towers) {
        if (Math.hypot(tower.x - x, tower.y - y) < TOWER_SIZE) {
          engineRef.current.selectedTowerId = tower.id;
          found = true;
          break;
        }
      }
      if (!found) {
        engineRef.current.selectedTowerId = null;
      }
    }
  };

  const upgradeSelectedTower = () => {
    if (engineRef.current && engineRef.current.selectedTowerId) {
      engineRef.current.upgradeTower(engineRef.current.selectedTowerId);
    }
  };

  const sellSelectedTower = () => {
    if (engineRef.current && engineRef.current.selectedTowerId) {
      engineRef.current.sellTower(engineRef.current.selectedTowerId);
    }
  };

  const selectTower = (type: TowerType) => {
    if (selectedTower === type) {
      setSelectedTower(null);
      if (rendererRef.current) rendererRef.current.selectedTowerType = null;
    } else {
      setSelectedTower(type);
      if (rendererRef.current) rendererRef.current.selectedTowerType = type;
    }
  };

  const togglePause = () => {
    if (engineRef.current) {
      engineRef.current.isPaused = !engineRef.current.isPaused;
      setIsPaused(engineRef.current.isPaused);
    }
  };

  const toggleSound = () => {
    if (engineRef.current) {
      const newEnabled = !soundEnabled;
      setSoundEnabled(newEnabled);
      // @ts-ignore - accessing private but it's okay for this demo
      engineRef.current.soundManager.setEnabled(newEnabled);
    }
  };

  const restartGame = () => {
    if (engineRef.current) {
      const newEngine = new GameEngine();
      newEngine.onStateChange = engineRef.current.onStateChange;
      newEngine.onGameOver = engineRef.current.onGameOver;
      // @ts-ignore
      newEngine.soundManager.setEnabled(soundEnabled);
      engineRef.current = newEngine;
      if (rendererRef.current) rendererRef.current['engine'] = newEngine;
      setIsGameOver(false);
      setIsPaused(false);
      setSelectedTower(null);
      if (rendererRef.current) rendererRef.current.selectedTowerType = null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col items-center justify-center p-4">
      <div className="max-w-6xl w-full flex flex-col lg:flex-row gap-8">
        
        {/* Main Game Area */}
        <div className="flex-1 flex flex-col gap-6">
          {/* HUD */}
          <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl p-5 flex items-center justify-between shadow-2xl border border-white/5">
            <div className="flex items-center gap-8">
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Currency</span>
                <div className="flex items-center gap-2 text-emerald-400 font-black text-2xl">
                  <Coins size={22} />
                  <span>{money}</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Integrity</span>
                <div className="flex items-center gap-2 text-rose-400 font-black text-2xl">
                  <Heart size={22} />
                  <span>{lives}</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Progress</span>
                <div className="flex items-center gap-2 text-blue-400 font-black text-2xl">
                  <ShieldAlert size={22} />
                  <span>Wave {wave}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {!waveActive && waveDelay > 0 && (
                <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400 text-sm font-bold animate-pulse">
                  WAVE START IN {waveDelay}S
                </div>
              )}
              <button 
                onClick={toggleSound}
                className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition-all active:scale-90"
                title={soundEnabled ? "Mute" : "Unmute"}
              >
                {soundEnabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
              </button>
              <button 
                onClick={togglePause}
                className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition-all active:scale-90"
                title={isPaused ? "Resume" : "Pause"}
              >
                {isPaused ? <Play size={20} /> : <Pause size={20} />}
              </button>
              <button 
                onClick={restartGame}
                className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 transition-all active:scale-90 text-rose-400"
                title="Restart"
              >
                <RotateCcw size={20} />
              </button>
            </div>
          </div>

          {/* Canvas Container */}
          <div className="relative rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border-8 border-slate-900 bg-slate-950 aspect-[4/3] w-full max-w-[800px] mx-auto group">
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className={`w-full h-full object-contain transition-all duration-500 ${selectedTower ? 'cursor-crosshair' : 'cursor-default'}`}
              onMouseMove={handleCanvasMouseMove}
              onMouseLeave={handleCanvasMouseLeave}
              onClick={handleCanvasClick}
            />
            
            {/* Game Over Overlay */}
            {isGameOver && (
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-center z-20 p-12 text-center">
                <div className="w-24 h-24 bg-rose-500/20 rounded-full flex items-center justify-center mb-6 border border-rose-500/30">
                  <ShieldAlert size={48} className="text-rose-500" />
                </div>
                <h2 className="text-6xl font-black text-white mb-2 tracking-tighter">DEFENSE BREACHED</h2>
                <p className="text-xl text-slate-400 mb-10 max-w-md">The perimeter has been compromised. You held the line until Wave {wave}.</p>
                <button 
                  onClick={restartGame}
                  className="px-10 py-5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-black text-xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                >
                  REBOOT SYSTEM
                </button>
              </div>
            )}
            
            {/* Paused Overlay */}
            {isPaused && !isGameOver && (
              <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm flex items-center justify-center z-10">
                <div className="px-10 py-5 bg-slate-900/80 rounded-3xl border border-white/10 shadow-2xl">
                  <h2 className="text-3xl font-black text-white tracking-[0.3em]">SYSTEM PAUSED</h2>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar / Shop */}
        <div className="w-full lg:w-96 flex flex-col gap-6">
          {/* Selected Tower Info */}
          {selectedTowerId && (
            <div className="bg-blue-600 rounded-[2rem] p-8 shadow-2xl border border-white/10 animate-in fade-in slide-in-from-right-4 duration-300">
              {(() => {
                const tower = engineRef.current!.towers.find(t => t.id === selectedTowerId);
                if (!tower) return null;
                const stats = TOWER_STATS[tower.type];
                const upgradeCost = engineRef.current!.getUpgradeCost(tower);
                const canAfford = money >= upgradeCost;

                return (
                  <>
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h2 className="text-2xl font-black text-white tracking-tight">{stats.name.toUpperCase()}</h2>
                        <span className="text-xs font-bold text-blue-200 uppercase tracking-widest">Level {tower.level}</span>
                      </div>
                      <button 
                        onClick={() => { if(engineRef.current) engineRef.current.selectedTowerId = null; setSelectedTowerId(null); }}
                        className="text-white/50 hover:text-white transition-colors"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mb-8">
                      <div className="bg-white/10 rounded-xl p-3">
                        <span className="text-[8px] uppercase text-blue-200 font-bold block mb-1">Power</span>
                        <span className="text-sm font-black text-white">{tower.damage}</span>
                      </div>
                      <div className="bg-white/10 rounded-xl p-3">
                        <span className="text-[8px] uppercase text-blue-200 font-bold block mb-1">Range</span>
                        <span className="text-sm font-black text-white">{tower.range}</span>
                      </div>
                      <div className="bg-white/10 rounded-xl p-3">
                        <span className="text-[8px] uppercase text-blue-200 font-bold block mb-1">Rate</span>
                        <span className="text-sm font-black text-white">{(1000/tower.cooldown).toFixed(1)}/s</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <button
                        onClick={upgradeSelectedTower}
                        disabled={!canAfford}
                        className={`
                          w-full py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2
                          ${canAfford 
                            ? 'bg-white text-blue-600 hover:scale-[1.02] active:scale-95 shadow-lg' 
                            : 'bg-white/20 text-white/40 cursor-not-allowed'}
                        `}
                      >
                        UPGRADE (${upgradeCost})
                      </button>
                      <button
                        onClick={sellSelectedTower}
                        className="w-full py-3 rounded-2xl font-bold text-xs text-white/70 hover:text-white hover:bg-white/10 transition-all"
                      >
                        DISMANTLE
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          <div className="bg-slate-900/80 backdrop-blur-md rounded-[2rem] p-8 shadow-2xl border border-white/5 h-full flex flex-col">
            <div className="mb-8">
              <h2 className="text-2xl font-black text-white mb-2 tracking-tight">ARSENAL</h2>
              <p className="text-sm text-slate-500 font-medium">Deploy tactical units to secure the path.</p>
            </div>
            
            <div className="flex flex-col gap-5 flex-1">
              {(Object.entries(TOWER_STATS) as [TowerType, typeof TOWER_STATS[TowerType]][]).map(([type, stats]) => {
                const canAfford = money >= stats.cost;
                const isSelected = selectedTower === type;
                
                return (
                  <button
                    key={type}
                    onClick={() => selectTower(type)}
                    disabled={!canAfford && !isSelected}
                    className={`
                      relative p-5 rounded-2xl border-2 text-left transition-all duration-300 group/btn
                      ${isSelected 
                        ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_30px_rgba(59,130,246,0.2)]' 
                        : canAfford 
                          ? 'border-slate-800 bg-slate-800/40 hover:border-slate-700 hover:bg-slate-800' 
                          : 'border-slate-900 bg-slate-900/40 opacity-40 cursor-not-allowed'
                      }
                    `}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-5 h-5 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] border-2 border-white/20" 
                          style={{ backgroundColor: stats.color }}
                        />
                        <span className="font-black text-lg text-slate-100 tracking-tight">{stats.name.toUpperCase()}</span>
                      </div>
                      <div className={`px-3 py-1 rounded-lg font-mono font-black text-sm ${canAfford ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        ${stats.cost}
                      </div>
                    </div>
                    
                    <p className="text-xs text-slate-400 mb-4 font-medium leading-relaxed">{stats.description}</p>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div className="flex flex-col">
                        <span className="text-[8px] uppercase text-slate-600 font-bold mb-0.5">Power</span>
                        <span className="text-xs font-black text-slate-300">{stats.damage}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] uppercase text-slate-600 font-bold mb-0.5">Range</span>
                        <span className="text-xs font-black text-slate-300">{stats.range}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[8px] uppercase text-slate-600 font-bold mb-0.5">Rate</span>
                        <span className="text-xs font-black text-slate-300">{(1000/stats.cooldown).toFixed(1)}/s</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            
            <div className="mt-10 p-6 bg-slate-950/50 rounded-2xl border border-white/5">
              <h3 className="text-[10px] font-black text-slate-500 mb-4 uppercase tracking-[0.2em]">Tactical Briefing</h3>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-1 h-1 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <p className="text-[11px] text-slate-400 leading-relaxed">Hover over deployed units to check their engagement radius.</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-1 h-1 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <p className="text-[11px] text-slate-400 leading-relaxed">Frost units are critical for slowing down fast-moving threats.</p>
                </div>
                <div className="flex gap-3">
                  <div className="w-1 h-1 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                  <p className="text-[11px] text-slate-400 leading-relaxed">Cannon units provide area suppression against dense clusters.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
