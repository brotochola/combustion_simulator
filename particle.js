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
      friction: 0.5,
      slop: -this.diameter * 0.35,
      // isSensor: true,
      render: {
        fillStyle: getRandomBrownishColor(0.66, 1),
        lineWidth: this.diameter * 2,
        strokeStyle: getRandomBrownishColor(0.3, 0.7),
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

    this.world.add(this.engine.world, [this.body]);
  }
  burningTemperatureAccordingToSubstance() {
    if (this.substance == "wood") this.burningTemperature = 250;
  }
  thermalConductivityAccordingToSubstance() {
    if (this.substance == "wood") this.thermalConductivity = 0.000025;
  }
  energyContainedAccordingToEinstein() {
    //energy contained in joules
    // if (this.substance == "wood") this.energyContained = this.mass * 10000
    if (this.substance == "wood") this.energyContained = this.mass * 1000000000;
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

  burn() {
    //when it burns, it converts to another substance
    //and releases heat
    this.onFire = true;
    const amountOfEnergyToTransmitToClosestParticles = 0.2;
    const amountOfEnergyToTransmitTo2ndLevelParticles = 0.066;

    for (const p of this.nearParticles) {
      //the amount of energy to be released goes to other particles
      //according to the distance they get more or less

      //apply 10% of the energy to nearParticles
      const howMuchEnergy =
        (this.energyContained * amountOfEnergyToTransmitToClosestParticles) /
        this.nearParticles.length;
      p.applyHeat(howMuchEnergy);
      this.energyContained -= howMuchEnergy;

      let tempArrayOfNearPArticlesLvl2 = [];
      for (const p2 of p.nearParticles) {
        if (p2 == p) continue;
        tempArrayOfNearPArticlesLvl2.push(p2);
      }

      //apply 5% of the energy to particles that are near of the near ones
      let howMuchEnergy2 =
        (this.energyContained * amountOfEnergyToTransmitTo2ndLevelParticles) /
        tempArrayOfNearPArticlesLvl2.length;
      for (const p2 of tempArrayOfNearPArticlesLvl2) {
        p2.applyHeat(howMuchEnergy2);
        this.energyContained -= howMuchEnergy2;
      }
    }
  }

  transferTemperatureToSurroundingParticles() {
    for (const particle of this.particles) {
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

  update(particles) {
    // Update the particle's position and velocity
    this.x += this.velocity.x;
    this.y += this.velocity.y;

    // Apply gravity
    this.velocity.y += this.acceleration.y;
    this.velocity.x += this.acceleration.x;

    if (this.temperature > this.burningTemperature) {
      this.burn();
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
  }

  render(context) {
    // Render the particle on the canvas
    if (this.onFire) {
      // Render fire effect when the particle is on fire
      const radius = 5 + Math.random() * 5;
      const intensity = 60 + Math.random() * 60;
      const gradient = context.createRadialGradient(
        this.x,
        this.y,
        0,
        this.x,
        this.y,
        radius
      );
      gradient.addColorStop(0, `rgba(255, ${intensity}, 0, 0.1)`);
      gradient.addColorStop(1, "rgba(255, 0, 0, 0)");
      context.fillStyle = gradient;
      context.fillRect(
        this.x - radius,
        this.y - radius,
        radius * 2,
        radius * 2
      );
    } else {
      // Render regular particle
      let r = this.temperature * 2;
      let g = 30;
      let b = 30;
      context.fillStyle = "rgb(" + r + "," + g + "," + b + ")";
      context.fillRect(this.x, this.y, 1, 1);
    }
  }
}
