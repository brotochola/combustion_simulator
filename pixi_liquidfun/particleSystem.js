class ParticleSystem {
  constructor() {
    this.timeStep = 1.0 / 60.0;
    this.velocityIterations = 8;
    this.positionIterations = 3;
    this.ground;

    this.world;
    this.FRAMENUM = 0;
    this.grid = [];

    this.PARTICLE_WIDTH = 10;
    this.CELL_SIZE = this.PARTICLE_WIDTH * 5;
    this.particles = [];
    this.canvas;
    this.renderer;
    this.loader;
    this.pixiApp;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.res;
    this.pause = false;
    this.gravity;
    this.psd; //particle system def
    this.particleSystemObject;
    this.gravityYVal = -1000;
  }

  createGrid() {
    for (let i = 0; i < window.innerWidth / this.CELL_SIZE; i++) {
      this.grid[i] = [];
      for (let j = 0; j < window.innerHeight / this.CELL_SIZE; j++) {
        this.grid[i][j] = new Cell(i, j, this.CELL_SIZE, this.grid);
      }
    }
    return this.grid;
  }

  createPixiStage(cb) {
    this.renderer = PIXI.autoDetectRenderer(this.width, this.height, {
      backgroundColor: "#ffffff",
      antialias: true,
      transparent: false,
      resolution: 1,
      autoresize: false,
    });
    this.loader = PIXI.Loader.shared;
    this.pixiApp = new PIXI.Application({
      width: this.width,
      height: this.height,
    });

    this.loader.add("water", "water.png");
    this.loader.add("wood", "wood.png");
    this.loader.load((loader, resources) => {
      this.res = resources;

      if (cb instanceof Function) cb();
    });
  }

  createWater() {
    let circle = new b2CircleShape();
    circle.position.Set(window.innerWidth / 2, -window.innerHeight / 2);
    circle.radius = 200;
    let pgd = new b2ParticleGroupDef();

    console.log("#particle group", pgd);
    // pgd.groupFlags = b2_springParticle; //b2_rigidParticleGroup | b2_solidParticleGroup;
    pgd.shape = circle;
    // pgd.color.Set(255, 0, 0, 255);
    this.wateryGroup = this.particleSystemObject.CreateParticleGroup(pgd);

    for (let i = 0; i < this.wateryGroup.GetParticleCount(); i++) {
      this.particles.push(new Particle(null, null, this, "water"));
    }
  }

  createParticleGroupForCustomParticles() {}

  createOneParticleOfWater() {
    let circle = new b2CircleShape();
    circle.position.Set(window.innerWidth / 2, -100);
    circle.radius = this.PARTICLE_WIDTH;
    let pgd = new b2ParticleGroupDef();
    // console.log("#particle group", pgd)
    pgd.groupFlags = b2_elasticParticle; // b2_viscousParticle;
    // pgd.flags = b2_elasticParticle;
    pgd.shape = circle;
    // pgd.color.Set(255, 0, 0, 255);
    let group = this.particleSystemObject.CreateParticleGroup(pgd);

    for (let i = 0; i < group.GetParticleCount(); i++) {
      this.particles.push(new Particle(null, null, this, "water"));
    }
  }

  createOneParticleOfSteam() {
    let circle = new b2CircleShape();
    circle.position.Set(
      window.innerWidth / 2 + Math.random() * 10,
      -window.innerHeight + Math.random() * 10
    );
    circle.radius = this.PARTICLE_WIDTH / 2.5;
    let pgd = new b2ParticleGroupDef();
    // console.log("#particle group", pgd)
    pgd.groupFlags = b2_zombieParticle;
    pgd.shape = circle;
    // pgd.color.Set(255, 0, 0, 255);
    let group = this.particleSystemObject.CreateParticleGroup(pgd);
    let count = group.GetParticleCount();
    // console.log(count);
    for (let i = 0; i < count; i++) {
      this.particles.push(new Particle(null, null, this, "steam", group));
    }
  }

  createPieceOfWood() {
    //bloque azul rigido
    let box = new b2PolygonShape();
    let pgd2 = new b2ParticleGroupDef();
    box.SetAsBoxXY(10, 100);
    pgd2.groupFlags = b2_rigidParticleGroup | b2_solidParticleGroup;
    pgd2.position.Set(100, -100);
    pgd2.angle = -0.5;
    pgd2.angularVelocity = Math.random();
    pgd2.shape = box;
    pgd2.color.Set(0, 0, 255, 255);
    this.blueRigidGroup = this.particleSystemObject.CreateParticleGroup(pgd2);

    //create the aprticles that we're gonna render
    for (let i = 0; i < this.blueRigidGroup.GetParticleCount(); i++) {
      this.particles.push(new Particle(null, null, this, "wood"));
    }
  }

  init() {
    console.log("init");
    this.grid = this.createGrid();

    this.createPixiStage(() => {
      this.canvas = this.pixiApp.view;

      this.canvas.id = "renderCanvas";
      this.canvas.onclick = (e) => this.handleClickOnCanvas(e);
      this.canvas.onmousemove = (e) => this.handleMouseMoveOnCanvas(e);
      this.canvas.onmousedown = (e) => (this.mousePressed = true);
      this.canvas.onmouseup = (e) => this.handleMouseUp();
      document.body.appendChild(this.canvas);
      this.createBox2DWorld();
      this.createFloorAndObjects();
      this.createWater();
      this.createPieceOfWood();
      this.gameLoop();
    });
  }
  handleMouseUp() {
    this.mousePressed = false;
    this.unHighlightAllParticles();
  }
  unHighlightAllParticles() {
    for (let p of this.particles) {
      p.unHighlight();
    }
  }

  handleMouseMoveOnCanvas(e) {
    if (!this.mousePressed) return;
    this.unHighlightAllParticles();
    let x = e.offsetX;
    let y = e.offsetY;

    let cellX = Math.floor(x / this.CELL_SIZE);
    let cellY = Math.floor(y / this.CELL_SIZE);
    let cell = this.grid[cellX][cellY];
    for (let p of cell.particlesHere) {
      p.highlight();
    }
  }
  handleClickOnCanvas() {}

  createFloorAndObjects = () => {
    let height = this.height;
    let width = this.width;
    console.log("createFloorAndObjects");
    // camera.position.y = 3;
    // camera.position.z = 6;

    let bd = new b2BodyDef();
    this.ground = this.world.CreateBody(bd);

    //GROUND
    let shape1 = new b2PolygonShape();
    shape1.vertices.push(new b2Vec2(0, -height));
    shape1.vertices.push(new b2Vec2(width, -height));
    shape1.vertices.push(new b2Vec2(width, -height - 50));
    shape1.vertices.push(new b2Vec2(0, -height - 50));
    this.ground.CreateFixtureFromShape(shape1, 0);

    //ROOF:
    let roof = new b2PolygonShape();
    roof.vertices.push(new b2Vec2(0, 0));
    roof.vertices.push(new b2Vec2(0, -10));
    roof.vertices.push(new b2Vec2(width, 0));
    roof.vertices.push(new b2Vec2(width, -10));
    this.ground.CreateFixtureFromShape(roof, 0);

    //LEFT WALL
    let shape2 = new b2PolygonShape();
    shape2.vertices.push(new b2Vec2(0, 0));
    shape2.vertices.push(new b2Vec2(10, 0));
    shape2.vertices.push(new b2Vec2(0, -height));
    shape2.vertices.push(new b2Vec2(10, -height));
    this.ground.CreateFixtureFromShape(shape2, 0);

    //RIGHT WALL
    let shape3 = new b2PolygonShape();
    shape3.vertices.push(new b2Vec2(width, 0));
    shape3.vertices.push(new b2Vec2(width + 10, 0));
    shape3.vertices.push(new b2Vec2(width, -height));
    shape3.vertices.push(new b2Vec2(width + 10, -height));
    this.ground.CreateFixtureFromShape(shape3, 0);

    this.psd = new b2ParticleSystemDef();
    this.psd.powderStrength = 100000;
    this.psd.springStrength = 999;
    this.psd.lifetimeGranularity = 99;
    this.psd.surfaceTensionNormalStrength = 99;
    this.psd.surfaceTensionPressureStrength = 9999;
    this.psd.viscousStrength = -9999;
    this.psd.radius = this.PARTICLE_WIDTH / 2;
    this.particleSystemObject = this.world.CreateParticleSystem(this.psd);

    // one group
    //AGUA!!!
    // let  circle = new b2CircleShape();
    // circle.position.Set(100, 0);
    // circle.radius = 100;
    // let  pgd = new b2ParticleGroupDef();
    // // console.log("#particle group", pgd)
    // // pgd.groupFlags = b2_rigidParticleGroup | b2_solidParticleGroup;
    // pgd.shape = circle;
    // pgd.color.Set(255, 0, 0, 255);
    // let partGr = particleSystem.CreateParticleGroup(pgd);
    // console.log("#partGR", partGr)

    // two group
    //ELASTICO
    // circle = new b2CircleShape();
    // circle.position.Set(-1, 3);
    // circle.radius = 0.5;
    // pgd = new b2ParticleGroupDef();
    // // pgd.groupFlags = b2_springParticle | b2_solidParticleGroup;;
    // pgd.flags = b2_elasticParticle;
    // // console.log(pgd.flags)
    // // pgd.groupFlags = b2_solidParticleGroup;
    // pgd.shape = circle;
    // pgd.color.Set(0, 255, 0, 255);
    // particleSystem.CreateParticleGroup(pgd);

    // third group
    //bloque azul rigido
    // let  box = new b2PolygonShape();
    // let  pgd = new b2ParticleGroupDef();
    // box.SetAsBoxXY(1, 0.5);
    // pgd.groupFlags = b2_rigidParticleGroup | b2_solidParticleGroup;;
    // pgd.position.Set(1, 4);
    // pgd.angle = -0.5;
    // pgd.angularVelocity = 2;
    // pgd.shape = box;
    // pgd.color.Set(0, 0, 255, 255);
    // particleSystem.CreateParticleGroup(pgd);

    // MANEJABLE!

    // let bodyDef3 = new b2BodyDef()
    // // console.log("#bodyDef3", bodyDef3)
    // let  circle = new b2CircleShape();
    // bodyDef3.type = b2_dynamicBody;
    // let  body = world.CreateBody(bodyDef3);
    // // console.log("body", body)
    // circle.position.Set(0, 8);
    // circle.radius = 0.2;
    // body.CreateFixtureFromShape(circle, 10);
  };

  createBox2DWorld = () => {
    this.gravity = new b2Vec2(0, this.gravityYVal);
    this.world = new b2World(this.gravity);
    window.world = this.world;
  };

  oneStepOfGameLoop = () => {
    // tickOfQuadTree();

    this.world.Step(
      this.timeStep,
      this.velocityIterations,
      this.positionIterations
    );

    this.updateParticles();
  };

  updateParticles() {
    for (let i = 0; i < this.world.particleSystems.length; i++) {
      let system = this.world.particleSystems[i];

      let particlesFromLiquidFun = system.GetPositionBuffer();
      let velocities = system.GetVelocityBuffer();

      // let  color = system.GetColorBuffer();
      // let  maxParticles = particlesFromLiquidFun.length

      for (let i = 0; i < particlesFromLiquidFun.length; i += 2) {
        if (this.particles[i * 0.5]) {
          let x = particlesFromLiquidFun[i];
          let y = particlesFromLiquidFun[i + 1];

          let velX = velocities[i];
          let velY = velocities[i + 1];
          this.particles[i * 0.5].update(x, y, velX, velY);
        }
      }
    }
  }

  renderEverything = () => {
    this.pixiApp.render(this.pixiApp.stage);
  };

  gameLoop = () => {
    if (!this.pause) {
      this.FRAMENUM++;
      this.oneStepOfGameLoop();

      // window.durationOfFrame = Date.now() - (window.lastFrame || 0);
      // window.lastFrame = Date.now();
      // window.frameRate = 1000 / durationOfFrame;

      // if (SAVE_GENERAL_STATS) {
      //     getStatsData();
      //     showDataInControlPanel();
      // }

      this.renderEverything();
      requestAnimationFrame(() => this.gameLoop());
    }
  };
}
