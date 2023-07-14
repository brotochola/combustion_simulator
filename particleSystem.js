class ParticleSystem {
  constructor(canvasId, width, height, Matter) {
    this.config = {
      diameter: 4,
      maxNumberOfConnectionsPerBody: 20,
      maxDistanceToAttach: 40,
    };

    this.Matter = Matter;
    this.engine = Matter.Engine.create();
    this.world = Matter.World;

    // this.canvas = document.getElementById(canvasId);
    // this.context = this.canvas.getContext("2d");
    // this.canvas.width = width;
    // this.canvas.height = height;
    this.particles = []; // array to hold all particles

    this.addFloor();

    this.runEngine();

    // // Add event listener to resize canvas when window size changes
    // window.addEventListener('resize', () => {
    //     this.canvas.width = width;
    //     this.canvas.height = height;
    // });

    // this.addEventListenerToMouse();
    this.addClickListenerToCanvas();
  }

  runEngine() {
    this.render = Matter.Render.create({
      element: document.body,
      engine: this.engine,
      options: {
        width: window.innerWidth,
        height: window.innerHeight * 0.8,
        wireframes: false, // <-- important
        // showAngleIndicator: true,
      },
    });

    let mouse = this.Matter.Mouse.create(this.render.canvas);
    let mouseConstraint = this.Matter.MouseConstraint.create(this.engine, {
      mouse: mouse,
      constraint: {
        // length: 100,
        stiffness: 0.5,
        damping: 0,
        render: {
          anchors: true,
          visible: true,
        },
      },
    });

    this.engine.world.gravity.y = 0;

    this.world.add(this.engine.world, mouseConstraint);
    // World.add(engine.world, constr);

    // keep the mouse in sync with rendering
    this.render.mouse = mouse;

    // run the renderer
    this.Matter.Render.run(this.render);

    // create runner
    this.runner = this.Matter.Runner.create();

    // run the engine
    this.Matter.Runner.run(this.runner, this.engine);

    this.Matter.Events.on(this.runner, "tick", (e) => this.onTick(e));
  }
  indicateWhichParticleItIs(x, y) {
    let closeP = this.findTwoClosestParticles(x, y);
    if (!closeP[0]) return;

    if (
      dist(x, y, closeP[0].body.position.x, closeP[0].body.position.y) <
      this.config.diameter * 2
    ) {
      let p = closeP[0].body;
      window.tempParticle = p;
      //DEBUG
      p.particle.temperature += 200;
      console.log(p);
    }
  }
  findTwoClosestParticles(x, y) {
    let arr = [];
    for (let i = 0; i < this.particles.length; i++) {
      let b = this.particles[i].body;
      let distance = dist(x, y, b.position.x, b.position.y);
      arr.push({ body: b, distance: distance });
    }

    let newArr = arr.sort((a, b) => (a.distance > b.distance ? 1 : -1));
    return newArr;
  }
  removeParticle(x, y) {
    let closePs = this.findTwoClosestParticles(x, y);
    if (!closePs[0]) return;
    let closest = closePs[0];

    if (
      dist(x, y, closest.body.position.x, closest.body.position.y) <
      this.config.diameter * 3
    ) {
      closest.body.particle.remove();
    }
  }
  addClickListenerToCanvas() {
    let canvas = document.querySelector("canvas");
    canvas.onmouseleave = (e) => (window.isDown = false);
    canvas.onmousedown = (e) => {
      window.isDown = e.which;
      let box = canvas.getBoundingClientRect();
      let x = e.x - box.x;
      let y = e.y - box.y;
      if (e.which == 1) this.indicateWhichParticleItIs(x, y);
      else if (e.which == 3) this.addParticle(x, y);
    };
    canvas.onmouseup = (e) => {
      window.isDown = false;
    };
    canvas.onmousemove = (e) => {
      if (!window.isDown) return;
      let box = canvas.getBoundingClientRect();
      let x = e.x - box.x;
      let y = e.y - box.y;

      if (window.isDown == 2) {
        //REMOVE PARTICLES

        this.removeParticle(x, y);

        return;
      } else if (window.isDown == 3) {
        //ADD PARTICLES

        this.addParticle(x, y);
      }
    };
  }

  addEventListenerToMouse() {
    //THIS IS THE BURNING FUNCTION!
    // Add event listener to handle particle interaction on click
    this.canvas.addEventListener("mousemove", (event) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;
      const energy = 10000; // Energy to transfer on click

      // Check for particles near mouse pointer and set them on fire
      for (const particle of this.particles) {
        const distance = Math.sqrt(
          Math.pow(mouseX - particle.x, 2) + Math.pow(mouseY - particle.y, 2)
        );
        if (distance <= 5) {
          // particle.onFire = true;
          particle.applyHeat(energy);
          // console.log(particle)
        }
        // else {
        //     particle.onFire = false;
        // }
      }
    });
  }
  addFloor() {
    var ground = Bodies.rectangle(0, 810, 3000, 200, {
      restitution: 0,
      friction: 0.5,
      slop: 0,
      label: "piso",
      render: {
        fillStyle: "red",
        lineWidth: 0,
      },
      isStatic: true,
      render: { fillStyle: "black" },
    });

    // add all of the bodies to the world
    this.world.add(this.engine.world, [ground]);
  }

  addParticle(x, y) {
    // console.log("add particule", x, y);

    const particle = new Particle(x, y, "wood", 20, this);
    particle.particles = this.particles;
    this.particles.push(particle);
  }

  onTick(e) {
    // Update all particles in the system
    for (const particle of this.particles) {
      particle.update(e);
    }
  }

  calculateOverallEnergy() {
    // Calculate the overall energy remaining in the branch
    let overallEnergy = 0;
    for (const particle of this.particles) {
      overallEnergy += particle.energyContained;
    }
    return overallEnergy;
  }

  calculateAverageTemperature() {
    // Calculate the average temperature of all particles
    let totalTemperature = 0;
    for (const particle of this.particles) {
      totalTemperature += particle.temperature;
    }
    return totalTemperature / this.particles.length;
  }

  //   render() {
  //     // Clear the canvas
  //     this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

  //     // Render all particles in the system
  //     for (const particle of this.particles) {
  //       particle.render(this.context);
  //     }

  //     // Update information div
  //     // const infoDiv = document.getElementById('info');
  //     // const overallEnergy = this.calculateOverallEnergy();
  //     // const averageTemperature = this.calculateAverageTemperature();
  //     // infoDiv.innerHTML = `Overall Energy: ${overallEnergy.toFixed(2)} | Average Temperature: ${averageTemperature.toFixed(2)}`;
  //   }

  //   startSimulation() {
  //     // Start the simulation loop
  //     const updateAndRender = () => {
  //       this.update();
  //       this.render();
  //       requestAnimationFrame(updateAndRender);
  //     };
  //     updateAndRender();
  //   }

  //   init() {
  //     //CREATES PARTICLES OF WOOD
  //     for (let i = 0; i < 110; i++) {
  //       for (let j = 0; j < 22; j++) {
  //         let random1 = Math.random() * 0.1 + 0.95;
  //         let random2 = Math.random() * 0.1 + 0.95;
  //         const x = i * random1 + 300;
  //         const y = 200 + j * random2;
  //         this.addParticle(x, y, "wood");
  //       }
  //     }
  //     for (let p of this.particles) {
  //       for (let p2 of this.particles) {
  //         if (p == p2) continue;
  //         const distance = Math.sqrt(
  //           Math.pow(p.x - p2.x, 2) + Math.pow(p.y - p2.y, 2)
  //         );
  //         if (distance > 2) continue;
  //         p.nearParticles.push(p2);
  //       }
  //     }
  //   }

  findOutIfThereIsAlreadyAConstraintWithTheseTwoBodies(b1, b2) {
    let which = this.engine.world.constraints.filter((k) => {
      return (
        ((k.bodyA || {}).id == b1.id && (k.bodyB || {}).id == b2.id) ||
        ((k.bodyB || {}).id == b1.id && (k.bodyA || {}).id == b2.id)
      );
    });
    if (which.length > 0) return which[0];
  }

  addAutomaticConnections(arr) {
    // console.log("#add automatic", numberOfAutomaticConnections, arr)
    // if (numberOfAutomaticConnections == undefined) numberOfAutomaticConnections = 3

    let howManyConnectionsWeMadeNow = 0;

    arr = arr ? arr : this.particles;
    for (let i = 0; i < arr.length; i++) {
      //EACH BODY
      let b = arr[i].body;

      let closestP = this.findTwoClosestParticles(b.position.x, b.position.y);

      closestP = (closestP || []).filter(
        (k) => k.distance < this.config.maxDistanceToAttach
      );

      //GET THE CLOSEST BODIES
      for (let i = 0; i < closestP.length; i++) {
        // if (counterOfConstraints >= numberOfAutomaticConnections) break
        let closeParticle = closestP[i];

        if (!closeParticle) continue;
        if (closeParticle.body == b) continue;
        if (closeParticle.distance == 0) continue;
        if (
          this.findOutIfThereIsAlreadyAConstraintWithTheseTwoBodies(
            closeParticle.body,
            b
          )
        )
          continue;
        //CHECK HOW MANY CONSTRAINTS IT ALREADY HAS
        //I KEEP TRACK OF THIS MYSELF IN EACH BODY
        if (
          (b.constraints || []).length >=
            this.config.maxNumberOfConnectionsPerBody ||
          (closeParticle.constraints || []).length >=
            this.config.maxNumberOfConnectionsPerBody
        ) {
          break;
        }

        // alert(1)

        let newConstraint = this.Matter.Constraint.create({
          pointA: { x: 0, y: 0 },
          pointB: { x: 0, y: 0 },
          // length: diameter * 2,
          angularStiffness: 0.9,
          stiffness: 0.9,
          damping: 0.01,
          render: {
            visible: true,
            anchors: false,
            strokeStyle: makeRGBA(getRandomBrownishColor(0.1, 0.22)),
            lineWidth: this.config.diameter * 3,
          },
          bodyA: closeParticle.body,
          bodyB: b,
        });
        //ADD CONSTRAINT TO THE WORLD
        this.world.add(this.engine.world, [newConstraint]);

        //ADD CONSTRAINT TO BOTH BODIES, TO KEEP TRACK OF THEM
        if (!Array.isArray(b.constraints)) b.constraints = [];
        b.constraints.push(newConstraint);

        if (!Array.isArray(closeParticle.body.constraints))
          closeParticle.body.constraints = [];
        closeParticle.body.constraints.push(newConstraint);

        howManyConnectionsWeMadeNow++;
      } //for
    } //for

    console.log("#we added ", howManyConnectionsWeMadeNow, "new constraints");
  }
}
