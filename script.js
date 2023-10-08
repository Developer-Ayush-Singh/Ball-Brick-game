/**
 * Represents the main game logic and components.
 */
class Game {
  /**
   * Initializes a new game instance.
   * @param {string} canvasId - The ID of the canvas element.
   */
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext("2d");
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;

    // Initialize game components
    this.ball = new Ball(
      this.canvas.width / 2,
      this.canvas.height / 2,
      this.canvas.width * 0.015
    );
    this.paddle = new Paddle(
      this.canvas.width / 2 - 40,
      this.canvas.height - 25,
      this.canvas.width * 0.15,
      8
    );
    this.bricks = [];
    this.score = 0;
    this.lives = 3;
    this.initBricks();
    this.addEventListeners();
    this.gameLoop();
    this.hue = 120; // Initial hue for green
    this.fallingHeart = null;
  }

  /**
   * Initializes bricks for the game.
   */
  initBricks() {
    let numRows = Math.floor(Math.random() * 8) + 5; // 5 to 12 rows
    let numCols = Math.floor(Math.random() * 10) + 10; // 10 to 19 columns
    let brickWidth = this.canvas.width / numCols - 5;
    let brickHeight = 15;

    for (let i = 0; i < numRows; i++) {
      for (let j = 0; j < numCols; j++) {
        let brickType = Math.random();
        if (brickType < 0.5) {
          this.bricks.push(
            new Brick(
              j * (brickWidth + 5),
              i * (brickHeight + 5) + 40,
              brickWidth,
              brickHeight
            )
          );
        } else if (brickType < 0.75) {
          this.bricks.push(
            new GoldenBrick(
              j * (brickWidth + 5),
              i * (brickHeight + 5) + 40,
              brickWidth,
              brickHeight
            )
          );
        } else {
          this.bricks.push(
            new SilverBrick(
              j * (brickWidth + 5),
              i * (brickHeight + 5) + 40,
              brickWidth,
              brickHeight
            )
          );
        }
      }
    }
  }

  /**
   * Adds necessary event listeners for game controls.
   */
  addEventListeners() {
    // Handle paddle movement with mouse
    window.addEventListener("mousemove", (e) => {
      this.paddle.x = e.clientX - this.paddle.width / 2;
    });

    // Handle paddle movement with touch
    window.addEventListener("touchmove", (e) => {
      this.paddle.x = e.touches[0].clientX - this.paddle.width / 2;
    });
  }

  /**
   * Main game loop.
   */
  gameLoop() {
    this.update();
    this.draw();
    if (this.lives > 0) {
      requestAnimationFrame(() => this.gameLoop());
    } else {
      this.gameOver();
    }
  }

  /**
   * Updates game state.
   */
  update() {
    let pointsWon = 0; // Initialize pointsWon to 0
    let lastBrickTouched = this.handleBrickCollision(pointsWon);

    this.checkForNewHeart(pointsWon, lastBrickTouched);
    this.handleFallingHeart();

    // Check if all bricks are broken
    if (this.bricks.length === 0) {
      this.initBricks(); // Reset bricks
    }

    this.hue += 1; // Increment the hue
    if (this.hue > 360) this.hue = 0; // Reset hue after a full rotation
  }

  /**
   * Handles ball collision with bricks.
   * @param {number} pointsWon - The points won during the collision.
   * @returns {Brick|null} - The last brick touched by the ball.
   */
  handleBrickCollision(pointsWon) {
    let lastBrickTouched = null;

    this.ball.update(this.canvas, this.paddle, () => {
      this.lives--;
      if (this.lives > 0) {
        this.ball.reset(this.canvas);
      }
    });
    this.paddle.update(this.canvas);

    // Ball collision with bricks
    this.bricks.forEach((brick, index) => {
      if (
        this.ball.y - this.ball.radius < brick.y + brick.height &&
        this.ball.y + this.ball.radius > brick.y &&
        this.ball.x + this.ball.radius > brick.x &&
        this.ball.x - this.ball.radius < brick.x + brick.width
      ) {
        this.ball.dy = -this.ball.dy;
        lastBrickTouched = brick; // Update the last brick touched

        if (brick instanceof GoldenBrick) {
          // this.ball.speed *= 1.5;
          pointsWon = 20;
          this.checkForNewHeart(pointsWon, lastBrickTouched);
          this.score += pointsWon;
          this.bricks.splice(index, 1);
        } else if (brick instanceof SilverBrick) {
          brick.hits++;
          if (brick.hits === 1) {
            this.ball.dy = -this.ball.dy;
          } else if (brick.hits === 2) {
            // this.ball.speed *= 0.75;
            pointsWon = 15;
            this.checkForNewHeart(pointsWon, lastBrickTouched);
            this.score += pointsWon;
            this.bricks.splice(index, 1);
          }
        } else {
          pointsWon = 10;
          this.score += pointsWon;
          this.bricks.splice(index, 1);
        }
      }
    });

    return lastBrickTouched;
  }

  /**
   * Checks and initializes a new heart if conditions are met.
   * @param {number} pointsWon - The points won during the collision.
   * @param {Brick|null} lastBrickTouched - The last brick touched by the ball.
   */
  checkForNewHeart(pointsWon, lastBrickTouched) {
    if (
      checkHundredsIncrease(this.score - pointsWon, pointsWon) &&
      !this.fallingHeart &&
      lastBrickTouched
    ) {
      this.fallingHeart = new Heart(
        lastBrickTouched.x + lastBrickTouched.width / 2,
        lastBrickTouched.y + lastBrickTouched.height
      );
    }
  }

  /**
   * Handles the falling heart's movement and collision.
   */
  handleFallingHeart() {
    if (this.fallingHeart) {
      this.fallingHeart.update();

      // Check collision with paddle
      if (
        this.fallingHeart.y + this.fallingHeart.size * 12 > this.paddle.y &&
        this.fallingHeart.x > this.paddle.x &&
        this.fallingHeart.x < this.paddle.x + this.paddle.width
      ) {
        this.lives++;
        this.fallingHeart = null;
      } else if (this.fallingHeart.y > this.canvas.height) {
        // If the heart goes off the screen, remove it
        this.fallingHeart = null;
      }
    }
  }

  /**
   * Renders game components.
   */
  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ball.draw(this.ctx);
    this.paddle.draw(this.ctx);
    this.bricks.forEach((brick) => brick.draw(this.ctx));

    this.ctx.font = "30px Arial";
    this.ctx.fillStyle = `hsl(${this.hue}, 100%, 50%)`; // Use the hue property
    this.ctx.fillText(`Score: ${this.score}`, 10, 30);
    this.ctx.fillText(`Lives: ${this.lives}`, this.canvas.width - 150, 30);

    // Draw falling heart
    if (this.fallingHeart) {
      this.fallingHeart.draw(this.ctx, this.hue);
    }
  }

  /**
   * Displays the game over screen.
   */
  gameOver() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.font = "30px Arial";
    this.ctx.fillStyle = `hsl(${this.hue}, 100%, 50%)`; // Use the hue property
    this.ctx.fillText(
      "Game Over",
      this.canvas.width / 2 - 75,
      this.canvas.height / 2 - 20
    );
    this.ctx.fillText(
      `Score: ${this.score}`,
      this.canvas.width / 2 - 75,
      this.canvas.height / 2 + 20
    );

    // Add an event listener to restart the game on click
    this.canvas.addEventListener("click", this.restartGame.bind(this), {
      once: true
    });
  }

  /**
   * Restarts the game.
   */
  restartGame() {
    // Reset game properties
    this.score = 0;
    this.lives = 3;
    this.initBricks();
    this.ball.reset(this.canvas);
    this.gameLoop();
  }
}

