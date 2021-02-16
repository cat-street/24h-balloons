const sky = document.querySelector('.sky');
const startButton = document.querySelector('.start-button');
const scoreCounter = document.querySelector('.stats__score-count');
const missedCounter = document.querySelector('.stats__missed-count');
const timer = document.querySelector('.stats__timer');

const skyWidth = 800;
const skyHeight = 600;
const playerStartPosition = 400;
const time = 60;
const balloonTimers = [];
const popSound = new Audio('./assets/balloon_poping.mp3');
const windSound = new Audio('./assets/wind.mp3');

let balloonGenerateInterval;
let phaseInterval;
let timeCounter;
let windInterval;
let windTimeout;
let needlePoint = 420;
let speedRatio = 2;
let generationSpeed = 2000;
let wind = 0;
let score = 0;
let missed = 0;

const addPlayer = (playerStartPosition) => {
  const playerElement = document.createElement('div');
  const playerPlatform = document.createElement('div');
  const playerNeedle = document.createElement('div');
  playerElement.classList.add('player');
  playerElement.style.left = `${playerStartPosition}px`;
  playerPlatform.classList.add('player__platform');
  playerNeedle.classList.add('player__needle');
  playerElement.append(playerPlatform);
  playerElement.append(playerNeedle);
  return playerElement;
};

const drawPlayer = (player, left) => {
  if (typeof left === 'number') player.style.left = `${left}px`;
};

const movePlayer = (event, player) => {
  const leftPosition = parseInt(player.style.left);
  switch (event.key) {
    case 'ArrowLeft':
      if (leftPosition <= 0) return;
      player.style.left = `${leftPosition - 15}px`;
      needlePoint -= 15;
      return;
    case 'ArrowRight':
      if (leftPosition >= 760) return;
      player.style.left = `${leftPosition + 15}px`;
      needlePoint += 15;
      return;
    default:
      return;
  }
};

const createBalloon = (size, color, positionX, positionY) => {
  const balloonElement = document.createElement('div');
  const balloonBody = document.createElement('div');
  const balloonFlare = document.createElement('div');
  const balloonBottom = document.createElement('div');
  const balloonRope = document.createElement('div');
  balloonElement.append(balloonBody);
  balloonBody.append(balloonFlare);
  balloonElement.append(balloonBottom);
  balloonElement.append(balloonRope);
  balloonElement.classList.add('balloon');
  balloonBody.classList.add('balloon__body');
  balloonFlare.classList.add('balloon__flare');
  balloonBottom.classList.add('balloon__bottom');
  balloonRope.classList.add('balloon__rope');
  balloonElement.style.width = `${size}px`;
  balloonElement.style.height = `${size}px`;
  balloonElement.style.color = color;
  balloonElement.style.left = `${positionX}px`;
  balloonElement.style.top = `${positionY}px`;
  return balloonElement;
};

const removeBalloon = (currentBalloon) => {
  currentBalloon.remove();
};

const drawBallon = (currentBalloon, left, top) => {
  currentBalloon.style.left = `${left}px`;
  currentBalloon.style.top = `${top}px`;
};

const checkContact = (currentBalloon) => {
  const width = parseInt(currentBalloon.style.width);
  const left = parseInt(currentBalloon.style.left);
  return needlePoint >= left && needlePoint <= left + width;
};

const hitOrMiss = (currentBalloon, balloonTop, balloonHeight, timer) => {
  const cleanup = () => {
    clearInterval(timer);
    removeBalloon(currentBalloon);
  };

  if (balloonTop < 20 && balloonTop > 0) {
    if (checkContact(currentBalloon)) {
      popSound.currentTime = 0;
      popSound.play();
      score += 1;
      scoreCounter.textContent = score;
      cleanup();
    }
  }

  if (balloonTop < 0 - balloonHeight * 1.5) {
    missed += 1;
    missedCounter.textContent = missed;
    cleanup();
  }
};

const analyzeWind = (left, width) => {
  if (wind > 0) {
    if (left + width >= skyWidth) return 0;
    if (left < skyWidth / 4) return 3;
    else if (left < skyWidth / 2) return 2;
    return 1;
  }
  if (wind < 0) {
    if (left === 0) return 0;
    if (left + width > skyWidth * 0.75) return -3;
    else if (left + width > skyWidth / 2) return -2;
    return -1;
  }
  return 0;
};

