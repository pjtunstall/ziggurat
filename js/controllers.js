import { Model } from "./models.js";
import { View } from "./views.js";

export class Controller {
  model;
  view;
  keysPressed;
  loopId;
  time;
  count;

  constructor(model, view) {
    this.time = 0;
    this.count = 0;
    this.model = model;
    this.view = view;
    this.keysPressed = new Set();
    this.view.addEventListener("keydown", (keyCode) =>
      this.handleKeydown(keyCode)
    );
    this.view.addEventListener("keyup", (keyCode) => this.handleKeyup(keyCode));
    this.view.addEventListener("click", (x, y) => this.handleClick(x, y));
  }

  handleKeydown(keyCode) {
    this.keysPressed.add(keyCode);
  }

  handleKeyup(keyCode) {
    this.keysPressed.clear(keyCode);
    switch (keyCode) {
      case "Tab":
      case "KeyQ":
        this.model.speed = this.model.normal;
    }
  }

  // Called from `this.loop` on each key code in the set `keysPressed` so as to allow multiple key presses to be processed at once.
  actOnKeydown(keyCode) {
    switch (keyCode) {
      case "Tab":
        this.model.speed = this.model.slow;
        break;
      case "KeyQ":
        this.model.speed = this.model.fast;
        break;
      case "ArrowUp":
        this.translate("y", -1, this.model.omega);
        break;
      case "ArrowDown":
        this.translate("y", 1, this.model.omega);
        break;
      case "ArrowLeft":
        this.translate("x", -1, this.model.omega);
        break;
      case "ArrowRight":
        this.translate("x", 1, this.model.omega);
        break;
      case "KeyZ": {
        this.roll(-Math.PI / 64);
        break;
      }
      case "KeyX":
        this.roll(Math.PI / 64);
        break;
      case "Space":
        this.model = new Model();
        this.view = new View();
        break;
    }
  }

  handleClick(x, y) {
    this.roll(-this.model.theta, this.model.midX, this.model.midY);
    const deltaX = x - this.model.midX;
    const deltaY = y - this.model.midY;
    this.translate("x", 1, -deltaX);
    this.translate("y", 1, -deltaY);
    this.roll(this.model.theta, this.model.midX, this.model.midY);
  }

  // ILP-optimized loop. See README for the naive, but more readable version and a discussion of performance.
  translate(axis, sign, distance) {
    for (let i = 0; i < Math.floor(this.model.rects.length / 4); i++) {
      this.model.rects[4 * i][axis] -= sign * distance;
      this.model.rects[4 * i + 1][axis] -= sign * distance;
      this.model.rects[4 * i + 2][axis] -= sign * distance;
      this.model.rects[4 * i + 3][axis] -= sign * distance;
    }
    for (let i = 0; i < this.model.rects.length % 4; i++) {
      this.model.rects[this.model.rects.length - 1 - i][axis] -=
        sign * distance;
    }
  }

  roll(deltaRoll) {
    this.view.roll(deltaRoll, this.model.midX, this.model.midY);
    this.model.theta += deltaRoll;
  }

  zoom(rect) {
    const widthIncrease = rect.width * this.model.speed;
    const heightIncrease = rect.height * this.model.speed;

    rect.width += widthIncrease;
    rect.height += heightIncrease;

    rect.x -= widthIncrease / 2;
    rect.y -= heightIncrease / 2;
  }

  loop() {
    requestAnimationFrame(() => this.loop());

    this.keysPressed.forEach((code) => {
      this.actOnKeydown(code);
    });

    this.view.clearCanvas();

    this.model.spawnRect();

    // ILP-optimized loop. See README for a discussion of performance and for the naive version.
    for (let i = 0; i < Math.floor(this.model.rects.length / 4); i++) {
      this.zoom(this.model.rects[4 * i]);
      this.zoom(this.model.rects[4 * i + 1]);
      this.zoom(this.model.rects[4 * i + 2]);
      this.zoom(this.model.rects[4 * i + 3]);
      this.view.drawRect(this.model.rects[4 * i]);
      this.view.drawRect(this.model.rects[4 * i + 1]);
      this.view.drawRect(this.model.rects[4 * i + 2]);
      this.view.drawRect(this.model.rects[4 * i + 3]);
    }
    for (let i = 0; i < this.model.rects.length % 4; i++) {
      this.zoom(this.model.rects[this.model.rects.length - 1 - i]);
    }

    if (this.model.rects.length > 255) {
      this.model.rects = this.model.rects.slice(1);
    }

    this.view.drawCrosshairs(this.model.midX, this.model.midY);
  }

  startLoop() {
    this.loopId = requestAnimationFrame(() => this.loop());
  }
}
