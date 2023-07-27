class Cell {
  constructor(y, x, cellWidth, grid) {
    this.grid = grid;
    this.cellWidth = cellWidth;
    this.pos = { x: x * cellWidth, y: y * cellWidth };
    this.x = x;
    this.y = y;

    // this.container = elem;
    this.particlesHere = [];
  }

  removeMe(who) {
    // if (USE_QUADTREE) return;
    let where;
    for (let i = 0; i < this.particlesHere.length; i++) {
      let a = this.particlesHere[i];
      if (a == who) {
        this.particlesHere.splice(i, 1);
        break;
      }
    }
  }
  addMe(who) {
    // if (USE_QUADTREE) return;
    // console.log("# add me", this, who);
    let areYouHere = false;
    for (let a of this.particlesHere) {
      if (a == who) {
        areYouHere = true;
        break;
      }
    }
    if (!areYouHere) {
      this.particlesHere.push(who);
    }
  }

  getNeighbours() {
    let grid = this.grid;
    if (this.neighbours) return this.neighbours;
    let arrRet = [];
    let x = this.x;
    let y = this.y;
    try {
      arrRet.push(grid[y - 1][x - 1]);
    } catch (e) {}
    try {
      arrRet.push(grid[y - 1][x]);
    } catch (e) {}
    try {
      arrRet.push(grid[y - 1][x + 1]);
    } catch (e) {}
    try {
      arrRet.push(grid[y][x - 1]);
    } catch (e) {}
    try {
      arrRet.push(grid[y][x + 1]);
    } catch (e) {}
    try {
      arrRet.push(grid[y + 1][x - 1]);
    } catch (e) {}
    try {
      arrRet.push(grid[y + 1][x]);
    } catch (e) {}
    try {
      arrRet.push(grid[y + 1][x + 1]);
    } catch (e) {}

    if (y == 0) {
      try {
        arrRet.push(grid[grid.length - 1][x - 1]);
      } catch (e) {}
      try {
        arrRet.push(grid[grid.length - 1][x]);
      } catch (e) {}
      try {
        arrRet.push(grid[grid.length - 1][x + 1]);
      } catch (e) {}
    }
    if (y == grid.length - 1) {
      try {
        arrRet.push(grid[0][x - 1]);
      } catch (e) {}
      try {
        arrRet.push(grid[0][x]);
      } catch (e) {}
      try {
        arrRet.push(grid[0][x + 1]);
      } catch (e) {}
    }

    if (x == 0) {
      try {
        arrRet.push(grid[y - 1][grid[0].length - 1]);
      } catch (e) {}
      try {
        arrRet.push(grid[y][grid[0].length - 1]);
      } catch (e) {}
      try {
        arrRet.push(grid[y + 1][grid[0].length - 1]);
      } catch (e) {}
    }
    if (x == grid[0].length - 1) {
      try {
        arrRet.push(grid[y - 1][0]);
      } catch (e) {}
      try {
        arrRet.push(grid[y][0]);
      } catch (e) {}
      try {
        arrRet.push(grid[y + 1][0]);
      } catch (e) {}
    }

    let ret = arrRet.filter((k) => k);
    this.neighbours = ret;
    return ret;
  }

  getPos() {
    return {
      x: this.pos.x + this.cellWidth / 2,
      y: this.pos.y + this.cellWidth / 2,
    };
  }

  // color(col) {
  //   this.elem.style.backgroundColor = col;
  // }

  render(FRAMENUM) {}
}
