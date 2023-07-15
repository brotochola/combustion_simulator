// https://codepen.io/davepvm/pen/Hhstl
// Particle class representing each molecule
class Particle {
  constructor(x, y, substance, temperature, particleSystem) {
    this.particleSystem = particleSystem;
    this.Matter = particleSystem.Matter;
    this.engine = particleSystem.engine;

    this.diameter = particleSystem.config.diameter;
    this.maxNumberOfConnectionsPerBody =
      particleSystem.config.maxNumberOfConnectionsPerBody;
    this.maxDistanceToAttach = particleSystem.config.maxDistanceToAttach;

    this.world = particleSystem.world;
    this.x = x; // x-coordinate
    this.y = y; // y-coordinate

    this.defaultColor = {
      fillStyle: getRandomBrownishColor(0.66, 1),
      strokeStyle: getRandomBrownishColor(0.3, 0.7),
    };

    this.createBody();

    this.nearParticles = [];

    this.substance = substance || "wood"; // substance of the particle
    this.heatCapacityAccordingToSubstance();
    this.massAccordingToSubstance();
    this.energyContainedAccordingToEinstein();
    this.thermalConductivityAccordingToSubstance();
    this.burningTemperatureAccordingToSubstance();

    // this.heat = 0; // heat being applied to the particle
    this.temperature = temperature || 20;

    this.velocity = { x: 0, y: 0 }; // velocity of the particle
    // this.gravity = 0; // gravity affecting the particle
    this.acceleration = { x: 0, y: 0 };
    this.onFire = false; // flag indicating if the particle is on fire
  }

  createBody() {
    let bodyOptions = {
      restitution: 0.1,
      // mass: 9999,
      friction: 1,
      slop: -this.diameter * 0.35,
      // isSensor: true,
      render: {
        fillStyle: makeRGBA(this.defaultColor.fillStyle),
        lineWidth: this.diameter * 2,
        strokeStyle: makeRGBA(this.defaultColor.strokeStyle),
      },
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
    }
  }
  thermalConductivityAccordingToSubstance() {
    if (this.substance == "wood") this.thermalConductivity = 0.000025;
  }
  energyContainedAccordingToEinstein() {
    //energy contained in joules
    // if (this.substance == "wood") this.energyContained = this.mass * 10000
    if (this.substance == "wood") {
      this.energyContained = this.mass * 2000000000;
      this.originalEnergycontained = this.mass * 2000000000;
    }
  }
  heatCapacityAccordingToSubstance() {
    //energy in joules to raise this particles (1mm3) 1 degree C
    if (this.substance == "wood") this.heatCapacity = 0.001025;
  }
  massAccordingToSubstance() {
    //mass in grams
    //each particle is 1mm3
    //0,0005gr / mm3

    if (this.substance == "wood") this.mass = 0.0005;
  }
  applyHeat(joules) {
    this.temperature += joules * this.heatCapacity;
  }

  remove(opt) {
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

  burn() {
    //when it burns, it converts to another substance
    //and releases heat
    this.onFire = true;

    let howMuchEnergyGetsActuallyLiberated =
      this.originalEnergycontained * 0.005;

    // const amountOfEnergyToTransmitTo2ndLevelParticles = 0.066;
    this.nearParticles = this.getNearParticles();

    ////////
    //FIX ME: THE ENERGY TRANSFERED FROM A BURNING PARTICLE TO THE REST
    // SHOULD BE ACCORDING TO THE DISTANCE BETWEEN THEM
    //////

    let howManyNearParts = this.nearParticles.length + 1;
    for (const p of [...this.nearParticles, this]) {
      //the amount of energy to be released goes to other particles
      //also to itself!
      if (!p.amIBelowMaxTemp()) {
        // console.log("#maxTemp");
        continue;
      }

      let howMuchEnergy = howMuchEnergyGetsActuallyLiberated / howManyNearParts;

      //CHANGE HOW MUCH ENERGY ACCORDING TO Y
      if (p.body.position.y < this.body.position.y) {
        howMuchEnergy *= 1 * 5;
      } else {
        howMuchEnergy /= 1 * 5;
      }
      p.applyHeat(howMuchEnergy);
      // this.energyContained -= howMuchEnergy * 1.05; //something is always lost
    }

    this.energyContained -= howMuchEnergyGetsActuallyLiberated;
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
    if (this.temperature > this.burningTemperature) {
      this.burn();
    }

    this.x = this.body.position.x;
    this.y = this.body.position.y;

    this.render();

    if (this.energyContained < 0.1) {
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
  }

  applyForceUpwards() {
    this.particleSystem.Matter.Body.applyForce(this.body, this.body.position, {
      x: 0,
      y: -0.00005 - Math.random() * 0.00001,
    });
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

  drawFlames() {
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

  drawFlames2() {
    const context = this.particleSystem.fireCanvas.getContext("2d");
    // Render fire effect when the particle is on fire
    const radius = this.diameter * 2 + Math.random() * this.diameter * 3;
    const intensity = 60 + Math.random() * 60;
    const gradient = context.createRadialGradient(
      this.x,
      this.y,
      0,
      this.x,
      this.y - radius,
      radius * 1.1
    );
    gradient.addColorStop(0, `rgba(255, ${intensity}, 0, 0.66)`);
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
      this.drawFlames();
      this.drawFlames2();
    }

    this.setColorAccordingToTemperature();
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
