/**
 * forEach helper
 */let forEach = function(t, o, c) {
	if ("[object Object]" === Object.prototype.toString.call(t)) {
		for (let l in t) Object.prototype.hasOwnProperty.call(t, l) && o.call(c, l, t[l], t);
	} else {
		for (let e = t.length, r = e - 1; r >= 0; r--) o.call(c, r, t[r], t)
	}
};

class Snake {
	/**
	 * Constructor
	 */
	constructor(container) {
		this.body = document.body;
		this.container = container || this.body;
		this.running = false;
		this.loop = null;
		this.score = 0;
		this.step = 20;
		this.size = 20;
		this.interval = 100;
		this.crashed = false;
		this.position = { x: 0, y: 0 };
		this.segments = [];
		this.positions = [];
		this.direction = 'right';
		this.food = null;
		this.foodPosition = { x: 0, y: 0 };
		this.keyCodes = [37, 38, 39, 40, 80, 82];
    this.storage = localStorage;
		this.vendorPrefix = this.getVendorPrefix();
	}

	/**
	 * Render required elements
	 * @param  {int} width
	 * @param  {int} height
	 */
	render(width, height) {
		if ( !width || !height ) {
			console.warn('Method render requires width and height dimensions!');
			return;
		}
    
    const score = this.storage.getItem('snake_highscore');

		this.gridWidth = width;
		this.gridHeight = height;

		this.grid = this.createElement('div', {
			class: 'snakeContainer'
		});

		this.modal = this.createElement('div', {
			class: 'snakeModal'
		});

		this.scorer = this.createElement('div', {
			class: 'snakeScore'
		});

		this.setStyle(this.grid, {
			width: width + 'px',
			height: height + 'px'
		});

		this.grid.appendChild(this.modal);
		this.grid.appendChild(this.scorer);
		this.container.appendChild(this.grid);

		this.renderSnake();

    if ( score ) {
      this.setMessage('Welcome<small>Your highest score was: '+score+'</small>');
      return;
    }
		this.setMessage('Welcome<small>Hit a direction key to continue</small>');
	}

	/**
	 * Start the game
	 */
	start() {
		if (this.loop) {
			clearInterval(this.loop);
		}
		this.loop = setInterval(this.move.bind(this), this.interval);
		this.running = true;
		this.removeMessage();
	}

	/**
	 * Render the snake
	 */
	renderSnake(init) {
		let size = this.size,
			segments = 4,
			x = this.size * segments;

		this.snake = this.createElement('div', {
			class: 'snake'
		});

		for (let i = 0; i < segments; i++) {
			x -= this.step;

			let segment = this.createSegment(x, 0);
			this.segments.push(segment);
			this.snake.appendChild(segment);

			this.positions.push({ x: x, y: 0 });
		}

		this.position.x = this.positions[0].x;
		this.position.y = this.positions[0].y;

		this.grid.appendChild(this.snake);

		document.addEventListener('keydown', this.handler.bind(this), false);

		this.setScore(0);
		this.feed();
	}

	/**
	 * Render a new snake segment
	 * @param  {int} x
	 * @param  {int} y
	 * @return {HTMLElement}
	 */
	createSegment(x, y) {
		let size = this.size,
			segment = this.createElement('div');

		this.setStyle(segment, {
			width: size + 'px',
			height: size + 'px',
			transform: 'translate3d(' + x + 'px,' + y + 'px,0)',
		});

		return segment;
	}