/**
 * Represents the ball in the game.
 */
class Ball {
  /**
   * Initializes a new ball instance.
   * @param {number} x - The x-coordinate of the ball's center.
   * @param {number} y - The y-coordinate of the ball's center.
   * @param {number} radius - The radius of the ball.
   */
  constructor(x, y, radius) {
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.speed = 4;
    this.dx = this.speed;
    this.dy = -this.speed;
    this.hue = 240; // Initial hue for blue
  }
  
  /**
   * Resets the ball to the center of the canvas.
   * @param {Object} canvas - The canvas element.
   */
  reset(canvas) {
    this.x = canvas.width / 2;
    this.y = canvas.height / 2;
    this.dx = this.speed;
    this.dy = -this.speed;
  }

  /**
   * Updates the ball's position and handles collisions.
   * @param {Object} canvas - The canvas element.
   * @param {Object} paddle - The paddle object.
   * @param {Function} onMiss - Callback function when the ball misses the paddle.
   */
  update(canvas, paddle, onMiss) {
    this.x += this.dx;
    this.y += this.dy;

    // Ball collision with walls
    if (this.x < 0 || this.x > canvas.width) this.dx = -this.dx;
    if (this.y < 0) this.dy = -this.dy;
    if (this.y > canvas.height) {
      onMiss();
    }

    // Ball collision with paddle
    if (
      this.y + this.radius > paddle.y &&
      this.x > paddle.x &&
      this.x < paddle.x + paddle.width
    ) {
      this.dy = -this.speed;
    }

    // hue
    this.hue += 1; // Increment the hue
    if (this.hue > 360) this.hue = 0; // Reset hue after a full rotation
  }
  
