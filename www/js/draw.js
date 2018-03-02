(function() {
	var canvas = document.querySelector('#paint');
	var ctx = canvas.getContext('2d');
	var markerWidth;
	var markerColor = $('#pen-color').val();
	var sketch = document.querySelector('#sketch');
	var sketch_style = getComputedStyle(sketch);
	var toolID = "pencil";
	var currpreset = "first-preset";
	var cPushArray = new Array();
	var cStep = -1;
	var isDrawing, lastPoint;
	var points = [ ];
	var isConnected = false;
	var canvasPicSrc, canvasPic = new Image();
	canvas.width = parseInt(sketch_style.getPropertyValue('width'));
	canvas.height = parseInt(sketch_style.getPropertyValue('height'));
	const canvasGetWidth = canvas.width;
	const canvasGetHeight = canvas.height;
	var currentIPaddress;
	var isFromQrScanner = false;
	var globaIpFromScanner;
	var socket;
	var tmp_canvas = document.createElement('canvas');
	var tmp_ctx = tmp_canvas.getContext('2d');
	tmp_canvas.id = 'tmp_canvas';
	tmp_canvas.width = canvas.width;
	tmp_canvas.height = canvas.height;
	sketch.appendChild(tmp_canvas);
	var mouse = {x: 0, y: 0};
	var last_mouse = {x: 0, y: 0};
	var bgColor;
	var bgIsColored = false;
	var newCanvasWidth, newCanvasHeight;
	var eventLogLabel;
	var filestate;
	var firstLaunch = window.localStorage.getItem('launch');
	var logstep = -2;
	var snap, gridState, prvX, prvY;
	var onTemplate = false;
	var imgSrc;
	//zoom vars
	var evCache = new Array();
	var prevDiff = -1;
	var currentView = 100;
	var canvasOffset = $('#tmp_canvas').offset();

	if(firstLaunch) {
	  	$("#tutorial-1").css("display", "none");
	} else {
	  	$("#tutorial-1").css("display", "block");
	}

	$("#scanQr").click(function(){
		QRScanner.scan(displayContents);
		QRScanner.show();
		$("#mainFrame").css("display", "none");
		$("#qr-view").css("display", "block");
	});

	function displayContents(err, text){
  		if(err){
    		alert("An error occured:" + err);
  		} else {
    		isFromQrScanner = true;
    		globaIpFromScanner = text;
			$("#qr-view").css("display", "none");
			$("#mainFrame").css("display", "block");
			QRScanner.hide();
			connects();
			socket.on("connect", function(){
	            socket.emit("sender", "start com");
	            $("#ipaddress").css("display", "none");
	            $(".close-connect").css("display", "none");
	            $("#btnConnect").css("display", "none");
	            $("#waiting-state").html("<img id='loader' style='width:100px' src='img/Loading_icon.gif'><br/><p style='color:green;font-weight:bold;'>Successfully connected.</p> Waiting for canvas details...");
	            $("#waiting-state").css("padding", "20px");
	            $("#grid").css("top", "8px");
	            $("#marker-width-label").css("top", "20px");
	            $("#new-canvas").css("top", "8px");
	            $("#connectedState").css("display", "block");
	            $(".sp-replacer, .sp-light, .full-spectrum").css("top", "13px");
	            $('#template-image').removeAttr('src');
	            isConnected = true;
	        });

	        socket.on("onClearCanvasToMobile", function(data){
	        	resetCanvas();
				cPushArray = new Array();
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
	        	if (isConnected) {
					eventLogLabel = "Background Color: "+bgColor;
					socket.emit("onSendEventLog", eventLogLabel);
				}
	        });

	        socket.on("onCanvasResizeToMobile", function(data){
	        	newCanvasWidth = data.canvasSizeWidth;
	        	newCanvasHeight = data.canvasSizeHeight;

	        	tmp_canvas.width = newCanvasWidth;
				tmp_canvas.height = newCanvasHeight;
				canvas.width = newCanvasWidth;
				canvas.height = newCanvasHeight;
		        if (cStep < 0) {
		        	canvasPic.src = canvas.toDataURL();
		        	canvasPicSrc = canvas.toDataURL();
		        } else {
		        	canvasPic.src = cPushArray[cStep];
		        	canvasPicSrc = cPushArray[cStep];
		        }

		        canvasPic.onload = function () {
		        	ctx.clearRect(0, 0, canvas.width, canvas.height);
		        	ctx.drawImage(canvasPic, 0, 0);
		        }
		        socket.emit("onSendcStep", {canvasPiccStep:canvasPicSrc});
	        });

	        socket.on("canvasDetailsReceive", function(data){
	        	canvasPic.src = data.cnvsSrc;
				canvasPic.onload = function (){
		        	ctx.clearRect(0, 0, canvas.width, canvas.height);
		        	ctx.drawImage(canvasPic, 0, 0);
			    }
			    canvas.width = data.cnvsW;
				canvas.height = data.cnvsH;
				tmp_canvas.width = data.cnvsW;
				tmp_canvas.height = data.cnvsH;
	        });
  		}
	}

	$('#pencil').addClass('active');
	$('#custom-bg-color').css("display", "none");
	$('#connect-modal').css("display", "none");
	/*StatusBar.hide();*/

	$("#collapse-tools").click(function(){
		$(".top-menu").toggleClass('tools-hiddens');
		$(".tools-item").toggleClass('tools-hidden');
		$("#pen-width").toggleClass('tools-hidden');
		$(".sp-preview").toggleClass('tools-hidden');
		$("#menu-right").toggleClass('tools-hidden');
		$(".tools-left").toggleClass('tools-hidden');
		$("#marker-width-label").toggleClass('tools-hidden');
		$("#new-canvas").toggleClass('tools-hidden');
	});

	var switchTool = function () {
		$('#active-tool').fadeIn("fast");
		$('#tools-modal').fadeOut("fast");

		var activeTool = $(this).attr('id');
		if (isConnected) {
			socket.emit("changeToolFromMobile", activeTool);
		}
	}

	$('#pencil').click(switchTool);

	$('#eraser').click(switchTool);

	$('#line').click(switchTool);

	$('#color-picker').click(switchTool);

	$('#paint-bucket').click(switchTool);

	$('#shapes').click(function(){
		$(".presets").css("display", "none");
		$(".shape-option, #stroke-color, #fill-color").css("display", "block");
		$("#brush-preset-container").fadeIn('slow');
		$("#active-tool").html(" ");
		$("#active-tool").html("<img src='img/polygon.svg'>");

		var activeTool = $(this).attr('id');
		if (isConnected) {
			socket.emit("changeToolFromMobile", activeTool);
		}
	});

	$('#move-tool').click(switchTool);

	$('#brush').click(function(){
		$(".presets").css("display", "block");
		$(".shape-option, #stroke-color, #fill-color").css("display", "none");
		$("#brush-preset-container").fadeIn('slow');
		$("#active-tool").html(" ");
		$("#active-tool").html("<img src='img/brush-stroke.svg'>");

		var activeTool = $(this).attr('id');
		if (isConnected) {
			socket.emit("changeToolFromMobile", activeTool);
		}
	});

	$('#settings').click(function(){
		$(this).toggleClass('active-menu');
		$('.drop-menu').toggleClass('show-menu');
		exitTools();
	});

	if (socket != undefined) {
		connects();
	}

	$("#btnConnect").click(function(){
		isFromQrScanner = false;
		try {
			connects();
	        socket.on("connect", function(){
	            socket.emit("sender", "start com");
	            $("#ipaddress").css("display", "none");
	            $(".close-connect").css("display", "none");
	            $("#btnConnect").css("display", "none");
	            $("#waiting-state").html("<img id='loader' style='width:100px' src='img/Loading_icon.gif'><br/><p style='color:green;font-weight:bold;'>Successfully connected.</p> Waiting for canvas details...");
	            $("#waiting-state").css("padding", "20px");
	            $("#grid").css("top", "8px");
	            $("#marker-width-label").css("top", "20px");
	            $("#new-canvas").css("top", "8px");
	            $("#connectedState").css("display", "block");
	            $(".sp-replacer, .sp-light, .full-spectrum").css("top", "13px");
	            $('#template-image').removeAttr('src');
	            isConnected = true;
	        });
		} catch(e) {
			window.plugins.toast.showShortBottom(
		    	'Please try again.',
		    	function(a){
		    		console.log('toast success: ' + a)
		    	},
		    	function(b){
		    		alert('toast error: ' + b)
		    	}
		    );
		}

        socket.on("onClearCanvasToMobile", function(data){
        	resetCanvas();
			cPushArray = new Array();
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
        	if (isConnected) {
				eventLogLabel = "Background Color: "+bgColor;
				socket.emit("onSendEventLog", eventLogLabel);
			}
        });

        socket.on("onCanvasResizeToMobile", function(data){
        	newCanvasWidth = data.canvasSizeWidth;
        	newCanvasHeight = data.canvasSizeHeight;

        	tmp_canvas.width = newCanvasWidth;
			tmp_canvas.height = newCanvasHeight;
			canvas.width = newCanvasWidth;
			canvas.height = newCanvasHeight;
	        if (cStep < 0) {
	        	canvasPic.src = canvas.toDataURL();
	        	canvasPicSrc = canvas.toDataURL();
	        } else {
	        	canvasPic.src = cPushArray[cStep];
	        	canvasPicSrc = cPushArray[cStep];
	        }

	        canvasPic.onload = function () {
	        	ctx.clearRect(0, 0, canvas.width, canvas.height);
	        	ctx.drawImage(canvasPic, 0, 0);
	        }
	        socket.emit("onSendcStep", {canvasPiccStep:canvasPicSrc});
        });
	   
        socket.on("onReceiveRotationDegrees", function(data){
        	$("#paint").css({'-webkit-transform' : 'rotate('+ data +'deg)',
    		'-moz-transform' : 'rotate('+ data +'deg)',
    		'-ms-transform' : 'rotate('+ data +'deg)',
    		'transform' : 'rotate('+ data +'deg)'});
    		$(tmp_canvas).css({'top': '0px'});
        });

        socket.on("canvasDetailsReceive", function(data){
        	canvasPic.src = data.cnvsSrc;
			canvasPic.onload = function (){
	        	ctx.clearRect(0, 0, canvas.width, canvas.height);
	        	ctx.drawImage(canvasPic, 0, 0);
		    }
		    canvas.width = data.cnvsW;
			canvas.height = data.cnvsH;
			tmp_canvas.width = data.cnvsW;
			tmp_canvas.height = data.cnvsH;
        });
    });

    var convertSetFromLetterToIP = {
        a : { a : 1, b : 2, c : 3, d : 4, e : 5 },
        b : { a : 6, b : 7, c : 8, d : 9, e : 10 },
        c : { a : 11, b : 12, c : 13, d : 14, e : 15 },
        d : { a : 16, b : 17, c : 18, d : 19, e : 20 },
        e : { a : 21, b : 22, c : 23, d : 24, e : 25 },
        f : { a : 26, b : 27, c : 28, d : 29, e : 30 },
        g : { a : 31, b : 32, c : 33, d : 34, e : 35 },
        h : { a : 36, b : 37, c : 38, d : 39, e : 40 },
        i : { a : 41, b : 42, c : 43, d : 44, e : 45 },
        j : { a : 46, b : 47, c : 48, d : 49, e : 50 },
        k : { a : 51, b : 52, c : 53, d : 54, e : 55 },
        l : { a : 56, b : 57, c : 58, d : 59, e : 60 },
        m : { a : 61, b : 62, c : 63, d : 64, e : 65 },
        n : { a : 66, b : 67, c : 68, d : 69, e : 70 },
        o : { a : 71, b : 72, c : 73, d : 74, e : 75 },
        p : { a : 76, b : 77, c : 78, d : 79, e : 80 },
        q : { a : 81, b : 82, c : 83, d : 84, e : 85 },
        r : { a : 86, b : 87, c : 88, d : 89, e : 90 },
        s : { a : 91, b : 92, c : 93, d : 94, e : 95 },
        t : { a : 96, b : 97, c : 98, d : 99, e : 100 },
        u : { a : 101, b : 102, c : 103, d : 104, e : 105 },
        v : { a : 106, b : 107, c : 108, d : 109, e : 110 },
        w : { a : 111, b : 112, c : 113, d : 114, e : 115 },
        x : { a : 116, b : 117, c : 118, d : 119, e : 120 },
        y : { a : 121, b : 122, c : 123, d : 124, e : 125 },
        z : { a : 126, b : 127, c : 128, d : 129, e : 130 },
        A : { a : 131, b : 132, c : 133, d : 134, e : 135 },
        B : { a : 136, b : 137, c : 138, d : 139, e : 140 },
        C : { a : 141, b : 142, c : 143, d : 144, e : 145 },
        D : { a : 146, b : 147, c : 148, d : 149, e : 150 },
        E : { a : 151, b : 152, c : 153, d : 154, e : 155 },
        F : { a : 156, b : 157, c : 158, d : 159, e : 160 },
        G : { a : 161, b : 162, c : 163, d : 164, e : 165 },
        H : { a : 166, b : 167, c : 168, d : 169, e : 170 },
        I : { a : 171, b : 172, c : 173, d : 174, e : 175 },
        J : { a : 176, b : 177, c : 178, d : 179, e : 180 },
        K : { a : 181, b : 182, c : 183, d : 184, e : 185 },
        L : { a : 186, b : 187, c : 188, d : 189, e : 190 },
        M : { a : 191, b : 192, c : 193, d : 194, e : 195 },
        N : { a : 196, b : 197, c : 198, d : 199, e : 200 },
        O : { a : 201, b : 202, c : 203, d : 204, e : 205 },
        P : { a : 206, b : 207, c : 208, d : 209, e : 210 },
        Q : { a : 211, b : 212, c : 213, d : 214, e : 215 },
        R : { a : 216, b : 217, c : 218, d : 219, e : 220 },
        S : { a : 221, b : 222, c : 223, d : 224, e : 225 },
        T : { a : 226, b : 227, c : 228, d : 229, e : 230 },
        U : { a : 231, b : 232, c : 233, d : 234, e : 235 },
        V : { a : 236, b : 237, c : 238, d : 239, e : 240 },
        W : { a : 241, b : 242, c : 243, d : 244, e : 245 },
        X : { a : 246, b : 247, c : 248, d : 249, e : 240 },
        Y : { a : 251, b : 252, c : 253, d : 254, e : 255 }
    };

    function connects(){
    	$("#sketch").css("zoom", "100%");
    	currentView = 100;
    	$("#zoomLabel").html(currentView+"%");
    	initZoom();
    	if (isFromQrScanner) {
    		currentIPaddress = globaIpFromScanner;
    	} else {
    		currentIPaddress = $('#ipaddress').val();
    	}

		var splitLetter = currentIPaddress.split("");

		/*if (splitLetter.length > 9) {
			window.plugins.toast.showShortBottom(
		    	'Please try again.',
		    	function(a){
		    		console.log('toast success: ' + a)
		    	},
		    	function(b){
		    		alert('toast error: ' + b)
		    	}
		    );
		} else {
			var part1 = parseInt(convertSetFromLetterToIP[splitLetter[0]][splitLetter[1]]);
			var part2 = parseInt(convertSetFromLetterToIP[splitLetter[2]][splitLetter[3]]);
			var part3 = parseInt(convertSetFromLetterToIP[splitLetter[4]][splitLetter[5]]);
			var part4 = parseInt(convertSetFromLetterToIP[splitLetter[6]][splitLetter[7]]);
			var convertedIp = part1+"."+part2+"."+part3+"."+part4;
			alert("converted"+convertedIp);
	        socket = io('http://'+convertedIp+':3000');
		}*/

		var part1 = parseInt(convertSetFromLetterToIP[splitLetter[0]][splitLetter[1]]);
		var part2 = parseInt(convertSetFromLetterToIP[splitLetter[2]][splitLetter[3]]);
		var part3 = parseInt(convertSetFromLetterToIP[splitLetter[4]][splitLetter[5]]);
		var part4 = parseInt(convertSetFromLetterToIP[splitLetter[6]][splitLetter[7]]);
		var convertedIp = part1+"."+part2+"."+part3+"."+part4;
        socket = io('http://'+convertedIp+':3000');

        socket.on("createCanvasToMobile", function(data){
        	if(data.state == "open"){
        		delete data.canvasArray["width"];
        		delete data.canvasArray["height"];
        		delete data.canvasArray["bgColor"];

        		filestate = data.state;
        		cPushArray = new Array();
        		for (var i = 0; i < Object.keys(data.canvasArray).length; i++) {
        			cPushArray.push(data.canvasArray[i]);
        		}

        		cStep = data.canvasArrayLength-4;
				canvasPic.src = data.canvasSrc;

				canvasPic.onload = function (){
		        	ctx.clearRect(0, 0, canvas.width, canvas.height);
		        	ctx.drawImage(canvasPic, 0, 0);
			    }
        	} else {
        		cPushArray = new Array();
				cStep = -1;
        	}

			$("#connect-modal").css("display", "none");

			canvas.width = parseInt(data.canvasWidth);
			canvas.height = parseInt(data.canvasHeight);
			tmp_canvas.width = parseInt(data.canvasWidth);
			tmp_canvas.height = parseInt(data.canvasHeight);

			$("#paint").css("background-color", data.canvasBackgroundColor);
			$("#paint").css("box-shadow", "0px 4px 14px grey")
			$("#sketch").css("background-color", "#d8d8d8");
			$("#sketch").css("height", "97%");

			if (data.state == "open" && $("#settings").hasClass('active-menu') == true || data.createVersion == "first") {
				$("#settings").toggleClass('active-menu');
				$('.drop-menu').toggleClass('show-menu');
			}

			$(".top-menu").css("height", "40px");

			if ($('#grid').hasClass('active-grid')) {
				$('#grid').toggleClass('active-grid');
				$('.grid-svg').toggleClass('show-grid');
			}

			$(".drop-menu").css("top", "48px");
			$(".slider").css("top", "25px");
			$(".primary").css("display", "none");
			$("#canvas-settings").css("display", "block");
			$("#canvas-settings").html("Set Background");
			$("#open-file").css("display", "block");
			$("#share").css("display", "block");
			$("#new-canvas").css("display", "block");
			$("#save-image").css("display", "block");
			$(".secondary").css("display", "block");

			if (isConnected) {
				socket.emit("sendActiveTool", toolID);
				socket.emit("sendPenColor", markerColor);
				socket.emit("sendActivePreset", currpreset);
				socket.emit("sendPenWidth", markerWidth);
			}
        });

        socket.on("receiveImageToMobileFromPC", function(data){
        	$("#connect-modal").css("display", "none");

			canvas.width = parseInt(data.width);
			canvas.height = parseInt(data.height);
			tmp_canvas.width = parseInt(data.width);
			tmp_canvas.height = parseInt(data.height);

			$("#paint").css("box-shadow", "0px 4px 14px grey")
			$("#sketch").css("background-color", "#d8d8d8");
			$("#sketch").css("height", "97%");

			if (data.state == "open" && $("#settings").hasClass('active-menu') == true || data.createVersion == "first") {
				$("#settings").toggleClass('active-menu');
				$('.drop-menu').toggleClass('show-menu');
			}

			$(".top-menu").css("height", "40px");

			if ($('#grid').hasClass('active-grid')) {
				$('#grid').toggleClass('active-grid');
				$('.grid-svg').toggleClass('show-grid');
			}

			$(".drop-menu").css("top", "48px");
			$(".slider").css("top", "25px");
			$(".primary").css("display", "none");
			$("#canvas-settings").css("display", "block");
			$("#canvas-settings").html("Set Background");
			$("#open-file").css("display", "block");
			$("#share").css("display", "block");
			$("#new-canvas").css("display", "block");
			$("#save-image").css("display", "block");
			$(".secondary").css("display", "block");

			var image = new Image();
			image.src = data.imageSource;
			image.onload = function(){
				ctx.drawImage(image, 0, 0);
			}
        });

        socket.on("onResponseArray", function(){
        	socket.emit("cPushArraySend", cPushArray);
        });

        socket.on("receiveLogStep", function(data){
        	logstep = data;
        });
	}

	$('.tool').click( function () {
		toolID = $(this).attr('id');
		if (isConnected) {
			socket.emit("sendActiveTool", toolID);
		}

		if (toolID == "brush") {
			brushpreset1();
		}
	});

	$('.presets').click( function () {
		currpreset = $(this).attr('id');
		if (isConnected) {
			socket.emit("sendActivePreset", currpreset);
		}

		if (toolID == "brush"){
			switch (currpreset) {
				case 'first-preset':
					brushpreset1();
				break;
				case 'second-preset':
					brushpreset2();
				break;
				case 'third-preset':
					brushpreset3();
				break;
			}
		} else {
			return;
		}

		if (isConnected) {
			eventLogLabel = "Change Preset: "+currpreset;
			socket.emit("onSendEventLog", eventLogLabel);
		}
	});

	var ppts = [];

	/* Mouse Capturing Work */
	tmp_canvas.addEventListener('touchmove', function(e) {

		var targetYval = e.targetTouches[0].pageY;
		var targetXval = e.targetTouches[0].pageX;
		mouse.x = typeof targetXval !== 'undefined' ? targetXval : e.layerX;
		mouse.y = typeof targetYval  !== 'undefined' ? targetYval  : e.layerY;
		// // mouse.x = e.targetTouches[0].pageX - canvasOffset.left;
		// // mouse.y = e.targetTouches[0].pageY - canvasOffset.top;
		// mouse.x = e.layerX;
		// mouse.y = e.layerY;
		console.log(mouse.x, mouse.y);

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
			eventLogLabel = "Resize Tool Width: "+markerWidth;
			socket.emit("onSendEventLog", eventLogLabel);
		}
		$("#marker-width-label").html(markerWidth+"px");
	});

	/*$('#pen-color').change(function () {
		markerColor = $(this).val();
		tmp_ctx.strokeStyle = markerColor;
		tmp_ctx.fillStyle = markerColor;
		if (isConnected) {
			socket.emit("sendPenColor", markerColor);
			eventLogLabel = "Change Tool Color: "+markerColor;
			socket.emit("onSendEventLog", eventLogLabel);
		}
	});*/

	$('#setCanvasType').click(function(){
		if ($('#canvas-type').val() == "Color") {
			bgColor = $('#custom-bg-color').val();
			bgIsColored = true;
		} else {
			bgColor = "#FFFFFF";
			bgIsColored = false;
		}

		$('#paint, body').css("background-color", bgColor);

		if (isConnected) {
			socket.emit("onBgChangeFromMobile", {bgColor:bgColor, bgIsColored:bgIsColored});
			$('body').css("background-color", "#d8d8d8");
		}
	});

	// OnPaint TouchStart
	tmp_canvas.addEventListener('touchstart', function(e) {
		var parentOffset = $(this).parent().offset();
		var targetYval = e.targetTouches[0].pageY;
		var targetXval = e.targetTouches[0].pageX;
		mouse.x = typeof targetXval !== 'undefined' ? targetXval : e.layerX;
		mouse.y = typeof targetYval  !== 'undefined' ? targetYval  : e.layerY;
		prvX = mouse.x;
		prvY = mouse.y;
		console.log(mouse.x, mouse.y);
		ppts.push({x: mouse.x, y: mouse.y});
		if (isConnected) {
			socket.emit("onTouchStart", {state:"touchstart", mX:prvX, mY:prvY});
			socket.emit("sendCoordinates", {x: mouse.x, y: mouse.y});
		}

		switch (toolID) {
			case 'pencil':
				snap = mouse.x % 8;
				if(gridState){
					if (snap <= 3) {
						tmp_canvas.addEventListener('touchmove', onSnap, false);
						tmp_canvas.removeEventListener('touchmove', onPaint, false);
					} else {
						tmp_canvas.addEventListener('touchmove', onPaint, false);
						tmp_canvas.removeEventListener('touchmove', onSnap, false);
					}
				} else {
					tmp_canvas.addEventListener('touchmove', onPaint, false);
					tmp_canvas.removeEventListener('touchmove', onSnap, false);
				}

				if (isConnected) {
					socket.emit("sendSnap", snap);
				}

				ctx.globalCompositeOperation = 'source-over';
				markerColor = $('#pen-color').val();
				markerWidth = parseInt($('#pen-width').val());
				tmp_ctx.strokeStyle = markerColor;
				tmp_ctx.fillStyle = markerColor;
				tmp_ctx.shadowBlur = 0;
				tmp_ctx.lineJoin = 'round';
				tmp_ctx.lineCap = 'round';
				tmp_ctx.lineWidth = markerWidth;
				onPaint();
				if (isConnected) {
					eventLogLabel = "Draw";
					socket.emit("onSendEventLog", eventLogLabel);
				}
			break;
			case 'color-picker':
				ctx.globalCompositeOperation = 'source-over';
				canvasPic.src = cPushArray[cStep];

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
				$('.sp-preview-inner').css('background-color', markerColor);
				if (isConnected) {
					socket.emit("onColorSend", markerColor);
				}
			break;
			case 'eraser':
				tmp_canvas.addEventListener('touchmove', onErase, false);
			break;
			case 'line':
				tmp_canvas.addEventListener('touchmove', onDrawLine, false);
			break;
		}
	}, false);

	// Onpaint TouchEnd
	tmp_canvas.addEventListener('touchend', function() {
		tmp_canvas.removeEventListener('touchmove', onPaint, false);
		tmp_canvas.removeEventListener('touchmove', onDrawLine, false);
		tmp_canvas.removeEventListener('touchmove', onErase, false);

		ctx.stroke();
		// Writing down to real canvas now
		ctx.drawImage(tmp_canvas, 0, 0);
		// sending log functions
		if (isConnected) {
			socket.emit("sendLogFunctions", {lcStep:cPushArray.length, lcanvasSrc: canvas.toDataURL()});
		}
		// checks if user undo from log
		if (logstep > 0){
			cStep = logstep;
		}
		// Storing every strokes to Array
		cPush();
		// Clearing tmp canvas
		tmp_ctx.clearRect(0, 0, tmp_canvas.width, tmp_canvas.height);
		// Emptying up Pencil Points
		ppts = [];
		// send touchstate
		if (isConnected) {
			socket.emit("onTouchEnd", {logstep:logstep, drawState:"touchend"});
		}
		ctx.save();
		logstep = -2;
	}, false);

	$('#new-canvas').click(function(){
		var el = document.getElementById("sketch");
	    el.onpointerdown = null;
	    el.onpointermove = null;
	    el.onpointerup = null;
	    el.onpointercancel = null;
	    el.onpointerout = null;
	    el.onpointerleave = null;
		$("#sketch").css("zoom", "100%");
		currentView = 100;
		$("#zoomLabel").html(currentView+"%");
		var confirmation1 = confirm("Are you sure you want to clear canvas?");
		if (confirmation1) {
			clearCanvas();
		}

		if (onTemplate) {
			if (confirmation1) {
				var confirmation2 = confirm("Clear template?");
				if (confirmation2) {
					$('#template-image').removeAttr('src');
					onTemplate = false;
				}
			}
		}
	});

	function clearCanvas() {
		resetCanvas();
		cPushArray = new Array();

		if (isConnected) {
			socket.emit("onClearCanvasFromMobile", 'clear');
		}

		if (!isConnected) {
			canvas.width = canvasGetWidth;
			canvas.height = canvasGetHeight;
			tmp_canvas.width = canvas.width;
			tmp_canvas.height = canvas.height;
			$("#sketch").css("height", "100%");
			$("#sketch").css("background-color", "white");
			$("#paint").css("box-shadow", "0px 0px 0px 0px transparent");
			$("#paint, body").css("background-color", "transparent");
		}
	}

	$('#redo').click(function(){
		if (cStep < cPushArray.length-1) {
	        cStep++;
	        canvasPic.src = cPushArray[cStep];
	        canvasPic.onload = function () {
	        	ctx.clearRect(0, 0, canvas.width, canvas.height);
	        	ctx.drawImage(canvasPic, 0, 0);
	        }
	        /*console.log(canvasPic.src);*/
	        if (isConnected) {
				socket.emit("onRedo", cPushArray[cStep]);
			}
   		}

   		if (isConnected) {
			socket.emit("cStep", cStep);
			eventLogLabel = "Redo";
			socket.emit("onSendEventLog", eventLogLabel);
		}
	});

	function undo() {
		if (cStep == 0) {
			resetCanvas();
		}
		if (cStep > 0) {
	        cStep--;
	        var src = cPushArray[cStep];
	        canvasPic.src = cPushArray[cStep];
	        canvasPic.onload = function (){
	        	ctx.clearRect(0, 0, canvas.width, canvas.height);
	        	ctx.drawImage(canvasPic, 0, 0);
	        }
		 	if (isConnected) {
				socket.emit("onUndo", cPushArray[cStep]);
			}
			/*console.log(canvasPic.src);*/
	    }

	    if (isConnected) {
			socket.emit("cStep", cStep);
			eventLogLabel = "Undo";
			socket.emit("onSendEventLog", eventLogLabel);
		}
	};

	$('#undo').click(undo);

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
		if (isConnected) {
			eventLogLabel = "Erase";
			socket.emit("onSendEventLog", eventLogLabel);
		}
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

	var onDrawLine = function(){
		var pptsl = ppts.length-1;
		ppts.push({x: mouse.x, y: mouse.y});
		ctx.lineWidth = markerWidth;
		ctx.strokeStyle = markerColor;
		ctx.beginPath();
		ctx.moveTo(ppts[0].x, ppts[0].y);
		ctx.lineTo(ppts[pptsl].x, ppts[pptsl].y);
	};
	
	var onSnap = function(){
		var pptsl = ppts.length-1;
		ppts.push({x: mouse.x, y: mouse.y});
		ctx.lineWidth = markerWidth;
		ctx.strokeStyle = markerColor;
		ctx.lineJoin = 'round';
		ctx.lineCap = 'round';
		ctx.beginPath();
		var dx = mouse.x - prvX;
		var dy = mouse.y - prvY;
		ctx.moveTo(ppts[0].x, ppts[0].y);
		if(Math.abs(dx) > Math.abs(dy)){
			ctx.lineTo(mouse.x, prvY);
		} else {
			ctx.lineTo(prvX, mouse.y);
		}
	}
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

			if (toolID == "brush" && currpreset == "first-preset") {
				var rgbaval = hexToRgbA(markerColor);
				tmp_ctx.strokeStyle = rgbaval+',0.3)';
				tmp_ctx.fillStyle = rgbaval+',0.3)';
				ctx.globalCompositeOperation = 'source-over';
				OnDrawFirst();
			}

			if (isConnected) {
				socket.emit("onTouchBrushStart", "brushtouchstart");
				eventLogLabel = "Draw";
				socket.emit("onSendEventLog", eventLogLabel);
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

			if (toolID == "brush" && currpreset == "second-preset") {
				tmp_ctx.lineJoin = tmp_ctx.lineCap = 'round';
				tmp_ctx.strokeStyle = markerColor;
				ctx.globalCompositeOperation = 'source-over';
				OnDrawSec();
			} else {
				return;
			}

			if (isConnected) {
				socket.emit("onTouchBrushStart", "brushtouchstart");
				eventLogLabel = "Draw";
				socket.emit("onSendEventLog", eventLogLabel);
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
		ctx.lineWidth = 1;
	 	ctx.lineJoin = tmp_ctx.lineCap = 'round';

		tmp_canvas.addEventListener('touchstart', function(e) {
			tmp_canvas.addEventListener('touchmove', OnDrawThird, false);
			var parentOffset = $(this).parent().offset();
			var xval = e.pageX - parentOffset.left;
			var yval = e.pageY - parentOffset.top;
			mouse.x = typeof xval !== 'undefined' ? xval : e.layerX;
			mouse.y = typeof yval  !== 'undefined' ? yval  : e.layerY;
			points = [ ];
	  		isDrawing = true;
	  		points.push({ x: mouse.x, y: mouse.y });

			if (toolID == "brush" && currpreset == "third-preset") {
				ctx.globalCompositeOperation = 'source-over';
				ctx.strokeStyle = markerColor;
				OnDrawThird();
			}

			if (isConnected) {
				socket.emit("onTouchBrushStart", "brushtouchstart");
				eventLogLabel = "Draw";
				socket.emit("onSendEventLog", eventLogLabel);
			}
		});

		tmp_canvas.addEventListener("touchend", function() {
			tmp_canvas.removeEventListener('touchmove', OnDrawThird, false);
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
		    if (toolID == "brush" && currpreset == "first-preset") {
			    if (d < 1000) {
			      ctx.beginPath();
			      $('#pen-color').val(markerColor);
			      var rgbaval = hexToRgbA(markerColor);
				  ctx.strokeStyle = rgbaval+',0.3)';
				  tmp_ctx.lineWidth = 1;
				  tmp_ctx.strokeStyle = markerColor;
				  tmp_ctx.shadowBlur = 0;
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
		if (toolID == "brush" && currpreset == "second-preset") {
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
		//ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		points.push({ x: mouse.x, y: mouse.y });
		if (toolID == "brush" && currpreset == "third-preset") {
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

	function resetCanvas(){
		cStep = -1;
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
		$(this).toggleClass('active-grid');
		$('.grid-svg').toggleClass('show-grid');

		gridState = $('.grid-svg').hasClass('show-grid');
		if (isConnected) {
			if (gridState) {
				socket.emit("onSendGrid", "hideGrid");
			} else {
				socket.emit("onSendGrid", "showGrid");
			}
			/*$("#grid").css("top", "-66px");*/
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
		$('#save-modal').css("display", "block");
		if (onTemplate) {
			$(".primary-saving").css("display", "none");
			$(".secondary-saving").css("display", "block");
		} else {
			$(".primary-saving").css("display", "block");
			$(".secondary-saving").css("display", "none");
		}
	});

	$(".save-png").click(function(){
		var cnvsSrc;
        canvasPic.src = canvas.toDataURL();
        (bgIsColored)?ctx.fillStyle = bgColor: ctx.fillStyle = "rgba(255,255,255,0)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        canvasPic.onload = function () {
        	ctx.drawImage(canvasPic, 0, 0);
        	cnvsSrc = canvas.toDataURL();

        	window.Base64ImageSaverPlugin.saveImageDataToLibrary(
		        function(msg){
		            console.log(msg);
		        },
		        function(err){
		            console.log(err);
		        },
		        cnvsSrc
		    );
        }

	    window.plugins.toast.showShortBottom(
	    	'Image saved to device.',
	    	function(a){
	    		console.log('toast success: ' + a)
	    	},
	    	function(b){
	    		alert('toast error: ' + b)
	    	}
	    );
	});

	$("#save-template").click(function() {
		var cnvsSrc, cnvsSrcs;
		cnvsSrcs = canvas.toDataURL();
		canvasPic.src = canvas.toDataURL(imgSrc);
		console.log(canvas.toDataURL(imgSrc));
		canvasPic.onload = function () {
			ctx.drawImage(canvasPic,0,0);
		}

        canvasPic.src = cnvsSrcs;
        ctx.fillStyle = "#FFF";
        // (bgIsColored)?ctx.fillStyle = bgColor: ctx.fillStyle = "#FFF";
        canvasPic.onload = function () {
        	ctx.drawImage(canvasPic, 0, 0);
        	cnvsSrc = canvas.toDataURL();
        	console.log(cnvsSrc);
        	window.Base64ImageSaverPlugin.saveImageDataToLibrary(
		        function(msg){
		            console.log(msg);
		        },
		        function(err){
		            console.log(err);
		        },
		        cnvsSrc
		    );
        }
	    window.plugins.toast.showShortBottom(
	    	'Image saved to device.',
	    	function(a){
	    		console.log('toast success: ' + a)
	    	},
	    	function(b){
	    		alert('toast error: ' + b)
	    	}
	    );
	});

	$("#active-tool").click(function() {
		if (!firstLaunch) {
			$("#tutorial-3").fadeOut("slow");
			$("#tutorial-4").fadeIn("slow");
		}
		$('#tools-modal').fadeIn("fast");
		$(this).fadeOut('fast');
		if ($("#settings").hasClass('active-menu')) {
			$("#settings").toggleClass('active-menu');
			$('.drop-menu').toggleClass('show-menu');
		}
	});

	function exitTools(){
		$('#active-tool').fadeIn("fast");
		$('#tools-modal').fadeOut("fast");
		$('#brush-preset-container').fadeOut("fast");
	}

	$('#exit-tool').click(exitTools);

	$('#tools-modal img').click(function () {
		var id = $(this).attr('id');
		if (!firstLaunch) {
			$("#tutorial-4").fadeOut("slow");
			$("#tutorial-5").fadeIn("slow");
			window.localStorage.setItem('launch', true);
			firstLaunch = window.localStorage.getItem('launch');
		}
		switch (id) {
			case "pencil":
				$("#active-tool").html(" ");
				$("#active-tool").html("<img src='img/pencil.svg'>");
				$("#brush-preset-container, #tools-modal").fadeOut("fast");
				break;
			case "line":
				$("#active-tool").html(" ");
				$("#active-tool").html("<img src='img/vector.svg'>");
				$("#brush-preset-container, #tools-modal").fadeOut("fast");
				break;
			case "eraser":
				$("#active-tool").html(" ");
				$("#active-tool").html("<img src='img/rubber.svg'>");
				$("#brush-preset-container, #tools-modal").fadeOut("fast");
				break;
			case "color-picker":
				$("#active-tool").html(" ");
				$("#active-tool").html("<img src='img/color-picker.svg'>");
				$("#brush-preset-container, #tools-modal").fadeOut("fast");
				break;
			case "move-tool":
				$("#active-tool").html(" ");
				$("#active-tool").html("<img src='img/move.svg'>");
				$("#brush-preset-container, #tools-modal").fadeOut("fast");
				break;
			case "shapes":
				/*$("#active-tool").html(" ");
				$("#active-tool").html("<img src='img/polygon.svg'>");
				$("#brush-preset-container, #tools-modal").fadeOut("fast");*/
				$('#tools-modal').fadeIn("fast");
				break;
			case "paint-bucket":
				$("#active-tool").html(" ");
				$("#active-tool").html("<img src='img/paint-can.svg'>");
				$("#brush-preset-container, #tools-modal").fadeOut("fast");
				break;
			case "brush":
				$('#tools-modal').fadeIn("fast");
				break;
		}
	});

	$("#brush-preset-container img").click(function() {
		$("#brush-preset-container, #tools-modal").fadeOut("fast");
		$("#active-tool").fadeIn("fast");
	});

  	function loadImage(e) {
  		$("#sketch").css("zoom", "100%");
  		currentView = 100;
  		$("#zoomLabel").html(currentView+"%");
  		initZoom();
  		$("#template-image").attr("src", "");
    	var reader = new FileReader();
    	reader.onload = function(event){
	        canvasPic.src = event.target.result;
	        canvasPic.onload = function () {
				tmp_canvas.width = canvasPic.width;
	        	tmp_canvas.height = canvasPic.height;
	        	canvas.width = canvasPic.width;
	        	canvas.height = canvasPic.height;
	        	/*$("#paint, #tmp_canvas").css({"position": "absolute","top": "50%","left": "50%", "transform": "translate(-50%, -50%)"});*/
	        	$("#sketch").css("background-color", "#d8d8d8");
	        	$("#sketch").css("height", "100%");
	        	$("#paint").css("box-shadow", "0px 4px 14px grey")
	        	ctx.drawImage(canvasPic, 0, 0);

	        	var openImageDetails = {
	        		filename: e.target.files[0].name,
	        		image: canvasPic.src,
	        		width: canvasPic.width,
	        		height: canvasPic.height
	        	}

	        	if (isConnected) {
	        		socket.emit("sendImageToPCFromMobile", openImageDetails);
	        		$("#sketch").css("height", "97%");
	        	}
	        }
    	}

    	cPush();
    	reader.readAsDataURL(e.target.files[0]);

    	$('#settings').toggleClass('active-menu');
		$('.drop-menu').toggleClass('show-menu');

    	return false;
  	}

	$('input[type=file]').change(loadImage);

	$("#share").click(function() {
		var today = new Date();
		var date = today.getFullYear() +""+ (today.getMonth()+1) +""+ today.getDate();
		var time = today.getHours() +""+ today.getMinutes() +""+ today.getSeconds();
		var dateTime = date+""+time;
		var cnvsSrc;
        canvasPic.src = canvas.toDataURL();
        (bgIsColored)?ctx.fillStyle = bgColor: ctx.fillStyle = "rgba(255,255,255,0)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        canvasPic.onload = function () {
        	ctx.drawImage(canvasPic, 0, 0);
        	cnvsSrc = canvas.toDataURL();
			window.plugins.socialsharing.share(null, dateTime, cnvsSrc, null);
		}
	});

	$("#skip-tutorial").click(function(){
		$("#tutorial-1").fadeOut("slow");
		$("#tutorial-12").fadeIn("slow");
		window.localStorage.setItem('launch', true);
		window.location = "sketchpad.html";
	});

	$("#start-tutorial").click(function(){
		$("#dash img").fadeIn("slow");
		$("#tutorial-1").fadeOut("slow");
		$("#tutorial-2").fadeIn("slow");
	});

	$("#tutorial-2 div").click(function(){
		$("#tutorial-2").fadeOut("slow");
		$("#tutorial-3").fadeIn("slow");
		$("#dash img").fadeOut("slow");
	});

	$("#tutorial-3 div").click(function(){
		$("#tutorial-3").fadeOut("slow");
		$("#tutorial-4").fadeIn("slow");
	});

	$("#tutorial-4 div").click(function(){
		$("#tutorial-4").fadeOut("slow");
		$("#tutorial-5").fadeIn("slow");
	});

	$("#tutorial-5 div").click(function(){
		$("#tutorial-5").fadeOut("slow");
		$("#tutorial-6").fadeIn("slow");
	});

	$("#tutorial-6 div").click(function(){
		$("#tutorial-6").fadeOut("slow");
		$("#tutorial-7").fadeIn("slow");
	});

	$("#tutorial-7 div").click(function(){
		$("#tutorial-7").fadeOut("slow");
		$("#tutorial-8").fadeIn("slow");
	});

	$("#tutorial-8 div").click(function(){
		$("#tutorial-8").fadeOut("slow");
		$("#tutorial-9").fadeIn("slow");
	});

	$("#tutorial-9 div").click(function(){
		$("#tutorial-9").fadeOut("slow");
		$("#tutorial-10").fadeIn("slow");
	});

	$("#tutorial-10 div").click(function(){
		$("#tutorial-10").fadeOut("slow");
		$("#tutorial-11").fadeIn("slow");
	});

	$("#tutorial-11 div").click(function(){
		$("#tutorial-11").fadeOut("slow");
		$("#tutorial-12").fadeIn("slow");
	});	

	$("#btnOkay").click(function(){
		$("#tutorial-12").fadeOut("slow");
		$("#tutorial-13").fadeIn("slow");
	});

	$("#btnGotIt").click(function(){
		$("#tutorial-13").fadeOut("slow");
	});

	$(".tuts-item").click(function() {
		var id = $(this).attr('id');
		var tutorialDesc, tutorialPrev;
		$("#tuts-preview-container").html(" ");
		$(".tuts-item").removeClass('active-tuts');
		$("#"+id).addClass('active-tuts');

		switch (id) {
			case "tuts-prev-1":
				tutorialDesc = "To change the active tool, press the lower right corner from the sketchpad and click the desired tool.";
				tutorialPrev = "<img src='img/help/t1.png'>"
				break;
			case "tuts-prev-2":
				tutorialDesc = "Change your tool color by pressing the color box and choose from the variety of colors in swatches and palettes.";
				tutorialPrev = "<img src='img/help/t2.png'>"
				break;
			case "tuts-prev-3":
				tutorialDesc = "Adjust the tool size by just sliding the range tool.";
				tutorialPrev = "<img src='img/help/t3.png'>"
				break;
			case "tuts-prev-4":
				tutorialDesc = "Press the grid icon to show grid lines on your sketchpad.";
				tutorialPrev = "<img src='img/help/t4.png'>"
				break;
			case "tuts-prev-5":
				tutorialDesc = "Check the other options like uploading images, changing backgroud, saving image, sharing your work, using templates and connecting to PC.";
				tutorialPrev = "<img src='img/help/t5.png'>"
				break;
		}

		$("#tutorial-hint").html(tutorialDesc);
		$("#tuts-preview-container").html(tutorialPrev);
	});

	$(".selected-template").click(function () {
		clearCanvas();
		var selected = $(this).attr('data-template');
		var templateType = $(this).attr('data-template-type');
		if (templateType == "drawing") {
			$("#template-image").css("z-index", "-1");
		} else {
			$("#template-image").css("z-index", "0");
		}

		$("#sketch").css("zoom", "100%");
		currentView = 100;
		$("#zoomLabel").html(currentView+"%");
		$("#template-image").attr('src', 'img/templates/'+selected+'.PNG');
		onTemplate = true;
		imgSrc = $(this).attr("src");
		console.log(imgSrc);
	});

	$(function(){
		$("#pen-color").spectrum({
		    color: "#000",
		    showInput: true,
		    className: "full-spectrum",
		    showInitial: true,
		    showPalette: true,
		    showSelectionPalette: true,
		    maxSelectionSize: 10,
		    preferredFormat: "hex",
		    localStorageKey: "spectrum.demo",
		    move: function (color) {
		        
		    },
		    show: function () {
		    
		    },
		    beforeShow: function () {
		    
		    },
		    hide: function () {
		    
		    },
		    change: function() {
		        
		    },
		    palette: [
		        ["rgb(0, 0, 0)", "rgb(67, 67, 67)", "rgb(102, 102, 102)",
		        "rgb(204, 204, 204)", "rgb(217, 217, 217)","rgb(255, 255, 255)"],
		        ["rgb(152, 0, 0)", "rgb(255, 0, 0)", "rgb(255, 153, 0)", "rgb(255, 255, 0)", "rgb(0, 255, 0)",
		        "rgb(0, 255, 255)", "rgb(74, 134, 232)", "rgb(0, 0, 255)", "rgb(153, 0, 255)", "rgb(255, 0, 255)"], 
		        ["rgb(230, 184, 175)", "rgb(244, 204, 204)", "rgb(252, 229, 205)", "rgb(255, 242, 204)", "rgb(217, 234, 211)", 
		        "rgb(208, 224, 227)", "rgb(201, 218, 248)", "rgb(207, 226, 243)", "rgb(217, 210, 233)", "rgb(234, 209, 220)", 
		        "rgb(221, 126, 107)", "rgb(234, 153, 153)", "rgb(249, 203, 156)", "rgb(255, 229, 153)", "rgb(182, 215, 168)", 
		        "rgb(162, 196, 201)", "rgb(164, 194, 244)", "rgb(159, 197, 232)", "rgb(180, 167, 214)", "rgb(213, 166, 189)", 
		        "rgb(204, 65, 37)", "rgb(224, 102, 102)", "rgb(246, 178, 107)", "rgb(255, 217, 102)", "rgb(147, 196, 125)", 
		        "rgb(118, 165, 175)", "rgb(109, 158, 235)", "rgb(111, 168, 220)", "rgb(142, 124, 195)", "rgb(194, 123, 160)",
		        "rgb(166, 28, 0)", "rgb(204, 0, 0)", "rgb(230, 145, 56)", "rgb(241, 194, 50)", "rgb(106, 168, 79)",
		        "rgb(69, 129, 142)", "rgb(60, 120, 216)", "rgb(61, 133, 198)", "rgb(103, 78, 167)", "rgb(166, 77, 121)",
		        "rgb(91, 15, 0)", "rgb(102, 0, 0)", "rgb(120, 63, 4)", "rgb(127, 96, 0)", "rgb(39, 78, 19)", 
		        "rgb(12, 52, 61)", "rgb(28, 69, 135)", "rgb(7, 55, 99)", "rgb(32, 18, 77)", "rgb(76, 17, 48)"]
		    ]
		});

		$('#pen-color').change(function () {
			markerColor = $(this).val();
			tmp_ctx.strokeStyle = markerColor;
			tmp_ctx.fillStyle = markerColor;
			if (isConnected) {
				socket.emit("sendPenColor", markerColor);
				eventLogLabel = "Change Tool Color: "+markerColor;
				socket.emit("onSendEventLog", eventLogLabel);
			}
		});
	});

	$("#cancelQr").click(function(){
		$("#qr-view").css("display", "none");
		$("#mainFrame").css("display", "block");
		QRScanner.hide();
	});

	function initZoom() {
	    // Install event handlers for the pointer target
	    var el = document.getElementById("sketch");
	    el.onpointerdown = pointerdown_handler;
	    el.onpointermove = pointermove_handler;

	    // Use same handler for pointer{up,cancel,out,leave} events since
	    // the semantics for these events - in this app - are the same.
	    el.onpointerup = pointerup_handler;
	    el.onpointercancel = pointerup_handler;
	    el.onpointerout = pointerup_handler;
	    el.onpointerleave = pointerup_handler;
	}

	function pointerdown_handler(ev) {
	    // The pointerdown event signals the start of a touch interaction.
	    // This event is cached to support 2-finger gestures
	    evCache.push(ev);
	    /*log("pointerDown", ev);*/
	}

	function pointermove_handler(ev) {
	    // This function implements a 2-pointer horizontal pinch/zoom gesture. 
	    //
	    // If the distance between the two pointers has increased (zoom in), 
	    // the taget element's background is changed to "pink" and if the 
	    // distance is decreasing (zoom out), the color is changed to "lightblue".
	    //
	    // This function sets the target element's border to "dashed" to visually
	    // indicate the pointer's target received a move event.
	    /*log("pointerMove", ev);*/
	    /*ev.target.style.border = "dashed";*/

	    // Find this event in the cache and update its record with this event
	    for (var i = 0; i < evCache.length; i++) {
	        if (ev.pointerId == evCache[i].pointerId) {
	            evCache[i] = ev;
	            break;
	        }
	    }

	    // If two pointers are down, check for pinch gestures
	    if (evCache.length == 2) {
	        // Calculate the distance between the two pointers
	        var curDiff = Math.abs(evCache[0].clientX - evCache[1].clientX);
	        if (prevDiff > 0) {
	            if (curDiff > prevDiff) {
	                // The distance between the two pointers has increased
	                /*log("Pinch moving OUT -> Zoom in", ev);*/
                    currentView += 1;
                    ev.target.style.zoom = currentView+"%";
                    $("#zoomLabel").html(currentView+"%");
                    /*$("#percent").innerHTML = currentView+"%";*/
                    /*ev.target.style.background = "pink";*/
	            }
	            if (curDiff < prevDiff) {
	                // The distance between the two pointers has decreased
	                /*log("Pinch moving IN -> Zoom out",ev);*/
                    currentView -= 1;
                    ev.target.style.zoom = currentView+"%";
                    $("#zoomLabel").html(currentView+"%");
                    /*document.getElementById("percent").innerHTML = currentView+"%";
                    ev.target.style.background = "lightblue";*/
	            }
	        }
	        // Cache the distance for the next move event 
	        prevDiff = curDiff;
	    }
	}

	function pointerup_handler(ev) {
	    /*log(ev.type, ev);*/
	    // Remove this pointer from the cache and reset the target's
	    // background and border
	    remove_event(ev);
	    /*ev.target.style.background = "white";
	    ev.target.style.border = "1px solid black";*/

	    // If the number of pointers down is less than two then reset diff tracker
	    if (evCache.length < 2) {
	        prevDiff = -1;
	    }
	}

	function remove_event(ev) {
	    // Remove this event from the target's cache
	    for (var i = 0; i < evCache.length; i++) {
	        if (evCache[i].pointerId == ev.pointerId) {
	            evCache.splice(i, 1);
	            break;
	        }
	    }
	}
}());