	/**
	 * Reposition the segments
	 */
	move() {
		let self = this;

		// Do this before incrementing snake position for smoother transition
		// otherwise the snake will appear to pause for an interval
		if (this.position.x == this.foodPosition.x && this.position.y == this.foodPosition.y) {
			// eat the food
			this.eat(this.position.x, this.position.y);
		} else {
			// remove last segment position
			this.positions.pop();
		}

		// update direction
		switch (this.direction) {
			case 'left':
				this.position.x -= this.step;
				break;
			case 'right':
				this.position.x += this.step;
				break;
			case 'up':
				this.position.y -= this.step;
				break;
			case 'down':
				this.position.y += this.step;
				break;
		}

		// check for collision
		if (this.collided()) {
			this.crash();
			return;
		}

		// prepend new head position
		this.positions.unshift({
			x: this.position.x,
			y: this.position.y
		});

		// loop over segments and apply position from segment in front
		forEach(this.positions, function(index, position) {
			self.setStyle(self.segments[index], {
				transform: 'translate3d(' + position.x + 'px,' + position.y + 'px,0)',
			});
		});
	}

	/**
	 * Eat the food
	 * @param  {[type]} x position to place the food
	 * @param  {[type]} y position to place the food
	 */
	eat(x, y) {
		this.setScore(10);

		// Add a new segment
		let segment = this.createSegment(x, y);
		this.segments.unshift(segment);
		this.snake.insertBefore(segment, this.snake.firstElementChild);

		// Move the food to a new position
		this.feed();
	}

	/**
	 * Update the food position
	 */
	feed() {
    let self = this;
		if (this.food == null) {
			let food = this.createElement('div', { class: 'food' });
			this.setStyle(food, { width: this.size + 'px',  height: this.size + 'px' });
			this.grid.appendChild(food);
			this.food = food;
		}

		// Randomise the position of the food
		this.foodPosition.y = Math.floor((Math.random() * this.gridHeight - this.size) + 1);
		this.foodPosition.x = Math.floor((Math.random() * this.gridWidth - this.size) + 1);

		// round the random position to keep relative to the grid
		// otherwise the snake will starve :/
		this.foodPosition.y = Math.ceil( this.foodPosition.y / this.size) * this.size;
		this.foodPosition.x = Math.ceil( this.foodPosition.x / this.size) * this.size;
    
    // Make sure the food isn't under the snake
    forEach(this.positions, function(index, position) {
      if ( position.x == self.foodPosition.x && position.y == self.foodPosition.y ) {
        self.feed();
        return;
      }
    });

		this.setStyle(this.food, {
			transform: 'translate3d(' + this.foodPosition.x + 'px, ' + this.foodPosition.y + 'px,0)'
		});
	}

	/**
	 * Snake has crashed into the container walls or itself
	 */
	crash() {
    let score = this.storage.getItem('snake_highscore');
		if (this.loop) {
			clearInterval(this.loop);
		}
		this.running = false;
		this.crashed = true;
    
    if ( score && this.score > score ) {
		  this.setMessage('New High Score!<small>Hit R to restart</small>');
    } else {
      this.setMessage('Game Over!<small>Hit R to restart</small>');
    }
    
    this.storage.setItem('snake_highscore', this.score);
	}

	/**
	 * Stop the current loop
	 */
	stop() {
		this.running = false;
		if (this.loop) {
			clearInterval(this.loop);
		}
	}

	/**
	 * Pause the game
	 */
	pause() {
		if (this.running) {
			this.setMessage('Paused<small>Hit any direction key to continue</small>');
			this.stop();
		}
	}

	/**
	 * Continue the game from pause
	 */
	continue () {
		this.running = true;
		if (this.loop) {
			clearInterval(this.loop);
		}
		this.loop = setInterval(this.move.bind(this), this.interval);
	}

	/**
	 * Reset the game
	 */
	restart() {

		this.snake.innerHTML = '';

		this.crashed = false;
		this.running = false;
		this.segments = [];
		this.positions = [];
		this.direction = 'right';

		if (this.loop) {
			clearInterval(this.loop);
		}

		let size = this.size,
			segments = 4,
			x = this.size * segments;

		for (let i = 0; i < segments; i++) {
			x -= this.step;

			let segment = this.createSegment(x, 0);
			this.segments.push(segment);
			this.snake.appendChild(segment);

			this.positions.push({ x: x, y: 0 });
		}

		this.position.x = this.positions[0].x;
		this.position.y = this.positions[0].y;

		this.setScore(0);
		this.feed();

		this.setMessage('<small>Press any direction key to continue</small>');
	}

