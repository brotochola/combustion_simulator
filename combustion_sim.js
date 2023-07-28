//uses matter.js

var Engine = Matter.Engine,
  Render = Matter.Render,
  Runner = Matter.Runner,
  Bodies = Matter.Bodies,
  Composite = Matter.Composite,
  Constraint = Matter.Constraint,
  MouseConstraint = Matter.MouseConstraint,
  Mouse = Matter.Mouse,
  World = Matter.World;

var particleSystem;

// create an engine

//STARTING POINT
document.body.onload = (e) => {
  particleSystem = new ParticleSystem(
    "canvas",
    window.innerWidth,
    window.innerHeight - 100,
    Matter
  );
  //   particleSystem.init();

  //   particleSystem.startSimulation();
};
