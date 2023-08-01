// https://codepen.io/davepvm/pen/Hhstl
// Particle class representing each molecule
class Particle {
  constructor(
    x,
    y,
    substance,
    temperature,
    particleSystem,
    energyContained,
    isStatic,
    doNotAddBodyToWorld
  ) {
    this.isStatic = isStatic;
    this.particleSystem = particleSystem;
    this.Matter = particleSystem.Matter;
    this.engine = particleSystem.engine;

    this.diameter = particleSystem.config[substance].diameter;
    this.maxNumberOfConnectionsPerBody =
      particleSystem.config[substance].maxNumberOfConnectionsPerBody;
    this.maxDistanceToAttach =
      particleSystem.config[substance].maxDistanceToAttach;

    this.world = particleSystem.world;
    this.x = x; // x-coordinate
    this.y = y; // y-coordinate

    this.substance = substance || "wood"; // substance of the particle

    let defaultColors = {
      wood: {
        fillStyle: getRandomBrownishColor(0.66, 1),
        strokeStyle: getRandomBrownishColor(0.3, 0.7),
      },
      woodGas: {
        fillStyle: "none",
        strokeStyle: "none",
      },
      water: {
        fillStyle: "blue",
        strokeStyle: "none",
      },
    };

    this.defaultColor = defaultColors[this.substance];

    this.createBody(doNotAddBodyToWorld);
    if (this.substance != "woodGas") this.createCircleInPixi();

    this.nearParticles = [];

    this.heatCapacityAccordingToSubstance();
    this.massAccordingToSubstance();
    this.calculateEneryContained(energyContained);
    this.thermalConductivityAccordingToSubstance();
    this.burningTemperatureAccordingToSubstance();

    this.temperature = temperature || 20;
    this.setStartingState();

    this.onFire = this.substance == "woodGas"; //woodgas starts burning
    this.updateMyPositionInCell();
  }

  setStartingState() {
    if (
      this.temperature < this.evaporationTemperature &&
      this.temperature > this.freezingTemperature
    ) {
      this.state = "liquid";
    } else if (this.temperature < this.freezingTemperature) {
      this.state = "solid";
      // this.freeze();
    } else if (this.temperature > this.evaporationTemperature) {
      this.state = "gas";
      // this.evaporate();
    } else if (this.temperature < this.evaporationTemperature) {
      this.state = "liquid";
      // this.condense();
    }
  }

  stateAccordingToTemperature() {
    if (
      this.freezingTemperature == undefined ||
      this.evaporationTemperature == undefined
    ) {
      return;
    }
    //DOES THIS SUBSTANCE MELT AND FREEZE?
    //WOOD AND WOODGAS DON'T
    //WATER DOES

    if (
      this.temperature < this.evaporationTemperature &&
      this.temperature > this.freezingTemperature &&
      this.state == "solid"
    ) {
      // this.state = "liquid";
      this.melt();
    } else if (
      this.temperature < this.freezingTemperature &&
      this.state == "liquid"
    ) {
      // this.state = "solid";
      this.freeze();
    } else if (
      this.temperature > this.evaporationTemperature &&
      this.state == "liquid"
    ) {
      // this.state = "gas";
      this.evaporate();
    } else if (
      this.temperature < this.evaporationTemperature &&
      this.state == "gas"
    ) {
      // this.state = "liquid";
      this.condense();
    }
  }

  createBody(doNotAddBodyToWorld) {
    let renderTypes = {
      wood: {
        visible: false,
      },
      woodGas: {
        visible: false,
      },
      water: {
        visible: false,
      },
    };

    let slops = {
      wood: 0, // this.diameter,
      woodGas: -this.diameter * 2,
      water: -1, //this.diameter,
    };

    //for the simulation, not to calculate energies:
    let masses = {
      wood: 0,
      woodGas: 0,
      water: 0,
    };
    let bodyOptions = {
      restitution: this.substance == "wood" ? 0.1 : 0.1,
      mass: masses[this.substance],
      friction: this.substance == "wood" ? 1 : 0,
      slop: slops[this.substance],
      // frictionAir: 0,
      // isSensor: true,
      render: renderTypes[this.substance],
      isStatic: !!this.isStatic,
      // density: 99999999999999
      // mass: 0
      plugin: {
        // attractors: [
        //   (bodyA, bodyB) => {
        //     let factor = this.getAttractionFactorAccordingToTemperature();
        //     let distX = bodyA.position.x - bodyB.position.x;
        //     let distY = bodyA.position.y - bodyB.position.y;
        //     return {
        //       x: (bodyA.position.x - bodyB.position.x) * 1e-6 * factor,
        //       y: (bodyA.position.y - bodyB.position.y) * 1e-6 * factor,
        //     };
        //   },
        // ],
      },
    };

    this.body = this.Matter.Bodies.circle(
      this.x,
      this.y,
      this.diameter,
      bodyOptions
    );

    this.body.constraints = []; //i need to keep track which constraints each body has
    this.body.particle = this;

    if (!doNotAddBodyToWorld) this.world.add(this.engine.world, [this.body]);
  }

