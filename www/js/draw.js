(function() {

	var canvas = document.querySelector('#paint');
	var ctx = canvas.getContext('2d');
	var markerWidth = 5;	
	var markerColor = $('#pen-color').val();
	var sketch = document.querySelector('#sketch');
	var sketch_style = getComputedStyle(sketch);
	var toolID = "pencil";
	var currpreset = "preset-first";
	var cPushArray = new Array();
	var cStep = -1;
	var isDrawing, lastPoint; // Brush preset 3
	var points = [ ]; // Brush Preset 4
	var isConnected = false;
	canvas.width = parseInt(sketch_style.getPropertyValue('width'));
	canvas.height = parseInt(sketch_style.getPropertyValue('height'));

	// Connection
	var currentIPaddress;
	var socket;
	
	// Creating a tmp canvas
	var tmp_canvas = document.createElement('canvas');
	var tmp_ctx = tmp_canvas.getContext('2d');
	tmp_canvas.id = 'tmp_canvas';
	tmp_canvas.width = canvas.width;
	tmp_canvas.height = canvas.height;
	sketch.appendChild(tmp_canvas);
	
	var mouse = {x: 0, y: 0};
	var last_mouse = {x: 0, y: 0};

	// Detect Connection
	if (socket != undefined) {
		connects();
	}

	// Request Connection
	$("#btnConnect").click(function(){
        connects();
        socket.on("connect", function(){
            socket.emit("sender", "start com");
            $("#ipaddress").css("display", "none");
            $(".close-connect").css("display", "none");
            $("#btnConnect").css("display", "none");
            $("#waiting-state").html("<img style='width:100px' src='img/Loading_icon.gif'><br/><p style='color:green;font-weight:bold;'>Successfully connected.</p> Waiting for canvas details...");
            $("#waiting-state").css("padding", "20px");
            isConnected = true;
        });
        
        socket.on("onClearCanvasToMobile", function(data){
        	resetCanvas();
			var cPushArray = new Array();
        });

        socket.on("onDisconnectToMobile", function(data){
        	location.reload();
        });

        socket.on("onBgChangeToMobile", function(data){
        	bgColor = data.bgColor;
        	bgIsColored = data.bgIsColored;
        	if (bgIsColored) {
        		$("#paint").css("background-color", bgColor);
        	} else {
        		$("#paint").css("background-color", "#FFFFFF");
        	}
        });
    });

	// Connection Function
    function connects(){
		currentIPaddress = $('#ipaddress').val();
        socket = io('http://'+currentIPaddress+':3000');

        socket.on("createCanvasToMobile", function(data){
			$("#connect-modal").css("display", "none");
			// Set Canvas Property
			canvas.width = parseInt(data.canvasWidth);
			canvas.height = parseInt(data.canvasHeight);
			tmp_canvas.width = parseInt(data.canvasWidth);
			tmp_canvas.height = parseInt(data.canvasHeight);
			// Display Canvas
			$("#paint").css("background-color", data.canvasBackgroundColor);
			$("#paint").css("box-shadow", "0px 4px 14px grey");
			$("#sketch").css("background-color", "#d8d8d8");
			$("#settings").toggleClass('active-menu');
			$('.drop-menu').toggleClass('show-menu');
			//Display Connected State
			$('#connectedState').css("display", "block");
			$('.slider').css("top", "25px");
			$('.left-menu').css("height", "80%");
			//Change menu options
			$(".primary").css("display", "none");
			$("#canvas-settings").css("display", "block");
			$("#canvas-settings").html("Set Background");
			$("#open-file").css("display", "block");
			$("#share").css("display", "block");
			$("#new-canvas").css("display", "block");
			$(".secondary").css("display", "block");
        });
	}

	// Get Current Tool ID
	$('.tool').click( function () {
		toolID = $(this).attr('id');

		if (isConnected) {
			socket.emit("sendActiveTool", toolID);
		}

		if (toolID == "brush") {
			brushpreset1();
		}
	});

	// Get Current Preset ID
	$('.presets').click( function () {
		currpreset = $(this).attr('id');

		if (isConnected) {
			socket.emit("sendActivePreset", currpreset);
		}

		if (toolID == "brush"){
			switch (currpreset) {
				case 'preset-first':
					brushpreset1();
				break;
				case 'preset-second':
					brushpreset2();
				break;
				case 'preset-third':
					brushpreset3();
				break;
				case 'preset-fourth':
					brushpreset4();
				break;
			}
		} else {
			return;
		}
	});

	// Pencil Points
	var ppts = [];

	/* Mouse Capturing Work */
	tmp_canvas.addEventListener('touchmove', function(e) {
		var targetYval = e.targetTouches[0].pageY;
		var targetXval = e.targetTouches[0].pageX;
		mouse.x = typeof targetXval !== 'undefined' ? targetXval : e.layerX;
		mouse.y = typeof targetYval  !== 'undefined' ? targetYval  : e.layerY;
		if (isConnected) {
			socket.emit("sendCoordinates", {x: mouse.x, y: mouse.y});
		}
	}, false);

	$('#pen-width').change(function () {
		markerWidth = parseInt($('#pen-width').val());
		tmp_ctx.lineWidth = markerWidth;
		$('#pen-width-label').val(markerWidth);
		if (isConnected) {
			socket.emit("sendPenWidth", markerWidth);
		}	
	});

	$('#pen-color').change(function () {
		markerColor = $(this).val();
		tmp_ctx.strokeStyle = markerColor;
		tmp_ctx.fillStyle = markerColor;
		if (isConnected) {
			socket.emit("sendPenColor", markerColor);
		}
	});

	var bgColor;
	var bgIsColored = false;

	$('#setCanvasType').click(function(){
		if ($('#canvas-type').val() == "Color") {
			bgColor = $('#custom-bg-color').val();
			bgIsColored = true;
		} else {
			bgColor = "#FFFFFF";
			bgIsColored = false;
		}

		$('#paint').css("background-color", bgColor);
		
		if (isConnected) {
			socket.emit("onBgChangeFromMobile", {bgColor:bgColor, bgIsColored:bgIsColored});
		}
	});

	// OnPaint TouchStart
	tmp_canvas.addEventListener('touchstart', function(e) {
		tmp_canvas.addEventListener('touchmove', onPaint, false);
		var parentOffset = $(this).parent().offset();
		var targetYval = e.targetTouches[0].pageY;
		var targetXval = e.targetTouches[0].pageX;
		mouse.x = typeof targetXval !== 'undefined' ? targetXval : e.layerX;
		mouse.y = typeof targetYval  !== 'undefined' ? targetYval  : e.layerY;

		ppts.push({x: mouse.x, y: mouse.y});

		if (isConnected) {
			socket.emit("onTouchStart", "touchstart");
		}

		if (isConnected) {
			socket.emit("sendCoordinates", {x: mouse.x, y: mouse.y});
		}

		switch (toolID) {
			case 'pencil':
				ctx.globalCompositeOperation = 'source-over';
				markerColor = $('#pen-color').val();
				tmp_ctx.strokeStyle = markerColor;
				tmp_ctx.fillStyle = markerColor;
				tmp_ctx.shadowBlur = 0;
				tmp_ctx.lineJoin = 'round';
				tmp_ctx.lineCap = 'round';
				onPaint();
			break;
			case 'color-picker': 
				ctx.globalCompositeOperation = 'source-over';
				var canvasPic = new Image();
				canvasPic.src = cPushArray[cStep];

				// user coordinates
				var targetYval = e.targetTouches[0].pageY;
				var targetXval = e.targetTouches[0].pageX;
				mouse.x = typeof targetXval !== 'undefined' ? targetXval : e.layerX;
				mouse.y = typeof targetYval  !== 'undefined' ? targetYval  : e.layerY;

				// image data and RGB values 
				var img_data = ctx.getImageData(mouse.x, mouse.y, 1, 1).data;
				var R = img_data[0];
				var G = img_data[1];
				var B = img_data[2];
				var A = img_data[3];
				var rgb = R + ',' + G + ',' + B + ',' + A;

				var hex = rgbToHex(R, G, B);

				// if (hex)
				if (A == 0) {
					if (bgIsColored) {
						markerColor = bgColor;
					} else {
						markerColor = '#FFF';
					}
				} else {
					markerColor = '#'+ hex;
				}

				$('#pen-color').val(markerColor);
				tmp_ctx.strokeStyle = markerColor;
				tmp_ctx.fillStyle = markerColor;
				$('.simpleColorDisplay').css('background-color', markerColor);

				if (isConnected) {
					socket.emit("onColorSend", markerColor);
				}
			break;
			case 'eraser':
				onErase();
			break;
		}		
	}, false);

	// Onpaint TouchEnd
	tmp_canvas.addEventListener('touchend', function() {
		tmp_canvas.removeEventListener('touchmove', onPaint, false);
		// Writing down to real canvas now
		ctx.drawImage(tmp_canvas, 0, 0);
		// Storing every strokes to Array
		cPush();
		// Clearing tmp canvas
		tmp_ctx.clearRect(0, 0, tmp_canvas.width, tmp_canvas.height);
		// Emptying up Pencil Points
		ppts = [];
		if (isConnected) {
			socket.emit("onTouchEnd", "touchend");
		}
	}, false);
	
	$('#new-canvas').click(function(){
		resetCanvas();
		var cPushArray = new Array();

		if (isConnected) {
			socket.emit("onClearCanvasFromMobile", 'clear');
		}

		$('#settings').toggleClass('active-menu');
		$('.drop-menu').toggleClass('show-menu');
	});

	// UNDO event
	$('#undo').click(function(){
		if (cStep == 0) {
			resetCanvas();
		}

		if (cStep > 0) {
	        cStep--;
	        var canvasPic = new Image();
	        var src = cPushArray[cStep];
	        canvasPic.onload = function (){ 
	        	ctx.clearRect(0, 0, canvas.width, canvas.height);
	        	ctx.drawImage(canvasPic, 0, 0); 
	        }
	        canvasPic.src = cPushArray[cStep];

		 	if (isConnected) {
				socket.emit("onUndo", cPushArray[cStep]);
			}
	    }

	    if (isConnected) {
			socket.emit("cStep", cStep);
		}
	});

	// REDO event
	$('#redo').click(function(){
		if (cStep < cPushArray.length-1) {
	        cStep++;
	        var canvasPic = new Image();
	        canvasPic.src = cPushArray[cStep];
	        canvasPic.onload = function () { 
	        	ctx.clearRect(0, 0, canvas.width, canvas.height);
	        	ctx.drawImage(canvasPic, 0, 0); 
	        }

	        if (isConnected) {
				socket.emit("onRedo", cPushArray[cStep]);
			}
   		}

   		if (isConnected) {
			socket.emit("cStep", cStep);
		}
	});

	var onPaint = function() {
		// Saving all the points in an array
		ppts.push({x: mouse.x, y: mouse.y});
		if (ppts.length < 3) {
			var b = ppts[0];
			tmp_ctx.beginPath();
			tmp_ctx.arc(b.x, b.y, tmp_ctx.lineWidth / 2, 0, Math.PI * 2, !0);
			tmp_ctx.fill();
			tmp_ctx.closePath();
			return;
		}
		// Tmp canvas is always cleared up before drawing.
		tmp_ctx.clearRect(0, 0, tmp_canvas.width, tmp_canvas.height);
		tmp_ctx.beginPath();
		tmp_ctx.moveTo(ppts[0].x, ppts[0].y);
		for (var i = 1; i < ppts.length - 2; i++) {
			var c = (ppts[i].x + ppts[i + 1].x) / 2;
			var d = (ppts[i].y + ppts[i + 1].y) / 2;
			tmp_ctx.quadraticCurveTo(ppts[i].x, ppts[i].y, c, d);
		}
		// For the last 2 points
		tmp_ctx.quadraticCurveTo(
			ppts[i].x,
			ppts[i].y,
			ppts[i + 1].x,
			ppts[i + 1].y
		);
		tmp_ctx.stroke();
	};

	// Eraser Function
	var onErase = function() {
		if (bgIsColored) {
			eraserColor = bgColor;
		} else {
			eraserColor = '#FFF';
		}
		// Saving all the points in an array
		ppts.push({x: mouse.x, y: mouse.y});
		tmp_ctx.strokeStyle = eraserColor;
		tmp_ctx.fillStyle = eraserColor;
		tmp_ctx.shadowBlur = 0;
		tmp_ctx.lineWidth = markerWidth;
		ctx.globalCompositeOperation = 'destination-out';
		if (ppts.length < 3) {
			var b = ppts[0];
			tmp_ctx.beginPath();
			tmp_ctx.arc(b.x, b.y, tmp_ctx.lineWidth / 2, 0, Math.PI * 2, !0);
			tmp_ctx.fill();
			tmp_ctx.closePath();
			return;
		}
		// Tmp canvas is always cleared up before drawing.
		tmp_ctx.clearRect(0, 0, tmp_canvas.width, tmp_canvas.height);
		tmp_ctx.beginPath();
		tmp_ctx.moveTo(ppts[0].x, ppts[0].y);
		for (var i = 1; i < ppts.length - 2; i++) {
			var c = (ppts[i].x + ppts[i + 1].x) / 2;
			var d = (ppts[i].y + ppts[i + 1].y) / 2;
			tmp_ctx.quadraticCurveTo(ppts[i].x, ppts[i].y, c, d);
		}
		// For the last 2 points
		tmp_ctx.quadraticCurveTo(
			ppts[i].x,
			ppts[i].y,
			ppts[i + 1].x,
			ppts[i + 1].y
		);
		tmp_ctx.stroke();
	};

	// Preset 1 TouchStart Function
	var brushpreset1 = function () {
		tmp_canvas.addEventListener('touchstart', function(e) {
			tmp_canvas.addEventListener('touchmove', OnDrawFirst, false);
			
			points = [ ];
			isDrawing = true;
		
			var parentOffset = $(this).parent().offset();
			var xval = e.pageX - parentOffset.left;
			var yval = e.pageY - parentOffset.top;

			mouse.x = typeof xval !== 'undefined' ? xval : e.layerX;
			mouse.y = typeof yval  !== 'undefined' ? yval  : e.layerY;

			points.push({ x: mouse.x, y: mouse.y });

			if (toolID == "brush" && currpreset == "preset-first") {
				var rgbaval = hexToRgbA(markerColor);
				tmp_ctx.strokeStyle = rgbaval+',0.3)';
				tmp_ctx.fillStyle = rgbaval+',0.3)';
				ctx.globalCompositeOperation = 'source-over';
				OnDrawFirst();
			}

			if (isConnected) {
				socket.emit("onTouchBrushStart", "brushtouchstart");
			}
		});

		tmp_canvas.addEventListener('touchend', function(){
			tmp_canvas.removeEventListener('touchmove', OnDrawFirst, false);
			isDrawing = false;
			points.length = 0;
			if (isConnected) {
				socket.emit("onTouchBrushEnd", "brushtouchend");
			}
		});
	};

	// Preset 2 TouchStart Function
	var brushpreset2 = function () {
		tmp_ctx.lineJoin = tmp_ctx.lineCap = 'round';
	
		points = [ ];
		tmp_canvas.addEventListener('touchstart', function(e) {
			tmp_canvas.addEventListener('touchmove', OnDrawSec, false);
			
			isDrawing = true;
			
			var parentOffset = $(this).parent().offset();
			var xval = e.pageX - parentOffset.left;
			var yval = e.pageY - parentOffset.top;

			mouse.x = typeof xval !== 'undefined' ? xval : e.layerX;
			mouse.y = typeof yval  !== 'undefined' ? yval  : e.layerY;

			points.push({ x: mouse.x, y: mouse.y });
			
			if (toolID == "brush" && currpreset == "preset-second") {
				tmp_ctx.strokeStyle = markerColor;
				ctx.globalCompositeOperation = 'source-over';
				OnDrawSec();
			} else {
				return;
			}

			if (isConnected) {
				socket.emit("onTouchBrushStart", "brushtouchstart");
			}
		});

		tmp_canvas.addEventListener('touchend', function(){
			tmp_canvas.removeEventListener('touchmove', OnDrawSec, false);
			isDrawing = false;
			points.length = 0;
			if (isConnected) {
			socket.emit("onTouchBrushEnd", "brushtouchend");
			}
		});
	};

	// Preset 3 TouchStart Function
	var brushpreset3 = function() {
		tmp_ctx.lineJoin = tmp_ctx.lineCap = 'round';

		tmp_canvas.addEventListener('touchstart', function(e) {
			tmp_canvas.addEventListener('touchmove', OnDrawThird, false);
			
			var parentOffset = $(this).parent().offset();
			var xval = e.pageX - parentOffset.left;
			var yval = e.pageY - parentOffset.top;

			mouse.x = typeof xval !== 'undefined' ? xval : e.layerX;
			mouse.y = typeof yval  !== 'undefined' ? yval  : e.layerY;

			isDrawing = true;
			lastPoint = { x: mouse.x, y: mouse.y };

			if (toolID == "brush" && currpreset == "preset-third") {
				ctx.globalCompositeOperation = 'source-over';
				ctx.strokeStyle = markerColor;
				OnDrawThird();
			}
		});

		tmp_canvas.addEventListener("touchend", function() {
			tmp_canvas.removeEventListener('touchmove', OnDrawThird, false);
			isDrawing = false;
		});
	};

	// Preset 4 TouchStart Function
	var brushpreset4 = function() {
		ctx.lineWidth = 1;
	 	ctx.lineJoin = tmp_ctx.lineCap = 'round';
		  
		tmp_canvas.addEventListener('touchstart', function(e) {
			tmp_canvas.addEventListener('touchmove', OnDrawFourth, false);
			
			var parentOffset = $(this).parent().offset();
			var xval = e.pageX - parentOffset.left;
			var yval = e.pageY - parentOffset.top;

			mouse.x = typeof xval !== 'undefined' ? xval : e.layerX;
			mouse.y = typeof yval  !== 'undefined' ? yval  : e.layerY;

			points = [ ];
	  		isDrawing = true;
	  		points.push({ x: mouse.x, y: mouse.y });
			
			if (toolID == "brush" && currpreset == "preset-fourth") {
				ctx.globalCompositeOperation = 'source-over';
				ctx.strokeStyle = markerColor;
				OnDrawFourth();
			}
		});

		tmp_canvas.addEventListener("touchend", function() {
			tmp_canvas.removeEventListener('touchmove', OnDrawFourth, false);
			isDrawing = false;
		});
	};

	var OnDrawFirst = function (){
		if (!isDrawing) return;
		points.push({ x: mouse.x, y: mouse.y });
		tmp_ctx.beginPath();
		tmp_ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
		tmp_ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
		tmp_ctx.stroke();

		var lastPoint = points[points.length-1];

	  	for (var i = 0, len = points.length; i < len; i++) {
		    var dx = points[i].x - lastPoint.x;
		    var dy = points[i].y - lastPoint.y;
		    var d = dx * dx + dy * dy;
		    if (toolID == "brush" && currpreset == "preset-first") {
			    if (d < 1000) {
			      ctx.beginPath();
			      $('#pen-color').val(markerColor);
			      var rgbaval = hexToRgbA(markerColor);
				  ctx.strokeStyle = rgbaval+',0.3)';
				  tmp_ctx.lineWidth = 1;
				  tmp_ctx.strokeStyle = markerColor;
			      ctx.moveTo(lastPoint.x + (dx * 0.2), lastPoint.y + (dy * 0.2));
			      ctx.lineTo(points[i].x - (dx * 0.2), points[i].y - (dy * 0.2));
			      ctx.stroke();
			    }
		    } else {
		    	return;
		    }
	    }	
	};

	var OnDrawSec = function (){
		if (!isDrawing) return;
		if (toolID == "brush" && currpreset == "preset-second") {
			ctx.beginPath();
	      	$('#pen-color').val(markerColor);
		  	ctx.strokeStyle = markerColor;
		  	tmp_ctx.shadowBlur = 10;
		  	tmp_ctx.shadowColor = markerColor;
		  	tmp_ctx.lineWidth = markerWidth;
	      	ctx.stroke();
	    } else {
	    	return;
	    }
	};

	var OnDrawThird = function(){
		if (!isDrawing) return;
		if (toolID == "brush" && currpreset == "preset-third") { 
			var currentPoint = { x: mouse.x, y: mouse.y };
		  	var dist = distanceBetween(lastPoint, currentPoint);
		  	var angle = angleBetween(lastPoint, currentPoint);
		  
		  	for (var i = 0; i < dist; i+=5) {
		    	x = lastPoint.x + (Math.sin(angle) * i);
		    	y = lastPoint.y + (Math.cos(angle) * i);
		    
		    	var radgrad = ctx.createRadialGradient(x,y,5,x,y,10);

		    	$('#pen-color').val(markerColor);
				var rgbaval = hexToRgbA(markerColor);
		    	radgrad.addColorStop(0, markerColor);
		    	radgrad.addColorStop(0.5, rgbaval+',0.5)');
		    	radgrad.addColorStop(1, rgbaval+',0)');
		    
		    	tmp_ctx.shadowBlur = 0;
		    	ctx.fillStyle = radgrad;
		    	ctx.fillRect(x-15, y-15, 30, 30);
		  	}

			lastPoint = currentPoint;
		}
	};

	var OnDrawFourth = function(){
		if (!isDrawing) return;
		  //ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		points.push({ x: mouse.x, y: mouse.y });
		if (toolID == "brush" && currpreset == "preset-fourth") {
			ctx.beginPath();
			ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
			ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
			ctx.stroke();
			  
			for (var i = 0, len = points.length; i < len; i++) {
			    dx = points[i].x - points[points.length-1].x;
			    dy = points[i].y - points[points.length-1].y;
			    d = dx * dx + dy * dy;

			    if (d < 2000 && Math.random() > d / 2000) {
			    	ctx.beginPath();
			      	$('#pen-color').val(markerColor);
				  	var rgbaval = hexToRgbA(markerColor);
				  	tmp_ctx.shadowBlur = 0;
				  	tmp_ctx.lineWidth = 1;
				  	tmp_ctx.strokeStyle = markerColor;
				  	ctx.strokeStyle = rgbaval+',0.3)';
			      	ctx.moveTo( points[points.length-1].x + (dx * 0.5), points[points.length-1].y + (dy * 0.5));
			      	ctx.lineTo( points[points.length-1].x - (dx * 0.5), points[points.length-1].y - (dy * 0.5));
			      	ctx.stroke();
			    }
			}
		}
	};

	// UndoRedo Array
	function cPush(){
    	cStep++;
	    if (cStep < cPushArray.length) { 
	    	cPushArray.length = cStep;
	    }
	    cPushArray.push(canvas.toDataURL());
	}

	// Canvas Reset
	function resetCanvas(){
		cStep = -1;
		var cPushArray = new Array();
		ctx.clearRect(0, 0, canvas.width, canvas.height);
	}

	// brush preset 3 configuring distance between points
	function distanceBetween(point1, point2) {
	  return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
	}

	// brush preset 3 configuring angle between points
	function angleBetween(point1, point2) {
	  return Math.atan2( point2.x - point1.x, point2.y - point1.y );
	}

	// hex to rgba conversion
	function hexToRgbA(hex){
	    var c;
	    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
	        c= hex.substring(1).split('');
	        if(c.length== 3){
	            c= [c[0], c[0], c[1], c[1], c[2], c[2]];
	        }
	        c= '0x'+c.join('');
	        return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255];
	    }
	}

	// rgb to hex conversion
	function rgbToHex(R,G,B) {
		return toHex(R)+toHex(G)+toHex(B)
	}

	function toHex(n) {
		n = parseInt(n,10);
	  	if (isNaN(n)) return "00";
	  	n = Math.max(0,Math.min(n,255));
	  	return "0123456789ABCDEF".charAt((n-n%16)/16)  + "0123456789ABCDEF".charAt(n%16);
	}

	$("#grid").click(function(){
		var gridState = $('.grid-svg').hasClass('show-grid');
		if (isConnected) {
			if (gridState) {
				socket.emit("onSendGrid", "showGrid");
			} else {
				socket.emit("onSendGrid", "hideGrid");
			}
		}
	});

	$("#disconnect").click(function(){
		var confirmation = confirm("Are you sure you want to disconnect?");
		if (confirmation) {
			socket.emit("onDisconnectFromMobile", 'disconnect');
			location.reload();
		}
	});

	$("#save-image").click(function(){
		window.Base64ImageSaverPlugin.saveImageDataToLibrary(
	        function(msg){
	            console.log(msg);
	        },
	        function(err){
	            console.log(err);
	        },
	        canvas.toDataURL()
	    );

	    window.plugins.toast.showShortBottom(
	    	'Image saved to device', 
	    	function(a){
	    		console.log('toast success: ' + a)
	    	},
	    	function(b){
	    		alert('toast error: ' + b)
	    	}
	    );
	});
	
}());