  /**
   * Renders the ball on the canvas.
   * @param {Object} ctx - The 2D context of the canvas.
   */
  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = `hsl(${this.hue}, 100%, 50%)`; // Use the hue property
    ctx.fill();
    ctx.closePath();
  }
}

/**
 * Represents the paddle in the game.
 */
class Paddle {
  /**
   * Initializes a new paddle instance.
   * @param {number} x - The x-coordinate of the paddle's top-left corner.
   * @param {number} y - The y-coordinate of the paddle's top-left corner.
   * @param {number} width - The width of the paddle.
   * @param {number} height - The height of the paddle.
   */
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.hue = 240;
  }
  
  /**
   * Updates the paddle's position based on boundaries and adjusts its hue.
   * @param {Object} canvas - The canvas element.
   */
  update(canvas) {
    if (this.x < 0) this.x = 0;
    if (this.x + this.width > canvas.width) this.x = canvas.width - this.width;
    this.hue += 1; // Increment the hue
    if (this.hue > 360) this.hue = 0; // Reset hue after a full rotation
  }
  
  /**
   * Renders the paddle on the canvas.
   * @param {Object} ctx - The 2D context of the canvas.
   */
  draw(ctx) {
    ctx.beginPath();
    ctx.rect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = `hsl(${this.hue}, 100%, 50%)`;
    ctx.fill();
    ctx.closePath();
  }
}

/**
 * Represents a brick in the game.
 */
class Brick {
  /**
   * Initializes a new brick instance.
   * @param {number} x - The x-coordinate of the brick's top-left corner.
   * @param {number} y - The y-coordinate of the brick's top-left corner.
   * @param {number} width - The width of the brick.
   * @param {number} height - The height of the brick.
   */
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.hue = 0; // Initial hue for red
  }

  /**
   * Renders the brick on the canvas with a hue shift.
   * @param {Object} ctx - The 2D context of the canvas.
   */
  draw(ctx) {
    this.hue += 1; // Increment the hue
    if (this.hue > 360) this.hue = 0; // Reset hue after a full rotation
    ctx.beginPath();
    ctx.rect(this.x, this.y, this.width, this.height);
    ctx.fillStyle = `hsl(${this.hue}, 100%, 50%)`;
    ctx.fill();
    ctx.closePath();
  }
}

/**
 * Represents a special golden brick in the game, which has additional effects or rewards.
 * Extends the basic Brick class.
 */
class GoldenBrick extends Brick {
  /**
   * Initializes a new golden brick instance.
   * @param {number} x - The x-coordinate of the brick's top-left corner.
   * @param {number} y - The y-coordinate of the brick's top-left corner.
   * @param {number} width - The width of the brick.
   * @param {number} height - The height of the brick.
   */
  constructor(x, y, width, height) {
    super(x, y, width, height);
    this.hue = 50; // Hue for golden color
  }

  /**
   * Overrides the draw method to render the golden brick on the canvas with a hue shift and a special power-up symbol (e.g., a small star).
   * @param {Object} ctx - The 2D context of the canvas.
   */
  draw(ctx) {
    super.draw(ctx);
    // Draw the star for the golden brick
    ctx.beginPath();
    ctx.moveTo(this.x + this.width * 0.5, this.y + this.height * 0.2);
    ctx.lineTo(this.x + this.width * 0.6, this.y + this.height * 0.8);
    ctx.lineTo(this.x + this.width * 0.2, this.y + this.height * 0.3);
    ctx.lineTo(this.x + this.width * 0.8, this.y + this.height * 0.3);
    ctx.lineTo(this.x + this.width * 0.4, this.y + this.height * 0.8);
    ctx.closePath();
    ctx.fillStyle = "yellow";
    ctx.fill();
  }
}

