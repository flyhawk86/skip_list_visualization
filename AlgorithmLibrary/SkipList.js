// Copyright 2011 David Galles, University of San Francisco. All rights reserved.
//
// Redistribution and use in source and binary forms, with or without modification, are
// permitted provided that the following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of
// conditions and the following disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice, this list
// of conditions and the following disclaimer in the documentation and/or other materials
// provided with the distribution.
//
// THIS SOFTWARE IS PROVIDED BY David Galles ``AS IS'' AND ANY EXPRESS OR IMPLIED
// WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND
// FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> OR
// CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
// SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
// ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
// NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF
// ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
// The views and conclusions contained in the software and documentation are those of the
// authors and should not be interpreted as representing official policies, either expressed
// or implied, of the University of San Francisco



function SkipList(am, w, h) 
{
	this.init(am, w, h);
}

SkipList.prototype = new Algorithm();
SkipList.prototype.constructor = SkipList;
SkipList.superclass = Algorithm.prototype;

SkipList.KEY_LENGTH = 5;
SkipList.MARGIN_X = 100;
SkipList.MARGIN_Y = 100;
SkipList.SPACING_X = 70;
SkipList.SPACING_Y = 70;
SkipList.INACTIVE_NODE_COLOR = "#000000";
SkipList.ACTIVE_NODE_COLOR = "#808080";

SkipList.FLAG = false;

// Return a randomized number
SkipList.prototype.random = function () 
{
	var times;

    times = parseInt(this.txtRandom.value);

	if(isNaN(times)){
		this.txtRandom.value = "0";
	}

	if(times > 0){
		SkipList.FLAG = true;
		times = times-1;
		this.txtRandom.value = times.toString();
		return true;
	}

	if(SkipList.FLAG){
		SkipList.FLAG = false;
		this.txtRandom.value = "0";
		return false;
	}

	var probability;

	probability = parseFloat(this.adjustProbabilityText.value);

	if(probability < 0 || probability > 1.0){
		alert("The probability should be within range 0.0 and 1.0 inclusive; reset to default value 0.5");
		this.adjustProbabilityText.value = "0.5";
	}
		
	return Math.random() < probability;
}

// Compare two keys, handling sentinel cases as well
SkipList.compareKeys = function (k1, k2) 
{
	// handling sentinel cases
	if (k1 === "Left\nSentinel") {
		return -1;
	} else if (k1 === "Right\nSentinel") {
		return 1;
	} else if (k2 === "Left\nSentinel") {
		return 1;
	} else if (k2 === "Right\nSentinel") {
		return -1;
	} // handling numerical cases
	else if (k1 === k2) {
		return 0;
	} else if (k1 < k2) {
		return -1;
	} else {
		// (k1 > k2)
		return 1;
	}
}

// Return the rightmost node
SkipList.endOfLayer = function (p) 
{
	while (p.right !== undefined) {
		p = p.right;
	}
	return p;
}

// display the node on the canvas based on (ind,layer).
// (ind,layer) corresponds to the location in the canvas.
SkipList.prototype.nodeToCanvas = function (p) 
{
	var xOld = p.x;
	var yOld = p.y;
	p.x = SkipList.MARGIN_X + SkipList.SPACING_X * p.ind;
	p.y = SkipList.MARGIN_Y + SkipList.SPACING_Y * p.layer;

	// if there is a change to the previous location
	// adjust accordingly
	if (p.x !== xOld || p.y !== yOld) {
		// create a new circle on the canvas if the current node doesn't have one
		// else move the circle
		if (p.id === undefined) {
			p.id = this.nextIndex++;
			this.cmd("CreateCircle", p.id, p.key+"", p.x, p.y);
		} else {
			this.cmd("Move", p.id, p.x, p.y);
		}
	}
}

SkipList.prototype.init = function (am, w, h) 
{
	// Call the unit function of our "superclass", which adds a couple of
	// listeners, and sets up the undo stack
	SkipList.superclass.init.call(this, am, w, h);

	this.addControls();

	// just call the reset() to initialize the canvas or an empty skip list
	this.reset();
}