  getAttractionFactorAccordingToTemperature() {
    // -272 :2
    // this.freezingTemperature -> 1
    // this.evaporationTemperature ->0
    // this.maxTemperature -> -1

    if (this.temperature < this.freezingTemperature) {
      let maxFactor = 2;
      let minFactor = 1;
      // -272 -> maxFactor
      // this.freezingTemperature ->minFactor
      // this.temperature -> x

      let m = (maxFactor - minFactor) / (-this.freezingTemperature - 272);

      let b =
        maxFactor +
        (272 * (maxFactor - minFactor)) / (-this.freezingTemperature - 272);

      return m * this.temperature + b;
    } else if (
      this.temperature > this.freezingTemperature &&
      this.temperature < this.evaporationTemperature
    ) {
      return 0;
    } else if (this.temperature > this.evaporationTemperature) {
      return -1;
    }
  }
  burningTemperatureAccordingToSubstance() {
    if (this.substance == "wood") {
      this.burningTemperature = 250;
      this.maxTemperature = 1093;
    } else if (this.substance == "woodGas") {
      this.burningTemperature = 200; //lower than wood
      this.maxTemperature = 1200; //roughly accurate
    } else if (this.substance == "water") {
      this.evaporationTemperature = 100;
      this.freezingTemperature = 0;
      this.maxTemperature = 375;
    }
  }
  thermalConductivityAccordingToSubstance() {
    if (this.substance == "wood") this.thermalConductivity = 0.000025;
    else if (this.substance == "woodGas")
      this.thermalConductivity = 0.0000025; //10x less
    else if (this.substance == "water") this.thermalConductivity = 0.0075; //water has 3x the thermal conductivity of wood
  }
  calculateEneryContained(energyContained) {
    //energy contained in joules
    // if (this.substance == "wood") this.energyContained = this.mass * 10000
    if (this.substance == "wood") {
      this.energyContained = this.mass * 2000000000;
      this.originalEnergycontained = this.mass * 2000000000;
    } else if (this.substance == "woodGas") {
      //WHEN WOODGAS IS LIBERATED, I WANT IT TO HAVE THE ENERGY THAT I TAKE OUT FROM THE WOOD
      if (energyContained) {
        this.energyContained = energyContained;
        this.originalEnergycontained = energyContained;
      } else {
        //10x less than wood
        this.energyContained = this.mass * 200000000;
        this.originalEnergycontained = this.mass * 200000000;
      }
    }
  }
  heatCapacityAccordingToSubstance() {
    //energy in joules to raise this particles (1mm3) 1 degree C
    if (this.substance == "wood") this.heatCapacity = 0.001025;
    else if (this.substance == "woodGas")
      this.heatCapacity = 0.0015; //50% than wood
    else if (this.substance == "water") this.heatCapacity = 0.0031; //3x wood
  }
  massAccordingToSubstance() {
    //mass in grams
    //each particle is 1mm3
    //0,0005gr / mm3

    if (this.substance == "wood") this.mass = 0.0005;
    else if (this.substance == "woodGas") this.mass = 0.00005;
    else if (this.substance == "water") this.mass = 0.0007;
  }
  applyHeat(joules) {
    this.temperature += Math.floor(joules) * this.heatCapacity;
  }

  remove(opt) {
    // console.log("removing");

    try {
      this.cell.removeMe(this);
    } catch (e) {
      console.warn("no cell");
    }

    for (let constr of this.body.constraints) {
      this.world.remove(this.engine.world, constr);
    }

    this.particleSystem.pixiApp.stage.removeChild(this.graphics);

    if (this.isPartOfABody) {
      //REMOVE THIS PARTICLE FROM THE BODY
      this.body.parent.parts = this.body.parent.parts.filter(
        (k) => k != this.body
      );
      //CHECK IF IT'S EMPTY
      this.particleSystem.removeEmptyCompoundBodies();
    } else {
      this.world.remove(this.engine.world, this.body);
    }

    this.particleSystem.particles = this.particleSystem.particles.filter(
      (k) => k.body.id != this.body.id
    );

    // if ((opt || {}).leaveAshes) {
    // }
  }
  releaseWoodGas(energy) {
    //   addParticle(x, y, substance, temperature, energy) {
    // console.log(energy);
    // debugger;
    this.particleSystem.addParticle(
      this.x - this.diameter * 0.5 + Math.random() * this.diameter,
      this.y - this.diameter,
      "woodGas",
      this.temperature,
      energy,
      false,
      false
    );
  }