/**
 * Represents a special silver brick in the game, which requires multiple hits to be destroyed.
 * Extends the basic Brick class.
 */
class SilverBrick extends Brick {
  /**
   * Initializes a new silver brick instance.
   * @param {number} x - The x-coordinate of the brick's top-left corner.
   * @param {number} y - The y-coordinate of the brick's top-left corner.
   * @param {number} width - The width of the brick.
   * @param {number} height - The height of the brick.
   */
  constructor(x, y, width, height) {
    super(x, y, width, height);
    this.hue = 0; // Hue for silver color
    this.hits = 0; // Number of hits taken
  }

  /**
   * Overrides the draw to render the silver brick on the canvas. The brick's color changes after the first hit.
   * @param {Object} ctx - The 2D context of the canvas.
   */
  draw(ctx) {
    if (this.hits === 1) {
      ctx.fillStyle = `hsl(${this.hue}, 0%, 60%)`; // Darker silver after hit
    } else {
      ctx.fillStyle = `hsl(${this.hue}, 0%, 75%)`; // Original silver color
    }
    ctx.beginPath();
    ctx.rect(this.x, this.y, this.width, this.height);
    ctx.fill();
    ctx.closePath();
  }
}

/**
 * Draws a heart shape on the canvas using a pixelated approach.
 * @param {number} x - The x-coordinate of the top-left corner of the heart.
 * @param {number} y - The y-coordinate of the top-left corner of the heart.
 * @param {number} size - The size of each pixel square.
 * @param {string} color - The color of the heart.
 */
function drawHeart(ctx, x, y, size, color) {
  console.log(drawHeart);
  const heartPixels = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0],
    [0, 1, 1, 1, 1, 0, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    [0, 0, 1, 1, 1, 1, 1, 1, 1, 0, 0],
    [0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0],
    [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  ];

  for (let i = 0; i < heartPixels.length; i++) {
    for (let j = 0; j < heartPixels[i].length; j++) {
      if (heartPixels[i][j] === 1) {
        ctx.fillStyle = color;
        ctx.fillRect(x + j * size, y + i * size, size, size);
      }
    }
  }
}

/**
 * Checks if the score has increased by a multiple of 100.
 * @param {number} oldScore - The previous score before the points were added.
 * @param {number} pointsWon - The points recently won.
 * @returns {boolean} - Returns true if the score has increased by a multiple of 100, otherwise false.
 */
function checkHundredsIncrease(oldScore, pointsWon) {
  const newScore = oldScore + pointsWon;

  const oldHundreds = Math.floor(oldScore / 100);
  const newHundreds = Math.floor(newScore / 100);

  return newHundreds > oldHundreds;
}

/**
 * Represents a heart object in the game.
 * The heart can move downwards and can be drawn on the canvas.
 */
class Heart {
  /**
   * Creates a new Heart instance.
   * @param {number} x - The x-coordinate of the top-left corner of the heart.
   * @param {number} y - The y-coordinate of the top-left corner of the heart.
   */
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = 2;
    this.size = 3;
  }
  
  /**
   * Updates the position of the heart based on its speed.
   */
  update() {
    this.y += this.speed;
  }

  /**
   * Draws the heart on the canvas using the provided context and hue.
   * @param {CanvasRenderingContext2D} ctx - The 2D rendering context of the canvas.
   * @param {number} hue - The hue value for the heart's color.
   */
  draw(ctx, hue) {
    drawHeart(ctx, this.x, this.y, this.size, `hsl(${hue}, 100%, 50%)`);
  }
}


document.getElementById("startScreen").addEventListener("click", function () {
  this.style.display = "none";
  document.getElementById("gameCanvas").style.display = "block";
  new Game("gameCanvas");
});

function requestFullScreen() {
  if (!document.fullscreenElement) {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    } else if (document.documentElement.mozRequestFullScreen) { /* Firefox */
      document.documentElement.mozRequestFullScreen();
    } else if (document.documentElement.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
      document.documentElement.webkitRequestFullscreen();
    } else if (document.documentElement.msRequestFullscreen) { /* IE/Edge */
      document.documentElement.msRequestFullscreen();
    }
  }
}

document.addEventListener('click', requestFullScreen);