const Constants = require('../shared/constants');
const Player = require('./player');
const Obstacle = require('./obstacle');
const Collisions = require('./collisions');

class Game {
  constructor() {
    this.sockets = {};
    this.players = {};
    this.bullets = [];
	 this.obstacle_list = [];
    this.lastUpdateTime = Date.now();
    this.shouldSendUpdate = false;
	 this.createObstacles();
	 this.collisionObj = new Collisions();
    setInterval(this.update.bind(this), 1000 / 60);
  }

  createObstacles() {
  	 this.obstacle_list[0] = new Obstacle(100, 100, 0, 300, 25);
 	 this.obstacle_list[1] = new Obstacle(100, 500, 30, 300, 25);
	 this.obstacle_list[2] = new Obstacle(100, 500, -10, 300, 50);
	 this.obstacle_list[3] = new Obstacle(600, 50, 90, 500, 50);
	 this.obstacle_list[4] = new Obstacle(50, 350, -70, 150, 15);
	 this.obstacle_list[5] = new Obstacle(650, 350, -60, 400, 30);
	 this.obstacle_list[6] = new Obstacle(850, 350, 50, 200, 25);
	 this.obstacle_list[7] = new Obstacle(1000, 200, 0, 200, 25);
	 this.obstacle_list[8] = new Obstacle(900, 600, 0, 200, 25);
  }

  addPlayer(socket, username, image) {
    this.sockets[socket.id] = socket;

	 let x = 0;
	 let y = 0;
	 let found_free = true;
	 do {
	 	 found_free = true;
		 x = Constants.MAP_SIZE_X * (Math.random());
		 y = Constants.MAP_SIZE_Y * (Math.random());
		 for (let i = 0; i < this.obstacle_list.length; i++) {
        if (this.obstacle_list[i].containsPoint(x + 15, y) ||
			   this.obstacle_list[i].containsPoint(x - 15, y) ||
			   this.obstacle_list[i].containsPoint(x, y + 15) ||
			   this.obstacle_list[i].containsPoint(x, y - 15)) { found_free = false; }
		 }
	 } while (found_free === false);

    this.players[socket.id] = new Player(socket.id, username, x, y, this.obstacle_list, image);
  }

  removePlayer(socket) {
    delete this.sockets[socket.id];
    delete this.players[socket.id];
  }

  handleInput(socket, dir) {
    if (this.players[socket.id]) {
      this.players[socket.id].setDirection(dir);
    }
  }

  update() {
    // Calculate time elapsed
    const now = Date.now();
    const dt = (now - this.lastUpdateTime) / 1000;
    this.lastUpdateTime = now;

    // Update each bullet
    const bulletsToRemove = [];
    this.bullets.forEach(bullet => {
      if (bullet.update(dt)) {
        // Destroy this bullet
        bulletsToRemove.push(bullet);
      }
    });
    this.bullets = this.bullets.filter(bullet => !bulletsToRemove.includes(bullet));

    // Update each player
    Object.keys(this.sockets).forEach(playerID => {
      const player = this.players[playerID];
      const newBullet = player.update(dt);
      if (newBullet) {
        this.bullets.push(newBullet);
      }
    });

    // Apply collisions, give players score for hitting bullets
    const destroyedBullets = this.collisionObj.applyCollisions(Object.values(this.players), this.bullets);
    destroyedBullets.forEach(b => {
      if (this.players[b.parentID]) {
        this.players[b.parentID].onDealtDamage();
      }
    });
    this.bullets = this.bullets.filter(bullet => !destroyedBullets.includes(bullet));

	 const obstacleDestroyedBulltes = this.collisionObj.applyObstacleCollisions(this.obstacle_list, this.bullets);
	 this.bullets = this.bullets.filter(bullet => !obstacleDestroyedBulltes.includes(bullet));

    // Check if any players are dead
    Object.keys(this.sockets).forEach(playerID => {
      const socket = this.sockets[playerID];
      const player = this.players[playerID];
      if (player.hp <= 0) {
        socket.emit(Constants.MSG_TYPES.GAME_OVER);
        this.removePlayer(socket);
      }
    });

    // Send a game update to each player every other time
    if (this.shouldSendUpdate) {
      const leaderboard = this.getLeaderboard();
      Object.keys(this.sockets).forEach(playerID => {
        const socket = this.sockets[playerID];
        const player = this.players[playerID];
        socket.emit(Constants.MSG_TYPES.GAME_UPDATE, this.createUpdate(player, leaderboard));
      });
      this.shouldSendUpdate = false;
    } else {
      this.shouldSendUpdate = true;
    }
  }

  getLeaderboard() {
    return Object.values(this.players)
      .sort((p1, p2) => p2.score - p1.score)
      .slice(0, 5)
      .map(p => ({ username: p.username, score: Math.round(p.score) }));
  }

  createUpdate(player, leaderboard) {
    const nearbyPlayers = Object.values(this.players).filter(
      p => p !== player,
    );

    const nearbyBullets = this.bullets.filter(
      b => b,
    );

	 const obstacleReturn = this.obstacle_list.filter(
      o => o,
	 );


    return {
      t: Date.now(),
      me: player.serializeForUpdate(),
      others: nearbyPlayers.map(p => p.serializeForUpdate()),
      bullets: nearbyBullets.map(b => b.serializeForUpdate()),
      obstacles: obstacleReturn.map(o => o.serializeForUpdate()),
      leaderboard,
    };
  }
}

module.exports = Game;