SkipList.prototype.addControls = function () 
{
	this.controls = [];

	this.textField = addControlToAlgorithmBar("Text", "");
	this.textField.onkeydown = this.returnSubmit(this.textField, this.insertCallback.bind(this), SkipList.KEY_LENGTH, true);
	this.controls.push(this.textField);

	this.lookupButton = addControlToAlgorithmBar("Button", "Lookup");
	this.lookupButton.onclick = this.lookupCallback.bind(this);
	this.controls.push(this.lookupButton);

	this.insertButton = addControlToAlgorithmBar("Button", "Insert");
	this.insertButton.onclick = this.insertCallback.bind(this);
	this.controls.push(this.insertButton);

	this.insertRandButton = addControlToAlgorithmBar("Button", "Insert a Random Number");
	this.insertRandButton.onclick = this.insertRandCallback.bind(this);
	this.controls.push(this.insertRandButton);

	this.removeButton = addControlToAlgorithmBar("Button", "Remove");
	this.removeButton.onclick = this.removeCallback.bind(this);
	this.controls.push(this.removeButton);

	this.lblRandom = addLabelToAlgorithmBar("Promotion Times for the Next Insertion (if 0 or not a number, then we flip coins): ");
    this.txtRandom = addControlToAlgorithmBar("Text", "0");
    this.controls.push(this.txtRandom);

	this.adjustProbabilityLabel = addLabelToAlgorithmBar("Adjust the probability of the coin flip between 0.0 and 1.0 (e.g. 0.8 means the 80% of the time favoring promotions)");
	this.adjustProbabilityText = addControlToAlgorithmBar("Text", "0.5");
	this.controls.push(this.adjustProbabilityText);
}


SkipList.prototype.reset = function () 
{
	this.nextIndex = 0;
	this.size = 0;

	// initialize an empty skip list with one Left\nSentinel and one Right\nSentinel only
	this.root = { key: "Left\nSentinel", ind: 0, layer: 0, right: { key: "Right\nSentinel", ind: 1, layer: 0 } };
	this.root.right.left = this.root;

	// create a banner on top of the screen for message display
	this.commands = [];
	this.bannerId = this.nextIndex++;
	this.cmd("CreateLabel", this.bannerId, "Canvas is initialized.", 0, 20, 0);

	// visualize left and right sentinels in the canvas
	this.nodeToCanvas(this.root);
	this.nodeToCanvas(this.root.right);
	this.connect(this.root, this.root.right, false, 1);
	this.animationManager.StartNewAnimation(this.commands);
}

// Create a new node
SkipList.prototype.newNode = function (key, ind, layer) 
{
	var p = {
		key: key,
		ind: ind,
		layer: layer
	};
	this.nodeToCanvas(p);
	return p;
}

// Connect two nodes with an directed/undirected edge.
SkipList.prototype.connect = function (p, q, isActive, isDirected) 
{
	this.cmd("Connect", p.id, q.id,
		isActive ? SkipList.ACTIVE_NODE_COLOR : SkipList.INACTIVE_NODE_COLOR,
		0 , isDirected);
}

// Disconnect the edge between two nodes
SkipList.prototype.disconnect = function (p, q) 
{
	this.cmd("Disconnect", p.id, q.id);
};

// Display a message on the top banner
SkipList.prototype.setMessage = function (str) 
{
	this.cmd("SetText", this.bannerId, str);
}

// Flash a node
SkipList.prototype.flashNode = function (id) 
{
	this.cmd("SetHighlight", id, 1);
	this.cmd("Step");
	this.cmd("SetHighlight", id, 0);
}

SkipList.prototype.lookupCallback = function (event) 
{
	var key = parseInt(this.textField.value);

	if (key !== "") {
		this.textField.value = "";
		this.implementAction(this.lookup.bind(this), key);
	}
}

