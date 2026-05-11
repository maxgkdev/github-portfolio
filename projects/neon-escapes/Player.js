class Player extends RectangleGO {
    constructor(position, imgIdle, imgRun, imgJump, imgRunJump) {
        super(position, 32, 32, "#ff00ff"); 
        this.neonColor = "lime"; 
        
        this.velocity = new Vector2(0, 0);
        this.gravity = 1500;
        this.speed = 300;
        this.isGrounded = false;

        this.inventory = [null, null, null];
        this.activePowerUps = { doubleJump: false, invincibility: false, gun: false };
        this.hasDoubleJumped = false;

        this.animations = {
            idle:     { img: imgIdle,    frames: 4, cols: 5, rows: 1, speed: 0.15, loop: true },
            run:      { img: imgRun,     frames: 6, cols: 5, rows: 2, speed: 0.1,  loop: true },
            jump:     { img: imgJump,    frames: 9, cols: 5, rows: 2, speed: 0.08, loop: false }, 
            run_jump: { img: imgRunJump, frames: 8, cols: 5, rows: 2, speed: 0.08, loop: false }  
        };
        
        this.currentState = 'idle';
        this.currentFrame = 0;
        this.frameTimer = 0;
        this.facingRight = true; 

        this.spriteScale = 2.5; 
        this.spriteOffsetY = -8; 
    }

    SetState(newState) {
        if (this.currentState !== newState) {
            this.currentState = newState;
            this.currentFrame = 0; 
            this.frameTimer = 0;
        }
    }

    AddPowerUp(type) {
        for (let s = 0; s < 3; s++) {
            if (!this.inventory[s]) {
                this.inventory[s] = { type: type, time: 10, isActive: false };
                let displayText = type.toUpperCase();
                if (type === 'gun') displayText = "GUN [F]";
                this.UpdateSlotUI(s, displayText);
                return true; 
            }
        }
        return false; 
    }

    ActivateSlot(index) {
        let slot = this.inventory[index];
        if (!slot || slot.isActive) return;
        slot.isActive = true;
    }

    ClearInventory() {
        for (let i = 0; i < 3; i++) {
            this.inventory[i] = null;
            this.UpdateSlotUI(i, "EMPTY");
            let timerEl = document.getElementById(`slot-${i+1}`).querySelector('.timer');
            if (timerEl) timerEl.style.width = "0%";
        }
        this.activePowerUps = { doubleJump: false, invincibility: false, gun: false };
    }

    UpdateSlotUI(index, text) {
        document.getElementById(`slot-${index+1}`).querySelector('.label').innerText = text;
    }

    Update(deltaTime) {
        if (Input.IsKeyDown(KEY_1)) this.ActivateSlot(0);
        if (Input.IsKeyDown(KEY_2)) this.ActivateSlot(1);
        if (Input.IsKeyDown(KEY_3)) this.ActivateSlot(2);

        this.activePowerUps = { doubleJump: false, invincibility: false, gun: false };

        for (let i = 0; i < 3; i++) {
            let slot = this.inventory[i];
            
            if (slot && slot.isActive) {
                slot.time -= deltaTime;
                this.activePowerUps[slot.type] = true; 

                let pct = Math.max(0, (slot.time / 10) * 100);
                document.getElementById(`slot-${i+1}`).querySelector('.timer').style.width = pct + "%";

                if (slot.time <= 0) {
                    this.inventory[i] = null;
                    this.UpdateSlotUI(i, "EMPTY");
                    document.getElementById(`slot-${i+1}`).querySelector('.timer').style.width = "0%";
                    this.activePowerUps[slot.type] = false;
                }
            }
        }

        let isMoving = false;
        this.velocity.x = 0;
        
        if (Input.IsKeyPressed(KEY_A) || Input.IsKeyPressed(KEY_LEFT)) {
            this.velocity.x = -this.speed;
            this.facingRight = false;
            isMoving = true;
        }
        if (Input.IsKeyPressed(KEY_D) || Input.IsKeyPressed(KEY_RIGHT)) {
            this.velocity.x = this.speed;
            this.facingRight = true;
            isMoving = true;
        }

        if (!this.isGrounded) {
            if (isMoving) this.SetState('run_jump');
            else this.SetState('jump');
        } else {
            if (isMoving) this.SetState('run');
            else this.SetState('idle');
        }

        if (Input.IsKeyDown(KEY_SPACE) || Input.IsKeyDown(KEY_W)) {
            if (this.isGrounded) {
                this.velocity.y = -600;
                this.isGrounded = false;
                this.hasDoubleJumped = false;
                game.PlaySound('jump'); // --- SOUND FX ---
            } 
            else if (!this.hasDoubleJumped && this.activePowerUps.doubleJump) {
                this.velocity.y = -500; 
                this.hasDoubleJumped = true;
                this.currentFrame = 0; 
                game.PlaySound('jump'); // --- SOUND FX ---
            }
        }

        // --- UPDATED: Changed to IsKeyPressed so sound plays cleanly! ---
        if (this.activePowerUps.gun && Input.IsKeyDown(KEY_F)) {
            let dir = this.facingRight ? 0 : Math.PI;
            let offsetX = this.facingRight ? 40 : -40; 
            let offsetY = -15; 
            let spawnX = this.position.x + offsetX;
            let spawnY = this.position.y + offsetY;

            game.SpawnBullet(new Vector2(spawnX, spawnY), dir);
            game.PlaySound('shoot'); // --- SOUND FX ---
        }

        this.velocity.y += this.gravity * deltaTime;
        this.position.x += this.velocity.x * deltaTime;
        this.position.y += this.velocity.y * deltaTime;

        let anim = this.animations[this.currentState];
        if (anim.img) {
            this.frameTimer += deltaTime;
            if (this.frameTimer >= anim.speed) {
                this.frameTimer = 0; 
                this.currentFrame++; 
                if (this.currentFrame >= anim.frames) {
                    if (anim.loop) this.currentFrame = 0; 
                    else this.currentFrame = anim.frames - 1; 
                }
            }
        }

        super.Update(deltaTime);
    }

    Draw(renderer) {
        const ctx = document.getElementById('myCanvas').getContext('2d');
        
        if (this.activePowerUps.invincibility) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.position.x, this.position.y + (this.spriteOffsetY / 2), 35, 0, Math.PI * 2);
            ctx.strokeStyle = "#ffff00"; 
            ctx.lineWidth = 4;
            ctx.shadowColor = "#ffff00";
            ctx.shadowBlur = 15;
            ctx.stroke();
            ctx.restore();
        }

        let anim = this.animations[this.currentState];

        if (anim.img && anim.img.complete && anim.img.naturalWidth !== 0) {
            ctx.imageSmoothingEnabled = false; 
            
            let frameWidth = anim.img.width / anim.cols; 
            let frameHeight = anim.img.height / anim.rows;
            let col = this.currentFrame % anim.cols;
            let row = Math.floor(this.currentFrame / anim.cols);

            let sourceX = col * frameWidth; 
            let sourceY = row * frameHeight;
            let destWidth = frameWidth * this.spriteScale; 
            let destHeight = frameHeight * this.spriteScale;
            let destX = this.position.x - destWidth / 2;
            let destY = (this.position.y - destHeight / 2) + this.spriteOffsetY;

            ctx.save(); 
            if (!this.facingRight) {
                ctx.translate(this.position.x * 2, 0); 
                ctx.scale(-1, 1); 
            }
            ctx.drawImage(anim.img, sourceX, sourceY, frameWidth, frameHeight, destX, destY, destWidth, destHeight);
            ctx.restore(); 
        } else {
            renderer.DrawFillBasicRectangle(this.position.x - this.width/2, this.position.y - this.height/2, this.width, this.height, this.neonColor);
        }
    }
}