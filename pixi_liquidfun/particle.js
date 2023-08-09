class Particle {
  constructor(x, y, partSys, substance, particleGroup) {
    this.substance = substance;
    this.particleGroup = particleGroup;

    const colors = {
      water: "0x5555ff",
      steam: "0xaaaaff",
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

    this.highlighted = false;
  }

  createSprite() {
    //we use the other one createCircle()
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
  unHighlight() {
    if (!this.highlighted) return;
    this.highlighted = false;
    this.graphics.clear();
    this.graphics.beginFill(this.color);
    this.graphics.drawCircle(0, 0, this.particleSystem.PARTICLE_WIDTH / 2);
    this.graphics.endFill();
  }

  highlight() {
    if (this.highlighted) return;
    this.highlighted = true;
    this.graphics.clear();
    this.graphics.beginFill("0xffffff");
    this.graphics.drawCircle(0, 0, this.particleSystem.PARTICLE_WIDTH / 2);
    this.graphics.endFill();
    // this.particleSystem.pixiApp.stage.addChild(this.graphics);
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
    let arr = [...this.getParticlesFromCell()];

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
      this.cell = this.particleSystem.grid[this.cellX][this.cellY];
      this.cell.addMe(this);
    } catch (e) {
      // console.log(this.cellY);
    }

    // return ret;
  }
  update(x, y, velX, velY) {
    this.velX = velX;
    this.velY = velY;
    // console.log(x, y);
    this.x = x;
    this.y = y;

    if (this.substance == "steam") this.applyForceUpwardsIfSteam();

    this.updateMyPositionInCell();

    this.render();
  }

  applyForceUpwardsIfSteam() {
    let force = 300 * 1000;
    this.particleGroup.ApplyForce(new b2Vec2(0, force));
  }
}