	/**
	 * Check whether the snake's head has collided with the container walls or itself
	 * @param  {int} x position of the head
	 * @param  {int} y position of the head
	 * @return {bool}
	 */
	collided(x, y) {
		let crashed = false, self = this;

		// Has the head collided with container?
		if (this.position.x < 0 || this.position.x > this.gridWidth - this.size || this.position.y < 0 || this.position.y > this.gridHeight - this.size) {
			crashed = true;
		}

		// Has the head collided with the body?
		forEach(this.positions, function(i, pos) {
			if (pos.x == self.position.x && pos.y == self.position.y) {
				crashed = true;
			}
		});

		// Nope
		return crashed;
	}

	/**
	 * Set a message in the modal
	 * @param {string} message
	 */
	setMessage(message) {
		this.modal.innerHTML = message;
		this.modal.classList.add('active');
	}

	/**
	 * Remove the modal
	 */
	removeMessage() {
		this.modal.innerHTML = '';
		this.modal.classList.remove('active');
	}

	/**
	 * Update the score
	 * @param {int} score
	 */
	setScore(score) {
		this.score += score;
		this.scorer.innerHTML = 'Score: ' + this.score;
	}

	/**
	 * Set the speed of the game
	 * @param {int} speed
	 */
	setSpeed(speed) {
		this.interval = 10 / speed;
	}

	/**
	 * Movement handler
	 * @param  {DOM Event} event
	 */
	handler(event) {
		event = event || window.event;

		let self = this, keyCode = event.which, origDirection = self.direction;

		if ( self.crashed || self.keyCodes.indexOf(keyCode) < 0 ) {
			if ( keyCode == 82 ) {
				self.restart();
			}
			return;
		}

		if (!self.running) self.start();

		switch (keyCode) {
			case 37: self.direction = 'left'; break;
			case 38: self.direction = 'up'; break;
			case 39: self.direction = 'right'; break;
			case 40: self.direction = 'down'; break;
			case 80: self.pause(); break;
			case 82: self.restart(); break;
		}

		// No reversing
		if (self.direction == 'left' && origDirection == 'right' ||
			self.direction == 'right' && origDirection == 'left' ||
			self.direction == 'up' && origDirection == 'down' ||
			self.direction == 'down' && origDirection == 'up') {
			self.direction = origDirection;
		}

		event.preventDefault();
	}

	/**
	 * Create element helper
	 * @param  {string} type  HTML DOM nodeName
	 * @param  {object} attrs Attributes to apply
	 * @return {HTMLElement}
	 */
	createElement(type, attrs) {
		let attr, elem = document.createElement(type);
		if (attrs) {
			for (attr in attrs) {
				elem.setAttribute(attr, attrs[attr]);
			}
		}
		return elem;
	}

	/**
	 * Update the style on a HTMLElement
	 * @param {HTMLElement} element
	 * @param {object} properties
	 */
	setStyle(element, properties) {
		let property, css = '';
		for (property in properties) {
			css += property + ': ' + properties[property] + ';';
			css += this.vendorPrefix + property + ': ' + properties[property] + ';';
		}
		element.style.cssText += css;
	}

	/**
	 * Get the current vendor prefix for setStyle
	 * @return {string} Vendor Prefix
	 */
	getVendorPrefix() {
		let ua = navigator.userAgent.toLowerCase(),
			match = /opera/.exec(ua) || /msie/.exec(ua) || /firefox/.exec(ua) || /(chrome|safari)/.exec(ua) || /trident/.exec(ua),
			vendors = { opera: '-o-', chrome: '-webkit-', safari: '-webkit-', firefox: '-moz-', trident: '-ms-', msie: '-ms-' };
		return vendors[match[0]];
	}
}let screen = document.getElementById('screen');let snake = new Snake(screen);

snake.render(600,400);
