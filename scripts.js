// SMOOTH SCROLLING
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const targetElement = document.querySelector(this.getAttribute('href'));
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// SCROLL REVEAL (Intersection Observer) 
const revealElements = document.querySelectorAll('.reveal');
const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('active');
            observer.unobserve(entry.target); // Only reveal once
        }
    });
}, { threshold: 0.15 });

revealElements.forEach(el => revealObserver.observe(el));

// DYNAMIC PROJECT MODALS

const projectData = {
    "neon-escape": {
        title: "Neon Escape: Deep Dive",
        content: `
            <p><strong>Neon Escape</strong> is a 2D action-platformer built completely from scratch using HTML5 Canvas, JavaScript, and CSS3 formatting. I implemented several advanced systems to ensure professional game feel and scalability:</p>
            <br>
            <ul>
                <li><strong>OOP Architecture & Game Loop:</strong> Structured with Object-Oriented Programming, utilizing a custom game loop managing <code>requestAnimationFrame</code> to cleanly separate Update and Draw logic based on <code>deltaTime</code>.</li>
                <li><strong>Advanced Level Loading:</strong> The level design is highly scalable, utilizing the asynchronous <code>fetch</code> API to dynamically load level data, platform positions, and enemy placement via a JSON file.</li>
                <li><strong>Dynamic Audio System:</strong> Built an <code>AudioManager</code> using the modern Web Audio API (<code>AudioContext</code>), allowing seamless music looping and dynamic pitch/speed alterations when the game is paused.</li>
                <li><strong>Complex Physics & State Machine:</strong> The <code>Player</code> class uses a dynamic State Machine for animations, while custom platform logic uses sine wave interpolation (<code>Math.sin()</code>) to calculate complex movement without collision errors.</li>
            </ul>
            <p>The UI, built with CSS3, syncs dynamically with the Canvas game state to manage an interactive visual inventory for power-ups.</p>
        `
    }
};

const modal = document.getElementById('project-modal');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const closeBtn = document.querySelector('.close-btn');

document.querySelectorAll('.modal-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const projectId = e.target.getAttribute('data-project');
        const data = projectData[projectId];
        
        if(data) {
            modalTitle.innerText = data.title;
            modalBody.innerHTML = data.content;
            modal.style.display = 'flex';
            setTimeout(() => modal.classList.add('show'), 10); // Small delay for transition
        }
    });
});

closeBtn.addEventListener('click', closeModal);
window.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
});

function closeModal() {
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
}

// INTERACTIVE CANVAS BACKGROUND 
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');
let particlesArray;

// Set canvas size
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

let mouse = { x: null, y: null, radius: 150 };

window.addEventListener('mousemove', function(event) {
    mouse.x = event.x;
    mouse.y = event.y;
});

class Particle {
    constructor(x, y, directionX, directionY, size, color) {
        this.x = x;
        this.y = y;
        this.directionX = directionX;
        this.directionY = directionY;
        this.size = size;
        this.color = color;
    }
    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2, false);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
    update() {
        if (this.x > canvas.width || this.x < 0) { this.directionX = -this.directionX; }
        if (this.y > canvas.height || this.y < 0) { this.directionY = -this.directionY; }
        
        // Move particle
        this.x += this.directionX;
        this.y += this.directionY;
        this.draw();
    }
}

function init() {
    particlesArray = [];
    let numberOfParticles = (canvas.height * canvas.width) / 9000;
    for (let i = 0; i < numberOfParticles; i++) {
        let size = (Math.random() * 2) + 1;
        let x = (Math.random() * ((innerWidth - size * 2) - (size * 2)) + size * 2);
        let y = (Math.random() * ((innerHeight - size * 2) - (size * 2)) + size * 2);
        let directionX = (Math.random() * 1) - 0.5;
        let directionY = (Math.random() * 1) - 0.5;
        let color = '#00f0ff'; // Neon Cyan
        particlesArray.push(new Particle(x, y, directionX, directionY, size, color));
    }
}

function animate() {
    requestAnimationFrame(animate);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    
    for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
    }
    connect();
}

function connect() {
    let opacityValue = 1;
    for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
            let distance = ((particlesArray[a].x - particlesArray[b].x) * (particlesArray[a].x - particlesArray[b].x)) + 
                           ((particlesArray[a].y - particlesArray[b].y) * (particlesArray[a].y - particlesArray[b].y));
            if (distance < (canvas.width / 7) * (canvas.height / 7)) {
                opacityValue = 1 - (distance / 20000);
                ctx.strokeStyle = `rgba(0, 240, 255, ${opacityValue * 0.2})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
                ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
                ctx.stroke();
            }
        }
    }
}

window.addEventListener('resize', function() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    init();
});


init();
animate();