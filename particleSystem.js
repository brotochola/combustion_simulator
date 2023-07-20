class ParticleSystem {
  constructor(canvasId, width, height, Matter) {
    this.COUNTER = 0;
    this.config = {
      wood: {
        diameter: 4,
        maxNumberOfConnectionsPerBody: 20,
        maxDistanceToAttach: 80,
      },
      woodGas: {
        diameter: 2,
        maxNumberOfConnectionsPerBody: 0,
        maxDistanceToAttach: 0,
      },
      water: {
        diameter: 4,
        maxNumberOfConnectionsPerBody: 10,
        maxDistanceToAttach: 40,
      },
    };

    this.Matter = Matter;
    this.engine = Matter.Engine.create();
    this.world = Matter.World;

    this.worldHeight = window.innerHeight - 100;

    // this.canvas = document.getElementById(canvasId);
    // this.context = this.canvas.getContext("2d");
    // this.canvas.width = width;
    // this.canvas.height = height;
    this.particles = []; // array to hold all particles

    this.constraintsVisible = true;
    this.gooBuilding = false;

    this.addFloor();

    this.runEngine();

    // // Add event listener to resize canvas when window size changes
    // window.addEventListener('resize', () => {
    //     this.canvas.width = width;
    //     this.canvas.height = height;
    // });

    // this.addEventListenerToMouse();
    this.addClickListenerToCanvas();

    this.addExtraCanvasForFire();

    this.addShortCuts();
  }

  addShortCuts() {
    window.onkeydown = (e) => {
      window.keyIsDown = e.keyCode;
    };
    window.onkeyup = (e) => {
      window.keyIsDown = null;
      console.log("letra", e.keyCode);
      if (e.keyCode == 32) {
        //space bar
        this.togglePause();
      } else if (e.keyCode == 71) {
        //G
        this.toggleGravity();
      }
    };
  }
  toggleGravity() {
    this.engine.world.gravity.y = this.engine.world.gravity.y ? 0 : 1;
    this.showAlert(this.engine.world.gravity.y ? "gravity on" : "gravity off");
  }
  showAlert(msg) {
    try {
      showAlert(msg);
    } catch (e) {
      console.warn(e);
      alert(msg);
    }
  }

  addExtraCanvasForFire() {
    let normalCanvas = document.querySelector("canvas");
    let fireCanvas = document.createElement("canvas");
    fireCanvas.id = "fireCanvas";
    this.fireCanvas = fireCanvas;
    fireCanvas.width = normalCanvas.width;
    fireCanvas.height = normalCanvas.height;
    this.fireContext = fireCanvas.getContext("2d");
    document.body.appendChild(fireCanvas);

    let liquidCanvas = document.createElement("canvas");
    liquidCanvas.id = "liquidCanvas";
    this.liquidCanvas = fireCanvas;
    liquidCanvas.width = normalCanvas.width;
    liquidCanvas.height = normalCanvas.height;
    this.liquidContext = liquidCanvas.getContext("2d");
    document.body.appendChild(liquidCanvas);
  }
  createBoxOfParticles(x, y, lines, rows, substance) {}

  runEngine() {
    this.render = Matter.Render.create({
      element: document.body,
      engine: this.engine,
      options: {
        // pixelRatio: "auto",
        // showPositions: true,
        width: window.innerWidth,
        // showVertexNumbers: true,
        height: this.worldHeight,
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
    // this.runner.isFixed = true;
    // this.runner.delta = 10;

    // run the engine
    this.Matter.Runner.run(this.runner, this.engine);

    this.Matter.Events.on(this.runner, "tick", (e) => this.onTick(e));
  }
  togglePause() {
    this.runner.enabled = !this.runner.enabled;
    this.showAlert(
      this.runner.enabled ? "Simulation running" : "Simulation paused"
    );
  }
  indicateWhichParticleItIs(x, y) {
    let closeP = this.getParticlesAndTheirDistance(x, y);
    if (!closeP[0]) return;

    const maxDistance = this.config["wood"].diameter * 2;

    if (
      dist(x, y, closeP[0].body.position.x, closeP[0].body.position.y) <
      maxDistance
    ) {
      let p = closeP[0].body;
      window.tempParticle = p.particle;
      //DEBUG
      // p.particle.temperature += 200;
      console.log(p.particle);
    }
  }

  getParticlesAndTheirDistance(x, y, substance) {
    let arr = [];
    let chosenParticles;
    if (substance) {
      chosenParticles = this.particles.filter((k) => k.substance == substance);
    } else {
      chosenParticles = this.particles;
    }
    for (let i = 0; i < chosenParticles.length; i++) {
      let b = chosenParticles[i].body;
      let distance = dist(x, y, b.position.x, b.position.y);
      arr.push({ body: b, distance: distance });
    }

    let newArr = arr.sort((a, b) => (a.distance > b.distance ? 1 : -1));
    return newArr;
  }
  removeParticle(x, y) {
    let closePs = this.getParticlesAndTheirDistance(x, y);
    if (!closePs[0]) return;
    let closest = closePs[0];

    if (
      dist(x, y, closest.body.position.x, closest.body.position.y) <
      this.config["wood"].diameter * 3
    ) {
      closest.body.particle.remove();
    }
  }
  checkIfAPointCollidesWithTheGrounds(x, y) {
    let arr = this.engine.world.bodies.filter((k) => k.label == "ground");
    let isColliding = false;
    for (let gr of arr) {
      if (
        x > gr.bounds.min.x &&
        x < gr.bounds.max.x &&
        y > gr.bounds.min.y &&
        y < gr.bounds.max.y
      ) {
        isColliding = true;
        break;
      }
    }
    return isColliding;
  }
  addClickListenerToCanvas() {
    let canvas = this.render.canvas;
    canvas.onmouseleave = (e) => (window.isDown = false);
    canvas.onmousedown = (e) => {
      window.isDown = e.which;
      let box = canvas.getBoundingClientRect();
      let x = e.x - box.x;
      let y = e.y - box.y;
      if (e.which == 1) this.indicateWhichParticleItIs(x, y);
      else if (e.which == 3) {
        if (this.checkIfAPointCollidesWithTheGrounds(x, y)) {
          this.addParticle(x, y, "wood", 20, undefined, true, false);
        } else {
          this.addParticle(
            x,
            y,
            "wood",
            20,
            undefined,
            false,
            this.gooBuilding
          );
        }
      }
    };
    canvas.onmouseup = (e) => {
      window.isDown = false;
    };
    canvas.onmousemove = (e) => {
      if (!window.isDown && !window.keyIsDown) return;
      let box = canvas.getBoundingClientRect();
      let x = e.x - box.x;
      let y = e.y - box.y;

      if (window.isDown == 2) {
        //REMOVE PARTICLES

        this.removeParticle(x, y);

        return;
      } else if (window.isDown == 3) {
        //ADD PARTICLES WHILE DRAGGING

        //GOO MODE DOESN'T WORK WHILE DRAGGING!
        this.addParticle(x, y, "wood", 20, undefined, false, false);
      }

      //KEYS
      if (window.keyIsDown == 87) {
        // console.log(1);
        //W
        this.addParticle(x, y, "water", 20, undefined, false, false);
      } else if (window.keyIsDown == 72) {
        //H (heat)
        let closeParticles = this.getParticlesAndTheirDistance(x, y, null);
        for (let p of closeParticles) {
          let part = p.body.particle || {};

          if (p.distance < 25) {
            let part = p.body.particle || {};
            part.highlight();
            part.heatUp(5);
          } else {
            part.unHighlight();
          }
        }
      } else if (window.keyIsDown == 67) {
        //C (cold)
        let closeParticles = this.getParticlesAndTheirDistance(x, y, null);
        for (let p of closeParticles) {
          let part = p.body.particle || {};

          if (p.distance < 25) {
            let part = p.body.particle || {};
            part.highlight();
            part.heatUp(-50);
          } else {
            part.unHighlight();
          }
        }
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
    var ground = Bodies.rectangle(0, this.worldHeight + 90, 3000, 200, {
      restitution: 0,
      friction: 9,
      slop: 0,
      label: "ground",
      render: {
        fillStyle: "red",
        lineWidth: 0,
      },
      isStatic: true,
      render: { fillStyle: "black" },
    });

    var leftWall = Bodies.rectangle(
      -90,
      this.worldHeight / 2,
      200,
      this.worldHeight,
      {
        restitution: 0,
        friction: 9,
        slop: 0,
        label: "ground",
        render: {
          fillStyle: "red",
          lineWidth: 0,
        },
        isStatic: true,
        render: { fillStyle: "black" },
      }
    );

    var rightWall = Bodies.rectangle(
      window.innerWidth + 90,
      this.worldHeight / 2,
      200,
      this.worldHeight,
      {
        restitution: 0,
        friction: 9,
        slop: 0,
        label: "ground",
        render: {
          fillStyle: "red",
          lineWidth: 0,
        },
        isStatic: true,
        render: { fillStyle: "black" },
      }
    );

    // add all of the bodies to the world
    this.world.add(this.engine.world, [ground, leftWall, rightWall]);
  }

  addParticle(x, y, substance, temperature, energy, isStatic, doGooBuilding) {
    // let substance = "wood";
    /// IT CAN BE WOOD GAS ;)

    const particle = new Particle(
      x,
      y,
      substance,
      Math.floor(temperature),
      this,
      energy,
      isStatic
    );
    particle.particles = this.particles;
    this.particles.push(particle);

    if (doGooBuilding) {
      this.addAutomaticConnections([particle]);
    }
  }

  onTick(e) {
    this.prevFrameTime = this.currentFrameTime || 0;
    this.currentFrameTime = performance.now();
    this.deltaTime = this.currentFrameTime - this.prevFrameTime;
    // Update all particles in the system
    this.COUNTER++;

    // console.log(this.COUNTER, particleSystem.totalEnergyContained());

    // setTimeout(() => {
    //   this.fireContext.clearRect(
    //     0,
    //     0,
    //     this.fireCanvas.width,
    //     this.fireCanvas.height
    //   );
    // }, this.deltaTime * 1.1);
    this.clearFireCanvas();
    this.clearLiquidCanvas();

    for (const particle of this.particles) {
      particle.update(this.COUNTER);
    }
  }
  clearFireCanvas() {
    this.fireContext.clearRect(
      0,
      0,
      this.fireCanvas.width,
      this.fireCanvas.height
    );
  }
  clearLiquidCanvas() {
    this.liquidContext.clearRect(
      0,
      0,
      this.liquidCanvas.width,
      this.liquidCanvas.height
    );
  }

  totalEnergyContained() {
    // Calculate the overall energy remaining in the branch
    let overallEnergy = 0;
    for (const particle of this.particles) {
      overallEnergy += particle.energyContained;
    }
    return overallEnergy;
  }

  calculateAvgEnergy() {
    return this.totalEnergyContained() / this.particles.length;
  }

  calculateAverageTemperature(subst) {
    // Calculate the average temperature of all particles
    let chosenPArticles;
    if (subst) {
      chosenPArticles = this.particles.filter((k) => k.substance == subst);
    } else {
      chosenPArticles = this.particles;
    }
    let totalTemperature = 0;
    for (const particle of chosenPArticles) {
      totalTemperature += particle.temperature;
    }
    return totalTemperature / chosenPArticles.length;
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

  addAutomaticConnections(arr, doNotCareAboutGooBuilding) {
    // console.log("#add automatic", numberOfAutomaticConnections, arr)
    // if (numberOfAutomaticConnections == undefined) numberOfAutomaticConnections = 3

    let howManyConnectionsWeMadeNow = 0;

    arr = arr ? arr : this.particles;
    for (let i = 0; i < arr.length; i++) {
      //EACH BODY

      if (arr[i].substance == "woodGas") continue;

      let maxDistanceDependingOnGooModeOrNot =
        this.config[arr[i].substance].maxDistanceToAttach *
        (doNotCareAboutGooBuilding && this.gooBuilding ? 2 : 1);

      let b = arr[i].body;
      let closestP = this.getParticlesAndTheirDistance(
        b.position.x,
        b.position.y,
        arr[i].substance
      );

      //ONLY CLOSE PARTICLES, MADE OF THE SAME SUBSTANCE
      closestP = (closestP || []).filter(
        (k) =>
          k.distance < maxDistanceDependingOnGooModeOrNot &&
          k.body.particle.substance == arr[i].substance
      );

      //GET THE CLOSEST BODIES
      for (let i = 0; i < closestP.length; i++) {
        // if (counterOfConstraints >= numberOfAutomaticConnections) break
        let closeParticle = closestP[i];

        let closePArticleSubstance = closeParticle.body.particle.substance;

        if (!closeParticle) continue;
        if (closeParticle.body == b) continue;
        if (closeParticle.distance == 0) continue;
        if (
          this.findOutIfThereIsAlreadyAConstraintWithTheseTwoBodies(
            closeParticle.body,
            b
          )
        ) {
          continue;
        }
        //CHECK HOW MANY CONSTRAINTS IT ALREADY HAS
        //I KEEP TRACK OF THIS MYSELF IN EACH BODY
        if (
          (b.constraints || []).length >=
            this.config[closePArticleSubstance].maxNumberOfConnectionsPerBody ||
          (closeParticle.constraints || []).length >=
            this.config[closePArticleSubstance].maxNumberOfConnectionsPerBody
        ) {
          break;
        }

        // alert(1)

        let newConstraint = this.Matter.Constraint.create({
          pointA: { x: 0, y: 0 },
          pointB: { x: 0, y: 0 },
          // length:

          angularStiffness: 0.9,
          stiffness: 1,
          damping: 0.01,
          render: {
            visible: true,
            anchors: false,
            strokeStyle:
              closePArticleSubstance == "wood"
                ? makeRGBA(getRandomBrownishColor(0.1, 0.22))
                : "rgba(255,255,255,0.5)",
            lineWidth:
              closePArticleSubstance == "wood"
                ? this.config[closePArticleSubstance].diameter * 3
                : 1,
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

    console.log(
      "#we added ",
      howManyConnectionsWeMadeNow,
      "new constraints to wood particles"
    );
  }

  toggleGooBuilding() {
    this.gooBuilding = !this.gooBuilding;
    this.showAlert(this.gooBuilding ? "goo mode enabled" : "goo mode disabled");
  }

  toggleViewConstraints() {
    for (let c of this.engine.world.constraints) {
      c.render.visible = !this.constraintsVisible;
    }
    this.constraintsVisible = !this.constraintsVisible;
    this.showAlert(
      this.constraintsVisible ? "constraints visible" : "constraints hidden"
    );
  }
}
