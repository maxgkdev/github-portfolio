function CheckOverlap(a, b) {
    let ax = a.position.x - a.width / 2;
    let ay = a.position.y - a.height / 2;
    let bx = b.position.x - b.width / 2;
    let by = b.position.y - b.height / 2;
    return (ax < bx + b.width && ax + a.width > bx && ay < by + b.height && ay + a.height > by);
}

class NeonPlatform extends RectangleGO {
    constructor(x, y, w, h, colorStr, isGoal, moveX = 0, moveY = 0, speed = 0) {
        super(new Vector2(x, y), w, h, colorStr);
        this.neonColor = colorStr || "cyan"; 
        this.isGoal = isGoal || false; 
        
        this.startX = x;
        this.startY = y;
        this.moveX = moveX; 
        this.moveY = moveY; 
        this.speed = speed; 
        this.time = 0;
        this.dx = 0; 
        this.dy = 0; 
    }

    Update(deltaTime) {
        if (this.speed > 0) {
            this.time += deltaTime;
            let oldX = this.position.x;
            let oldY = this.position.y;
            
            this.position.x = this.startX + Math.sin(this.time * this.speed) * this.moveX;
            this.position.y = this.startY + Math.sin(this.time * this.speed) * this.moveY;
            
            this.dx = this.position.x - oldX;
            this.dy = this.position.y - oldY;
        }
    }

    Draw(renderer) {
        renderer.DrawFillBasicRectangle(this.position.x - this.width/2, this.position.y - this.height/2, this.width, this.height, this.neonColor);
        renderer.DrawStrokeBasicRectangle(this.position.x - this.width/2, this.position.y - this.height/2, this.width, this.height, "white", 2);
    }
}

class NeonEnemy extends RectangleGO {
    constructor(x, y, patrolWidth, speed, img) {
        super(new Vector2(x, y), 32, 32, "#ff0000"); 
        this.neonColor = "#ff0000";
        this.startX = x;
        this.patrolWidth = patrolWidth;
        this.speed = speed;
        this.direction = 1; 

        this.img = img;
        this.frames = 6;
        this.cols = 5;
        this.rows = 2;
        this.currentFrame = 0;
        this.frameTimer = 0;
        this.animSpeed = 0.1; 
        
        this.spriteScale = 1.8; 
        this.spriteOffsetY = -4; 
    }
    
    Update(deltaTime) {
        this.position.x += this.speed * this.direction * deltaTime;
        
        if (this.position.x > this.startX + this.patrolWidth / 2) {
            this.position.x = this.startX + this.patrolWidth / 2;
            this.direction = -1;
        } else if (this.position.x < this.startX - this.patrolWidth / 2) {
            this.position.x = this.startX - this.patrolWidth / 2;
            this.direction = 1;
        }

        if (this.img) {
            this.frameTimer += deltaTime;
            if (this.frameTimer >= this.animSpeed) {
                this.frameTimer = 0;
                this.currentFrame++;
                if (this.currentFrame >= this.frames) {
                    this.currentFrame = 0; 
                }
            }
        }
    }

    Draw(renderer) {
        if (this.img && this.img.complete && this.img.naturalWidth !== 0) {
            const ctx = document.getElementById('myCanvas').getContext('2d');
            ctx.imageSmoothingEnabled = false; 
            
            let frameWidth = this.img.width / this.cols; 
            let frameHeight = this.img.height / this.rows;
            let col = this.currentFrame % this.cols;
            let row = Math.floor(this.currentFrame / this.cols);

            let sourceX = col * frameWidth; 
            let sourceY = row * frameHeight;
            let destWidth = frameWidth * this.spriteScale; 
            let destHeight = frameHeight * this.spriteScale;
            let destX = this.position.x - destWidth / 2;
            let destY = (this.position.y - destHeight / 2) + this.spriteOffsetY;

            ctx.save(); 
            if (this.direction === -1) {
                ctx.translate(this.position.x * 2, 0); 
                ctx.scale(-1, 1); 
            }
            ctx.drawImage(this.img, sourceX, sourceY, frameWidth, frameHeight, destX, destY, destWidth, destHeight);
            ctx.restore(); 
        } else {
            renderer.DrawFillBasicRectangle(this.position.x - this.width/2, this.position.y - this.height/2, this.width, this.height, this.neonColor);
            renderer.DrawStrokeBasicRectangle(this.position.x - this.width/2, this.position.y - this.height/2, this.width, this.height, "#ffaa00", 2);
        }
    }
}

class Bullet extends RectangleGO {
    constructor(pos, rotation) {
        super(pos, 10, 4, "#ffff00");
        this.speed = 800;
        this.rotation = rotation;
    }
    Update(deltaTime) {
        this.position.x += Math.cos(this.rotation) * this.speed * deltaTime;
    }
}

