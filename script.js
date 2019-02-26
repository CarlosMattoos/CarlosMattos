(function(){
	// CANVAS ======================================================================================================

	var cnv = document.querySelector('canvas');
	
	// CONTEXTO DE RENDERIZAÇÃO 2D ======================================================================================================

	var ctx = cnv.getContext('2d');
	
	// RECURSOS DO JOGO ======================================================================================================

	// ARRAYS ===============================================================================================================

	var sprites = [];
	var assetsToLoad = [];
	var missiles = [];
	var aliens = [];
	var messages = [];
	
	// VARIÁVEIS ÚTEIS ======================================================================================================

	var alienFrequency = 100;
	var alienTimer = 0;
	var shots = 0;
	var hits = 0;
	var acuracy = 0;
	var scoreToWin = 70;
	var FIRE = 0, EXPLOSION = 1;
	
	// SPRITES ======================================================================================================

	// CENÁRIO ======================================================================================================

	var background = new Sprite(0,56,400,500,0,0);
	sprites.push(background);
	
	// NAVE ======================================================================================================

	var defender = new Sprite(0,0,30,50,185,450);
	sprites.push(defender);

	// MENSAGEM NA TELA INICIAL ======================================================================================================

	var startMessage = new ObjectMessage(cnv.height/2,"PRESS ENTER","#f00");
	messages.push(startMessage);

	// MENSAGEM DE PAUSE ======================================================================================================

	var pausedMessage = new ObjectMessage(cnv.height/2,"PAUSED", "#f00");
	pausedMessage.visible = false;
	messages.push(pausedMessage);

	// MENSAGEM DE GAME OVER ======================================================================================================

	var gameOverMessage = new ObjectMessage(cnv.height/2,"","#f00");
	gameOverMessage.visible = false;
	messages.push(gameOverMessage);

	// PLACAR ======================================================================================================

	var scoreMessage = new ObjectMessage(10,"","#0f0");
	scoreMessage.font = "normal bold 15px emulogic";
	updateScore();
	messages.push(scoreMessage);
	
	// IMAGEM ======================================================================================================

	var img = new Image();
	img.addEventListener('load',loadHandler,false);
	img.src = "img/img.png";
	assetsToLoad.push(img);

	// CONTADOR DE RECURSOS ======================================================================================================

	var loadedAssets = 0;
	
	
	// ENTRADAS ======================================================================================================

	var LEFT = 37, RIGHT = 39, ENTER = 13, SPACE = 32;
	
	// AÇÕES ======================================================================================================

	var mvLeft = mvRight = shoot = spaceIsDown = false;
	
	// ESTADOS DO JOGO ======================================================================================================

	var LOADING = 0, PLAYING = 1, PAUSED = 2, OVER = 3;
	var gameState = LOADING;
	
	// LISTENERS ======================================================================================================

	window.addEventListener('keydown',function(e){
		var key = e.keyCode;
		switch(key){
			case LEFT:
				mvLeft = true;
				break;
			case RIGHT:
				mvRight = true;
				break;
			case SPACE:
				if(!spaceIsDown){
					shoot = true;
					spaceIsDown = true;
				}
				break;
		}
	},false);
	
	window.addEventListener('keyup',function(e){
		var key = e.keyCode;
		switch(key){
			case LEFT:
				mvLeft = false;
				break;
			case RIGHT:
				mvRight = false;
				break;
			case ENTER:
				if(gameState !== OVER){
				if(gameState !== PLAYING){
					gameState = PLAYING;
					startMessage.visible = false;
					pausedMessage.visible = false;
				} else {
					gameState = PAUSED;
					pausedMessage.visible = true;

				}
			}
				break;
			case SPACE:
				spaceIsDown = false;
		}
	},false);
	
	
	
	// FUNÇÕES ======================================================================================================

	function loadHandler(){
		loadedAssets++;
		if(loadedAssets === assetsToLoad.length){
			img.removeEventListener('load',loadHandler,false);
			//inicia o jogo
			gameState = PAUSED;
		}
	}
	
	function loop(){
		requestAnimationFrame(loop, cnv);

		// DEFINE AS AÇÕES COM BASE NO ESTADO DO JOGO ======================================================================================================

		switch(gameState){
			case LOADING:
				console.log('LOADING...');
				break;
			case PLAYING:
				update();
				break;
			case OVER:
				endGame();
				break;
		}
		render();
	}
	
	function update(){

		// MOVE PARA A ESQUERDA ======================================================================================================

		if(mvLeft && !mvRight){
			defender.vx = -10;
		}
		
		// MOVE PARA A DIREITA ======================================================================================================

		if(mvRight && !mvLeft){
			defender.vx = 10;
		}
		
		// PARA A NAVE ======================================================================================================

		if(!mvLeft && !mvRight){
			defender.vx = 0;
		}
		
		// DISPARA O TIRO ======================================================================================================

		if(shoot){
			fireMissile();
			shoot = false;
		}
		
		// ATUALIZA A POSIÇÃO ======================================================================================================

		defender.x = Math.max(0,Math.min(cnv.width - defender.width, defender.x + defender.vx));
		
		// ATUALIZA A POSIÇÃO DOS MÍSSEIS ======================================================================================================

		for(var i in missiles){
			var missile = missiles[i];
			missile.y += missile.vy;
			if(missile.y < -missile.height){
				removeObjects(missile,missiles);
				removeObjects(missile,sprites);
				updateScore();
				i--;
			}
		}
		
		// INCREMENTO DO ALIEN TIMER ======================================================================================================

		alienTimer++;
		
		// CRIAÇÃO DO ALIEN, CASO O TIMER SE IGUALE A FREQUÊNCIA ======================================================================================================

		if(alienTimer === alienFrequency){
			makeAlien();
			alienTimer = 0;

			// AJUSTE NA FREQUÊNCIA DA CRIAÇÃO DOS  ======================================================================================================

			if(alienFrequency > 2){
				alienFrequency--;
			}
		}
		
		// MOVIMENTAÇÃO DOS ALIENS ======================================================================================================

		for(var i in aliens){
			var alien = aliens[i];
			if(alien.state !== alien.EXPLODED){
				alien.y += alien.vy;
				if(alien.state === alien.CRAZY){
					if(alien.x > cnv.width - alien.width || alien.x < 0){
						alien.vx *= -1;
					}
					alien.x += alien.vx;
				}
			}
			
			// CONFERE SE ALGUM ALIEN CHEGOU A TERRA ======================================================================================================

			if(alien.y > cnv.height + alien.height){
				gameState = OVER;
			}
			

			// CONFERE SE ALGUM ALIEN COLIDIU COM A NAVE ======================================================================================================

			if(collide(alien,defender)){
				destroyAlien(alien);
				removeObjects(defender,sprites);
				gameState = OVER;

			}


			// CONFERE SE ALGUM ALIEN FOI DESTRUÍDO ======================================================================================================

			for(var j in missiles){
				var missile = missiles[j];
				if(collide(missile,alien) && alien.state !== alien.EXPLODED){
					destroyAlien(alien);
					hits++;
					updateScore();
					if(parseInt(hits) === scoreToWin){
						gameState = OVER;

						// DESTRÓI TODOS OS ALIENS ======================================================================================================

						for(var k in aliens){
							var alienk = aliens[k];
							destroyAlien(alienk);
						}
					}
					removeObjects(missile,missiles);
					removeObjects(missile,sprites);
					i--;
					j--;
				}
			}

		}

		// FIM DA MOVIMENTAÇÃO DOS ALIENS ======================================================================================================

	}
	// FIM DO UPDATE ======================================================================================================
	
	// CRIAÇÃO DOS MÍSSEIS ======================================================================================================

	function fireMissile(){
		var missile = new Sprite(136,12,8,13,defender.centerX() - 4,defender.y - 13);
		missile.vy = -8;
		sprites.push(missile);
		missiles.push(missile);
		playSound(FIRE);
		shots++;
	}
	
	// CRIAÇÃO DOS ALIENS ======================================================================================================

	function makeAlien(){

		// CRIA UM VALOR ALEATÓRIO ENTRE 0 E 7 => LARGURA DO CANVAS / LARGURA DO ALIEN ======================================================================================================

		// DIVIDE O CANVAS EM 8 COLUNAS PARA O POSICIONAMENTO ALEATÓRIO DO ALIEN ======================================================================================================

		var alienPosition = (Math.floor(Math.random() * 8)) * 50;
		
		var alien = new Alien(30,0,50,50,alienPosition,-50);
		alien.vy = 1;
		
		// OTIMIZAÇÃO DO ALIEN ======================================================================================================

		if(Math.floor(Math.random() * 11) > 7){
			alien.state = alien.CRAZY;
			alien.vx = 2;
		}
		
		if(Math.floor(Math.random() * 11) > 5){
			alien.vy = 2;
		}
		
		sprites.push(alien);
		aliens.push(alien);
	}
	
	// DESTRÓI OS ALIENS ======================================================================================================

	function destroyAlien(alien){
		alien.state = alien.EXPLODED;
		alien.explode();
		playSound(EXPLOSION);
		setTimeout(function(){
			removeObjects(alien,aliens);
			removeObjects(alien,sprites);
		},1000);
	}
	
	// REMOVE OS OBJETOS DO JOGO ======================================================================================================

	function removeObjects(objectToRemove,array){
		var i = array.indexOf(objectToRemove);
		if(i !== -1){
			array.splice(i,1);
		}
	}

	// ATUALIZAÇÃO DO PLACAR ======================================================================================================

	function updateScore(){

		// CÁLCULO DO APROVEITAMENTO ======================================================================================================

		if(shots === 0){
			acuracy = 100;
		} 
		else {
			acuracy = Math.floor((hits/shots) * 100);
		}

		// AJUSTE DO TEXTO ======================================================================================================

		if(acuracy < 100){
			acuracy = acuracy.toString();
			if(acuracy.length < 2){
				acuracy = "  " + acuracy;
			}
			else {
				acuracy = " " + acuracy;
			}
		}

		// AJUSTE NO TEXTO DO HITS ======================================================================================================

		hits = hits.toString();
		if(hits.length < 2){
			hits = "0" + hits;
		}

		scoreMessage.text = "HITS: " + hits + " - ACURACY: " + acuracy + "%";
	}

	// FUNÇÃO DE GAME OVER ======================================================================================================

	function endGame(){
		if(hits < scoreToWin){
			gameOverMessage.text = "EARTH DESTROYED!";
			gameOverMessage.visible = true;

		}
		else {
			gameOverMessage.text = "EARTH SAVED!";
			gameOverMessage.color = "#00f";
			gameOverMessage.visible = true;
		}
		
		setTimeout(function(){
			location.reload();
		},3000);
	}

	// EFEITOS SONOROS ======================================================================================================

	function playSound(soundType){
		var sound = document.createElement("audio");
			if(soundType === EXPLOSION){
				sound.src = "sound/explosion.ogg";
			}
			else {
				sound.src = "sound/fire.ogg";
			}
			sound.addEventListener("canplaythrough",function(){
				sound.play();
			},false);
	}
	
	function render(){
		ctx.clearRect(0,0,cnv.width,cnv.height);

		// EXIBE OS SPRITES ======================================================================================================

		if(sprites.length !== 0){
			for(var i in sprites){
				var spr = sprites[i];
				ctx.drawImage(img,spr.sourceX,spr.sourceY,spr.width,spr.height,Math.floor(spr.x),Math.floor(spr.y),spr.width,spr.height);
			}
		}

		// EXIBE OS TEXTOS ======================================================================================================

		if(messages.length !== 0){
			for(var i in messages){
				var message = messages[i];
				if(message.visible){
					ctx.font = message.font;
					ctx.fillStyle = message.color;
					ctx.textBaseline = message.baseline;
					message.x = (cnv.width - ctx.measureText(message.text).width)/2;
					ctx.fillText(message.text,message.x,message.y);
				}
			}
		}
	}
	
	loop();
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
}());