SkipList.prototype.insertCallback = function (event) 
{
	var key = parseInt(this.textField.value);

	if (key !== "") {
		this.textField.value = "";
		this.implementAction(this.insert.bind(this), key);
	}
}

SkipList.prototype.insertRandCallback = function (event) 
{
	var key = Math.floor(Math.random() * Math.pow(10, SkipList.KEY_LENGTH));

	if (key !== "") {
		this.textField.value = "";
		this.implementAction(this.insert.bind(this), key);
	}
}

SkipList.prototype.removeCallback = function (event) 
{
	var key = parseInt(this.textField.value);

	if (key !== "") {
		this.textField.value = "";
		this.implementAction(this.remove.bind(this), key);
	}
}

// search for the key
SkipList.prototype.search = function (key) 
{	
	var p, isMovingRight;

	this.commands = [];
	this.setMessage("Searching for " + key);

	// go right and down, looking for the key
	p = this.root;
	while (true) {
		// Go to the right as far as possible
		while (true) {
			// Highlight nodes visited during searching
			this.cmd("SetForegroundColor", p.id, SkipList.ACTIVE_NODE_COLOR);
			this.cmd("SetHighlight", p.id, 1);
			this.cmd("Step");

			// check whether we found a matching key or a larger key
			isMovingRight = SkipList.compareKeys(p.right.key, key) <= 0;
			this.setMessage(isMovingRight ? "Going right" : "Going down");
			this.cmd("Step");

			// Leave the foreground color but remove the highlighted since we will move to another node
			this.cmd("SetHighlight", p.id, 0);
			if (!isMovingRight) {
				break;
			}
			this.connect(p, p.right, true, 1);
			p = p.right;
		}

		// Check if we can move down
		if (p.down === undefined) {
			break;
		}
		this.connect(p, p.down, true, 0);
		p = p.down;
	}

	this.setMessage("No layers below; Finish searching");
	this.currNode = p;
	return this.commands;
}

// Mark All nodes inactive 
SkipList.prototype.markAllNodesInactive = function () 
{
	var p1, p2;

	// traverse the entire list on all layers
	for (p1 = this.root; p1 !== undefined; p1 = p1.down) {
		for (p2 = p1; p2 !== undefined; p2 = p2.right) {
			this.cmd("SetForegroundColor", p2.id, SkipList.INACTIVE_NODE_COLOR);
			
			if (p2.right !== undefined) {
				this.connect(p2, p2.right, false, 1);
			}

			if (p2.down !== undefined) {
				this.connect(p2, p2.down, false, 0);
			}
		}
	}}

// look for the key
SkipList.prototype.lookup = function (key) 
{
	this.search(key);

	this.setMessage( SkipList.compareKeys(this.currNode.key, key) === 0 ?
		"Key " + key + " found" :
		"Key " + key + " not found");

	this.markAllNodesInactive(); 

	return this.commands;
}