class PowerUp extends RectangleGO {
    constructor(x, y, type, img) {
        const colors = { doubleJump: "#00ff00", invincibility: "#ffff00", gun: "#ffffff" };
        super(new Vector2(x, y), 30, 30, colors[type]);
        this.type = type;
        this.img = img;
        this.neonColor = colors[type];
    }

    Draw(renderer) {
        if (this.img && this.img.complete && this.img.naturalWidth !== 0) {
            const ctx = document.getElementById('myCanvas').getContext('2d');
            ctx.imageSmoothingEnabled = false; 
            ctx.save();

            let drawSize = 36; 
            let destX = this.position.x - drawSize / 2;
            let destY = this.position.y - drawSize / 2;

            ctx.drawImage(this.img, destX, destY, drawSize, drawSize);
            ctx.restore();
        } else {
            renderer.DrawFillBasicRectangle(this.position.x - this.width/2, this.position.y - this.height/2, this.width, this.height, this.neonColor);
        }
    }
}

class NeonEscape extends Game {
    constructor(renderer) {
        super(renderer);
        this.gameStarted = false;
        this.isPaused = false; 
        this.score = 0;
        this.timeElapsed = 0;
        this.enemiesKilled = 0;

        this.graphicAssets = {
            playerIdle: { path: "assets/player_idle.png", img: null },
            playerRun: { path: "assets/player_run.png", img: null },
            playerJump: { path: "assets/player_jump.png", img: null },
            playerRunJump: { path: "assets/player_run_jump.png", img: null },
            bgImage: { path: "assets/background.png", img: null },
            enemyWalk: { path: "assets/enemy_walk.png", img: null },
            itemDoubleJump: { path: "assets/double_jump.png", img: null },
            itemGun: { path: "assets/gun.png", img: null },
            itemInvincibility: { path: "assets/invincibility.png", img: null }
        };

        
        this.audioManager = {
            jump: new Audio("assets/sounds/jump.wav"),
            shoot: new Audio("assets/sounds/shoot.wav"),
            stomp: new Audio("assets/sounds/stomp.wav"),
            powerup: new Audio("assets/sounds/powerup.wav")
        };

       
        this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        this.bgmBuffer = null;
        this.bgmSource = null;
        this.isBgmPlaying = false;
        
        // Fetch the raw audio data and decode it into memory
        fetch("assets/sounds/music.wav")
            .then(response => response.arrayBuffer())
            .then(data => this.audioCtx.decodeAudioData(data))
            .then(buffer => {
                this.bgmBuffer = buffer;
                console.log("BGM Loaded into Web Audio API");
            })
            .catch(err => console.error("Error loading BGM:", err));
    }

    PlaySound(name) {
        if (this.audioManager[name]) {
            this.audioManager[name].currentTime = 0; 
            this.audioManager[name].play().catch(e => {});
        }
    }

    
    PlayBGM() {
        if (this.isBgmPlaying || !this.bgmBuffer) return;
        if (this.audioCtx.state === 'suspended') this.audioCtx.resume();
        
        this.bgmSource = this.audioCtx.createBufferSource();
        this.bgmSource.buffer = this.bgmBuffer;
        this.bgmSource.loop = true; 
        
        
        this.bgmGain = this.audioCtx.createGain();
        let slider = document.getElementById('volume-slider');
        this.bgmGain.gain.value = slider ? parseFloat(slider.value) : 0.4;
        
        
        if (slider) {
            slider.oninput = (e) => {
                if (this.bgmGain) this.bgmGain.gain.value = parseFloat(e.target.value);
            };
        }
        
        this.bgmSource.connect(this.bgmGain);
        this.bgmGain.connect(this.audioCtx.destination);
        
        this.bgmSource.start(0);
        this.isBgmPlaying = true;
    }
    StopBGM() {
        if (this.bgmSource && this.isBgmPlaying) {
            this.bgmSource.stop();
            this.bgmSource.disconnect();
            this.isBgmPlaying = false;
        }
    }

    Start() {
        super.Start();
        const invUI = document.getElementById('inventory-ui');
        if (invUI) invUI.style.display = 'none';
        
        const startBtn = document.getElementById('start-btn');
        if (startBtn) startBtn.onclick = () => this.StartGame();

        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) restartBtn.onclick = () => this.StartGame();

        const resumeBtn = document.getElementById('resume-btn');
        if (resumeBtn) resumeBtn.onclick = () => this.ResumeGame();

