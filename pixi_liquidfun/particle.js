class Particle {
  constructor(x, y, partSys, substance) {
    this.substance = substance;

    const colors = {
      water: "0x5555ff",
      wood: "0x995500",
    };

    this.color = colors[this.substance];
    this.particleSystem = partSys;
    this.x = x;
    this.y = y;

    // this.createSprite();

    this.createCircle();

    // pixiApp.stage.addChild(graphics);

    // let radius = system.radius;
    // let x = particles[i];
    // let y = particles[i + 1];

    // if (i % 10 == 0) console.log(y)

    partSys.pixiApp.stage.addChild(this.graphics);
  }

  createSprite() {
    this.graphics = new PIXI.Sprite(
      this.particleSystem.res[this.substance].texture
    );
    this.graphics.anchor.set(0.5);

    this.graphics.scale.x =
      this.particleSystem.PARTICLE_WIDTH /
      this.particleSystem.res[this.substance].data.width;
    this.graphics.scale.y = this.graphics.scale.x;
  }

  createCircle() {
    this.graphics = new PIXI.Graphics();
    this.graphics.beginFill(this.color);
    this.graphics.drawCircle(
      this.x,
      this.y,
      this.particleSystem.PARTICLE_WIDTH / 2
    );
    this.graphics.endFill();
    this.particleSystem.pixiApp.stage.addChild(this.graphics);
  }
  render() {
    this.graphics.x = this.x;
    this.graphics.y = -this.y;
  }

  getParticlesFromCell() {
    return this.cell.particlesHere;
  }
  getParticlesFromCloseCells() {
    if (!this.cell) return;
    let arr = [];
    for (let cell of this.cell.getNeighbours()) {
      for (let p of cell.particlesHere) {
        arr.push(p);
      }
    }
    return arr;
  }

  updateMyPositionInCell() {
    // let ret;

    if (this.cell) this.cell.removeMe(this);

    this.cellX = Math.floor(this.x / this.particleSystem.CELL_SIZE);
    this.cellY = Math.floor(-this.y / this.particleSystem.CELL_SIZE);

    try {
      this.cell = grid[this.cellX][this.cellY];
      this.cell.addMe(this);
    } catch (e) {
      // console.log(this.cellY);
    }

    // return ret;
  }
  update(x, y) {
    // console.log(x, y);
    this.x = x;
    this.y = y;

    this.updateMyPositionInCell();

    this.render();
  }
}