const moveBalloon = (currentBalloon, height) => {
  const speed = parseInt(currentBalloon.style.width) / speedRatio;
  const balloonHeight = parseInt(height);

  const timer = setInterval(() => {
    let balloonTop = parseInt(currentBalloon.style.top);
    let balloonLeft = parseInt(currentBalloon.style.left);
    drawBallon(
      currentBalloon,
      balloonLeft + analyzeWind(balloonLeft, height),
      balloonTop - 1
    );
    hitOrMiss(currentBalloon, balloonTop, balloonHeight, timer);
  }, speed);
  balloonTimers.push(timer);
};

const addWind = () => {
  windInterval = setInterval(() => {
    wind = 0;
    windSound.pause();
    windTimeout = setTimeout(() => {
      wind = Math.floor(Math.random() * 3) - 1;
      if (wind !== 0) windSound.play();
    }, 3000);
  }, 5000)
}

const generateBalloon = () => {
  const randomSize = Math.random() * 30 + 30;
  const randomRed = (Math.random() * 255).toFixed();
  const randomGreen = (Math.random() * 255).toFixed();
  const randomBlue = (Math.random() * 255).toFixed();
  const randomColor = `rgb(${randomRed}, ${randomGreen}, ${randomBlue})`;
  const randomPosition = (Math.random() * (skyWidth - randomSize)).toFixed();
  const newBalloon = createBalloon(
    randomSize,
    randomColor,
    randomPosition,
    skyHeight
  );

  sky.append(newBalloon);
  moveBalloon(newBalloon, randomSize);
};

const formatTime = (time) => {
  let minutes = Math.floor(time / 6000).toString();
  let seconds = Math.floor((time % 6000) / 100).toString();
  let milliseconds = Math.floor(time % 100).toString();

  const addZero = (val) => {
    if (val.length === 1) {
      return `0${val}`;
    }
    return val;
  };

  minutes = addZero(minutes);
  seconds = addZero(seconds);
  milliseconds = addZero(milliseconds);

  return `${minutes}:${seconds}:${milliseconds}`;
};

const setTimer = () => {
  let currentTime = time * 100;
  timeCounter = setInterval(() => {
    timer.textContent = formatTime(currentTime);
    currentTime -= 1;
    if (currentTime < 0) {
      gameOver();
    };
  }, 10);
};

const gameOver = () => {
  clearInterval(balloonGenerateInterval);
  clearInterval(phaseInterval);
  clearInterval(timeCounter);
  clearInterval(windInterval);
  clearTimeout(windTimeout);
  windSound.currentTime = 0;
}

const reset = () => {
  gameOver();
  speedRatio = 2;
  generationSpeed = 2000;
  score = 0;
  missed = 0;
  timer.textContent = '00:00:00';
  scoreCounter.textContent = '0';
  missedCounter.textContent = '0';
  const strayBalloons = Array.from(document.querySelectorAll('.balloon'));
  strayBalloons.map((el) => removeBalloon(el));
  balloonTimers.map((el) => clearInterval(el));
  balloonTimers.splice(0, balloonTimers.length);
};

const initNewGame = () => {
  setTimer();
  addWind();

  // start balloons generation
  balloonGenerateInterval = setInterval(
    () => generateBalloon(),
    generationSpeed
  );

  // speed up balloons
  phaseInterval = setInterval(() => {
    clearInterval(balloonGenerateInterval);
    generationSpeed -= 500;
    speedRatio += 1.2;

    balloonGenerateInterval = setInterval(
      () => generateBalloon(),
      generationSpeed
    );

    if (generationSpeed < 500) {
      clearInterval(balloonGenerateInterval);
      clearInterval(phaseInterval);
    }
  }, 15000);
};

const player = addPlayer(playerStartPosition);
sky.append(player);

document.addEventListener('keydown', (event) => {
  movePlayer(event, player);
});

startButton.addEventListener('click', () => {
  startButton.textContent = 'RESTART';
  reset();
  initNewGame();
});