        const quitBtn = document.getElementById('quit-btn');
        if (quitBtn) quitBtn.onclick = () => this.QuitGame();
    }

    async StartGame() {
        document.getElementById('main-menu').style.display = 'none';
        document.getElementById('win-menu').style.display = 'none';
        document.getElementById('pause-menu').style.display = 'none';
        document.getElementById('game-ui').style.display = 'flex';
        
        const invUI = document.getElementById('inventory-ui');
        if (invUI) invUI.style.display = 'flex';

        this.score = 0;
        this.timeElapsed = 0;
        this.enemiesKilled = 0; 
        this.isPaused = false; 
        
        document.getElementById('score-val').innerText = "0";
        document.getElementById('time-val').innerText = "0.0";

        this.gameObjects = [];

        try {
            const response = await fetch('assets/level.json');
            const data = await response.json();

            if (data.platforms) {
                data.platforms.forEach(p => {
                    this.gameObjects.push(new NeonPlatform(p.x, p.y, p.width, p.height, p.color, p.isGoal, p.moveX, p.moveY, p.speed));
                });
            }
            
            if (data.enemies) {
                data.enemies.forEach(e => {
                    this.gameObjects.push(new NeonEnemy(e.x, e.y, e.patrolWidth, e.speed, this.graphicAssets.enemyWalk.img));
                });
            }

            if (data.powerups) {
                data.powerups.forEach(p => {
                    let loadedImg = null;
                    if (p.type === 'doubleJump') loadedImg = this.graphicAssets.itemDoubleJump.img;
                    if (p.type === 'gun') loadedImg = this.graphicAssets.itemGun.img;
                    if (p.type === 'invincibility') loadedImg = this.graphicAssets.itemInvincibility.img;
                    
                    this.gameObjects.push(new PowerUp(p.x, p.y, p.type, loadedImg));
                });
            }

            this.player = new Player(
                new Vector2(200, 370), 
                this.graphicAssets.playerIdle.img, 
                this.graphicAssets.playerRun.img,
                this.graphicAssets.playerJump.img,
                this.graphicAssets.playerRunJump.img
            );
            this.gameObjects.push(this.player);

            this.camera = new FollowCameraBasic(new Vector2(400, 300), this.player);
            this.camera.Start();

            this.gameStarted = true;
            this.player.ClearInventory();

            
            this.StopBGM();
            this.PlayBGM();

        } catch (e) {
            console.error("Failed to load JSON", e);
        }
    }

    TogglePause() {
        this.isPaused = !this.isPaused;
        if (this.isPaused) {
            document.getElementById('pause-menu').style.display = 'flex';
            
            if (this.bgmSource) this.bgmSource.playbackRate.value = 0.5; 
        } else {
            document.getElementById('pause-menu').style.display = 'none';
           
            if (this.bgmSource) this.bgmSource.playbackRate.value = 1.0; 
        }
    }

    ResumeGame() {
        this.isPaused = false;
        document.getElementById('pause-menu').style.display = 'none';
       
        if (this.bgmSource) this.bgmSource.playbackRate.value = 1.0; 
    }

    QuitGame() {
        this.gameStarted = false;
        document.getElementById('pause-menu').style.display = 'none';
        document.getElementById('game-ui').style.display = 'none';
        const invUI = document.getElementById('inventory-ui');
        if (invUI) invUI.style.display = 'none';
        document.getElementById('main-menu').style.display = 'flex';
        this.StopBGM();
    }

    AddScore(points) {
        this.score += points;
        document.getElementById('score-val').innerText = this.score;
    }

    WinGame() {
        this.gameStarted = false;
        document.getElementById('game-ui').style.display = 'none';
        const invUI = document.getElementById('inventory-ui');
        if (invUI) invUI.style.display = 'none';
        
        let timeBonus = Math.max(0, Math.floor(5000 - (this.timeElapsed * 50)));
        this.AddScore(timeBonus);

        let combatScore = this.enemiesKilled * 100;

        document.getElementById('final-stats').innerHTML = `
            TIME: <span style="color:#fff">${this.timeElapsed.toFixed(1)}s</span><br>
            TIME BONUS: <span style="color:#00f3ff">+${timeBonus}</span><br><br>
            ENEMIES DEFEATED: <span style="color:#fff">${this.enemiesKilled}</span><br>
            COMBAT SCORE: <span style="color:#ff00ff">+${combatScore}</span><br><br>
            FINAL SCORE: <span style="color:#ffff00">${this.score}</span>
        `;
        
        document.getElementById('win-menu').style.display = 'flex';
        this.StopBGM();
    }

    SpawnBullet(pos, rotation) {
        this.gameObjects.push(new Bullet(pos, rotation));
    }

    Update(deltaTime) {
        if (this.gameStarted && Input.IsKeyDown(KEY_ESCAPE)) {
            this.TogglePause();
        }

        if (this.isPaused) return; 

        super.Update(deltaTime);

        if (this.gameStarted) {
            
            this.timeElapsed += deltaTime;
            document.getElementById('time-val').innerText = this.timeElapsed.toFixed(1);

            if (this.player.position.y > 800) {
                this.StartGame(); 
                return;
            }

            this.player.isGrounded = false;
            
            for (let i = 0; i < this.gameObjects.length; i++) {
                let obj = this.gameObjects[i];

                if (obj instanceof PowerUp) {
                    if (CheckOverlap(this.player, obj)) {
                        if (this.player.AddPowerUp(obj.type)) {
                            this.PlaySound('powerup'); 
                            this.gameObjects.splice(i, 1);
                            i--; 
                            continue; 
                        }
                    }
                }
                
                else if (obj instanceof Bullet) {
                    let bulletHit = false;
                    for (let j = 0; j < this.gameObjects.length; j++) {
                        let other = this.gameObjects[j];
                        if (other instanceof NeonEnemy && CheckOverlap(obj, other)) {
                            this.gameObjects.splice(j, 1); 
                            if (j <= i) i--; 
                            bulletHit = true;
                            
                            this.enemiesKilled++;
                            this.AddScore(100);
                            this.PlaySound('stomp'); 
                            break; 
                        }
                    }
                    if (bulletHit) {
                        this.gameObjects.splice(this.gameObjects.indexOf(obj), 1); 
                        i--; 
                        continue; 
                    }
                }
                
                else if (obj instanceof NeonPlatform) {
                    let px = this.player.position.x - this.player.width / 2;
                    let py = this.player.position.y - this.player.height / 2;
                    let ox = obj.position.x - obj.width / 2;
                    let oy = obj.position.y - obj.height / 2;

                    if (px < ox + obj.width && px + this.player.width > ox &&
                        py < oy + obj.height && py + this.player.height > oy) {
                        
                        if (obj.isGoal) {
                            this.WinGame();
                            return; 
                        }

                        let previousBottom = py + this.player.height - (this.player.velocity.y * deltaTime);
                        
                        if (this.player.velocity.y >= 0 && previousBottom <= oy + 30) {
                            this.player.position.y = oy - this.player.height / 2;
                            this.player.velocity.y = 0;
                            this.player.isGrounded = true;
                            
                            if (obj.speed > 0) {
                                this.player.position.x += obj.dx;
                            }
                        }
                    }
                }

                else if (obj instanceof NeonEnemy) {
                    let px = this.player.position.x - this.player.width / 2;
                    let py = this.player.position.y - this.player.height / 2;
                    let ox = obj.position.x - obj.width / 2;
                    let oy = obj.position.y - obj.height / 2;

                    if (px < ox + obj.width && px + this.player.width > ox &&
                        py < oy + obj.height && py + this.player.height > oy) {
                        
                        let previousBottom = py + this.player.height - (this.player.velocity.y * deltaTime);

                        if (this.player.velocity.y > 0 && previousBottom <= oy + 15) {
                            this.player.velocity.y = -500; 
                            this.gameObjects.splice(i, 1);
                            i--; 
                            
                            this.enemiesKilled++;
                            this.AddScore(100);
                            this.PlaySound('stomp'); 
                            continue; 
                        } 
                        else if (this.player.activePowerUps.invincibility) {
                            this.gameObjects.splice(i, 1);
                            i--;
                            
                            this.enemiesKilled++;
                            this.AddScore(100);
                            this.PlaySound('stomp'); 
                            continue;
                        }
                        else {
                            this.StartGame(); 
                            return; 
                        }
                    }
                }
            } 
            if (this.camera) this.camera.Update(deltaTime);
        }
    }

    Draw() {
        const canvas = document.getElementById('myCanvas');
        const cw = canvas.width;
        const ch = canvas.height;

        this.renderer.DrawFillBasicRectangle(0, 0, cw, ch, "#050505");
        
        let bgImg = this.graphicAssets.bgImage ? this.graphicAssets.bgImage.img : null;
        if (bgImg && bgImg.complete && bgImg.naturalWidth !== 0) {
            const ctx = canvas.getContext('2d');
            
            ctx.imageSmoothingEnabled = false; 
            ctx.save();

            let scale = ch / bgImg.height; 
            let bgWidth = bgImg.width * scale;
            let bgHeight = ch; 

            let camX = (this.gameStarted && this.camera) ? this.camera.position.x : 0;
            let parallaxSpeed = 0.2; 
            let offsetX = ((camX * parallaxSpeed) % bgWidth + bgWidth) % bgWidth;

            for (let i = -1; i <= Math.ceil(cw / bgWidth) + 1; i++) {
                let drawX = Math.floor((i * bgWidth) - offsetX);
                let drawW = Math.ceil(bgWidth) + 1; 
                ctx.drawImage(bgImg, drawX, 0, drawW, bgHeight);
            }
            
            ctx.restore();
        }

        if (this.gameStarted && this.camera) this.camera.PreDraw(this.renderer);
        super.Draw();
        if (this.gameStarted && this.camera) this.camera.PostDraw(this.renderer);
    }
}

window.onload = () => {
    Init(NeonEscape);
};