  burn() {
    //when it burns, it converts to another substance
    //and releases heat
    this.onFire = true;
    // if (this.substance == "woodGas") debugger;

    let minEnergyToBeLiberated =
      this.substance == "wood"
        ? this.originalEnergycontained * 0.04
        : this.originalEnergycontained * 0.1;
    let howMuchEnergyGetsActuallyLiberated = minEnergyToBeLiberated;

    ////////
    //FIX ME: THE ENERGY TRANSFERED FROM A BURNING PARTICLE TO THE REST
    // SHOULD BE ACCORDING TO THE DISTANCE BETWEEN THEM
    //////

    let howManyNearParts = this.nearParticles.length + 1;
    let howMuchEnergyPerClosePArticle =
      howMuchEnergyGetsActuallyLiberated / howManyNearParts;

    let counterOfEnergyLiberatedInThisFrame = 0;
    for (const p of [...this.nearParticles, this]) {
      //the amount of energy to be released goes to other particles
      //also to itself!
      if (!p.amIBelowMaxTemp()) {
        continue;
      }

      let howMuchEnergyForThisParticle =
        p.body.position.y < this.body.position.y
          ? howMuchEnergyPerClosePArticle * 1.5
          : howMuchEnergyPerClosePArticle / 1.5;

      p.applyHeat(howMuchEnergyForThisParticle);
      counterOfEnergyLiberatedInThisFrame += howMuchEnergyForThisParticle;
    } //for

    //SOME NERGY GOES TO HEAT OTHER PARTICLES.
    this.energyContained -= counterOfEnergyLiberatedInThisFrame;

    //SOME OTHER ENERGY TRANSFORMS TO NEW PARTICLES OF WOODGAS
    if (this.substance == "wood" && this.COUNTER % 2 == 0) {
      this.releaseWoodGas(howMuchEnergyGetsActuallyLiberated);
      this.energyContained -= howMuchEnergyGetsActuallyLiberated;
    }
  }

  amIBelowMaxTemp() {
    return this.temperature < this.maxTemperature;
  }

  transferTemperatureToSurroundingParticles() {
    for (const particle of this.nearParticles) {
      if (particle == this) continue;
      const distance = Math.sqrt(
        Math.pow(this.x - particle.x, 2) + Math.pow(this.y - particle.y, 2)
      );
      // debugger;

      const avg = (this.temperature + particle.temperature) / 2;
      const avgThermalConductivity =
        (this.thermalConductivity + particle.thermalConductivity) / 2;

      // console.log(
      //   "transfering temp",
      //   this.temperature,
      //   particle.temperature,
      //   (avg / distance) * avgThermalConductivity
      // );

      let tempToTransfer = (Math.abs(avg) / distance) * avgThermalConductivity;

      if (this.temperature > particle.temperature) {
        this.temperature -= tempToTransfer;
        particle.temperature += tempToTransfer;
      } else {
        this.temperature += tempToTransfer;
        particle.temperature -= tempToTransfer;
      }
    }
  }

  removeAllMyConstraints() {
    for (let constr of this.body.constraints) {
      this.world.remove(this.engine.world, constr);
    }
  }
  melt() {
    this.state = "liquid";
    this.removeAllMyConstraints();
  }
  freeze() {
    this.state = "solid";
    if (
      this.body.constraints.length <
      this.particleSystem.config[this.substance].maxNumberOfConnectionsPerBody
    ) {
      this.particleSystem.addAutomaticConnections([this]);
    }
  }
  evaporate() {
    this.state = "gas";
    this.removeAllMyConstraints();
  }
  condense() {
    this.state = "liquid";
    this.removeAllMyConstraints();
  }

  heatUp(degrees) {
    this.temperature += degrees;
  }
  updateMyPositionInCell() {
    // let ret;

    this.cellX = Math.floor(this.x / this.particleSystem.CELL_SIZE);
    this.cellY = -Math.floor(-this.y / this.particleSystem.CELL_SIZE);
    if (isNaN(this.cellY)) {
      console.warn(this);
      debugger;
    }
    let newCell = (this.particleSystem.grid[this.cellY] || [])[this.cellX];

    if (this.cell && newCell && this.cell == newCell) {
      //you're already here
      return;
    }

    if (this.cell) this.cell.removeMe(this);

    try {
      this.cell = newCell;
      this.cell.addMe(this);
    } catch (e) {
      console.error("this particle is not in any cell", this.cellX, this.cellY);
      this.remove();
      // debugger;
    }

    // return ret;
  }

