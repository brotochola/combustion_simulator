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
    isStatic
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
        fillStyle: "transparent",
        strokeStyle: "transparent",
      },
    };

    this.defaultColor = defaultColors[this.substance];

    this.createBody();

    this.nearParticles = [];

    this.heatCapacityAccordingToSubstance();
    this.massAccordingToSubstance();
    this.calculateEneryContained(energyContained);
    this.thermalConductivityAccordingToSubstance();
    this.burningTemperatureAccordingToSubstance();

    // this.heat = 0; // heat being applied to the particle
    this.temperature = temperature || 20;

    this.velocity = { x: 0, y: 0 }; // velocity of the particle
    // this.gravity = 0; // gravity affecting the particle
    this.acceleration = { x: 0, y: 0 };
    this.onFire = this.substance == "woodGas";
  }

  createBody() {
    let renderTypes = {
      wood: {
        fillStyle: makeRGBA(this.defaultColor.fillStyle),
        lineWidth: this.diameter * 2,
        strokeStyle: makeRGBA(this.defaultColor.strokeStyle),
      },

      woodGas: {
        fillStyle: "transparent",
        lineWidth: 0,
        strokeStyle: "transparent",
        visible: false,
      },
    };

    let bodyOptions = {
      restitution: this.substance == "wood" ? 0.1 : 0.1,
      mass: this.substance == "wood" ? 1 : 0.0001,
      friction: this.substance == "wood" ? 1 : 0,
      slop:
        this.substance == "wood" ? -this.diameter * 0.35 : this.diameter * 2,
      // frictionAir: 0,
      // isSensor: true,
      render: renderTypes[this.substance],
      isStatic: !!this.isStatic,
      // density: 99999999999999
      // mass: 0
    };

    this.body = this.Matter.Bodies.circle(
      this.x,
      this.y,
      this.diameter,
      bodyOptions
    );

    this.body.constraints = []; //i need to keep track which constraints each body has
    this.body.particle = this;

    this.world.add(this.engine.world, [this.body]);
  }
  burningTemperatureAccordingToSubstance() {
    if (this.substance == "wood") {
      this.burningTemperature = 250;
      this.maxTemperature = 1093;
    } else if (this.substance == "woodGas") {
      this.burningTemperature = 200; //lower than wood
      this.maxTemperature = 1200; //roughly accurate
    }
  }
  thermalConductivityAccordingToSubstance() {
    if (this.substance == "wood") this.thermalConductivity = 0.000025;
    else if (this.substance == "woodGas") this.thermalConductivity = 0.0000025; //10x less
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
    else if (this.substance == "woodGas") this.heatCapacity = 0.0001025;
  }
  massAccordingToSubstance() {
    //mass in grams
    //each particle is 1mm3
    //0,0005gr / mm3

    if (this.substance == "wood") this.mass = 0.0005;
    else if (this.substance == "woodGas") this.mass = 0.00005;
  }
  applyHeat(joules) {
    this.temperature += Math.floor(joules) * this.heatCapacity;
  }

  remove(opt) {
    // console.log("removing");
    for (let constr of this.body.constraints) {
      this.world.remove(this.engine.world, constr);
    }

    this.world.remove(this.engine.world, this.body);
    this.particleSystem.particles = this.particleSystem.particles.filter(
      (k) => k.body.id != this.body.id
    );

    if ((opt || {}).leaveAshes) {
    }
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

    let minEnergyToBeLiberated = this.originalEnergycontained * 0.05;
    let howMuchEnergyGetsActuallyLiberated = minEnergyToBeLiberated;

    this.nearParticles = this.getNearParticles();

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
      if (particle !== this) {
        const distance = Math.sqrt(
          Math.pow(this.x - particle.x, 2) + Math.pow(this.y - particle.y, 2)
        );

        const avg = (this.temperature + particle.temperature) / 2;
        const avgThermalConductivity =
          (this.thermalConductivity + particle.thermalConductivity) / 2;
        if (this.temperature > particle.temperature) {
          this.temperature -= (avg / distance) * avgThermalConductivity;
          particle.temperature += (avg / distance) * avgThermalConductivity;
        } else {
          this.temperature += (avg / distance) * avgThermalConductivity;
          particle.temperature -= (avg / distance) * avgThermalConductivity;
        }
      }
    }
  }

  update(COUNTER) {
    this.COUNTER = COUNTER;
    // console.log(this.temperature, this.substance);
    if (this.temperature > this.burningTemperature) {
      this.burn();
    }

    this.x = this.body.position.x;
    this.y = this.body.position.y;

    if (this.energyContained < 1) {
      // console.log(1);
      this.remove({ leaveAshes: true });
    }

    this.transferTemperatureToSurroundingParticles();

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

    if (this.substance == "woodGas") this.applyForceUpwards();

    this.render();
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
    for (let p of this.particles) {
      let difX = Math.abs(this.body.position.x - p.body.position.x);
      let difY = Math.abs(this.body.position.y - p.body.position.y);
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

  drawFlamesForWood() {
    const context = this.particleSystem.fireCanvas.getContext("2d");

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
    const context = this.particleSystem.fireCanvas.getContext("2d");
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
    if (this.highlighted) {
      this.body.render.fillStyle = "white";
      return;
    }
    // Render the particle on the canvas
    if (this.onFire) {
      if (this.substance == "wood") this.drawFlamesForWood();
      this.drawGlowingFlames();
    }

    if (this.substance == "wood") this.setColorAccordingToTemperature();
  }

  setColorAccordingToTemperature() {
    let fillR = this.defaultColor.fillStyle.r;
    let strokeR = this.defaultColor.strokeStyle.r;

    let tempRatio = this.temperature / this.burningTemperature;
    let newFillR = tempRatio * (255 - fillR) + fillR;

    let newStrokeR = tempRatio * (255 - strokeR) + strokeR;

    this.body.render.fillStyle = makeRGBA({
      ...this.defaultColor.fillStyle,
      r: newFillR,
    });

    this.body.render.strokeStyle = makeRGBA({
      ...this.defaultColor.strokeStyle,
      r: newStrokeR,
    });
  }
}
