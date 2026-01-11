import React, { useState, useEffect, useRef } from 'react';
import './App.css';


const PLATFORM_WIDTH = 130;
const PLATFORM_HEIGHT = 90;

export default function App() {
  
  const [gameState, setGameState] = useState('menu'); // menu, cutscene, playing, gameOver
  const [currentScene, setCurrentScene] = useState(0);
  const [gameOverMessage, setGameOverMessage] = useState('');
  const [platformY, setPlatformY] = useState(0);
  const [antPos, setAntPos] = useState({ x: 0, y: 0 });
  const [arrows, setArrows] = useState([]);
  const [enemies, setEnemies] = useState([]);

  const canvasRef = useRef(null);
  const gameStateRef = useRef({
    gameState: 'menu',
    currentScene: 0,
    platformY: 0,
    ant: { x: 0, y: 0 },
    arrows: [],
    enemies: [],
    gameOverMessage: '',
    running: false,
    inCutscene: false,
    cutsceneSound: null,
  });

  const imagesRef = useRef({});
  const soundsRef = useRef({});
  const animationIdRef = useRef(null);
  const spawnTimeoutRef = useRef(null);

  useEffect(() => {
    const loadAssets = async () => {
      const imageFiles = [
        'ant.png',
        'arrow.png',
        'enemy.png',
        'kintoun.png',
        'introScene.png',
        'firstIllustration.png',
        'encounterScene.png',
        'captureScene.png',
        'winScene.png',
      ];

      const soundFiles = {
        arrow: 'arrow.mp3',
        hit: 'hit.mp3',
        kiss: 'kiss.mp3',
        walking: 'walking.mp3',
        huh: 'huh.mp3',
        gasp: 'gasp.mp3',
        minishcap: 'minishcap.mp3',
      };

      imageFiles.forEach((file) => {
        const img = new Image();
        img.src = file;
        imagesRef.current[file] = img;
      });

      Object.entries(soundFiles).forEach(([key, file]) => {
        soundsRef.current[key] = new Audio(file);
      });
    };

    loadAssets();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const gameRef = gameStateRef.current;

    const update = () => {
      if (!gameRef.running) return;

      // Update arrows
      gameRef.arrows = gameRef.arrows.map((a) => ({
        ...a,
        x: a.x + a.dx,
        y: a.y + a.dy,
      }));

      // Update enemies
  gameRef.enemies.forEach((e) => {
  e.x += e.speedX;
  e.y += e.speedY;

  const dx = e.x - gameRef.ant.x;
  const dy = e.y - gameRef.ant.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance < 30) {
    endGameHandler('You Lose! 💀');
  }
});
      // Collision
      gameRef.arrows.forEach((a) => {
        gameRef.enemies.forEach((e) => {
          if (e.alive && Math.hypot(a.x - e.x, a.y - e.y) < 20) {
            e.alive = false;
            gameRef.kills++;
            gameRef.platformY -= 10;
            gameRef.ant.y -= 10;

            if (soundsRef.current.hit) {
              soundsRef.current.hit.currentTime = 0;
              soundsRef.current.hit.play();
            }

            if (gameRef.platformY < 80) {
              endGameHandler('You Win! 🏆');
            }
          }
        });
      });

      gameRef.enemies = gameRef.enemies.filter((e) => e.alive);

      setAntPos({ ...gameRef.ant });
      setArrows([...gameRef.arrows]);
      setEnemies([...gameRef.enemies]);
      setPlatformY(gameRef.platformY);
    };

    const draw = () => {
      if (!gameRef.running) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw platform
      if (imagesRef.current['kintoun.png']?.complete) {
        ctx.drawImage(
          imagesRef.current['kintoun.png'],
          gameRef.ant.x - PLATFORM_WIDTH / 2 + 15,
          gameRef.platformY - PLATFORM_HEIGHT / 2,
          PLATFORM_WIDTH,
          PLATFORM_HEIGHT
        );
      }

      // Draw ant
      if (imagesRef.current['ant.png']?.complete) {
        //ctx.drawImage(imagesRef.current['ant.png'], gameRef.ant.x - 32, gameRef.ant.y - 32, 64, 64);
        ctx.save();
        if (!gameRef.ant.facingRight) {
    
    ctx.translate(gameRef.ant.x, gameRef.ant.y);
    
    ctx.scale(-1, 1);
    
    ctx.drawImage(imagesRef.current['ant.png'], -32, -32, 64, 64);
  } else {
    ctx.drawImage(imagesRef.current['ant.png'], gameRef.ant.x - 32, gameRef.ant.y - 32, 64, 64);
  }
  ctx.restore(); 
      }


      // Draw arrows
      gameRef.arrows.forEach((a) => {
        if (!imagesRef.current['arrow.png']?.complete) return;
        const angle = Math.atan2(a.dy, a.dx);
        ctx.save();
        ctx.translate(a.x, a.y);
        ctx.rotate(angle);
        ctx.drawImage(imagesRef.current['arrow.png'], -16, -4, 32, 8);
        ctx.restore();
      });

      // Draw enemies
  gameRef.enemies.forEach((e) => {
  if (imagesRef.current['enemy.png']?.complete) {
    ctx.save();

    ctx.translate(e.x, e.y);

    if (e.speedX < 0) {
      ctx.scale(-1, 1);
    }

    ctx.drawImage(imagesRef.current['enemy.png'], -30, -30, 60, 60);

    ctx.restore();
  }
  });

    };

    const gameLoop = () => {
      update();
      draw();
      animationIdRef.current = requestAnimationFrame(gameLoop);
    };

    animationIdRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, []);

  const endGameHandler = (message) => {
    const gameRef = gameStateRef.current;
    gameRef.running = false;
    setGameOverMessage(message);

    if (message.includes('Win')) {
      setGameState('win');
      if (soundsRef.current.kiss) {
        soundsRef.current.kiss.play();
      }
    } else {
      setGameState('gameOver');
    }
  };

  const resetGame = () => {
    const gameRef = gameStateRef.current;
    gameRef.platformY = window.innerHeight * 0.7;
    gameRef.arrows = [];
    gameRef.enemies = [];
    gameRef.ant = { x: window.innerWidth / 2, y: gameRef.platformY - 30 };
    gameRef.kills = 0;
    gameRef.gameOverMessage = '';

    setPlatformY(gameRef.platformY);
    setAntPos({ ...gameRef.ant });
    setArrows([]);
    setEnemies([]);
  };

  const startGame = () => {
    resetGame();
    gameStateRef.current.running = true;
    gameStateRef.current.gameState = 'playing';
    setGameState('playing');
    spawnEnemyLoop();
  };

  const spawnEnemyLoop = () => {

  const spawnEnemy = () => {
    const gameRef = gameStateRef.current;
    if (!gameRef.running) return;

    let x, y;
    
    const edge = Math.floor(Math.random() * 4);

    if (edge === 0) { x = Math.random() * window.innerWidth; y = -50; }
    else if (edge === 1) { x = Math.random() * window.innerWidth; y = window.innerHeight + 50; }
    else if (edge === 2) { x = -50; y = Math.random() * window.innerHeight; }
    else { x = window.innerWidth + 50; y = Math.random() * window.innerHeight; }

        const angle = Math.atan2(gameRef.ant.y - y, gameRef.ant.x - x);
        const speed = 2.0; 
        const sX = Math.cos(angle) * speed;
        const sY = Math.sin(angle) * speed;

    gameRef.enemies.push({
      x: x,
      y: y,
      speedX: sX,
      speedY: sY,
      alive: true
    });

    // Spawn a cada 1.2 segundos
    spawnTimeoutRef.current = setTimeout(spawnEnemy, 1200);
  };

  spawnEnemy();
  };

  const startCutscene = () => {
    resetGame();
    setCurrentScene(0);
    gameStateRef.current.inCutscene = true;
    gameStateRef.current.gameState = 'cutscene';
    setGameState('cutscene');
    playCutsceneSound(0);
  };

  const playCutsceneSound = (index) => {
    const gameRef = gameStateRef.current;
    if (gameRef.cutsceneSound) {
      gameRef.cutsceneSound.pause();
      gameRef.cutsceneSound.currentTime = 0;
    }

    const soundKeys = ['walking', 'huh', 'gasp', 'minishcap'];
    gameRef.cutsceneSound = soundsRef.current[soundKeys[index]];
    if (gameRef.cutsceneSound) {
      gameRef.cutsceneSound.currentTime = 0;
      gameRef.cutsceneSound.play();
    }
  };

  const nextScene = () => {
    let newScene = currentScene + 1;
    const sceneCount = 4; // firstIllustration, encounterScene, captureScene, introScene

    if (newScene >= sceneCount) {
      const gameRef = gameStateRef.current;
      if (gameRef.cutsceneSound) {
        gameRef.cutsceneSound.pause();
        gameRef.cutsceneSound.currentTime = 0;
      }
      gameRef.inCutscene = false;
      startGame();
      return;
    }

    setCurrentScene(newScene);
    playCutsceneSound(newScene);
  };

  const handleCanvasClick = (e) => {
    if (gameState === 'playing') {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const gameRef = gameStateRef.current;
      gameRef.ant.facingRight = mx >= gameRef.ant.x; //esta
      gameRef.arrows.push({
        x: gameRef.ant.x,
        y: gameRef.ant.y,
        dx: (mx - gameRef.ant.x) / 20,
        dy: (my - gameRef.ant.y) / 20,
      });

      if (soundsRef.current.arrow) {
        soundsRef.current.arrow.currentTime = 0;
        soundsRef.current.arrow.play();
      }
    } else if (gameState === 'cutscene') {
      nextScene();
    } else if (gameState === 'win') {
      startGame();
    }
  };

  const sceneImages = [
    '/firstIllustration.png',
    '/encounterScene.png',
    '/captureScene.png',
    '/introScene.png',
  ];

  return (
    <div className="app-root">
      
      <div id="menu" className={gameState === 'menu' ? 'menu visible' : 'menu hidden'}>
        <h1>🎀 Archant 🐜</h1>
        <button onClick={startCutscene} id="playBtn" className="btn">
          Play Game
        </button>
      </div>

     
      <canvas
        ref={canvasRef}
        id="game"
        className={`game-canvas ${gameState === 'menu' ? 'hidden' : 'visible'} ${gameState === 'playing' ? 'playing' : ''}`}
        onClick={handleCanvasClick}
      />

      
      {gameState === 'cutscene' && (
        <div
          className="cutscene-overlay"
          style={{ backgroundImage: `url(${sceneImages[currentScene]})` }}
          onClick={nextScene}
        />
      )}

      {gameState === 'win' && (
        <div
          className="win-overlay"
          style={{ backgroundImage: 'url(/winScene.png)' }}
          onClick={() => startGame()}
        />
      )}

      {gameState === 'gameOver' && (
        <div id="msg" className="message">
          {gameOverMessage}
          <br />
          <br />
          <button onClick={startGame} className="btn">
            Retry
          </button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="goal">
          🎀🐜❤️Goal❤️🐜🌸
        </div>
      )}
    </div>
  );
}