// Insert a key to the skip list 
SkipList.prototype.insert = function (key) 
{
	var p1, p2, p_down, p_right, ind, topRoot, coinFlip;

	// move to the proper position for inserting the new key 
	this.search(key);

	p1 = this.currNode;
	// if the key exists, then nothing need to do
	if (SkipList.compareKeys(key, p1.key) === 0) {
		this.setMessage("Key " + key + " already exists");
		this.markAllNodesInactive();
		return this.commands;
	} 

	// real work of inserting the key starts here
	this.setMessage("Insert the key " + key);
	this.disconnect(p1, p1.right);
	this.size++;

	// the index of the current node in the current layer
	ind = p1.ind + 1;

	// Shift all nodes right of p1 on all layers one step/node to the right.
	// visually or on canvas
	for (p2 = p1.right; p2 !== undefined; p2 = p2.right) {
		for (p_right = p2; p_right !== undefined; p_right = p_right.up) {
			p_right.ind++;
			this.nodeToCanvas(p_right);
		}
	}
	this.cmd("Step");

	// iteratively insert the new key into the skip list on all layers
	p_down = undefined; 
	while (true) {
		// leave place on the current layer of the skip list first
		this.disconnect(p1, p1.right);
		p2 = this.newNode(key, ind, p1.layer);
		p2.right = p1.right;
		p2.right.left = p2;
		p2.left = p1;
		p2.left.right = p2;

		// connect two vertically adjacent nodes
		if (p_down !== undefined) {
			p2.down = p_down;
			p2.down.up = p2;
			this.connect(p2, p2.down, false, 0);
		}
		this.connect(p2.left, p2, false, 1);
		this.connect(p2, p2.right, false, 1);
		this.flashNode(p2.id);

		// Flip a coin for whether we keep building nodes
		coinFlip = this.random();
		this.setMessage(coinFlip ? "Coin flip result: True; Going up" : "Coin flip result: False; Stop");
		if (!coinFlip) {
			this.setMessage("Successfully inserted the key " + key);
			break;
		}

		// go to the left until we can go up
		while (true) {
			this.flashNode(p1.id);
			if (p1.up !== undefined) {
				break;
			} else if (p1.left !== undefined) {
				p1 = p1.left;
			} else {
				// Insert a new layer visually or on canvas
				{
					var p_, q_;
					for (p_ = this.root; p_ !== undefined; p_ = p_.down) {
						for (q_ = p_; q_ !== undefined; q_ = q_.right) {
							++q_.layer;
							this.nodeToCanvas(q_);
						}
					}
				}
				this.cmd("Step");

				// on the new layer, create left and right sentinels
				topRoot = this.newNode("Left\nSentinel", 0, 0);
				topRoot.right = this.newNode("Right\nSentinel", this.size - 1 + 2, 0);
				topRoot.right.left = topRoot;
				topRoot.down = p1;
				topRoot.down.up = topRoot;
				topRoot.right.down = SkipList.endOfLayer(p1);
				topRoot.right.down.up = topRoot.right;

				// and visually display edges
				this.connect(topRoot, topRoot.right, false, 1);
				this.connect(topRoot, topRoot.down, false, 0);
				this.connect(topRoot.right, topRoot.right.down, false, 0);
				this.root = topRoot;
				this.cmd("Step");

				break;
			}
		}
		p_down = p2;
		p1 = p1.up;
		this.flashNode(p1.id);
	}
	

	this.markAllNodesInactive();
	return this.commands;
}

// Remove a key from the skip list if it exists
SkipList.prototype.remove = function (key) 
{
	var p1, p2;

	this.search(key);

	p1 = this.currNode;
	if (SkipList.compareKeys(key, p1.key) !== 0) {
		this.setMessage("Key " + key + " not found and thus not in the list now");
		this.markAllNodesInactive();
		return this.commands;
	} 

	this.setMessage("Successfully removed key " + key);

	p2 = p1.right;

	// remove the key on all layers
	while (p1 !== undefined) {
		this.flashNode(p1.id);
		p1.left.right = p1.right;
		p1.right.left = p1.left;
		this.cmd("Delete", p1.id);
		this.connect(p1.left, p1.right, false, 1);
		p1 = p1.up;
	}

	for (; p2 !== undefined; p2 = p2.right) {
		for (p1 = p2; p1 !== undefined; p1 = p1.up) {
			p1.ind--;
			this.nodeToCanvas(p1);
		}
	}	

	this.markAllNodesInactive();
	return this.commands;
}


// Called by our superclass when we get an animation started event -- need to wait for the
// event to finish before we start doing anything
SkipList.prototype.disableUI = function (event) 
{
	for (var i = 0; i < this.controls.length; i++) {
		this.controls[i].disabled = true;
	}
}

// Called by our superclass when we get an animation completed event -- we can
/// now interact again.
SkipList.prototype.enableUI = function (event) 
{
	for (var i = 0; i < this.controls.length; i++) {
		this.controls[i].disabled = false;
	}
}


var currentAlg;

function init() 
{
	var animManag = initCanvas();
	currentAlg = new SkipList(animManag, canvas.width, canvas.height);

}