  getParticlesFromCell() {
    if (!this.cell) return;
    return this.cell.particlesHere;
  }
  getParticlesFromCloseCells() {
    //from this cell and neighbour cells
    if (!this.cell) return [];
    let arr = [];
    arr.push(...this.getParticlesFromCell());

    for (let cell of this.cell.getNeighbours()) {
      for (let p of cell.particlesHere) {
        arr.push(p);
      }
    }
    return arr;
  }

  manageTemperature() {
    this.transferTemperatureToSurroundingParticles();
    this.stateAccordingToTemperature();
    if (this.temperature < -272) this.temperature = -272;
    // console.log(this.temperature, this.substance);
    if (this.burningTemperature && this.temperature > this.burningTemperature) {
      this.burn();
      this.temperature = this.burningTemperature + 1;
    } else {
      this.onFire = false;
    }
  }

  update(COUNTER) {
    this.COUNTER = COUNTER;

    this.lastY = this.y;
    this.lastX = this.x;

    this.x = this.body.position.x;
    this.y = this.body.position.y;

    this.updateMyPositionInCell();

    if (this.energyContained < 1) {
      // console.log(1);
      this.remove({ leaveAshes: true });
    }

    this.manageTemperature();

    // for (const particle of particles) {
    //     if (particle !== this) {
    //         const distance = Math.sqrt(
    //             Math.pow(this.x - particle.x, 2) + Math.pow(this.y - particle.y, 2)
    //         );
    //         const energyTransfer = Math.min(this.heat / distance, this.heat);
    //         // particle.heat += energyTransfer;
    //         particle.applyHeat(energyTransfer);
    //         this.applyHeat(energyTransfer)
    //     }
    // }

    if (
      this.substance == "woodGas" ||
      (this.substance == "water" && this.state == "gas")
    ) {
      this.applyForceUpwards();
    }

    this.checkIfItWentToHigh();
    this.nearParticles = this.getNearParticles();
    this.render();
  }
  checkIfItWentToHigh() {
    if (this.y < -window.innerHeight) {
      this.remove();
    }
  }

  applyForceUpwards() {
    // console.log(this.temperature / this.maxTemperature);
    const ratioOfTemp = this.temperature / this.maxTemperature;
    this.particleSystem.Matter.Body.setVelocity(this.body, {
      x: 0,
      y: -this.diameter * 6 * ratioOfTemp,
    });

    // this.particleSystem.Matter.Body.applyForce(this.body, this.body.position, {
    //   x: 0, //Math.random() * 0.00000005 - 0.000000025,
    //   y:
    //     -0.00000000001 -
    //     0.00000000001 * (this.temperature / this.maxTemperature), //-0.0000005 - Math.random() * 0.00000001,
    // });
  }

  getAvgTempOfNearParticles() {
    let avg = 0;
    for (let p of this.nearParticles) {
      avg += p.temperature;
    }
    return avg / this.nearParticles.length;
  }

  getNearParticles() {
    let arr = [];
    let closeParts = this.getParticlesFromCloseCells();
    if (!Array.isArray(closeParts)) debugger;

    for (let p of closeParts) {
      let difX = Math.abs(this.x - p.x);
      let difY = Math.abs(this.y - p.y);
      // let difY
      if (difX < this.diameter * 6 && difY < this.diameter * 6) {
        if (p != this) arr.push(p);
      }
      // if(p.body.x)
    }
    return arr;
  }

  highlight() {
    this.highlighted = true;
  }
  unHighlight() {
    this.highlighted = false;
  }

  drawFlamesForWood() {
    const context = this.particleSystem.fireContext;

    // Render fire effect when the particle is on fire
    const radius = this.diameter * 4 + Math.random() * this.diameter * 3;

    const intensity = 120 + Math.random() * 120;

    let centerOfGradient = {
      x: this.x + this.diameter / 2,
      y: this.y - radius, //height of flame
    };
    let sizeOfRect = { w: radius * 2, h: radius * 4 };

    const gradient = context.createRadialGradient(
      centerOfGradient.x,
      centerOfGradient.y,
      this.diameter,
      centerOfGradient.x,
      centerOfGradient.y - this.diameter * 2,
      radius / 2
    );
    gradient.addColorStop(0, `rgba(255, ${intensity}, 0, 0.3)`);
    gradient.addColorStop(1, "rgba(255, 0, 0, 0)");
    context.fillStyle = gradient;
    context.fillRect(
      this.x - sizeOfRect.w / 2,
      this.y - sizeOfRect.h,
      sizeOfRect.w,
      sizeOfRect.h
    );
  }

  drawGlowingFlames() {
    const context = this.particleSystem.fireContext;
    // Render fire effect when the particle is on fire
    let radius;
    let alpha;
    if (this.substance == "wood") {
      radius = this.diameter * 2 + Math.random() * this.diameter * 3;
      alpha = 0.66;
    } else if (this.substance == "woodGas") {
      radius = this.diameter * 5 + Math.random() * this.diameter * 5;
      alpha = 0.15;
    }

    let intensity = 120 + (this.temperature / this.maxTemperature) * 120;
    if (isNaN(intensity)) debugger;
    if (intensity > 255) intensity = 255;
    const gradient = context.createRadialGradient(
      this.x,
      this.y,
      0,
      this.x,
      this.y - (this.substance == "woodGas" ? 0 : radius),
      radius * 1.1
    );
    gradient.addColorStop(0, `rgba(255, ${intensity}, 0, ${alpha})`);
    gradient.addColorStop(1, `rgba(255, ${120 - intensity}, 0, 0)`);
    context.fillStyle = gradient; //"white";
    context.fillRect(
      this.x - radius * 2,
      this.y - radius * 7,
      radius * 4,
      radius * 8
    );
  }
  render() {
    // Render the particle on the canvas

    if (this.substance != "woodGas") {
      this.graphics.x = this.x;
      this.graphics.y = this.y;
    } else {
      //wood gas
    }

    if (this.onFire) {
      if (this.substance == "wood") {
        this.drawFlamesForWood();
        this.drawGlowingFlames();
      } else if (this.substance == "woodGas") {
        this.drawGlowingFlames();
      }
    }

    if (this.substance == "wood") this.setColorAccordingToTemperature();

    if (this.substance == "water") {
      //water particles draw in a different render, to which i apply css filters to make it more watery
      this.drawWater();
    }

    if (this.highlighted && this.substance != "woodGas") {
      this.graphics.tint = "0xffffff";
      // return;
    }
  }
  createCircleInPixi() {
    this.graphics = new PIXI.Graphics();
    this.graphics.beginFill("0xFFFFFF");
    this.graphics.drawCircle(0, 0, this.diameter);
    this.graphics.endFill();
    this.particleSystem.pixiApp.stage.addChild(this.graphics);
  }
  drawWater() {
    /*
        use this shader:
        https://www.shadertoy.com/view/wtfcWS

    */

    //////////////////
    // let context = this.particleSystem.liquidContext;
    // context.beginPath();
    // context.arc(this.x, this.y, this.diameter, 0, 2 * Math.PI, false);
    // context.fillStyle = "#1133ff";
    // context.fill();

    let tempRatio = this.temperature / this.evaporationTemperature;
    if (tempRatio > 1) tempRatio = 1;
    else if (tempRatio < 0) tempRatio = 0;

    let color = colorMixer([230, 255, 230], [11, 15, 255], tempRatio);

    this.graphics.tint = rgba2hex2(makeRGBA(color));

    // let strokeCol = (this.temperature / this.evaporationTemperature) * 255;
    // if (strokeCol > 255) strokeCol = 255;
    // if (strokeCol < 0) strokeCol = 0;

    // context.lineWidth = 4;

    // context.strokeStyle = makeRGBA({
    //   r: strokeCol,
    //   g: strokeCol,
    //   b: 255,
    //   a: 1,
    // });
    // context.stroke();
  }

  setColorAccordingToTemperature() {
    let fillR = this.defaultColor.fillStyle.r;
    let strokeR = this.defaultColor.strokeStyle.r;

    let tempRatio = this.temperature / this.burningTemperature;
    let newFillR = tempRatio * (255 - fillR) + fillR;

    // let newStrokeR = tempRatio * (255 - strokeR) + strokeR;

    // this.body.render.fillStyle = makeRGBA({
    //   ...this.defaultColor.fillStyle,
    //   r: newFillR,
    // });
    let rgba = makeRGBA({
      ...this.defaultColor.fillStyle,
      r: newFillR,
    });

    let newColor = rgba2hex2(rgba);
    this.graphics.tint = newColor;

    // this.body.render.strokeStyle = makeRGBA({
    //   ...this.defaultColor.strokeStyle,
    //   r: newStrokeR,
    // });
  }
}
